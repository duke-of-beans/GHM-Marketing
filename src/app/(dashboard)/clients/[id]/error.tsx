"use client";

export default function ClientDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "Failed to load client profile. This may be a data issue."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
        <a
          href="/clients"
          className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
        >
          Back to Clients
        </a>
      </div>
    </div>
  );
}
