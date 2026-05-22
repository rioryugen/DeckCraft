<div align="center">

<!-- Animated SVG Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0096C7,100:48CAE4&height=220&section=header&text=🎴%20PPT%20Deck&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=AI-Powered%20Presentation%20Generator&descSize=20&descAlignY=55" width="100%"/>

<!-- Typing Animation -->
<a href="#-quick-start">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=0096C7&center=true&vCenter=true&multiline=true&repeat=true&width=600&height=80&lines=Generate+stunning+presentations+with+AI;From+text+to+slides+in+seconds;Self-hosted+%7C+Open+Source+%7C+Multi-LLM" alt="Typing SVG" />
</a>

<br/>

<!-- Animated Badges -->
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white&labelColor=1a1a2e)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=1a1a2e)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi&logoColor=white&labelColor=1a1a2e)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&labelColor=1a1a2e)](LICENSE)

<br/>

[![Stars](https://img.shields.io/github/stars/mnknayeemintel/PPT-Deck?style=social)](https://github.com/mnknayeemintel/PPT-Deck)
[![Forks](https://img.shields.io/github/forks/mnknayeemintel/PPT-Deck?style=social)](https://github.com/mnknayeemintel/PPT-Deck/fork)

</div>

---

<div align="center">

### ⚡ Transform any idea into a professional presentation

</div>

<br/>

<!-- Animated Feature Cards -->
<table align="center">
<tr>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/artificial-intelligence.png" width="60"/><br/>
<b>🤖 Multi-LLM</b><br/>
<sub>OpenAI • Gemini • Claude<br/>Ollama • Custom APIs</sub>
</td>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/template.png" width="60"/><br/>
<b>🎨 Smart Templates</b><br/>
<sub>Auto-layout • Themes<br/>Professional designs</sub>
</td>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/chat.png" width="60"/><br/>
<b>💬 Chat Editor</b><br/>
<sub>Iterate with AI<br/>Real-time editing</sub>
</td>
<td align="center" width="25%">
<img src="https://img.icons8.com/fluency/96/export-pdf.png" width="60"/><br/>
<b>📦 Export</b><br/>
<sub>PPTX • PDF<br/>One-click download</sub>
</td>
</tr>
</table>

---

## 📋 Table of Contents

<details open>
<summary><b>Click to expand/collapse</b></summary>

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🔌 API Reference](#-api-reference)
- [🐳 Docker](#-docker)
- [🧪 Testing](#-testing)
- [📖 Usage Examples](#-usage-examples)
- [🗺️ Roadmap](#️-roadmap)
- [📝 Changelog](#-changelog)
- [🤝 Contributing](#-contributing)

</details>

---

## ✨ Features

<details open>
<summary><b>🤖 AI-Powered Generation</b></summary>

| Feature | Description |
|---------|-------------|
| 🧠 **Smart Outlines** | AI generates structured outlines from any topic |
| 📝 **Content Generation** | Full slide content with speaker notes |
| 🎯 **Tone Control** | Professional, casual, academic, creative |
| 🌍 **Multi-language** | Generate in 50+ languages |
| 📊 **Verbosity Levels** | Concise, standard, or detailed |

</details>

<details>
<summary><b>🎨 Design & Templates</b></summary>

| Feature | Description |
|---------|-------------|
| 🖼️ **Auto-Layout** | AI picks the best slide layout per content |
| 🎭 **Theme Engine** | Generate custom color themes with AI |
| 📐 **Template Studio** | Create and save custom templates |
| 🖌️ **Smart Styling** | Automatic font sizing and spacing |

</details>

<details>
<summary><b>🔗 Integrations</b></summary>

| Provider | Models | Status |
|----------|--------|--------|
| OpenAI | GPT-4.1, GPT-4o, o3, o4-mini | ✅ |
| Google | Gemini 2.5 Pro/Flash | ✅ |
| Anthropic | Claude Sonnet/Opus | ✅ |
| Ollama | Llama, Mistral, Phi, etc. | ✅ |
| GitHub Models | All OpenAI models | ✅ |
| Custom | Any OpenAI-compatible API | ✅ |

</details>

<details>
<summary><b>📄 Document Processing</b></summary>

| Feature | Description |
|---------|-------------|
| 📑 **PDF Upload** | Extract content from PDF documents |
| 📊 **PPTX Import** | Import and edit existing presentations |
| 📝 **Text/Markdown** | Generate from plain text or markdown |
| 🔍 **Smart Chunking** | Semantic document splitting |

</details>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PPT Deck                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  packages/  │    │   desktop/   │    │ export-engine/ │  │
│  │             │    │              │    │               │  │
│  │  ┌───────┐ │    │  Electron    │    │  PPTX/PDF     │  │
│  │  │  api/ │ │◄───│  Desktop     │    │  Generation   │  │
│  │  │       │ │    │  App         │    │  Runtime      │  │
│  │  │FastAPI│ │    └──────────────┘    └───────────────┘  │
│  │  └───┬───┘ │                                           │
│  │      │     │         ┌──────────┐                      │
│  │  ┌───▼───┐ │         │  tools/  │                      │
│  │  │  web/ │ │         │          │                      │
│  │  │       │ │         │  Build & │                      │
│  │  │Next.js│ │         │  Deploy  │                      │
│  │  └───────┘ │         └──────────┘                      │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>📂 Detailed Structure</b></summary>

```
PPT-Deck/
├── 📦 packages/
│   ├── 🐍 api/                 # FastAPI Backend
│   │   ├── app/                # Routes, middleware, lifespan
│   │   ├── core/               # LLM integration, utilities
│   │   ├── providers/          # Services (DB, image gen, docs)
│   │   ├── schemas/            # Pydantic & SQL models
│   │   ├── config/             # Constants & configuration
│   │   ├── templates/          # Slide template schemas
│   │   └── tests/              # Pytest test suite
│   │
│   └── 🌐 web/                 # Next.js Frontend
│       ├── app/                # App Router pages
│       ├── shared/             # Reusable UI components
│       ├── state/              # Redux store & slices
│       ├── lib/                # Utility functions
│       └── types/              # TypeScript definitions
│
├── 🖥️ desktop/                 # Electron App
│   ├── app/                    # Main process & IPC
│   ├── resources/              # Bundled runtime assets
│   └── build/                  # Installer configs & icons
│
├── 📤 export-engine/           # PPTX export runtime
├── 🔧 tools/                   # Build & deploy scripts
├── 🐳 Dockerfile              # Production container
├── 🐳 docker-compose.yml      # Full stack orchestration
└── 📖 README.md               # You are here!
```

</details>

---

## 🚀 Quick Start

<details open>
<summary><b>💻 Local Development</b></summary>

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| uv | Latest | Python package manager |
| npm | 9+ | Node package manager |

### 1️⃣ Clone & Setup Backend

```bash
# Clone the repository
git clone https://github.com/mnknayeemintel/PPT-Deck.git
cd PPT-Deck

# Install backend dependencies
cd packages/api
uv sync

# Create environment config
cp ../../.env.example .env
# Edit .env with your API keys
```

### 2️⃣ Start Backend

```bash
cd packages/api
uv run uvicorn server:app --host 0.0.0.0 --port 8000
```

### 3️⃣ Start Frontend

```bash
cd packages/web
npm install
npm run dev
```

### 4️⃣ Open in Browser

```
🌐 Frontend:  http://localhost:3000
📡 API Docs:  http://localhost:8000/docs
```

</details>

<details>
<summary><b>🐳 Docker (One-Command Setup)</b></summary>

```bash
# Clone and run
git clone https://github.com/mnknayeemintel/PPT-Deck.git
cd PPT-Deck

# Set your API key
echo "OPENAI_API_KEY=your-key-here" > .env

# Launch everything
docker compose up -d
```

Access at `http://localhost:3000` 🎉

</details>

---

## ⚙️ Configuration

<details open>
<summary><b>🔑 Environment Variables</b></summary>

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LLM` | Provider: `openai` \| `google` \| `anthropic` \| `ollama` \| `custom` | `openai` | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | - | If using OpenAI |
| `GOOGLE_API_KEY` | Google Gemini API key | - | If using Google |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | If using Anthropic |
| `CUSTOM_LLM_URL` | Custom OpenAI-compatible endpoint | - | If using custom |
| `CUSTOM_MODEL` | Model name for custom provider | - | If using custom |
| `CUSTOM_LLM_API_KEY` | API key for custom provider | - | If using custom |
| `DISABLE_THINKING` | Disable thinking param (for GitHub Models) | `false` | No |
| `DISABLE_IMAGE_GENERATION` | Skip AI image generation | `false` | No |
| `DISABLE_AUTH` | Disable authentication | `false` | No |
| `APP_DATA_DIRECTORY` | Storage path for presentations | `./app_data` | No |
| `MEM0_ENABLED` | Enable AI memory features | `false` | No |

</details>

<details>
<summary><b>🤖 Provider Quick Setup</b></summary>

**OpenAI (Default)**
```env
LLM=openai
OPENAI_API_KEY=sk-...
```

**GitHub Models (Free)**
```env
LLM=custom
CUSTOM_LLM_URL=https://models.github.ai/inference
CUSTOM_MODEL=openai/gpt-4.1
CUSTOM_LLM_API_KEY=ghp_...
DISABLE_THINKING=false
```

**Ollama (Local)**
```env
LLM=ollama
OLLAMA_URL=http://localhost:11434
```

**Google Gemini**
```env
LLM=google
GOOGLE_API_KEY=AI...
```

</details>

---

## 🔌 API Reference

<details open>
<summary><b>📡 Endpoints</b></summary>

### Generate Presentation

```http
POST /api/v1/ppt/presentation/generate
Content-Type: application/json
```

```json
{
  "content": "Benefits of Remote Work",
  "n_slides": 5,
  "language": "English",
  "template": "general",
  "tone": "professional",
  "verbosity": "standard",
  "export_as": "pptx"
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "status": "completed",
  "download_url": "/api/v1/ppt/presentation/{id}/download"
}
```

### List Presentations

```http
GET /api/v1/ppt/presentations
```

### Get Presentation Status

```http
GET /api/v1/ppt/presentation/{id}/status
```

### Chat with Presentation

```http
POST /api/v1/ppt/chat
Content-Type: application/json
```

```json
{
  "presentation_id": "uuid-here",
  "message": "Make slide 3 more concise"
}
```

</details>

<details>
<summary><b>🐍 Python SDK Example</b></summary>

```python
import requests

# Generate a presentation
response = requests.post("http://localhost:8000/api/v1/ppt/presentation/generate", json={
    "content": "Introduction to Machine Learning",
    "n_slides": 6,
    "language": "English",
    "template": "general",
    "tone": "academic",
    "verbosity": "detailed",
    "export_as": "pptx"
})

result = response.json()
print(f"Presentation ID: {result['id']}")
```

</details>

<details>
<summary><b>📜 cURL Examples</b></summary>

```bash
# Generate presentation
curl -X POST http://localhost:8000/api/v1/ppt/presentation/generate \
  -H "Content-Type: application/json" \
  -d '{"content":"AI in Healthcare","n_slides":5,"language":"English","template":"general","tone":"professional","verbosity":"standard","export_as":"pptx"}'

# List all presentations
curl http://localhost:8000/api/v1/ppt/presentations

# Download PPTX
curl -O http://localhost:8000/api/v1/ppt/presentation/{id}/download
```

</details>

---

## 🧪 Testing

```bash
# Backend tests
cd packages/api
uv run pytest

# With coverage
uv run pytest --cov=. --cov-report=html

# Frontend tests
cd packages/web
npx cypress run
```

---

## 📖 Usage Examples

<details>
<summary><b>📊 Business Pitch Deck</b></summary>

```json
{
  "content": "SaaS startup pitch for an AI writing assistant. Target: Series A investors. Key metrics: 50k MAU, 200% MoM growth, $2M ARR.",
  "n_slides": 10,
  "tone": "professional",
  "verbosity": "standard"
}
```

</details>

<details>
<summary><b>🎓 Educational Lecture</b></summary>

```json
{
  "content": "Introduction to Quantum Computing for undergraduate students. Cover qubits, superposition, entanglement, and current applications.",
  "n_slides": 12,
  "tone": "academic",
  "verbosity": "detailed"
}
```

</details>

<details>
<summary><b>🚀 Product Launch</b></summary>

```json
{
  "content": "New smartwatch launch. Features: health monitoring, 7-day battery, water resistance, AI assistant integration.",
  "n_slides": 8,
  "tone": "creative",
  "verbosity": "concise"
}
```

</details>

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| ✅ | Multi-LLM support | Done |
| ✅ | Template engine | Done |
| ✅ | Chat-based editing | Done |
| ✅ | PPTX export | Done |
| ✅ | Docker deployment | Done |
| 🔄 | PDF export | In Progress |
| 📋 | Real-time collaboration | Planned |
| 📋 | Plugin system | Planned |
| 📋 | Presentation analytics | Planned |

---

## 📝 Changelog

### v1.0.0 (2026-05-22)
- 🎉 Initial release
- 🤖 Multi-LLM support (OpenAI, Google, Anthropic, Ollama, Custom)
- 🎨 Template-based slide generation
- 💬 Chat-based iterative editing
- 📦 PPTX export
- 🐳 Docker support
- 🖥️ Electron desktop app

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License © 2026 **RioRyuGen**

---

<div align="center">

### 👤 Author

**RioRyuGen**

[![GitHub](https://img.shields.io/badge/GitHub-RioRyuGen-181717?style=for-the-badge&logo=github)](https://github.com/mnknayeemintel)

---

<sub>Built with ❤️ using FastAPI, Next.js, and AI</sub>

<br/>

<!-- Animated Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0096C7,100:48CAE4&height=120&section=footer" width="100%"/>

</div>
# DeckCraft

AI-powered presentation generation platform. Create professional slide decks from text prompts using state-of-the-art language models.

## Features

- Generate complete presentations from a topic or document
- Multiple LLM provider support (OpenAI, Google Gemini, Anthropic, Ollama, custom endpoints)
- Template-based slide layouts with automatic content fitting
- Image generation and stock photo integration
- Real-time chat interface for iterative editing
- Export to PPTX format
- Self-hosted via Docker or run locally

## Architecture

```
packages/
├── api/          # FastAPI backend (Python 3.11)
└── web/          # Next.js frontend (React 19)
desktop/          # Electron desktop application
export-engine/    # Presentation export runtime
tools/            # Build and deployment scripts
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- uv (Python package manager)

### Backend Setup
```bash
cd packages/api
uv sync
uv run uvicorn server:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd packages/web
npm install
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM` | Provider: `openai`, `google`, `anthropic`, `ollama`, `custom` | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `CUSTOM_LLM_URL` | Custom OpenAI-compatible endpoint | - |
| `CUSTOM_MODEL` | Model name for custom provider | - |
| `CUSTOM_LLM_API_KEY` | API key for custom provider | - |
| `DISABLE_THINKING` | Disable thinking parameter for incompatible APIs | `false` |
| `DISABLE_IMAGE_GENERATION` | Skip image generation | `false` |
| `DISABLE_AUTH` | Disable authentication | `false` |
| `APP_DATA_DIRECTORY` | Storage directory for presentations | `./app_data` |

### Docker
```bash
docker compose up
```

## API Usage

### Generate a Presentation
```bash
curl -X POST http://localhost:8000/api/v1/ppt/presentation/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Benefits of Remote Work",
    "n_slides": 5,
    "language": "English",
    "template": "general",
    "tone": "professional",
    "verbosity": "standard",
    "export_as": "pptx"
  }'
```

## Development

### Running Tests
```bash
cd packages/api
uv run pytest
```

### Project Structure

**Backend** (`packages/api/`):
- `app/` - FastAPI application, routes, middleware
- `core/` - Utilities, LLM integration, helpers
- `providers/` - Service layer (database, image gen, document processing)
- `schemas/` - Pydantic and SQLAlchemy models
- `config/` - Constants and configuration
- `templates/` - Slide template schemas

**Frontend** (`packages/web/`):
- `src/` - Next.js app router pages
- `shared/` - Reusable UI components
- `state/` - Redux store and slices
- `lib/` - Utility functions

## License

Apache 2.0
<p align="center">
  <img src="./readme_assets/images/logo.png" alt="DeckCraft" />
</p>

<p align="center">
  <a href="https://DeckCraft.ai/download"><strong>Quickstart</strong></a> &middot;
  <a href="https://docs.DeckCraft.ai/"><strong>Docs</strong></a> &middot;
  <a href="https://www.youtube.com/@DeckCraftai"><strong>Youtube</strong></a> &middot;
  <a href="https://discord.gg/9ZsKKxudNE"><strong>Discord</strong></a>
</p>

<p align="center">
  <a href="https://github.com/DeckCraft/DeckCraft/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=flat" alt="Apache2.0" /></a>
  <a href="https://github.com/DeckCraft/DeckCraft"><img src="https://img.shields.io/github/stars/DeckCraft/DeckCraft?style=flat" alt="Stars" /></a>
  <a href="https://DeckCraft.ai/"><img src="https://img.shields.io/badge/Platform-Docker%20%7C%20Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat" alt="Platform" /></a>
</p>

# Open-Source AI Presentation Generator and API (Gamma, Beautiful AI, Decktopus Alternative)



### ✨ Why DeckCraft

No SaaS lock-in · No forced subscriptions · Full control over models and data

What makes DeckCraft different?

- Use Fully **self-hosted** in Web through [Docker Package](https://docs.DeckCraft.ai/v3/get-started/quickstart)
- Or Download [Desktop App](https://DeckCraft.ai/download) (Mac, Windows & Linux)
- Works with OpenAI, Gemini, Vertex AI, Azure OpenAI, Anthropic, Ollama, or custom models
- Comes with AI Presentation Generation API
- Fully open-source (Apache 2.0)
- Works with your own design/templates
- **Fully editable PPTX export**

> [!TIP]
> **Star us!** A ⭐ shows your support and encourages us to keep building! 😇

<p align="center">
  <img src="./readme_assets/images/banner_bg.gif" alt="DeckCraft" />
</p>

#

### 🎛 Features

<p align="center">
  <img src="./readme_assets/images/features-1.png" alt="DeckCraft Features" />
</p>

#

### 💻 DeckCraft Desktop

Create AI-powered presentations using your own model provider (BYOK) or run everything locally on your own machine for full control and data privacy.

<p align="center">
  <a href="https://DeckCraft.ai/download">
    <img src="./readme_assets/images/banner.png" alt="Cloud deployment" />
  </a>
</p>

**Available Platforms**

<table>
<tr>
<th align="left">Platform</th>
<th align="left">Architecture</th>
<th align="left">Package</th>
<th align="left">Download</th>
</tr>

<tr>
<td><b>macOS</b></td>
<td>Apple Silicon / Intel</td>
<td><code>.dmg</code></td>
<td><a href="https://DeckCraft.ai/download">Download ↗</a></td>
</tr>

<tr>
<td><b>Windows</b></td>
<td>x64</td>
<td><code>.exe</code></td>
<td><a href="https://DeckCraft.ai/download">Download ↗</a></td>
</tr>

<tr>
<td><b>Linux</b></td>
<td>x64</td>
<td> <code>.deb</code></td>
<td><a href="https://DeckCraft.ai/download">Download ↗</a></td>
</tr>

</table>


**Deploy to Cloud Providers**

<div style="display:flex; gap:12px; align-items:center;">
  <a href="https://railway.com/deploy/DeckCraft-ai-presentations">
    <img
      src="https://railway.com/button.svg"
      alt="Deploy on Railway"
      style="height:38px;"
    />
  </a>
  <a href="https://cloud.digitalocean.com/apps/new?repo=https://github.com/DeckCraft/DeckCraft/tree/main">
    <img
      src="https://www.deploytodo.com/do-btn-blue.svg"
      alt="Deploy to DigitalOcean"
      style="height:36px;"
    />
  </a>
</div>

#

DeckCraft gives you complete control over your AI presentation workflow. Choose your models, customize your experience, and keep your data private.

- Custom Templates & Themes — Create unlimited presentation designs with HTML and Tailwind CSS
- AI Template Generation — Create presentation templates from existing Powerpoint documents.
- Flexible Generation — Build presentations from prompts or uploaded documents
- Export Ready — Save as PowerPoint (PPTX) and PDF with professional formatting
- Built-In MCP Server — Generate presentations over Model Context Protocol
- Bring Your Own Key — Use your own API keys for OpenAI, Google Gemini, Vertex AI, Azure OpenAI, Anthropic Claude, or any compatible provider. Only pay for what you use, no hidden fees or subscriptions.
- Ollama Integration — Run open-source models locally with full privacy
- OpenAI API Compatible — Connect to any OpenAI-compatible endpoint with your own models
- Multi-Provider Support — Mix and match text and image generation providers
- Versatile Image Generation — Choose from DALL-E 3, Gemini Flash, Pexels, or Pixabay
- Rich Media Support — Icons, charts, and custom graphics for professional presentations
- Runs Locally — All processing happens on your device, no cloud dependencies
- API Deployment — Host as your own API service for your team
- Fully Open-Source — Apache 2.0 licensed, inspect, modify, and contribute
- Docker Ready — One-command deployment with GPU support for local models
- Electron Desktop App — Run DeckCraft as a native desktop application on Windows, macOS, and Linux (no browser required)
- Sign in with ChatGPT — Use your free or paid ChatGPT account to sign in and start creating presentations instantly — no separate API key required

#

### ☁️ DeckCraft Cloud

Run DeckCraft directly in your browser — no installation, no setup required. Start creating presentations instantly from anywhere.

<p align="center">
  <a href="https://DeckCraft.ai">
    <img src="./readme_assets/images/cloud-banner.png" alt="DeckCraft Cloud" />
  </a>
</p>

#

### ⚡ Running DeckCraft

  <p>
    You can run DeckCraft in two ways:
    <strong>Docker</strong> for a one-command setup without installing a local dev
    stack, or the <strong>Electron desktop app</strong> for a native app
    experience (ideal for development or offline use).
  </p>

**Option 1: Electron (Desktop App)**

   <p>
    Run DeckCraft as a native desktop application. LLM and image provider
    (API keys, etc.) can be configured in the app. The same environment variables
    used for Docker apply when running the bundled backend.
  </p>

  <p>
    <strong>Prerequisites:</strong> Node.js (LTS), npm, Python 3.11, and
    <a href="https://docs.astral.sh/uv/">uv</a>
    (for the shared FastAPI backend in <code>servers/fastapi</code>).
  </p>

- Setup (First Time)
  <pre><code class="language-bash">cd electron
  npm run setup:env</code></pre>

  This installs Node dependencies, runs <code>uv sync</code> in the FastAPI
  server, and installs Next.js dependencies.

- Run in Development
  <pre><code class="language-bash">npm run dev</code></pre>
  <p>
  This compiles TypeScript and starts Electron. The backend and UI run locally
  inside the desktop window.
  </p>

- Build Distributable (Optional)
  To create installers for Windows, macOS, or Linux:
  <pre><code class="language-bash">npm run build:all
  npm run dist</code></pre>
  <p>
  Output files are written to <code>electron/dist</code>
  (or as configured in your <code>electron-builder</code> settings).
  </p>

**Option 2: Docker**

- Start DeckCraft
  Linux/MacOS (Bash/Zsh Shell):
  <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

  Windows (PowerShell):
  <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -v "${PWD}\app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Open DeckCraft
  <p>
  Open <a href="http://localhost:5000">http://localhost:5000</a> in the browser
  of your choice to use DeckCraft.
  </p>

  <blockquote>
  <p>
    <strong>Note:</strong> You can replace <code>5000</code> with any other port
    number of your choice to run DeckCraft on a different port number.
  </p>
  </blockquote>

#

### ⚙️ Deployment Configurations

The lists below match the environment variables forwarded in this repository’s **`docker-compose.yml`** (`production`, `production-gpu`, `development`, and `development-gpu`). Put values in a `.env` file next to the compose file, or export them before `docker compose up`. The Electron app backend can read the same names when run outside Docker.

Other optional variables exist in code (for example advanced Mem0 paths, LiteParse runners, or `FAST_API_INTERNAL_URL` when Next.js and FastAPI are not same-origin); they are **not** wired in `docker-compose.yml`. Supported names are discoverable from `servers/fastapi/utils/get_env.py` and the Next.js server utilities under `servers/nextjs/`.

#### LLM and API keys

- **CAN_CHANGE_KEYS**=[true/false]: Set to **false** if you want to keep API keys hidden and make them unmodifiable.
- **LLM**=[openai/google/vertex/azure/anthropic/ollama/custom/codex]: Select the text **LLM**.
- **OPENAI_API_KEY**: Required if **LLM** is **openai**.
- **OPENAI_MODEL**: Required if **LLM** is **openai** (default: `gpt-4.1`).
- **GOOGLE_API_KEY**: Required if **LLM** is **google**.
- **GOOGLE_MODEL**: Required if **LLM** is **google** (default: `models/gemini-2.0-flash`).
- **VERTEX_MODEL**: Required if **LLM** is **vertex** (default: `gemini-2.5-flash`).
- **VERTEX_API_KEY**: Optional auth path for **LLM=vertex** (Vertex Express).
- **VERTEX_PROJECT** / **VERTEX_LOCATION**: Optional auth path for **LLM=vertex** when using GCP project credentials (do not combine with `VERTEX_API_KEY`).
- **VERTEX_BASE_URL**: Optional Vertex gateway/base URL override.
- **AZURE_OPENAI_MODEL**: Required if **LLM** is **azure** (deployment/model name).
- **AZURE_OPENAI_API_KEY**: Required if **LLM** is **azure**.
- **AZURE_OPENAI_API_VERSION**: Required if **LLM** is **azure** (for example `2024-10-21`).
- **AZURE_OPENAI_ENDPOINT** / **AZURE_OPENAI_BASE_URL**: At least one is required if **LLM** is **azure**.
- **AZURE_OPENAI_DEPLOYMENT**: Optional deployment override for **LLM** is **azure**.
- **ANTHROPIC_API_KEY**: Required if **LLM** is **anthropic**.
- **ANTHROPIC_MODEL**: Required if **LLM** is **anthropic** (default: `claude-3-5-sonnet-20241022`).
- **CODEX_MODEL**: Required if **LLM** is **codex** (Codex OAuth flow; compose maps host port **1455** for the callback).
- **CUSTOM_LLM_URL**: OpenAI-compatible base URL if **LLM** is **custom**.
- **CUSTOM_LLM_API_KEY**: API key if **LLM** is **custom**.
- **CUSTOM_MODEL**: Model id if **LLM** is **custom**.
- **DISABLE_THINKING**=[true/false]: If **true**, disables “thinking” on the custom LLM.
- **WEB_GROUNDING**=[true/false]: If **true**, enables web search for OpenAI, Google, and Anthropic models.
- **EXTENDED_REASONING**=[true/false]: Enables extended reasoning where supported by the configured stack.

#### Ollama

Use when **LLM** is **ollama**:

- **OLLAMA_URL**: Base URL of the Ollama HTTP API (e.g. `http://host.docker.internal:11434` from Docker).
- **OLLAMA_MODEL**: Model name in Ollama (e.g. `llama3.2:3b`).
- **START_OLLAMA**=[true/false]: Container entrypoint (`start.js`): optional install + `ollama serve`. Default **false** (`development` / `production` compose).

#### Presentation memory (Mem0 OSS)

Mem0 uses local Qdrant + SQLite (OSS); memory is scoped per presentation.

By default the Docker runtime now points Mem0 at a local Ollama-compatible LLM endpoint, so it no longer needs an OpenAI key just to initialize. If you want to use OpenAI instead, set `MEM0_LLM_BASE_URL`/`MEM0_LLM_API_KEY` to your OpenAI-compatible endpoint and key.
Docker images install the default spaCy model (`en_core_web_sm`) during build so Mem0 can start without extra setup on each run.

| Variable                     | Purpose                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **MEM0_ENABLED**             | **true**/false (compose default **true**).                                                                       |
| **MEM0_LLM_MODEL**           | Mem0 LLM model name (compose default **`llama3.1:latest`** or `OLLAMA_MODEL`).                                   |
| **MEM0_LLM_API_KEY**         | Mem0 LLM API key placeholder for OpenAI-compatible clients (compose default **`ollama`**).                       |
| **MEM0_LLM_BASE_URL**        | Mem0 LLM base URL (compose default **`OLLAMA_URL`** or `http://host.docker.internal:11434`).                     |
| **MEM0_DIR**                 | Root directory (compose default **`/app_data/mem0`**).                                                           |
| **MEM0_EMBEDDER_PROVIDER**   | Embedder backend (compose default **`fastembed`**).                                                              |
| **MEM0_EMBEDDER_MODEL**      | Model id (compose default **`BAAI/bge-small-en-v1.5`**).                                                         |
| **MEM0_EMBEDDING_DIMS**      | Vector size (compose default **384**).                                                                           |
| **MEM0_SPACY_MODEL**         | Optional spaCy model override (default **`en_core_web_sm`**).                                                    |
| **MEM0_REQUIRE_SPACY_MODEL** | Keep as **true** (default). Set to false only if you intentionally want Mem0 to run without spaCy lemmatization. |

#### Document parsing (LiteParse)

| Variable                  | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| **LITEPARSE_DPI**         | OCR render DPI (compose default **120**). |
| **LITEPARSE_NUM_WORKERS** | Worker count (compose default **1**).     |

#### Database

- **DATABASE_URL**: SQLAlchemy URL; if unset, the app falls back to SQLite under app data.
- **MIGRATE_DATABASE_ON_STARTUP**: Compose sets **`true`** for all services so migrations run on startup.

#### Image generation

These variables match `docker-compose.yml`. **`IMAGE_PROVIDER`** selects the backend (`pexels`, `pixabay`, `gemini_flash`, `nanobanana_pro`, `dall-e-3`, `gpt-image-1.5`, `comfyui`, `open_webui`). Use **OPENAI_API_KEY** for OpenAI image modes and **GOOGLE_API_KEY** for Gemini image modes (same keys as the LLM section).

- **DISABLE_IMAGE_GENERATION**=[true/false]: Disable slide image generation.
- **IMAGE_PROVIDER**: Provider id (see enum above).
- **PEXELS_API_KEY**: Pexels stock images.
- **PIXABAY_API_KEY**: Pixabay stock images.
- **DALL_E_3_QUALITY**=[standard/hd]: Optional for **dall-e-3** (default `standard`).
- **GPT_IMAGE_1_5_QUALITY**=[low/medium/high]: Optional for **gpt-image-1.5** (default `medium`).
- **COMFYUI_URL** / **COMFYUI_WORKFLOW**: Self-hosted ComfyUI workflow JSON.
- **OPEN_WEBUI_IMAGE_URL** / **OPEN_WEBUI_IMAGE_API_KEY**: Open WebUI–compatible image endpoint.
- **OPENAI_COMPAT_IMAGE_BASE_URL** / **OPENAI_COMPAT_IMAGE_API_KEY** / **OPENAI_COMPAT_IMAGE_MODEL**: Required if using **openai_compatible** to send image requests to any OpenAI-compatible `/v1/images/*` endpoint (LiteLLM, Azure, vLLM Gateways, etc.).

#### Telemetry

- **DISABLE_ANONYMOUS_TRACKING**=[true/false]: Set to **true** to disable anonymous telemetry.

#### Authentication (web login)

DeckCraft uses a **single admin account** per instance. Credentials live in `app_data` (hashed; see `userConfig.json`). Pass these with `-e` or via `.env` for compose:

- **AUTH_USERNAME** / **AUTH_PASSWORD** — Preseed the admin login on first boot (password at least 6 characters). Ignored if a user already exists unless **AUTH_OVERRIDE_FROM_ENV** is set.
- **AUTH_OVERRIDE_FROM_ENV**=[true/false] — If **true**, replace stored credentials from the env vars on every FastAPI startup and rotate the session signing secret (invalidates existing sessions). Remove after a one-off rotation.
- **RESET_AUTH**=[true/false] — If **true**, clear stored credentials on startup. Use for a **single** boot to recover access, then unset.

**Examples**

```bash
docker run -it --name DeckCraft -p 5000:80 -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest
```

```bash
docker run -it --name DeckCraft -p 5000:80 -e AUTH_USERNAME=admin -e AUTH_PASSWORD=changeme123 -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest
```

```bash
docker run -it --name DeckCraft -p 5000:80 -e AUTH_USERNAME=admin -e AUTH_PASSWORD=changeme123 -v "${PWD}\app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest
```

```bash
docker stop DeckCraft && docker rm DeckCraft && docker run -it --name DeckCraft -p 5000:80 -e AUTH_USERNAME=admin -e AUTH_PASSWORD=newcred456 -e AUTH_OVERRIDE_FROM_ENV=true -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest
```

```bash
docker stop DeckCraft && docker rm DeckCraft && docker run -it --name DeckCraft -p 5000:80 -e RESET_AUTH=true -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest
```

```bash
docker stop DeckCraft && docker rm DeckCraft && docker run -it --name DeckCraft -p 5000:80 -e AUTH_USERNAME=admin -e AUTH_PASSWORD=changeme123 -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest
```

**Manual reset:** stop the container, edit `./app_data/userConfig.json`, delete `AUTH_USERNAME`, `AUTH_PASSWORD_HASH`, and `AUTH_SECRET_KEY`, save, and start again.

Sign out from the app: **Settings → Other → Sign out**.

> Note: LLM and image variables above are forwarded from **`docker-compose.yml`** when set in `.env`.

<br>
<br>

**Docker Run Examples by Provider**

Same variables as compose; use `-e` instead of `.env` when running `docker run` directly.

- Using OpenAI
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e LLM="openai" -e OPENAI_API_KEY="******" -e IMAGE_PROVIDER="dall-e-3" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using Google
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e LLM="google" -e GOOGLE_API_KEY="******" -e IMAGE_PROVIDER="gemini_flash" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using Vertex AI (API key mode)
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e LLM="vertex" -e VERTEX_API_KEY="******" -e VERTEX_MODEL="gemini-2.5-flash" -e IMAGE_PROVIDER="gemini_flash" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using Azure OpenAI
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e LLM="azure" -e AZURE_OPENAI_API_KEY="******" -e AZURE_OPENAI_MODEL="gpt-4.1" -e AZURE_OPENAI_API_VERSION="2024-10-21" -e AZURE_OPENAI_ENDPOINT="https://YOUR-RESOURCE.openai.azure.com" -e IMAGE_PROVIDER="pexels" -e PEXELS_API_KEY="******" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using Ollama
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e LLM="ollama" -e OLLAMA_MODEL="llama3.2:3b" -e IMAGE_PROVIDER="pexels" -e PEXELS_API_KEY="*******" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using Anthropic
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e LLM="anthropic" -e ANTHROPIC_API_KEY="******" -e IMAGE_PROVIDER="pexels" -e PEXELS_API_KEY="******" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using OpenAI Compatible LLM API
    <pre><code class="language-bash">docker run -it -p 5000:80 -e CAN_CHANGE_KEYS="false"  -e LLM="custom" -e CUSTOM_LLM_URL="http://*****" -e CUSTOM_LLM_API_KEY="*****" -e CUSTOM_MODEL="llama3.2:3b" -e IMAGE_PROVIDER="pexels" -e  PEXELS_API_KEY="********" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Running DeckCraft with GPU Support
  To use GPU acceleration with Ollama models, you need to install and configure the NVIDIA Container Toolkit. This allows Docker containers to access your NVIDIA GPU.
  Once the NVIDIA Container Toolkit is installed and configured, you can run DeckCraft with GPU support by adding the `--gpus=all` flag:
    <pre><code class="language-bash">docker run -it --name DeckCraft --gpus=all -p 5000:80 -e LLM="ollama" -e OLLAMA_MODEL="llama3.2:3b" -e IMAGE_PROVIDER="pexels" -e PEXELS_API_KEY="*******" -e CAN_CHANGE_KEYS="false" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

- Using an OpenAI-Compatible Image Provider

  This routes all slide image requests through your OpenAI-compatible gateway (LiteLLM, Azure, vLLM, etc.) while keeping the text LLM configuration independent:
    <pre><code class="language-bash">docker run -it --name DeckCraft -p 5000:80 -e IMAGE_PROVIDER="openai_compatible" -e OPENAI_COMPAT_IMAGE_BASE_URL="https://proxy.example.com/v1" -e OPENAI_COMPAT_IMAGE_API_KEY="******" -e OPENAI_COMPAT_IMAGE_MODEL="gpt-image-1" -v "./app_data:/app_data" ghcr.io/DeckCraft/DeckCraft:latest</code></pre>

#

### ✨ Generate Presentation via API

**Generate Presentation**

<p>
<strong>Endpoint:</strong> <code>/api/v1/ppt/presentation/generate</code><br>
<strong>Method:</strong> <code>POST</code><br>
<strong>Content-Type:</strong> <code>application/json</code>
</p>

<p>
<strong>Authentication (HTTP Basic):</strong><br>
All <code>/api/v1/</code> routes except <code>/api/v1/auth/*</code> require authentication. Send your DeckCraft admin username and password (same as the web UI, or <strong>AUTH_USERNAME</strong> / <strong>AUTH_PASSWORD</strong> when preseeding Docker). With <code>curl</code>, put them right after <code>-u</code> as <code>-u USERNAME:PASSWORD</code> — that is HTTP Basic auth and sets <code>Authorization: Basic …</code> for you. Replace the sample <code>username:password</code> below with your real credentials.
</p>

**Request Body**

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Required</th>
<th>Description</th>
</tr>
</thead>
<tbody>

<tr>
<td><code>content</code></td>
<td>string</td>
<td>Yes</td>
<td>Main content used to generate the presentation.</td>
</tr>

<tr>
<td><code>slides_markdown</code></td>
<td>string[] | null</td>
<td>No</td>
<td>Provide custom slide markdown instead of auto-generation.</td>
</tr>

<tr>
<td><code>instructions</code></td>
<td>string | null</td>
<td>No</td>
<td>Additional generation instructions.</td>
</tr>

<tr>
<td><code>tone</code></td>
<td>string</td>
<td>No</td>
<td>
Text tone (default: <code>"default"</code>).  
Options: <code>default</code>, <code>casual</code>, <code>professional</code>, 
<code>funny</code>, <code>educational</code>, <code>sales_pitch</code>
</td>
</tr>

<tr>
<td><code>verbosity</code></td>
<td>string</td>
<td>No</td>
<td>
Content density (default: <code>"standard"</code>).  
Options: <code>concise</code>, <code>standard</code>, <code>text-heavy</code>
</td>
</tr>

<tr>
<td><code>web_search</code></td>
<td>boolean</td>
<td>No</td>
<td>Enable web search grounding (default: <code>false</code>).</td>
</tr>

<tr>
<td><code>n_slides</code></td>
<td>integer</td>
<td>No</td>
<td>Number of slides to generate (default: <code>8</code>).</td>
</tr>

<tr>
<td><code>language</code></td>
<td>string</td>
<td>No</td>
<td>Presentation language (default: <code>"English"</code>).</td>
</tr>

<tr>
<td><code>template</code></td>
<td>string</td>
<td>No</td>
<td>Template name (default: <code>"general"</code>).</td>
</tr>

<tr>
<td><code>include_table_of_contents</code></td>
<td>boolean</td>
<td>No</td>
<td>Include table of contents slide (default: <code>false</code>).</td>
</tr>

<tr>
<td><code>include_title_slide</code></td>
<td>boolean</td>
<td>No</td>
<td>Include title slide (default: <code>true</code>).</td>
</tr>

<tr>
<td><code>files</code></td>
<td>string[] | null</td>
<td>No</td>
<td>
Files to use in generation.  
Upload first via <code>/api/v1/ppt/files/upload</code>.
</td>
</tr>

<tr>
<td><code>export_as</code></td>
<td>string</td>
<td>No</td>
<td>
Export format (default: <code>"pptx"</code>).  
Options: <code>pptx</code>, <code>pdf</code>
</td>
</tr>

</tbody>
</table>

**Response**

<pre><code class="language-json">{
  "presentation_id": "string",
  "path": "string",
  "edit_path": "string"
}</code></pre>

**Example (curl + HTTP Basic auth with <code>-u</code>)**

<pre><code class="language-bash">curl -u username:password \
  -X POST http://localhost:5000/api/v1/ppt/presentation/generate \
  -H "Content-Type: application/json" \
  -d '{
   "content": "Introduction to Machine Learning",
    "n_slides": 5,
    "language": "English",
    "template": "general",
    "export_as": "pptx"
  }'</code></pre>

**Example Response**

<pre><code class="language-json">{
  "presentation_id": "d3000f96-096c-4768-b67b-e99aed029b57",
  "path": "/app_data/d3000f96-096c-4768-b67b-e99aed029b57/Introduction_to_Machine_Learning.pptx",
  "edit_path": "/presentation?id=d3000f96-096c-4768-b67b-e99aed029b57"
}</code></pre>

<blockquote>
<strong>Note:</strong>  
Prepend your server’s root URL to <code>path</code> and 
<code>edit_path</code> to construct valid links.
</blockquote>

**Documentation & Tutorials**

<ul>
  <li>
    <a href="https://docs.DeckCraft.ai/using-DeckCraft-api">
      Full API Documentation
    </a>
  </li>
  <li>
    <a href="https://docs.DeckCraft.ai/tutorial/generate-presentation-over-api">
      Generate Presentations via API in 5 Minutes
    </a>
  </li>
  <li>
    <a href="https://docs.DeckCraft.ai/tutorial/generate-presentation-from-csv">
      Create Presentations from CSV using AI
    </a>
  </li>
  <li>
    <a href="https://docs.DeckCraft.ai/tutorial/create-data-reports-using-ai">
      Create Data Reports Using AI
    </a>
  </li>
</ul>

#

### 🚀 Roadmap

Track the public roadmap on GitHub Projects: [https://github.com/orgs/DeckCraft/projects/2](https://github.com/orgs/DeckCraft/projects/2)
