# Copilot Desktop

A GitHub Copilot-powered desktop chat application for non-engineer tech employees (PMTs, TPMs). Provides a standalone chat interface with skills, MCP integrations, and conversation history — outside of any IDE.

Built with Tauri v2, React, TypeScript, and the GitHub Models API.

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

# Optional: enables web search in the Web Research skill
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

Requires a **GitHub Copilot Pro, Business, or Enterprise** subscription for access to the GitHub Models API.

---

## Project structure

```
copilot-desktop/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── auth/           # Sign-in screen
│   │   ├── conversation/   # Chat UI (messages, input, list)
│   │   ├── layout/         # App shell (sidebar, chat panel, context panel)
│   │   ├── model/          # Model picker
│   │   ├── mcp/            # MCP server management
│   │   └── skills/         # Skill list, chip, builder drawer
│   ├── hooks/              # useChat (tool-calling loop + streaming)
│   ├── lib/                # API clients, storage wrappers, tool execution
│   ├── pages/              # AuthPage, ChatPage
│   ├── store/              # Zustand stores (auth, conversations, skills, MCP)
│   └── types/              # TypeScript interfaces
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── auth.rs         # GitHub Device Flow, system keychain
│   │   ├── storage.rs      # ~/.copilot-desktop/ file I/O
│   │   ├── mcp_host.rs     # MCP server process management
│   │   └── lib.rs          # Tauri command registration
│   └── tauri.conf.json
└── docs/
    └── implementation-plan.md
```

---

## Local data

All data is stored locally in `~/.copilot-desktop/`:

```
~/.copilot-desktop/
  conversations/    # one JSON file per conversation
  skills/           # custom skill definitions
  mcp/              # MCP server configs
  settings.json
```

Auth tokens are stored in the **system keychain** (macOS Keychain, Windows Credential Manager).

---

## Available models

Models are served via the [GitHub Models API](https://github.com/marketplace/models). The following are configured:

| Label | Model ID |
|---|---|
| GPT-4o (Recommended) | `gpt-4o` |
| GPT-4o Mini (Fast) | `gpt-4o-mini` |
| o3 Mini (Reasoning) | `o3-mini` |
| Llama 3.3 70B | `meta-llama/Llama-3.3-70B-Instruct` |
| Mistral Large | `mistral-large-2411` |

---

## IDE setup

- **VS Code** with the [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) and [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- The `.vscode/extensions.json` file recommends these automatically
