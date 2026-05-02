import { useState } from "react";
import type { ToolCall, ToolResult } from "../../types/conversation";

interface Props {
  toolCall: ToolCall;
  toolResult?: ToolResult;
}

function friendlyToolName(name: string): string {
  const labels: Record<string, string> = {
    read_file: "Read file",
    write_file: "Wrote file",
    create_file: "Created file",
    list_directory: "Listed directory",
    search_files: "Searched files",
    create_directory: "Created directory",
    delete_file: "Deleted file",
    move_file: "Moved file",
    copy_file: "Copied file",
    get_file_info: "Got file info",
    edit_file: "Edited file",
    web_search: "Searched the web",
    github_search: "Searched GitHub",
  };
  return labels[name] ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function keyArg(args: Record<string, unknown>): string | null {
  // Prefer path/query/name — pick the most user-readable arg
  for (const key of ["path", "query", "name", "pattern", "url", "file_path", "directory"]) {
    const val = args[key];
    if (typeof val === "string" && val) {
      // Show just the filename for paths
      if (key === "path" || key === "file_path" || key === "directory") {
        const parts = val.replace(/\\/g, "/").split("/");
        return parts[parts.length - 1] || val;
      }
      return val.length > 60 ? val.slice(0, 60) + "…" : val;
    }
  }
  return null;
}

export function ToolActivityCard({ toolCall, toolResult }: Props) {
  const [expanded, setExpanded] = useState(false);

  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    // ignore
  }

  const label = friendlyToolName(toolCall.function.name);
  const detail = keyArg(args);
  const isError = toolResult?.isError ?? false;
  const resultPreview = toolResult?.content
    ? toolResult.content.slice(0, 200) + (toolResult.content.length > 200 ? "…" : "")
    : null;

  return (
    <div className={`my-1 rounded-lg border text-xs ${
      isError
        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
        : "border-[hsl(var(--border))] bg-[hsl(var(--background))]"
    }`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="opacity-50">{isError ? "⚠" : "⚙"}</span>
        <span className="font-medium text-[hsl(var(--foreground))] opacity-70">{label}</span>
        {detail && (
          <span className="truncate font-mono opacity-50">{detail}</span>
        )}
        {toolResult && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto flex-shrink-0 opacity-40 hover:opacity-80"
            aria-label={expanded ? "Hide result" : "Show result"}
          >
            {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>
      {expanded && resultPreview && (
        <div className="border-t border-[hsl(var(--border))] px-3 py-2">
          <pre className="whitespace-pre-wrap break-words font-mono text-[hsl(var(--muted-foreground))]">
            {resultPreview}
          </pre>
        </div>
      )}
    </div>
  );
}
