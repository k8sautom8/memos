interface OllamaConfig {
  baseUrl?: string;
  model?: string;
}

interface AIPromptConfig {
  tagGenerationPrompt: string;
  assistantSuggestionsPrompt: string;
  assistantRewritePrompt: string;
  assistantEnhanceSlightPrompt: string;
  assistantEnhanceElaboratePrompt: string;
}

// Fetch config from backend API
let configCache: OllamaConfig | null = null;
let configFetchPromise: Promise<OllamaConfig> | null = null;

const fetchConfigFromBackend = async (): Promise<OllamaConfig> => {
  if (configCache) {
    return configCache;
  }
  
  if (configFetchPromise) {
    return configFetchPromise;
  }

  configFetchPromise = (async () => {
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const data = await response.json();
        configCache = {
          baseUrl: data.ollamaBaseUrl || "http://localhost:11434",
          model: data.ollamaModel || "gpt-oss:120b",
        };
        return configCache;
      }
    } catch (error) {
      console.warn("Failed to fetch Ollama config from backend:", error);
    }
    // Fallback to defaults
    return {
      baseUrl: "http://localhost:11434",
      model: "gpt-oss:120b",
    };
  })();

  return configFetchPromise;
};

const DEFAULT_CONFIG: Required<OllamaConfig> = {
  baseUrl: "http://localhost:11434",
  model: "gpt-oss:120b",
};

// Cache for AI prompt config fetched from backend
let promptConfigCache: AIPromptConfig | null = null;
let promptConfigFetchPromise: Promise<AIPromptConfig> | null = null;

const fetchPromptConfigFromBackend = async (): Promise<AIPromptConfig> => {
  if (promptConfigCache) {
    return promptConfigCache;
  }

  if (promptConfigFetchPromise) {
    return promptConfigFetchPromise;
  }

  promptConfigFetchPromise = (async () => {
    try {
      const response = await fetch("/api/ai-prompts");
      if (response.ok) {
        const data = await response.json();
        promptConfigCache = data;
        return promptConfigCache;
      }
    } catch (error) {
      console.warn("Failed to fetch AI prompt config from backend, using defaults:", error);
    }
    // Fallback to defaults
    const {
      DEFAULT_TAG_GENERATION_PROMPT,
      DEFAULT_ASSISTANT_SUGGESTIONS_PROMPT,
      DEFAULT_ASSISTANT_REWRITE_PROMPT,
      DEFAULT_ASSISTANT_ENHANCE_SLIGHT_PROMPT,
      DEFAULT_ASSISTANT_ENHANCE_ELABORATE_PROMPT,
    } = await import("./tagService");
    return {
      tagGenerationPrompt: DEFAULT_TAG_GENERATION_PROMPT,
      assistantSuggestionsPrompt: DEFAULT_ASSISTANT_SUGGESTIONS_PROMPT,
      assistantRewritePrompt: DEFAULT_ASSISTANT_REWRITE_PROMPT,
      assistantEnhanceSlightPrompt: DEFAULT_ASSISTANT_ENHANCE_SLIGHT_PROMPT,
      assistantEnhanceElaboratePrompt: DEFAULT_ASSISTANT_ENHANCE_ELABORATE_PROMPT,
    };
  })();

  return promptConfigFetchPromise;
};

export const ollamaService = {
  async getPromptConfig(): Promise<AIPromptConfig> {
    return fetchPromptConfigFromBackend();
  },

  async getConfig(): Promise<OllamaConfig> {
    // First try to fetch from backend (uses environment variables)
    const backendConfig = await fetchConfigFromBackend();
    
    // Allow localStorage to override backend config
    const baseUrl = localStorage.getItem("ollama_base_url") || backendConfig.baseUrl || DEFAULT_CONFIG.baseUrl;
    const model = localStorage.getItem("ollama_model") || backendConfig.model || DEFAULT_CONFIG.model;
    return { baseUrl, model };
  },

  setConfig(config: OllamaConfig): void {
    if (config.baseUrl) {
      localStorage.setItem("ollama_base_url", config.baseUrl);
    }
    if (config.model) {
      localStorage.setItem("ollama_model", config.model);
    }
  },

  async generateCompletion(prompt: string, context?: string): Promise<string> {
    const { baseUrl, model } = await this.getConfig();

    try {
      // Try to use backend proxy first (for internal network addresses)
      // If baseUrl is an internal address (localhost, .local, private IP), use proxy
      const useProxy = baseUrl.includes("localhost") || 
                      baseUrl.includes(".local") || 
                      baseUrl.match(/^http:\/\/10\.|^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.|^http:\/\/192\.168\./);
      
      const apiUrl = useProxy 
        ? `/api/ollama/generate` 
        : `${baseUrl}/api/generate`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: context ? `${context}\n\n${prompt}` : prompt,
          stream: false,
          ...(useProxy ? { baseUrl } : {}), // Include baseUrl in body if using proxy
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.response?.trim() || "";
    } catch (error) {
      console.error("Ollama API error:", error);
      throw error;
    }
  },

  async getSuggestions(content: string, cursorPosition: number): Promise<string[]> {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const currentLine = beforeCursor.split("\n").pop() || "";
    
    // Get more context - last 10 lines before cursor and first 5 lines after
    const linesBefore = beforeCursor.split("\n");
    const linesAfter = afterCursor.split("\n");
    const contextBefore = linesBefore.slice(-10).join("\n");
    const contextAfter = linesAfter.slice(0, 5).join("\n");
    
    // Use full content as context if it's not too long (max 2000 chars)
    const fullContext = content.length < 2000 ? content : content.slice(0, 2000);

    // Fetch prompt config from backend (supports ConfigMap override)
    const promptConfig = await this.getPromptConfig();
    const prompt = promptConfig.assistantSuggestionsPrompt
      .replace("{{FULL_CONTEXT}}", fullContext)
      .replace("{{CONTEXT_BEFORE}}", contextBefore)
      .replace("{{CONTEXT_AFTER}}", contextAfter)
      .replace("{{CURRENT_LINE}}", currentLine);

    try {
      const response = await this.generateCompletion(prompt);
      const suggestions = response
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => {
          // Filter out empty lines, numbered items, and common prefixes
          if (s.length === 0) return false;
          if (s.match(/^\d+[\.\)]\s*/)) return false;
          if (s.match(/^[-*•]\s*/)) return false;
          if (s.match(/^(Suggestion|Option|Idea):\s*/i)) return false;
          return true;
        })
        .slice(0, 3);

      return suggestions.length > 0 ? suggestions : ["Continue the thought...", "Add more detail...", "Expand on this idea..."];
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      return [];
    }
  },

  async enhanceContent(content: string, section?: string): Promise<string> {
    const prompt = section
      ? `Enhance and expand the following section of a note/memo. Make it more detailed, informative, and well-structured while maintaining the original intent and style.

Section to enhance:
${section}

Full context:
${content.length < 1500 ? content : content.slice(0, 1500)}

Provide an enhanced version of the section:`
      : `Analyze the following note/memo and provide an enhanced version that is more detailed, well-structured, and informative while maintaining the original intent and style.

Content:
${content.length < 2000 ? content : content.slice(0, 2000)}

Provide the enhanced version:`;

    try {
      const response = await this.generateCompletion(prompt);
      return response.trim();
    } catch (error) {
      console.error("Failed to enhance content:", error);
      throw error;
    }
  },

  async rewriteContent(content: string): Promise<string> {
    // Fetch prompt config from backend (supports ConfigMap override)
    const promptConfig = await this.getPromptConfig();
    const prompt = promptConfig.assistantRewritePrompt
      .replace("{{CONTENT}}", content.length < 3000 ? content : content.slice(0, 3000));

    try {
      const response = await this.generateCompletion(prompt);
      return response.trim();
    } catch (error) {
      console.error("Failed to rewrite content:", error);
      throw error;
    }
  },

  async enhanceContentSlight(content: string): Promise<string> {
    // Fetch prompt config from backend (supports ConfigMap override)
    const promptConfig = await this.getPromptConfig();
    const prompt = promptConfig.assistantEnhanceSlightPrompt
      .replace("{{CONTENT}}", content.length < 3000 ? content : content.slice(0, 3000));

    try {
      const response = await this.generateCompletion(prompt);
      return response.trim();
    } catch (error) {
      console.error("Failed to enhance content slightly:", error);
      throw error;
    }
  },

  async enhanceContentElaborate(content: string): Promise<string> {
    // Fetch prompt config from backend (supports ConfigMap override)
    const promptConfig = await this.getPromptConfig();
    const prompt = promptConfig.assistantEnhanceElaboratePrompt
      .replace("{{CONTENT}}", content.length < 3000 ? content : content.slice(0, 3000));

    try {
      const response = await this.generateCompletion(prompt);
      return response.trim();
    } catch (error) {
      console.error("Failed to enhance content elaborately:", error);
      throw error;
    }
  },
};

