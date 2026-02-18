"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for push notifications and PWA support.
 * Mounts once at the root layout level — no UI, no side effects beyond SW registration.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  return null;
}
