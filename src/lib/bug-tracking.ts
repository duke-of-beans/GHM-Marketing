// Global metadata capture for bug reporting
// Tracks console errors, network errors, and user actions

if (typeof window !== "undefined") {
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

    // Keep only last 20 errors
    if ((window as any).__consoleErrors.length > 20) {
      (window as any).__consoleErrors.shift();
    }
  };

  // Capture network errors
  const originalFetch = window.fetch;
  window.fetch = async function(...args: any[]) {
    const startTime = Date.now();
    try {
      const response = await originalFetch.apply(this, args);
      
      // Track failed requests
      if (!response.ok) {
        (window as any).__networkErrors.push({
          url: args[0],
          status: response.status,
          statusText: response.statusText,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });

        // Keep only last 10 network errors
        if ((window as any).__networkErrors.length > 10) {
          (window as any).__networkErrors.shift();
        }
      }
      
      return response;
    } catch (error) {
      // Track network failures
      (window as any).__networkErrors.push({
        url: args[0],
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 10 network errors
      if ((window as any).__networkErrors.length > 10) {
        (window as any).__networkErrors.shift();
      }
      
      throw error;
    }
  };

  // Track user actions (clicks)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const action = {
      type: 'click',
      element: target.tagName,
      text: target.textContent?.substring(0, 50) || '',
      timestamp: new Date().toISOString(),
    };

    (window as any).__recentActions.push(action);

    // Keep only last 10 actions
    if ((window as any).__recentActions.length > 10) {
      (window as any).__recentActions.shift();
    }
  }, true);
}

export {};
