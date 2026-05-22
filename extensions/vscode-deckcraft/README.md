# DeckCraft VS Code Extension

AI-powered presentation generation directly from VS Code with MCP server for Copilot integration.

## Features

- **Generate Presentations** — Create professional slide decks from any text, selection, or file
- **MCP Server** — Exposes DeckCraft tools for AI copilots via Model Context Protocol
- **Context Menu** — Right-click selected text or markdown files to generate presentations
- **Multi-LLM** — Works with OpenAI, Gemini, Claude, Ollama, and custom providers

## Commands

| Command | Description |
|---------|-------------|
| `DeckCraft: Generate Presentation` | Generate from a text prompt |
| `DeckCraft: Generate from Selection` | Generate from selected text in editor |
| `DeckCraft: Generate from File` | Generate from a markdown/text file |
| `DeckCraft: List Presentations` | Browse generated presentations |
| `DeckCraft: Set Server URL` | Configure the API server endpoint |
| `DeckCraft: Start MCP Server` | Start the MCP server for AI copilot integration |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `deckcraft.serverUrl` | `http://localhost:8000` | DeckCraft API server URL |
| `deckcraft.username` | `` | Authentication username |
| `deckcraft.defaultTemplate` | `general` | Default template |
| `deckcraft.defaultTone` | `professional` | Default tone |
| `deckcraft.defaultSlideCount` | `5` | Default slide count |
| `deckcraft.mcpPort` | `3099` | MCP server port |
| `deckcraft.autoStartMcp` | `false` | Auto-start MCP server |

## MCP Server

The extension includes a built-in MCP (Model Context Protocol) server that exposes DeckCraft tools for AI assistants.

### Available Tools

- `generate_presentation` — Generate a presentation from content
- `list_presentations` — List all presentations
- `get_presentation` — Get presentation details
- `delete_presentation` — Delete a presentation

### Usage with Copilot

1. Start the MCP server via command palette: `DeckCraft: Start MCP Server`
2. Configure your MCP client to connect to `http://127.0.0.1:3099`
3. AI assistants can now generate presentations through the MCP protocol

## Requirements

- DeckCraft server running (locally or remote)
- VS Code 1.85+

## Quick Start

1. Install the extension
2. Start your DeckCraft server (`docker compose up` or run locally)
3. Open command palette → `DeckCraft: Generate Presentation`
4. Enter your topic and options
5. Presentation is generated!

## License

MIT © RioRyuGen
