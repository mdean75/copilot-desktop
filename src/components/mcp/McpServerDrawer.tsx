import { useState } from "react";
import { useMcpStore } from "../../store/useMcpStore";
import {
  CURATED_MCP_SERVERS,
  type CuratedServer,
} from "../../lib/curatedMcpServers";

interface Props {
  onClose: () => void;
}

type DrawerView = "list" | "curated-configure" | "custom";

export function McpServerDrawer({ onClose }: Props) {
  const { addServer } = useMcpStore();
  const [view, setView] = useState<DrawerView>("list");
  const [selectedCurated, setSelectedCurated] = useState<CuratedServer | null>(null);
  const [envValues, setEnvValues] = useState<Record<string, string>>({});
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom form state
  const [customName, setCustomName] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [customArgs, setCustomArgs] = useState("");
  const [customEnvText, setCustomEnvText] = useState("KEY=value\nANOTHER=value2");

  const handleSelectCurated = (server: CuratedServer) => {
    setSelectedCurated(server);
    setEnvValues({});
    setArgValues({});
    setError(null);
    setView("curated-configure");
  };

  const handleConnectCurated = async () => {
    if (!selectedCurated) return;
    setIsConnecting(true);
    setError(null);

    try {
      const finalArgs = [
        ...selectedCurated.baseArgs,
        ...selectedCurated.argFields.map((f) => argValues[f.key] ?? ""),
      ].filter(Boolean);

      await addServer({
        displayName: selectedCurated.displayName,
        transport: "stdio",
        command: selectedCurated.command,
        args: finalArgs,
        env: envValues,
        isCurated: true,
        curatedSlug: selectedCurated.slug,
      });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectCustom = async () => {
    if (!customName.trim() || !customCommand.trim()) return;
    setIsConnecting(true);
    setError(null);

    try {
      const args = customArgs
        .split(/\s+/)
        .map((a) => a.trim())
        .filter(Boolean);

      const env: Record<string, string> = {};
      for (const line of customEnvText.split("\n")) {
        const idx = line.indexOf("=");
        if (idx > 0) {
          env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }

      await addServer({
        displayName: customName.trim(),
        transport: "stdio",
        command: customCommand.trim(),
        args,
        env,
        isCurated: false,
      });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />

      <div className="flex h-full w-[520px] flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
          <button
            onClick={view === "list" ? onClose : () => setView("list")}
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            {view === "list" ? "✕ Close" : "← Back"}
          </button>
          <h2 className="text-sm font-semibold">
            {view === "list" && "Connect an App"}
            {view === "curated-configure" && selectedCurated?.displayName}
            {view === "custom" && "Custom MCP Server"}
          </h2>
          <div className="w-16" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {view === "list" && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                MCP apps give the AI access to external tools like Jira, Notion, or your file system.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Popular Apps
                </p>
                {CURATED_MCP_SERVERS.map((server) => (
                  <button
                    key={server.slug}
                    onClick={() => handleSelectCurated(server)}
                    className="flex w-full items-start gap-3 rounded-lg border border-[hsl(var(--border))] p-3 text-left transition-colors hover:bg-[hsl(var(--muted))]"
                  >
                    <span className="text-2xl">{server.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{server.displayName}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {server.description}
                      </p>
                    </div>
                    <span className="ml-auto text-[hsl(var(--muted-foreground))]">›</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setView("custom")}
                  className="w-full rounded-lg border border-dashed border-[hsl(var(--border))] py-3 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  + Custom MCP Server
                </button>
              </div>
            </div>
          )}

          {view === "curated-configure" && selectedCurated && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--muted))] p-3">
                <span className="text-3xl">{selectedCurated.icon}</span>
                <div>
                  <p className="font-medium">{selectedCurated.displayName}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {selectedCurated.description}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Runs via: <code className="font-mono">{selectedCurated.command} {selectedCurated.baseArgs.join(" ")}</code>
              </p>

              {selectedCurated.argFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-medium">
                    {field.label} <span className="text-[hsl(var(--destructive))]">*</span>
                  </label>
                  <input
                    value={argValues[field.key] ?? ""}
                    onChange={(e) =>
                      setArgValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              ))}

              {selectedCurated.envFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-medium">
                    {field.label} <span className="text-[hsl(var(--destructive))]">*</span>
                  </label>
                  <input
                    type={field.sensitive ? "password" : "text"}
                    value={envValues[field.key] ?? ""}
                    onChange={(e) =>
                      setEnvValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              ))}

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <button
                onClick={handleConnectCurated}
                disabled={isConnecting}
                className="w-full rounded-md bg-[hsl(var(--primary))] py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {isConnecting ? "Connecting…" : `Connect ${selectedCurated.displayName}`}
              </button>
            </div>
          )}

          {view === "custom" && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Configure any MCP server that uses stdio transport.
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Display Name <span className="text-[hsl(var(--destructive))]">*</span>
                </label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="My Custom Server"
                  className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Command <span className="text-[hsl(var(--destructive))]">*</span>
                </label>
                <input
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="npx or node or python"
                  className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">Arguments</label>
                <input
                  value={customArgs}
                  onChange={(e) => setCustomArgs(e.target.value)}
                  placeholder="-y @scope/package-name /path/to/dir"
                  className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Space-separated. Paths with spaces: use quotes.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Environment Variables{" "}
                  <span className="text-[hsl(var(--muted-foreground))]">(optional)</span>
                </label>
                <textarea
                  value={customEnvText}
                  onChange={(e) => setCustomEnvText(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  One per line: KEY=value
                </p>
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <button
                onClick={handleConnectCustom}
                disabled={isConnecting || !customName.trim() || !customCommand.trim()}
                className="w-full rounded-md bg-[hsl(var(--primary))] py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {isConnecting ? "Connecting…" : "Connect Server"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
