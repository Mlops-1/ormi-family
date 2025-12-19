import babyIcon from '@/assets/lotties/baby_girl_icon.json';
import dogIcon from '@/assets/lotties/puppy_relaxing.json';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useRef, useState } from 'react';

export default function ModeToggle() {
  // Read initial theme from localStorage or document class
  const getTheme = () => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? 'dark' : 'light';
    }
    return 'light';
  };

  const [mode, setMode] = useState<'light' | 'dark'>(getTheme());
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Sync state with DOM changes if changed elsewhere (optional)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          setMode(getTheme());
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);

    // Apply to DOM
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Play animation
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    }
  };

  // Select animation based on TARGET mode (or current? User said toggle transform)
  // If current is Light (Baby), button should likely show what it IS or what it WILL BE?
  // Usually toggle shows the CURRENT state icon, or the "Switch to" icon.
  // User said: "dog_icon and baby_girl_icon transform naturally... stopped... click to play and transform"
  // If I am in Baby Mode (Light), I see Baby. I click, it animates, transforms to Dog (Dark)?
  // Or I see Dog because that's what I can switch to?
  // Let's assume: Show CURRENT mode icon.
  // Light Mode -> Show Baby. Click -> Play Baby animation -> Switch to Dark Mode -> Show Dog?
  // Or maybe smoother:
  // Light Mode -> Show Baby.
  // Click -> Baby plays -> Fades out -> Dog Fades in -> Dark Mode active.

  const currentAnimation = mode === 'light' ? babyIcon : dogIcon;

  return (
    <button
      onClick={toggleMode}
      className="w-10 h-10 relative flex items-center justify-center rounded-full bg-white dark:bg-ormi-green-500 shadow-md border border-gray-200 dark:border-ormi-green-600 hover:scale-105 transition-transform overflow-hidden"
      aria-label="Toggle Theme"
      title={mode === 'light' ? 'Switch to Pet Mode' : 'Switch to Toddler Mode'}
    >
      <div className="w-8 h-8">
        <Lottie
          lottieRef={lottieRef}
          animationData={currentAnimation}
          loop={true}
          autoplay={true} // "Static state... play when pressed"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </button>
  );
}
