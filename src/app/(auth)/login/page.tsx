"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

type LoginStep = "credentials" | "totp";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string>("/logo.png");
  const [tenantName, setTenantName] = useState<string | null>(null);

  // Store credentials across the two-step flow
  const emailRef = useRef<string>("");
  const passwordRef = useRef<string>("");

  // Fetch tenant branding (FEAT-018) — no auth required
  useEffect(() => {
    fetch("/api/public/branding")
      .then((r) => r.json())
      .then((d) => {
        setTenantLogoUrl(d.logoUrl ?? "/logo.png");
        if (d.companyName) setTenantName(d.companyName);
      })
      .catch(() => {});
  }, []);

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error === "2FA_REQUIRED") {
        // Preserve credentials, advance to TOTP step
        emailRef.current = email;
        passwordRef.current = password;
        setStep("totp");
        setLoading(false);
        return;
      }

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const totpCode = formData.get("totpCode") as string;

    try {
      const result = await signIn("credentials", {
        email: emailRef.current,
        password: passwordRef.current,
        totpCode,
        isBackupCode: useBackupCode ? "true" : "false",
        redirect: false,
      });

      if (result?.error === "INVALID_TOTP_CODE") {
        setError(useBackupCode ? "Invalid backup code" : "Invalid code. Check your authenticator app.");
        setLoading(false);
        return;
      }

      if (result?.error) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tenantLogoUrl}
            alt={tenantName ?? "Company logo"}
            className="mx-auto max-h-16 max-w-48 object-contain"
          />
          <p className="text-sm text-muted-foreground">
            {step === "credentials" ? "Sign in to your dashboard" : "Two-factor authentication"}
          </p>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground underline hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-status-danger text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {useBackupCode
                  ? "Enter one of your backup codes."
                  : "Enter the 6-digit code from your authenticator app."}
              </p>

              <div className="space-y-2">
                <Label htmlFor="totpCode">
                  {useBackupCode ? "Backup Code" : "Authentication Code"}
                </Label>
                <Input
                  id="totpCode"
                  name="totpCode"
                  type="text"
                  placeholder={useBackupCode ? "XXXXXXXXXX" : "000000"}
                  inputMode={useBackupCode ? "text" : "numeric"}
                  maxLength={useBackupCode ? 10 : 6}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <p className="text-sm text-status-danger text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>

              <div className="flex justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    setUseBackupCode((v) => !v);
                    setError(null);
                  }}
                >
                  {useBackupCode ? "Use authenticator app instead" : "Use a backup code"}
                </button>
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    setStep("credentials");
                    setError(null);
                    emailRef.current = "";
                    passwordRef.current = "";
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      {/* COVOS platform mark — admin layer only, tasteful */}
      <p className="mt-6 text-[10px] tracking-widest text-muted-foreground uppercase select-none">
        Powered by COVOS
      </p>
    </div>
  );
}
