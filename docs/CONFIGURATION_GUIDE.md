# How to Apply Custom Configuration

This guide explains how to apply custom templates and AI prompts to your Memos instance.

## Quick Start

1. **Create your `config.json` file** using the example below
2. **Place it in your Memos data directory**
3. **Restart your Memos server**

## Configuration File Location

The configuration file must be named `config.json` and placed in your Memos data directory:

- **Development**: `~/.memos/config.json`
- **Production (Linux)**: `/var/opt/memos/config.json`
- **Production (Windows)**: `C:\ProgramData\memos\config.json`
- **Docker**: Mount to `/var/opt/memos/config.json`
- **Kubernetes**: Mount via ConfigMap to `/var/opt/memos/config.json`

## Step-by-Step Instructions

### Option 1: Local Development

1. **Find your data directory**:
   ```bash
   # Default location
   ls ~/.memos/
   ```

2. **Create or edit `config.json`**:
   ```bash
   nano ~/.memos/config.json
   ```

3. **Paste your configuration** (see example below)

4. **Restart Memos**:
   ```bash
   # Stop your current Memos instance
   # Then start it again
   go run ./cmd/memos --mode dev --port 8081
   ```

### Option 2: Docker Compose

1. **Create `config.json` in your project directory**:
   ```bash
   mkdir -p ./memos-config
   nano ./memos-config/config.json
   ```

2. **Update your `docker-compose.yaml`**:
   ```yaml
   services:
     memos:
       image: neosmemo/memos:latest
       volumes:
         - ~/.memos/:/var/opt/memos
         - ./memos-config/config.json:/var/opt/memos/config.json:ro  # Add this line
       environment:
         - MEMOS_MODE=prod
         - MEMOS_PORT=5230
         - MEMOS_INSTANCE_URL=https://memos.example.com  # Optional: Your public URL
         - OLLAMA_BASE_URL=http://ollama:11434  # Optional: Ollama server URL
         - OLLAMA_MODEL=llama3:8b  # Optional: Default Ollama model
   ```

3. **Restart the container**:
   ```bash
   docker-compose restart memos
   ```

### Option 3: Kubernetes ConfigMap

#### Method 1: Create ConfigMap from YAML file

1. **Create a ConfigMap YAML file** (`memos-config.yaml`):
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

2. **Apply the ConfigMap**:
   ```bash
   kubectl apply -f memos-config.yaml
   ```

#### Method 2: Create ConfigMap directly from config.json file

**Create ConfigMap from existing config.json file:**
```bash
# Create ConfigMap from config.json file
kubectl create configmap memos-config \
  --from-file=config.json=./config.json \
  --namespace=memos

# Or if using config.example.json
kubectl create configmap memos-config \
  --from-file=config.json=./config.example.json \
  --namespace=memos
```

**Create ConfigMap from literal JSON (inline):**
```bash
kubectl create configmap memos-config \
  --from-literal=config.json='{"templates":[],"aiPrompts":{}}' \
  --namespace=memos
```

**Update existing ConfigMap:**
```bash
# Update ConfigMap from file
kubectl create configmap memos-config \
  --from-file=config.json=./config.json \
  --namespace=memos \
  --dry-run=client -o yaml | kubectl apply -f -

# Or edit directly
kubectl edit configmap memos-config -n memos
```

**View ConfigMap:**
```bash
# View ConfigMap contents
kubectl get configmap memos-config -n memos -o yaml

# View just the config.json data
kubectl get configmap memos-config -n memos -o jsonpath='{.data.config\.json}'
```

3. **Update your Deployment** to mount the ConfigMap:
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
             readOnly: true
         volumes:
         - name: config
           configMap:
             name: memos-config
   ```

4. **Restart the deployment**:
   ```bash
   kubectl rollout restart deployment/memos
   ```

### Option 4: Docker Run Command

```bash
docker run -d \
  --name memos \
  -p 5230:5230 \
  -v ~/.memos/:/var/opt/memos \
  -v /path/to/your/config.json:/var/opt/memos/config.json:ro \
  -e MEMOS_MODE=prod \
  -e MEMOS_PORT=5230 \
  -e MEMOS_INSTANCE_URL=https://memos.example.com \
  -e OLLAMA_BASE_URL=http://localhost:11434 \
  -e OLLAMA_MODEL=llama3:8b \
  neosmemo/memos:latest
```

## Environment Variables Reference

Memos supports the following environment variables:

### Core Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MEMOS_MODE` | Server mode | `dev` | `prod`, `dev`, `demo` |
| `MEMOS_PORT` | HTTP port | `8081` | `5230` |
| `MEMOS_ADDR` | Binding address | (empty) | `0.0.0.0` |
| `MEMOS_DATA` | Data directory | `~/.memos` (dev), `/var/opt/memos` (prod) | `/var/opt/memos` |
| `MEMOS_DRIVER` | Database driver | `sqlite` | `mysql`, `postgres` |
| `MEMOS_DSN` | Database connection string | Auto-generated for SQLite | `user:pass@tcp(localhost:3306)/memos` |
| `MEMOS_INSTANCE_URL` | Public URL of instance | (empty) | `https://memos.example.com` |

### AI/Ollama Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434` | `http://ollama:11434` |
| `OLLAMA_MODEL` | Default Ollama model | `gpt-oss:120b` | `llama3:8b`, `mistral:7b` |

**Note**: Ollama environment variables are read at server startup and exposed via `/api/config`. They can be overridden in the browser's localStorage for per-user customization.

## Example Configuration File

Create a file named `config.json` with this structure:

```json
{
  "templates": [
    {
      "id": "daily-standup",
      "name": "Daily Standup",
      "description": "Template for daily standup meetings",
      "content": "# Daily Standup - {{DATE}}\n\n## What I did yesterday\n- \n\n## What I'm doing today\n- \n\n## Blockers\n- \n"
    },
    {
      "id": "bug-report",
      "name": "Bug Report",
      "description": "Template for reporting bugs",
      "content": "# Bug Report\n\n**Environment:** \n**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n\n**Screenshots:**\n"
    }
  ],
  "aiPrompts": {
    "tagGenerationPrompt": "Analyze this content and suggest 3 relevant tags:\n\n{{CONTENT}}\n\nTags (one per line):",
    "assistantSuggestionsPrompt": "Provide 3 suggestions to continue writing:\n\n{{FULL_CONTEXT}}\n\nSuggestions:",
    "assistantRewritePrompt": "Rewrite this content:\n\n{{CONTENT}}\n\nRewritten:",
    "assistantEnhanceSlightPrompt": "Make slight improvements:\n\n{{CONTENT}}\n\nEnhanced:",
    "assistantEnhanceElaboratePrompt": "Expand on existing points:\n\n{{CONTENT}}\n\nElaborated:"
  }
}
```

## Verifying Configuration

After applying your configuration:

1. **Check server logs** for any warnings:
   ```bash
   # Docker
   docker logs memos | grep -i config
   
   # Kubernetes
   kubectl logs deployment/memos | grep -i config
   ```

2. **Test templates**:
   - Open Memos in your browser
   - Click the template icon in the editor toolbar
   - Your custom templates should appear in the list

3. **Test AI prompts**:
   - Create a memo and save it
   - Check if tags are generated using your custom prompt
   - Use the AI Assistant to verify prompts are working

## Troubleshooting

### Configuration Not Loading

**Problem**: Templates/prompts not appearing

**Solutions**:
1. Check file location: `config.json` must be in the data directory
2. Check file permissions: File must be readable
3. Check JSON syntax: Validate your JSON at https://jsonlint.com/
4. Check server logs: Look for config-related errors
5. Restart server: Configuration is loaded at startup

### Partial Configuration

**Problem**: Some templates work, others don't

**Solution**: Check your JSON structure - all templates must have `id`, `name`, `description`, and `content` fields

### Defaults Still Showing

**Problem**: Custom config not overriding defaults

**Solutions**:
1. Verify file path is correct
2. Check file is readable by the Memos process
3. Ensure JSON is valid (no syntax errors)
4. Restart the server after making changes

## Updating Configuration

To update your configuration:

1. **Edit `config.json`** with your changes
2. **Restart Memos server** (configuration is loaded at startup)
3. **Clear browser cache** if templates don't update (Ctrl+Shift+R or Cmd+Shift+R)

## Best Practices

1. **Backup your config**: Keep a copy of your `config.json` file
2. **Version control**: Store your config in Git for easy deployment
3. **Test locally**: Test configuration changes in development before production
4. **Validate JSON**: Always validate JSON syntax before applying
5. **Document customizations**: Add comments in your config file (outside JSON) or maintain a separate doc

## Example: Complete Setup Script

For Docker Compose, create a setup script:

```bash
#!/bin/bash
# setup-config.sh

# Create config directory
mkdir -p ./memos-config

# Copy example config
cp config.example.json ./memos-config/config.json

# Edit config (opens in default editor)
${EDITOR:-nano} ./memos-config/config.json

# Restart memos
docker-compose restart memos

echo "Configuration applied! Check logs: docker-compose logs memos"
```

Make it executable:
```bash
chmod +x setup-config.sh
./setup-config.sh
```

## Need Help?

- Check `docs/CONFIGURATION.md` for detailed configuration options
- See `config.example.json` for a complete example
- Review server logs for error messages
- Ensure your JSON is valid using a JSON validator
