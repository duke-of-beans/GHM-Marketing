"use client";

/**
 * PushPermissionPrompt
 * Shows once when the user first opens TeamFeed (or navigates to the dashboard for the first time).
 * Asks for notification permission, registers the subscription if granted.
 * Respects the global pushMessagesEnabled / pushTasksEnabled settings (passed as prop).
 * Stores acknowledgment in localStorage so it only fires once per browser.
 */

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "ghm-push-prompted";

interface Props {
  /** Only show if global push is enabled at all */
  pushEnabled: boolean;
}

export function PushPermissionPrompt({ pushEnabled }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pushEnabled) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    // Already granted/denied — no need to prompt
    if (Notification.permission !== "default") return;
    // Already asked this browser
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so it doesn't pop immediately on mount
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [pushEnabled]);

  async function handleAllow() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.info("Notifications blocked. You can enable them in browser settings.");
        return;
      }
      await subscribe();
      toast.success("Push notifications enabled!");
    } catch (err) {
      console.error("[Push] Failed to subscribe:", err);
      toast.error("Could not enable notifications");
    }
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "dismissed");
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border bg-background shadow-lg p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Enable Notifications?</p>
            <p className="text-xs text-muted-foreground">Get alerts for new messages and task assignments</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAllow} className="flex-1">
          <Bell className="h-3.5 w-3.5 mr-1.5" />
          Enable
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss} className="flex-1">
          <BellOff className="h-3.5 w-3.5 mr-1.5" />
          Not now
        </Button>
      </div>
    </div>
  );
}

/** Subscribe this browser to push and register with the server */
export async function subscribe() {
  const sw = await navigator.serviceWorker.ready;

  const existing = await sw.pushManager.getSubscription();
  if (existing) {
    await sendSubscriptionToServer(existing);
    return existing;
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const subscription = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await sendSubscriptionToServer(subscription);
  return subscription;
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  const json = subscription.toJSON();
  await fetch("/api/push-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  });
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes.buffer;
}
