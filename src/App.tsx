import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useModelStore } from "./store/useModelStore";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";

export default function App() {
  const { user, token, isLoading, initialize } = useAuthStore();
  const fetchModels = useModelStore((s) => s.fetchModels);

  useEffect(() => {
    initialize();
  }, []);

  // Fetch available models once authenticated
  useEffect(() => {
    if (token) {
      fetchModels(token);
    }
  }, [token, fetchModels]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      </div>
    );
  }

  return user ? <ChatPage /> : <AuthPage />;
}
