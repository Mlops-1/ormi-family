import { useEffect, useRef } from 'react';

/**
 * A hook to enhance mobile touch interactions, particularly for maps and swipeable elements.
 * This helps resolve issues where touch/drag/swipe events are swallowed or blocked,
 * especially in mobile developer tools or on actual mobile devices.
 *
 * Usage:
 * const containerRef = useMobileTouch();
 * <div ref={containerRef} ... />
 */
export function useMobileTouch<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 1. Force touch-action to manipulation or none to allow custom gestures
    // 'none' disables all browser gestures (pan/zoom) allowing the app to handle them completely.
    // 'pan-y' or 'pan-x' might be better if we want some scrolling, but for maps/cards 'none' is often safest.
    element.style.touchAction = 'none';
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';

    // 2. Prevent default touch behaviors that might interfere with custom drag logic
    // We use { passive: false } to allow valid preventDefault() calls.
    const handleTouchMove = (e: TouchEvent) => {
      // Logic to decide if we should prevent default.
      // For a map or simple drag surface, we generally want to prevent browser scrolling.
      // However, check if the target is something scrollable inside?
      // For now, consistent with user request to "make it work", we aggressive prevent default
      // on the container to give full control to the app's gesture handlers.
      if (e.cancelable) {
        e.preventDefault(); // CAREFUL: This might block scrolling if applied to the whole page.
      }
    };

    // Apply listeners
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return ref;
}
