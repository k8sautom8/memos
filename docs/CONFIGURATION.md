# Configuration Guide

Memos supports file-based configuration for templates and AI prompts, allowing you to override defaults via ConfigMaps in Kubernetes/Docker deployments.

## Configuration File Location

Place your `config.json` file in the Memos data directory:
- **Default location**: `~/.memos/config.json` (development)
- **Production**: `/var/opt/memos/config.json` (or wherever `MEMOS_DATA` points)
- **Docker**: Mount as a volume or ConfigMap to `/var/opt/memos/config.json`

## Configuration Structure

```json
{
  "templates": [
    {
      "id": "unique-template-id",
      "name": "Template Display Name",
      "description": "Template description shown in UI",
      "content": "Template content with {{DATE}} placeholder",
      "icon": "optional-icon-name"
    }
  ],
  "aiPrompts": {
    "tagGenerationPrompt": "Your custom AI prompt with {{CONTENT}} placeholder"
  }
}
```

## Template Configuration

### Template Fields

- **id** (required): Unique identifier for the template
- **name** (required): Display name shown in the template menu
- **description** (required): Description shown in the template menu
- **content** (required): Template content (supports `{{DATE}}` placeholder)
- **icon** (optional): Icon identifier (not currently used, reserved for future)

### Date Placeholder

Use `{{DATE}}` in template content to insert the current date. The backend will replace it with the formatted date when the template is used.

### Example Template

```json
{
  "id": "sprint-planning",
  "name": "Sprint Planning",
  "description": "Template for sprint planning meetings",
  "content": "# Sprint Planning - {{DATE}}\n\n## Goals\n- \n\n## Tasks\n- [ ] \n\n## Blockers\n- \n"
}
```

## AI Prompt Configuration

The `aiPrompts` section allows you to customize all AI prompts used throughout the application.

### Available Prompts

1. **tagGenerationPrompt** - Used for automatic tag generation when saving memos
2. **assistantSuggestionsPrompt** - Used for contextual suggestions at cursor position
3. **assistantRewritePrompt** - Used for complete content rewriting
4. **assistantEnhanceSlightPrompt** - Used for slight enhancements (grammar, clarity)
5. **assistantEnhanceElaboratePrompt** - Used for elaborate enhancements (expanding on existing points)

### Placeholders

Each prompt supports different placeholders that are replaced at runtime:

- **Tag Generation**: 
  - `{{CONTENT}}` - Memo content (truncated to 1500 chars)
  - `{{EXISTING_TAGS}}` - List of existing tags (top 30 most used, sorted by frequency) - **Automatically inserted if not in prompt**
- **Suggestions**: 
  - `{{FULL_CONTEXT}}` - Full memo content (truncated to 2000 chars)
  - `{{CONTEXT_BEFORE}}` - Text before cursor (last 10 lines)
  - `{{CONTEXT_AFTER}}` - Text after cursor (first 5 lines)
  - `{{CURRENT_LINE}}` - Current line being typed
- **Rewrite/Enhance**: `{{CONTENT}}` - Memo content (truncated to 3000 chars)

### Example Configuration

```json
{
  "aiPrompts": {
    "tagGenerationPrompt": "You are a helpful assistant. Analyze this content and suggest 3 tags:\n\n{{CONTENT}}\n\nTags (one per line):",
    "assistantSuggestionsPrompt": "Custom prompt for suggestions:\n\n{{FULL_CONTEXT}}\n\nSuggestions:",
    "assistantRewritePrompt": "Custom rewrite prompt:\n\n{{CONTENT}}\n\nRewritten:",
    "assistantEnhanceSlightPrompt": "Custom slight enhance prompt:\n\n{{CONTENT}}\n\nEnhanced:",
    "assistantEnhanceElaboratePrompt": "Custom elaborate enhance prompt:\n\n{{CONTENT}}\n\nElaborated:"
  }
}
```

## Kubernetes ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: memos-config
  namespace: memos
data:
  config.json: |
    {
      "templates": [
        {
          "id": "custom-template",
          "name": "Custom Template",
          "description": "My custom template",
          "content": "# Custom\n\nContent here"
        }
      ],
      "aiPrompts": {
        "tagGenerationPrompt": "Custom prompt: {{CONTENT}}"
      }
    }
```

Then mount it in your deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: memos
spec:
  template:
    spec:
      containers:
      - name: memos
        volumeMounts:
        - name: config
          mountPath: /var/opt/memos/config.json
          subPath: config.json
      volumes:
      - name: config
        configMap:
          name: memos-config
```

## Environment Variables

Memos supports the following environment variables:

### Core Configuration

- **MEMOS_MODE** - Server mode: `prod`, `dev`, or `demo` (default: `dev`)
- **MEMOS_PORT** - HTTP port for the server (default: `8081`)
- **MEMOS_ADDR** - Binding address for the server (default: empty, binds to all interfaces)
- **MEMOS_DATA** - Data directory path (default: `~/.memos` for dev, `/var/opt/memos` for prod)
- **MEMOS_DRIVER** - Database driver: `sqlite`, `mysql`, or `postgres` (default: `sqlite`)
- **MEMOS_DSN** - Database connection string (default: auto-generated for SQLite)
- **MEMOS_INSTANCE_URL** - Public URL of your Memos instance (used for OAuth callbacks, etc.)

### AI/Ollama Configuration

- **OLLAMA_BASE_URL** - Ollama API base URL (default: `http://localhost:11434`)
- **OLLAMA_MODEL** - Default Ollama model to use for AI features (default: `gpt-oss:120b`)

These environment variables are read at server startup. The Ollama configuration is exposed via the `/api/config` endpoint and can be overridden in the browser's localStorage.

## Docker Compose Example

```yaml
services:
  memos:
    image: neosmemo/memos:latest
    volumes:
      - ~/.memos/:/var/opt/memos
      - ./config.json:/var/opt/memos/config.json:ro
    environment:
      - MEMOS_MODE=prod
      - MEMOS_PORT=5230
      - MEMOS_INSTANCE_URL=https://memos.example.com
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=llama3:8b
```

## Behavior

- **If config file exists**: Templates and prompts from the file are used
- **If config file doesn't exist**: Default templates and prompts are used
- **Partial config**: Missing fields fall back to defaults
- **Invalid config**: Falls back to defaults with a warning log

## API Endpoints

The configuration is exposed via REST API endpoints:

- `GET /api/config` - Returns Ollama configuration (base URL and model)
- `GET /api/templates` - Returns all templates (from config or defaults)
- `GET /api/ai-prompts` - Returns AI prompt configuration
- `POST /api/ollama/generate` - Proxy endpoint for Ollama API calls (for internal network access)

**Note**: `/api/templates` and `/api/ai-prompts` are public (no authentication required) and can be used by the frontend to fetch configuration. `/api/config` is also public. `/api/ollama/generate` requires authentication.

## Notes

- Configuration is loaded once at server startup
- Changes to `config.json` require a server restart to take effect
- Template IDs must be unique
- The `{{DATE}}` placeholder in templates is replaced server-side when templates are fetched
- The `{{CONTENT}}` placeholder in AI prompts is replaced client-side when generating tags
