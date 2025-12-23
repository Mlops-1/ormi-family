import { useEffect, useSyncExternalStore } from 'react';

// External store for Tmap loaded state (singleton, persists across renders)
let isScriptInjected = false;
const listeners: Set<() => void> = new Set();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return Boolean(window.Tmapv2);
}

function notifyListeners() {
  listeners.forEach((callback) => callback());
}

export default function useTmapScript() {
  // Use useSyncExternalStore for React 18+ compatibility
  const isLoaded = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    // If already loaded or script already injected, do nothing
    if (isLoaded || isScriptInjected) {
      return;
    }

    // Mark as injected to prevent duplicate scripts
    isScriptInjected = true;

    // Get API key from environment variables
    const appKey = import.meta.env.VITE_TMAP_APP_KEY;
    if (!appKey) {
      console.error('VITE_TMAP_APP_KEY is not set');
      return;
    }

    // Create and inject the script dynamically
    const script = document.createElement('script');
    script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${appKey}`;
    script.async = true;
    script.setAttribute('data-tmap', 'true');

    script.onload = () => {
      // Poll for Tmapv2 availability (script loads async)
      const checkLoaded = () => {
        if (window.Tmapv2) {
          notifyListeners();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    };

    script.onerror = () => {
      console.error('Failed to load TMap SDK');
      isScriptInjected = false; // Allow retry
    };

    document.head.appendChild(script);
  }, [isLoaded]);

  return { isLoaded };
}
