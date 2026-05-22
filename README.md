<div align="center">

<!-- Animated SVG Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0096C7,100:48CAE4&height=220&section=header&text=🎴%20DeckCraft&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=AI-Powered%20Presentation%20Generator&descSize=20&descAlignY=55" width="100%"/>

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

[![Stars](https://img.shields.io/github/stars/rioryugen/DeckCraft?style=social)](https://github.com/rioryugen/DeckCraft)
[![Forks](https://img.shields.io/github/forks/rioryugen/DeckCraft?style=social)](https://github.com/rioryugen/DeckCraft/fork)

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
│                       DeckCraft                              │
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
DeckCraft/
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
git clone https://github.com/rioryugen/DeckCraft.git
cd DeckCraft

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
git clone https://github.com/rioryugen/DeckCraft.git
cd DeckCraft

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

[![GitHub](https://img.shields.io/badge/GitHub-RioRyuGen-181717?style=for-the-badge&logo=github)](https://github.com/rioryugen)

---

<sub>Built with ❤️ using FastAPI, Next.js, and AI</sub>

<br/>

<!-- Animated Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0096C7,100:48CAE4&height=120&section=footer" width="100%"/>

</div>
