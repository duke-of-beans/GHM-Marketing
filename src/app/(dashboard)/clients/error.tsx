"use client";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Failed to load clients</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "Something went wrong loading the client portfolio."}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  );
}
