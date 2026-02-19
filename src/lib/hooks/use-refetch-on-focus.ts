import { useEffect, useRef } from "react";

/**
 * Calls the provided refetch function when the browser tab regains focus.
 * Debounced to avoid rapid-fire refetches when alt-tabbing quickly.
 * 
 * Usage:
 *   useRefetchOnFocus(fetchData);
 * 
 * Where fetchData is the same function called in useEffect on mount.
 */
export function useRefetchOnFocus(refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const onFocus = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => refetchRef.current(), 300);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearTimeout(timeout);
    };
  }, []);
}
