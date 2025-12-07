import { useEffect, useState } from 'react';

export default function useTmapScript() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.Tmapv2) {
      setIsLoaded(true);
      return;
    }

    const checkLoaded = () => {
      if (window.Tmapv2) {
        setIsLoaded(true);
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return { isLoaded };
}
