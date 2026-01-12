package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/pkg/errors"

	"github.com/usememos/memos/internal/config"
	"github.com/usememos/memos/internal/profile"
	storepb "github.com/usememos/memos/proto/gen/store"
	apiv1 "github.com/usememos/memos/server/router/api/v1"
	"github.com/usememos/memos/server/router/fileserver"
	"github.com/usememos/memos/server/router/frontend"
	"github.com/usememos/memos/server/router/rss"
	"github.com/usememos/memos/server/runner/s3presign"
	"github.com/usememos/memos/store"
)

type Server struct {
	Secret  string
	Profile *profile.Profile
	Store   *store.Store
	Config  *config.Config

	echoServer        *echo.Echo
	runnerCancelFuncs []context.CancelFunc
}

func NewServer(ctx context.Context, profile *profile.Profile, store *store.Store) (*Server, error) {
	// Load configuration from file (supports ConfigMaps)
	cfg, err := config.LoadConfig(profile.Data)
	if err != nil {
		slog.Warn("Failed to load config file, using defaults", "error", err)
		cfg = config.GetDefaultConfig()
	}

	// Validate config
	if err := config.ValidateConfig(cfg); err != nil {
		slog.Warn("Config validation failed, using defaults", "error", err)
		cfg = config.GetDefaultConfig()
	}

	s := &Server{
		Store:   store,
		Profile: profile,
		Config:  cfg,
	}

	echoServer := echo.New()
	echoServer.Debug = true
	echoServer.HideBanner = true
	echoServer.HidePort = true
	echoServer.Use(middleware.Recover())
	s.echoServer = echoServer

	instanceBasicSetting, err := s.getOrUpsertInstanceBasicSetting(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get instance basic setting")
	}

	secret := "usememos"
	if profile.Mode == "prod" {
		secret = instanceBasicSetting.SecretKey
	}
	s.Secret = secret

	// Register healthz endpoint.
	echoServer.GET("/healthz", func(c echo.Context) error {
		return c.String(http.StatusOK, "Service ready.")
	})

	// Register config endpoint for frontend (Ollama config from environment)
	echoServer.GET("/api/config", func(c echo.Context) error {
		ollamaBaseURL := os.Getenv("OLLAMA_BASE_URL")
		if ollamaBaseURL == "" {
			ollamaBaseURL = "http://localhost:11434"
		}
		ollamaModel := os.Getenv("OLLAMA_MODEL")
		if ollamaModel == "" {
			ollamaModel = "gpt-oss:120b"
		}
		return c.JSON(http.StatusOK, map[string]string{
			"ollamaBaseUrl": ollamaBaseURL,
			"ollamaModel":   ollamaModel,
		})
	})

	// Register templates endpoint (supports ConfigMap override)
	echoServer.GET("/api/templates", func(c echo.Context) error {
		// Replace {{DATE}} placeholder with current date
		templates := make([]config.Template, len(s.Config.Templates))
		currentDate := time.Now().Format("Monday, January 2, 2006")
		for i, template := range s.Config.Templates {
			templates[i] = template
			templates[i].Content = strings.ReplaceAll(template.Content, "{{DATE}}", currentDate)
		}
		return c.JSON(http.StatusOK, templates)
	})

	// Register AI prompts endpoint (supports ConfigMap override)
	echoServer.GET("/api/ai-prompts", func(c echo.Context) error {
		return c.JSON(http.StatusOK, s.Config.AIPrompts)
	})

	// Register Ollama proxy endpoint (for internal network addresses)
	echoServer.POST("/api/ollama/generate", func(c echo.Context) error {
		var req struct {
			Model   string `json:"model"`
			Prompt  string `json:"prompt"`
			BaseUrl string `json:"baseUrl,omitempty"`
			Stream  bool   `json:"stream,omitempty"`
		}
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		ollamaBaseURL := req.BaseUrl
		if ollamaBaseURL == "" {
			ollamaBaseURL = os.Getenv("OLLAMA_BASE_URL")
		}
		if ollamaBaseURL == "" {
			ollamaBaseURL = "http://localhost:11434"
		}

		// Prepare request body for Ollama
		requestBody := map[string]interface{}{
			"model":  req.Model,
			"prompt": req.Prompt,
			"stream": req.Stream,
		}
		bodyBytes, err := json.Marshal(requestBody)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to marshal request"})
		}

		// Forward request to Ollama
		ollamaURL := fmt.Sprintf("%s/api/generate", ollamaBaseURL)
		ollamaReq, err := http.NewRequest("POST", ollamaURL, bytes.NewReader(bodyBytes))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create request"})
		}
		ollamaReq.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(ollamaReq)
		if err != nil {
			return c.JSON(http.StatusBadGateway, map[string]string{"error": fmt.Sprintf("Failed to connect to Ollama: %v", err)})
		}
		defer resp.Body.Close()

		var ollamaResp map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to parse Ollama response"})
		}

		return c.JSON(resp.StatusCode, ollamaResp)
	})

	// Serve frontend static files.
	frontend.NewFrontendService(profile, store).Serve(ctx, echoServer)

	rootGroup := echoServer.Group("")

	apiV1Service := apiv1.NewAPIV1Service(s.Secret, profile, store)

	// Register HTTP file server routes BEFORE gRPC-Gateway to ensure proper range request handling for Safari.
	// This uses native HTTP serving (http.ServeContent) instead of gRPC for video/audio files.
	fileServerService := fileserver.NewFileServerService(s.Profile, s.Store, s.Secret)
	fileServerService.RegisterRoutes(echoServer)

	// Create and register RSS routes (needs markdown service from apiV1Service).
	rss.NewRSSService(s.Profile, s.Store, apiV1Service.MarkdownService).RegisterRoutes(rootGroup)
	// Register gRPC gateway as api v1.
	if err := apiV1Service.RegisterGateway(ctx, echoServer); err != nil {
		return nil, errors.Wrap(err, "failed to register gRPC gateway")
	}

	return s, nil
}

func (s *Server) Start(ctx context.Context) error {
	var address, network string
	if len(s.Profile.UNIXSock) == 0 {
		address = fmt.Sprintf("%s:%d", s.Profile.Addr, s.Profile.Port)
		network = "tcp"
	} else {
		address = s.Profile.UNIXSock
		network = "unix"
	}
	listener, err := net.Listen(network, address)
	if err != nil {
		return errors.Wrap(err, "failed to listen")
	}

	// Start Echo server directly (no cmux needed - all traffic is HTTP).
	s.echoServer.Listener = listener
	go func() {
		if err := s.echoServer.Start(address); err != nil && err != http.ErrServerClosed {
			slog.Error("failed to start echo server", "error", err)
		}
	}()
	s.StartBackgroundRunners(ctx)

	return nil
}

func (s *Server) Shutdown(ctx context.Context) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	slog.Info("server shutting down")

	// Cancel all background runners
	for _, cancelFunc := range s.runnerCancelFuncs {
		if cancelFunc != nil {
			cancelFunc()
		}
	}

	// Shutdown echo server.
	if err := s.echoServer.Shutdown(ctx); err != nil {
		slog.Error("failed to shutdown server", slog.String("error", err.Error()))
	}

	// Close database connection.
	if err := s.Store.Close(); err != nil {
		slog.Error("failed to close database", slog.String("error", err.Error()))
	}

	slog.Info("memos stopped properly")
}

func (s *Server) StartBackgroundRunners(ctx context.Context) {
	// Create a separate context for each background runner
	// This allows us to control cancellation for each runner independently
	s3Context, s3Cancel := context.WithCancel(ctx)

	// Store the cancel function so we can properly shut down runners
	s.runnerCancelFuncs = append(s.runnerCancelFuncs, s3Cancel)

	// Create and start S3 presign runner
	s3presignRunner := s3presign.NewRunner(s.Store)
	s3presignRunner.RunOnce(ctx)

	// Start continuous S3 presign runner
	go func() {
		s3presignRunner.Run(s3Context)
		slog.Info("s3presign runner stopped")
	}()

	// Log the number of goroutines running
	slog.Info("background runners started", "goroutines", runtime.NumGoroutine())
}

func (s *Server) getOrUpsertInstanceBasicSetting(ctx context.Context) (*storepb.InstanceBasicSetting, error) {
	instanceBasicSetting, err := s.Store.GetInstanceBasicSetting(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get instance basic setting")
	}
	modified := false
	if instanceBasicSetting.SecretKey == "" {
		instanceBasicSetting.SecretKey = uuid.NewString()
		modified = true
	}
	if modified {
		instanceSetting, err := s.Store.UpsertInstanceSetting(ctx, &storepb.InstanceSetting{
			Key:   storepb.InstanceSettingKey_BASIC,
			Value: &storepb.InstanceSetting_BasicSetting{BasicSetting: instanceBasicSetting},
		})
		if err != nil {
			return nil, errors.Wrap(err, "failed to upsert instance setting")
		}
		instanceBasicSetting = instanceSetting.GetBasicSetting()
	}
	return instanceBasicSetting, nil
}
