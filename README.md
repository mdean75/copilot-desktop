# Copilot Desktop

A GitHub Copilot-powered desktop chat application for non-engineer tech employees (PMTs, TPMs). Provides a standalone chat interface with agents, skills, MCP app integrations, and conversation history — outside of any IDE.

Built with Tauri v2, React, TypeScript, and the GitHub Copilot API.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode Command Line Tools (macOS) | latest | `xcode-select --install` |

Verify your setup:
```bash
node --version
rustc --version
cargo --version
```

---

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd copilot-desktop
npm install
```

---

## 2. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Set **Application name**: `Copilot Desktop (dev)`
3. Set **Homepage URL**: `http://localhost`
4. Set **Authorization callback URL**: `http://localhost` *(not used — device flow has no redirect)*
5. Check **Enable Device Flow**
6. Click **Register application**
7. Copy the **Client ID**

---

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
VITE_GITHUB_CLIENT_ID=your_client_id_here

# Optional: enables web search in the Web Research agent
# Get a free key at https://api.search.brave.com (2000 req/month free)
VITE_BRAVE_SEARCH_API_KEY=your_brave_key_here
```

---

## 4. Run the app

```bash
npm run tauri dev
```

The first run compiles the Rust backend — this takes a few minutes. Subsequent runs are fast.

On **first launch**, macOS needs to register the app's URL scheme. If the OAuth redirect doesn't work after signing in, run this once:

```bash
npm run tauri build -- --debug --bundles app
open "src-tauri/target/debug/bundle/macos/Copilot Desktop.app"
```

Close it, then resume with `npm run tauri dev`.

---

## 5. Sign in

Click **Sign in with GitHub** — a browser window opens to `github.com/login/device`. Enter the code shown in the app and authorize. You'll be redirected back automatically.

Requires a **GitHub Copilot Pro, Business, or Enterprise** subscription.

---

## Features

### Agents
Custom assistant personas defined by a system prompt, enabled tools, and connected apps. Select one from the sidebar to activate it. Two built-in agents are included (Web Research, GitHub Context); create your own with the **+ New Agent** button.

Agents follow the GitHub Copilot `.agent.md` file convention. User-created agents are stored in `~/.copilot-desktop/agents/`.

### Skills
Lightweight, read-only capabilities loaded from `~/.copilot/skills/`. Each skill is a directory containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, `allowed-tools`) and a body that serves as additional system prompt context. Select a skill from the sidebar to activate it alongside (or instead of) an agent.

### Connected Apps (MCP)
Attach external tools to your conversations via the [Model Context Protocol](https://modelcontextprotocol.io). Click **+ Add App** in the sidebar to connect a server. Curated presets are available for Filesystem, GitHub, Notion, Slack, and Jira/Confluence. Custom stdio MCP servers are also supported.

When a tool is used during a conversation, a tool activity card appears in the chat above the AI response — showing which tool ran and what it accessed.

### Models
Available models are fetched live from the GitHub Copilot API based on your account's enabled models. Use the model picker in the chat toolbar to switch models at any time, including mid-conversation.

---

## Project structure

```
copilot-desktop/
├── src/                    # React frontend
│   ├── components/
│   │   ├── agents/         # Agent list, chip, builder drawer, skill chip
│   │   ├── auth/           # Sign-in screen
│   │   ├── conversation/   # Chat UI (messages, input, list, tool activity)
│   │   ├── layout/         # App shell (sidebar, chat panel, context panel)
│   │   ├── mcp/            # MCP server management drawer
│   │   └── model/          # Model picker
│   ├── hooks/              # useChat (tool-calling loop + streaming)
│   ├── lib/                # Storage wrappers, tool execution, curated servers
│   ├── pages/              # AuthPage, ChatPage
│   ├── store/              # Zustand stores (auth, conversations, agents, skills, MCP, models)
│   └── types/              # TypeScript interfaces
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── auth.rs         # GitHub Device Flow, system keychain
│   │   ├── copilot.rs      # Copilot API client (token exchange, streaming, models)
│   │   ├── mcp_host.rs     # MCP server process management (stdio, JSON-RPC 2.0)
│   │   ├── storage.rs      # ~/.copilot-desktop/ file I/O + ~/.copilot/skills/ scanning
│   │   └── lib.rs          # Tauri command registration
│   └── tauri.conf.json
└── docs/
    └── implementation-plan.md
```

---

## Local data

All app data is stored locally:

```
~/.copilot-desktop/
  conversations/    # one JSON file per conversation
  agents/           # user-created agent definitions
  mcp/              # MCP server configs
  settings.json

~/.copilot/skills/  # GitHub Copilot skills (read-only, shared with other Copilot clients)
  <skill-name>/
    SKILL.md
```

Auth tokens are stored in the **system keychain** (macOS Keychain).

---

## IDE setup

- **VS Code** with the [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) and [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- The `.vscode/extensions.json` file recommends these automatically
