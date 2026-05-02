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
5. ~~Tool activity visibility in chat~~ ✅ — tool cards appear above AI response showing which tool ran, key argument, and expandable result
6. ~~MCP server PATH resolution~~ ✅ — augment PATH on spawn so npx/node work outside a login shell; capture stderr on failure for actionable errors

## Terminology Alignment ✅

Renamed "Skills" → "Agents" throughout to align with GitHub Copilot conventions:

- **Agents** — custom assistants with a system prompt, tools, and MCP server access. Stored in `~/.copilot-desktop/agents/`. Selectable from sidebar; active agent injects its system prompt and enables its tools.
- **Skills** — lightweight, read-only capabilities defined as `SKILL.md` files in `~/.copilot/skills/<name>/`. Loaded at startup from the filesystem. Selectable from sidebar; active skill injects its body as system prompt context and enables its `allowed-tools`.

## Future Enhancements

### On-Demand Skill Loading (aligns with VS Code Copilot behavior)

**Current behavior:** User selects a skill explicitly; its body is injected into the system prompt.

**Target behavior:** All skill frontmatter (name + description + allowed-tools) is injected into every conversation. The model uses the `description` field to decide when a skill is relevant and calls a `load_skill(name)` tool to fetch the body on demand. Skill body is returned as a tool result and used in the model's reply.

- Uses `description` for relevance matching (no `when` field — aligns with GH Copilot convention)
- Fits into the existing tool-calling loop; add `load_skill` to builtin tools
- Remove explicit skill selection UI once implemented

### Instructions

Inject `~/.github/copilot-instructions.md` as persistent context prepended to every conversation. Aligns with VS Code Copilot's repository/user instructions feature.

### Prompts

Scan `~/.github/prompts/*.prompt.md` for reusable prompt templates. Surface them via a `/` command palette in the chat input to pre-fill a message. No tools — text only.

### Session State Alignment

GH CLI and other Copilot tools store session state in a specific home directory location. Align `~/.copilot-desktop/` with that convention as a future cleanup.

## Tech Stack

- Tauri v2 (Rust + WebView)
- React + TypeScript + Tailwind CSS
- GitHub Device Flow OAuth (Copilot client ID)
- GitHub Copilot API (`api.githubcopilot.com`) via Rust backend
- Local storage: `~/.copilot-desktop/` (JSON files) + system keychain
