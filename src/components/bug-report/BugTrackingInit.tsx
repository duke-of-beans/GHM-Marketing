"use client";

import { useEffect } from "react";

export function BugTrackingInit() {
  useEffect(() => {
    // Initialize storage
    (window as any).__consoleErrors = [];
    (window as any).__networkErrors = [];
    (window as any).__recentActions = [];

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      originalConsoleError.apply(console, args);
      
      (window as any).__consoleErrors.push({
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        timestamp: new Date().toISOString(),
      });

      if ((window as any).__consoleErrors.length > 20) {
        (window as any).__consoleErrors.shift();
      }
    };

    // Capture network errors
    const originalFetch = window.fetch;
    window.fetch = async function(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const startTime = Date.now();
      try {
        const response = await originalFetch.call(this, input, init);
        
        if (!response.ok) {
          (window as any).__networkErrors.push({
            url: typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url,
            status: response.status,
            statusText: response.statusText,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });

          if ((window as any).__networkErrors.length > 10) {
            (window as any).__networkErrors.shift();
          }
        }
        
        return response;
      } catch (error) {
        (window as any).__networkErrors.push({
          url: typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });

        if ((window as any).__networkErrors.length > 10) {
          (window as any).__networkErrors.shift();
        }
        
        throw error;
      }
    };

    // Track user actions
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const action = {
        type: 'click',
        element: target.tagName,
        text: target.textContent?.substring(0, 50) || '',
        timestamp: new Date().toISOString(),
      };

      (window as any).__recentActions.push(action);

      if ((window as any).__recentActions.length > 10) {
        (window as any).__recentActions.shift();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
}
