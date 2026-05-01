import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";

export default function App() {
  const { user, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      </div>
    );
  }

  return user ? <ChatPage /> : <AuthPage />;
}
