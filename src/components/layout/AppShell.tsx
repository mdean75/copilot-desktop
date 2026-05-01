import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { ContextPanel } from "./ContextPanel";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        <ChatPanel />
        <ContextPanel />
      </main>
    </div>
  );
}
