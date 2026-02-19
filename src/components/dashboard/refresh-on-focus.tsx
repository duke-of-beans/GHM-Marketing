"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refreshes the current page's server component data when the browser tab
 * regains focus. This busts the Next.js 14 client-side Router Cache for
 * dashboard pages, ensuring metrics/widgets always reflect the latest DB state.
 *
 * Drop this component anywhere in a server-rendered page and it handles the rest.
 * It does NOT cause a full page reload — it re-fetches the RSC payload in the
 * background and React reconciles the diff.
 */
export function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const onFocus = () => {
      router.refresh();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  return null;
}
