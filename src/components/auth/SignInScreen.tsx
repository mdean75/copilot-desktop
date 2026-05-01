import { useAuthStore } from "../../store/useAuthStore";

export function SignInScreen() {
  const { signIn, isLoading, error, deviceFlow } = useAuthStore();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🤖</span>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Copilot Desktop
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Your GitHub Copilot, as a desktop app.
            <br />
            Works with your existing Copilot subscription.
          </p>
        </div>

        {error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
        )}

        {deviceFlow ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Enter this code at{" "}
              <span className="font-medium text-[hsl(var(--foreground))]">
                {deviceFlow.verificationUri}
              </span>
            </p>
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-6 py-3">
              <span className="font-mono text-2xl font-bold tracking-widest text-[hsl(var(--foreground))]">
                {deviceFlow.userCode}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              The browser should have opened automatically. Waiting for authorization…
            </p>
          </div>
        ) : (
          <button
            onClick={signIn}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md bg-[hsl(var(--foreground))] px-6 py-3 text-sm font-medium text-[hsl(var(--background))] transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <GitHubIcon />
            {isLoading ? "Starting…" : "Sign in with GitHub"}
          </button>
        )}

        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Requires: GitHub Copilot Pro, Business, or Enterprise
        </p>

        <p className="absolute bottom-4 right-4 text-xs text-[hsl(var(--muted-foreground))]">
          v0.1.0
        </p>
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
