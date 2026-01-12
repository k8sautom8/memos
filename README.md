# Memos

<img align="right" height="96px" src="https://raw.githubusercontent.com/usememos/.github/refs/heads/main/assets/logo-rounded.png" alt="Memos" />

An open-source, self-hosted note-taking service. Your thoughts, your data, your control — no tracking, no ads, no subscription fees.

[![Home](https://img.shields.io/badge/🏠-usememos.com-blue?style=flat-square)](https://usememos.com)
[![Live Demo](https://img.shields.io/badge/✨-Try%20Demo-orange?style=flat-square)](https://demo.usememos.com/)
[![Docs](https://img.shields.io/badge/📚-Documentation-green?style=flat-square)](https://usememos.com/docs)
[![Discord](https://img.shields.io/badge/💬-Discord-5865f2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/tfPJa4UmAv)
[![Docker Pulls](https://img.shields.io/docker/pulls/neosmemo/memos?style=flat-square&logo=docker)](https://hub.docker.com/r/neosmemo/memos)

<img src="https://raw.githubusercontent.com/usememos/.github/refs/heads/main/assets/demo.png" alt="Memos Demo Screenshot" height="512" />

### 💎 Featured Sponsors

[**Warp** — The AI-powered terminal built for speed and collaboration](https://go.warp.dev/memos)

<a href="https://go.warp.dev/memos" target="_blank" rel="noopener">
  <img src="https://raw.githubusercontent.com/warpdotdev/brand-assets/main/Github/Sponsor/Warp-Github-LG-02.png" alt="Warp - The AI-powered terminal built for speed and collaboration" width="512" />
</a>

---

[**LambdaTest** - Cross-browser testing cloud](https://www.lambdatest.com/?utm_source=memos&utm_medium=sponsor)
  
<a href="https://www.lambdatest.com/?utm_source=memos&utm_medium=sponsor" target="_blank" rel="noopener">
  <img src="https://www.lambdatest.com/blue-logo.png" alt="LambdaTest - Cross-browser testing cloud" height="50" />
</a>

## Overview

Memos is a privacy-first, self-hosted knowledge base that works seamlessly for personal notes, team wikis, and knowledge management. Built with Go and React, it offers lightning-fast performance without compromising on features or usability.

**Why choose Memos over cloud services?**

| Feature           | Memos                          | Cloud Services                |
| ----------------- | ------------------------------ | ----------------------------- |
| **Privacy**       | ✅ Self-hosted, zero telemetry | ❌ Your data on their servers |
| **Cost**          | ✅ Free forever, MIT license   | ❌ Subscription fees          |
| **Performance**   | ✅ Instant load, no latency    | ⚠️ Depends on internet        |
| **Ownership**     | ✅ Full control & export       | ❌ Vendor lock-in             |
| **API Access**    | ✅ Full REST + gRPC APIs       | ⚠️ Limited or paid            |
| **Customization** | ✅ Open source, forkable       | ❌ Closed ecosystem           |

## Features

- **🔒 Privacy-First Architecture**

  - Self-hosted on your infrastructure with zero telemetry
  - Complete data ownership and export capabilities
  - No tracking, no ads, no vendor lock-in

- **📝 Markdown Native**

  - Full markdown support with syntax highlighting
  - Plain text storage — take your data anywhere
  - Customizable templates with date placeholders
  - Inline formatting toolbar

- **🤖 AI-Powered Features**

  - **AI Tag Generation** - Automatically generate relevant tags using Ollama
  - **AI Writing Assistant** - Contextual suggestions, rewrite, and enhance content
  - **Custom AI Prompts** - Configure AI behavior via ConfigMaps
  - **Tag Reuse** - Smart tag matching to minimize tag proliferation
  - Supports any Ollama-compatible models (Llama, Mistral, GPT, etc.)

- **💬 Comments & Collaboration**

  - Inline comment system for discussions
  - Real-time comment updates
  - Comment threading support

- **🔊 Text-to-Speech**

  - Read memos aloud with natural-sounding voices
  - Multiple voice options (male/female, premium voices)
  - Play/pause controls and voice selection
  - Optimized for story-like reading experience

- **⚡ Blazing Fast**

  - Built with Go backend and React frontend
  - Optimized for performance at any scale
  - Lazy-loaded images with Intersection Observer
  - Efficient React Query caching

- **🐳 Simple Deployment**

  - One-line Docker installation
  - Supports SQLite, MySQL, and PostgreSQL
  - Kubernetes ConfigMap support for configuration
  - Environment variable configuration

- **🔗 Developer-Friendly**

  - Full REST and gRPC APIs
  - Easy integration with existing workflows
  - Configurable templates and AI prompts
  - File-based configuration (supports ConfigMaps)

- **🎨 Beautiful Interface**
  - Clean, minimal design with multiple themes
  - Dark mode and custom theme support
  - Mobile-responsive layout with optimized toolbar
  - Inline forms (no popups) for better UX

## Quick Start

### Docker (Recommended)

```bash
docker run -d \
  --name memos \
  -p 5230:5230 \
  -v ~/.memos:/var/opt/memos \
  -e MEMOS_MODE=prod \
  -e OLLAMA_BASE_URL=http://localhost:11434 \
  -e OLLAMA_MODEL=llama3:8b \
  neosmemo/memos:stable
```

Open `http://localhost:5230` and start writing!

**Environment Variables:**
- `MEMOS_MODE` - Server mode (`prod`, `dev`, `demo`)
- `MEMOS_PORT` - HTTP port (default: `8081`)
- `MEMOS_DATA` - Data directory path
- `MEMOS_DRIVER` - Database driver (`sqlite`, `mysql`, `postgres`)
- `MEMOS_DSN` - Database connection string
- `MEMOS_INSTANCE_URL` - Public URL of your instance
- `OLLAMA_BASE_URL` - Ollama API URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL` - Default Ollama model (default: `gpt-oss:120b`)

### Documentation

- **[Features Guide](docs/FEATURES.md)** - Complete overview of all features including AI, text-to-speech, comments, and more
- **[Configuration Guide](docs/CONFIGURATION_GUIDE.md)** - How to configure templates, AI prompts, and environment variables
- **[Configuration Reference](docs/CONFIGURATION.md)** - Detailed configuration options and API endpoints

### Try the Live Demo

Don't want to install yet? Try our [live demo](https://demo.usememos.com/) first!

### Other Installation Methods

- **Docker Compose** - Recommended for production deployments
- **Pre-built Binaries** - Available for Linux, macOS, and Windows
- **Kubernetes** - Helm charts and manifests available
- **Build from Source** - For development and customization

See our [installation guide](https://usememos.com/docs/installation) for detailed instructions.

## Contributing

We welcome contributions of all kinds! Whether you're fixing bugs, adding features, improving documentation, or helping with translations — every contribution matters.

**Ways to contribute:**

- 🐛 [Report bugs](https://github.com/usememos/memos/issues/new?template=bug_report.md)
- 💡 [Suggest features](https://github.com/usememos/memos/issues/new?template=feature_request.md)
- 🔧 [Submit pull requests](https://github.com/usememos/memos/pulls)
- 📖 [Improve documentation](https://github.com/usememos/memos/tree/main/docs)
- 🌍 [Help with translations](https://github.com/usememos/memos/tree/main/web/src/locales)

## Sponsors

Love Memos? [Sponsor us on GitHub](https://github.com/sponsors/usememos) to help keep the project growing!

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=usememos/memos&type=Date)](https://star-history.com/#usememos/memos&Date)

## License

Memos is open-source software licensed under the [MIT License](LICENSE).

## Privacy Policy

Memos is built with privacy as a core principle. As a self-hosted application, all your data stays on your infrastructure. There is no telemetry, no tracking, and no data collection. See our [Privacy Policy](https://usememos.com/privacy) for details.

---

**[Website](https://usememos.com)** • **[Documentation](https://usememos.com/docs)** • **[Demo](https://demo.usememos.com/)** • **[Discord](https://discord.gg/tfPJa4UmAv)** • **[X/Twitter](https://x.com/usememos)**

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>
