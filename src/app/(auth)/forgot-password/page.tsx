"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent enumeration
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <Image src="/logo.png" alt="Company logo" width={240} height={80} className="mx-auto" priority />
          <p className="text-sm text-muted-foreground">Password reset</p>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                If that email is registered, you'll receive a reset link within a few minutes. Check your spam folder if it doesn't arrive.
              </p>
              <Link href="/login" className="text-sm text-primary underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-status-danger text-center">{error}</p>}
              <Button type="submit" className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Sending..." : "Send reset link"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-xs text-muted-foreground underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
