import { useEffect, useState } from 'react';

// Module-level state for script loading
let loadPromise: Promise<void> | null = null;
const listeners: Set<(loaded: boolean) => void> = new Set();

function notifyListeners(loaded: boolean) {
  listeners.forEach((callback) => callback(loaded));
}

// Check if Tmapv2 is fully ready (not just exists, but has constructors)
function isTmapReady(): boolean {
  return Boolean(
    window.Tmapv2 &&
    typeof window.Tmapv2.Map === 'function' &&
    typeof window.Tmapv2.LatLng === 'function' &&
    typeof window.Tmapv2.Marker === 'function'
  );
}

function loadTmapScript(): Promise<void> {
  // If already ready, resolve immediately
  if (isTmapReady()) {
    return Promise.resolve();
  }

  // If already loading, return existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Get API key
  const appKey = import.meta.env.VITE_TMAP_APP_KEY;
  if (!appKey) {
    console.error('VITE_TMAP_APP_KEY is not set');
    return Promise.reject(new Error('VITE_TMAP_APP_KEY is not set'));
  }

  // Start loading
  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.querySelector('script[data-tmap="true"]');

    if (existingScript) {
      // Script exists, just wait for Tmapv2 to be ready
      const checkReady = () => {
        if (isTmapReady()) {
          notifyListeners(true);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
      return;
    }

    // Create and inject script
    const script = document.createElement('script');
    script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${appKey}`;
    script.async = true;
    script.setAttribute('data-tmap', 'true');

    script.onload = () => {
      // Poll until Tmapv2 is fully ready
      const checkReady = () => {
        if (isTmapReady()) {
          notifyListeners(true);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };

    script.onerror = () => {
      console.error('Failed to load TMap SDK');
      loadPromise = null; // Allow retry
      reject(new Error('Failed to load TMap SDK'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export default function useTmapScript() {
  const [isLoaded, setIsLoaded] = useState(isTmapReady);

  useEffect(() => {
    // If already loaded, nothing to do
    if (isLoaded) {
      return;
    }

    // Subscribe to load events
    const handleLoad = (loaded: boolean) => {
      setIsLoaded(loaded);
    };
    listeners.add(handleLoad);

    // Start loading if not already
    loadTmapScript().catch((error) => {
      console.error('TMap script load error:', error);
    });

    return () => {
      listeners.delete(handleLoad);
    };
  }, [isLoaded]);

  return { isLoaded };
}
