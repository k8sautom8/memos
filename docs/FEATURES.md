# Memos Features Guide

This document provides an overview of all features available in Memos, including recent enhancements.

## Core Features

### Note-Taking
- **Markdown Support** - Full markdown syntax with syntax highlighting
- **Rich Text Editing** - Inline formatting toolbar with shortcuts
- **Templates** - Customizable templates with `{{DATE}}` placeholder support
- **Tags** - Organize memos with tags (hierarchical tags supported)
- **Visibility Control** - Public, Protected, or Private memos
- **Pinning** - Pin important memos to the top
- **Search** - Full-text search across all memos
- **Filtering** - Filter by tags, visibility, date, and more

### Comments System
- **Inline Comments** - Comment directly on memos
- **Real-time Updates** - Comments update in real-time
- **Threading Support** - Reply to comments (hierarchical structure)
- **Comment Count** - See comment count on memo cards

## AI Features

### AI Tag Generation
- **Automatic Tagging** - AI automatically generates 3 relevant tags when saving memos
- **Tag Reuse** - Smart matching to reuse existing tags and minimize proliferation
- **Configurable Prompts** - Customize AI behavior via `config.json`
- **Asynchronous Processing** - Tag generation happens in background (doesn't slow down saving)

### AI Writing Assistant
Access via the AI icon in the editor toolbar:

1. **Get Contextual Suggestions** - AI suggests 3 ways to continue writing at cursor position
2. **Enhance Slightly** - Minor improvements (grammar, clarity) without changing content
3. **Enhance Elaborately** - Expand on existing points with more detail
4. **Re-write Completely** - Complete rewrite with improved structure and style
5. **Custom Prompt** - Provide your own instructions for AI assistance

**Configuration:**
- All AI prompts are configurable via `config.json` (supports ConfigMaps)
- Uses Ollama-compatible models (Llama, Mistral, GPT, etc.)
- Configure via `OLLAMA_BASE_URL` and `OLLAMA_MODEL` environment variables

## Text-to-Speech

### Read Aloud Feature
- **Natural Reading** - Optimized for story-like reading experience
- **Voice Selection** - Choose from available system voices (male/female)
- **Premium Voices** - Prioritizes neural/premium voices for better quality
- **Playback Controls** - Play, pause, stop, and voice selection
- **Smart Processing** - Automatically cleans markdown and adds natural pauses

**Usage:**
- Click the speaker icon on any memo
- Select your preferred voice from the dropdown
- Control playback with play/pause buttons

## Configuration & Customization

### File-Based Configuration
- **Templates** - Customize memo templates via `config.json`
- **AI Prompts** - Override all AI prompts for tag generation and writing assistance
- **ConfigMap Support** - Deploy configurations via Kubernetes ConfigMaps
- **Environment Variables** - Configure Ollama settings via environment variables

### Configuration Files
- **Location**: `{MEMOS_DATA}/config.json`
- **Format**: JSON with templates and AI prompts
- **Example**: See `config.example.json` in the repository root

### Environment Variables
See [Configuration Guide](CONFIGURATION_GUIDE.md) for complete list:
- `MEMOS_MODE` - Server mode (prod/dev/demo)
- `MEMOS_PORT` - HTTP port
- `MEMOS_DATA` - Data directory
- `MEMOS_DRIVER` - Database driver (sqlite/mysql/postgres)
- `OLLAMA_BASE_URL` - Ollama API URL
- `OLLAMA_MODEL` - Default Ollama model

## Performance Optimizations

### Image Optimization
- **Lazy Loading** - Images load only when visible (Intersection Observer)
- **Optimized Loading** - Priority loading for above-the-fold images
- **CLS Prevention** - Explicit width/height attributes prevent layout shifts

### React Query Caching
- **Smart Caching** - Efficient data caching with React Query
- **Background Refetching** - Automatic updates without blocking UI
- **Optimistic Updates** - Instant UI feedback for mutations

## UI/UX Enhancements

### Mobile Optimization
- **Responsive Toolbar** - Optimized mobile toolbar layout
- **Visibility Selector** - Simplified "P" button with color coding on mobile
- **Touch-Friendly** - All controls optimized for touch interaction

### Theme Support
- **Multiple Themes** - Dark, Midnight, Paper, Whitewall, Default, Colorful
- **Theme-Aware Components** - All buttons and forms adapt to theme
- **Consistent Styling** - Unified design language across all components

### Inline Forms
- **No Popups** - All forms are inline (no modal dialogs)
- **Better UX** - Seamless form experience without interruptions
- **Smooth Transitions** - CSS transitions for form appearance

## API & Integration

### REST API
- **Full REST API** - Complete REST API for all operations
- **gRPC Support** - gRPC and Connect RPC protocols
- **Public Endpoints** - Templates and AI prompts available without auth

### API Endpoints
- `GET /api/config` - Ollama configuration
- `GET /api/templates` - Available templates
- `GET /api/ai-prompts` - AI prompt configuration
- `POST /api/ollama/generate` - Ollama proxy endpoint

See [Configuration Guide](CONFIGURATION_GUIDE.md) for detailed API documentation.

## Deployment Options

### Docker
- **One-line Install** - Simple Docker run command
- **Docker Compose** - Production-ready compose files
- **Volume Mounting** - Easy data persistence

### Kubernetes
- **ConfigMap Support** - Deploy configurations via ConfigMaps
- **Helm Charts** - (If available) Helm chart support
- **Production Ready** - Full Kubernetes deployment support

### Database Support
- **SQLite** - Default, zero-configuration database
- **MySQL** - Production-grade relational database
- **PostgreSQL** - Advanced PostgreSQL support

## Security

### Authentication
- **JWT Tokens** - Secure JWT-based authentication
- **Personal Access Tokens** - Long-lived tokens for API access
- **OAuth 2.0** - SSO support via OAuth providers

### Privacy
- **Self-Hosted** - Complete data ownership
- **Zero Telemetry** - No tracking or analytics
- **Local AI** - AI features run on your infrastructure (Ollama)

## Migration & Upgrades

### Database Migrations
- **Automatic Migrations** - Migrations run automatically on startup
- **Version Tracking** - Schema version stored in database
- **Rollback Support** - Safe migration process

### Configuration Migration
- **Backward Compatible** - Old configurations still work
- **Default Fallbacks** - Missing configs use sensible defaults
- **Validation** - Config validation on startup

## Troubleshooting

### Common Issues
1. **AI Features Not Working** - Check `OLLAMA_BASE_URL` and `OLLAMA_MODEL` environment variables
2. **Templates Not Loading** - Verify `config.json` location and JSON syntax
3. **Comments Not Saving** - Check database permissions and connection
4. **Text-to-Speech Not Working** - Ensure browser supports Web Speech API

### Getting Help
- Check [Configuration Guide](CONFIGURATION_GUIDE.md) for setup issues
- Review server logs for error messages
- Validate JSON configuration files
- Ensure all environment variables are set correctly

## Future Enhancements

Potential future features (not yet implemented):
- Voice input for memos
- Advanced AI model selection per user
- Comment reactions
- Rich media support
- Collaborative editing

---

For detailed configuration instructions, see:
- [Configuration Guide](CONFIGURATION_GUIDE.md)
- [Configuration Reference](CONFIGURATION.md)
