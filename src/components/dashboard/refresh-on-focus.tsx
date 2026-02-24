"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Refreshes the current page's server component data when the browser tab
 * regains focus — but not immediately after a same-session navigation.
 *
 * Problem: router.refresh() on every focus event fires even when returning
 * from another route within the app. This caused the master dashboard grid
 * and sales dashboard widgets to flash/rerender on every back-navigation
 * (e.g., after visiting /leads or /clients and pressing Back).
 *
 * Fix: Track the last navigation timestamp. If focus fires within 2 seconds
 * of a route change, skip the refresh — the page was just loaded fresh.
 * Only refresh on genuine re-focus events (user switching tabs/apps).
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const pathname = usePathname();
  const lastNavAt = useRef<number>(Date.now());

  // Update nav timestamp whenever the route changes
  useEffect(() => {
    lastNavAt.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    const DEBOUNCE_MS = 2000; // ignore focus within 2s of navigation

    const onFocus = () => {
      const msSinceNav = Date.now() - lastNavAt.current;
      if (msSinceNav < DEBOUNCE_MS) return;
      router.refresh();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  return null;
}
