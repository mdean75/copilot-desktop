# Copilot Desktop — Implementation Plan

See full plan in conversation history. Summary of phases:

## Phases

- **Phase 1** ✅ — Tauri scaffold, GitHub OAuth (device flow), keychain token storage, 3-panel layout shell
- **Phase 2** ✅ — Storage layer (`~/.copilot-desktop/`), GitHub Models API streaming client, conversation history, model picker
- **Phase 3** ✅ — Built-in skills (Web Search, GitHub Context), skill builder drawer, custom skill CRUD, tool-calling loop
- **Phase 4** ✅ — MCP connected apps: Rust process management, curated server library, custom server form, status indicators
- **Phase 5** 🔲 — File upload, settings screen, conversation search, markdown rendering, packaging

## Known Backlog (post-Phase 3)

1. ~~Model switching mid-conversation~~ ✅
2. ~~Markdown/code rendering in message bubbles~~ ✅
3. ~~Delete conversations from sidebar~~ ✅
4. ~~Prompt history recall (up-arrow)~~ ✅

## Future Enhancements

### Align terminology with GitHub Copilot standards

The app currently uses "Skills" to mean system prompt + tools + tool-calling loop, which is effectively an agent. This conflicts with GitHub Copilot's established terminology where these concepts are distinct:

- **Instructions** — persistent behavioral guidelines (like `.github/copilot-instructions.md`)
- **Prompts** — reusable prompt templates (`.github/prompts/*.md`) that users invoke for specific tasks
- **Agents** — autonomous entities with tools, a system prompt, and multi-step reasoning (e.g., `@workspace`, custom agents via `chat-agent.json`)
- **Skills** — in Copilot Extensions, a skill is a lightweight read-only capability that answers a question (no tool loop, no state)

**Goal:** Refactor the current "Skills" feature to align with these definitions:
1. Rename current tool-equipped skills → **Agents** (system prompt + tools + loop)
2. Add **Instructions** as persistent context injected into every conversation
3. Add **Prompts** as user-invokable templates (no tools, just pre-filled messages)
4. Reserve **Skills** for simple, stateless capabilities (or remove the term to avoid confusion)

This will make the app intuitive for anyone coming from VS Code Copilot.

## Tech Stack

- Tauri v2 (Rust + WebView)
- React + TypeScript + Tailwind CSS
- GitHub Device Flow OAuth (Copilot client ID)
- GitHub Copilot API (`api.githubcopilot.com`) via Rust backend
- Local storage: `~/.copilot-desktop/` (JSON files) + system keychain
