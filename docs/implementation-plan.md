# Copilot Desktop — Implementation Plan

See full plan in conversation history. Summary of phases:

## Phases

- **Phase 1** ✅ — Tauri scaffold, GitHub OAuth (device flow), keychain token storage, 3-panel layout shell
- **Phase 2** ✅ — Storage layer (`~/.copilot-desktop/`), GitHub Models API streaming client, conversation history, model picker
- **Phase 3** ✅ — Built-in skills (Web Search, GitHub Context), skill builder drawer, custom skill CRUD, tool-calling loop
- **Phase 4** ✅ — MCP connected apps: Rust process management, curated server library, custom server form, status indicators
- **Phase 5** 🔲 — File upload, settings screen, conversation search, markdown rendering, packaging

## Known Backlog (post-Phase 3)

1. Model switching mid-conversation
2. Markdown/code rendering in message bubbles
3. Delete conversations from sidebar
4. Prompt history recall (up-arrow)

## Tech Stack

- Tauri v2 (Rust + WebView)
- React + TypeScript + Tailwind CSS
- GitHub Device Flow OAuth
- GitHub Models API (`models.inference.ai.azure.com`)
- Local storage: `~/.copilot-desktop/` (JSON files) + system keychain
