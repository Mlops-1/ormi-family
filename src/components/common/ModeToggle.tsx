import babyIcon from '@/assets/lotties/baby_girl_icon.json';
import dogIcon from '@/assets/lotties/puppy_relaxing.json';
import { useFilterStore } from '@/store/filterStore';
import { useUserStore } from '@/store/userStore';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useRef } from 'react';

export default function ModeToggle() {
  const { mode, setMode } = useUserStore();
  const { setFiltersForMode } = useFilterStore();
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Sync state with DOM on mount and change
  useEffect(() => {
    const root = window.document.documentElement;
    if (mode === 'pet') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  const toggleMode = () => {
    const newMode = mode === 'toddler' ? 'pet' : 'toddler';

    setMode(newMode);
    setFiltersForMode(newMode);

    // Play animation
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    }
  };

  const currentAnimation = mode === 'toddler' ? babyIcon : dogIcon;

  return (
    <button
      onClick={toggleMode}
      className="w-10 h-10 relative flex items-center justify-center rounded-full bg-white dark:bg-ormi-green-500 shadow-md hover:scale-105 transition-transform overflow-hidden"
      aria-label="Toggle Theme"
      title={
        mode === 'toddler' ? 'Switch to Pet Mode' : 'Switch to Toddler Mode'
      }
    >
      <div className="w-8 h-8">
        <Lottie
          lottieRef={lottieRef}
          animationData={currentAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </button>
  );
}
