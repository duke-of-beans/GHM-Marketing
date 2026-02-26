"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setStatus("idle");
        return;
      }
      setStatus("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-status-danger">Invalid or missing reset link.</p>
        <Link href="/forgot-password" className="text-sm text-primary underline">Request a new one</Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-status-success font-medium">Password updated successfully.</p>
        <p className="text-sm text-muted-foreground">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password" required />
      </div>
      {error && <p className="text-sm text-status-danger text-center">{error}</p>}
      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Updating..." : "Set new password"}
      </Button>
      <div className="text-center">
        <Link href="/login" className="text-xs text-muted-foreground underline">Back to sign in</Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <Image src="/logo.png" alt="GHM Digital Marketing" width={240} height={80} className="mx-auto" priority />
          <p className="text-sm text-muted-foreground">Set new password</p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-center text-muted-foreground">Loading...</p>}>
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
