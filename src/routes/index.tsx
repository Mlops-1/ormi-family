import motherAnimation from '@/assets/lotties/mother.json';
import DogRiveAnimation from '@/components/DogRiveAnimation';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  const handleModeSelect = (mode: 'toddler' | 'pet') => {
    const root = window.document.documentElement;

    if (mode === 'toddler') {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    // Navigate to the main app (now at /map)
    navigate({ to: '/map' });
  };

  useEffect(() => {
    // Optional: Pre-load theme preference if needed
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-orange-50 dark:bg-slate-900 transition-colors duration-500 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-600 dark:text-orange-400 mb-4 drop-shadow-sm font-display">
          누구와 함께 하시나요?
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          여행 파트너를 선택해주세요
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full max-w-4xl px-6 z-10">
        {/* Toddler Option */}
        <motion.button
          onClick={() => handleModeSelect('toddler')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 p-8 transition-all group relative flex flex-col items-center"
        >
          <div className="absolute inset-0 bg-linear-to-br from-orange-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
          <div className="w-full h-64 md:h-80 mb-6 relative">
            <Lottie
              animationData={motherAnimation}
              loop={true}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            아이와 함께
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            유모차 접근성, 수유실 정보
          </p>
        </motion.button>

        {/* Pet Option */}
        <motion.button
          onClick={() => handleModeSelect('pet')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 p-8 transition-all group relative flex flex-col items-center"
        >
          {/* Rive Animation */}
          <DogRiveAnimation />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            반려견과 함께
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            반려동물 동반 가능 장소
          </p>
        </motion.button>
      </div>

      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-120 h-120 bg-indigo-300/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse delay-700" />
    </div>
  );
}
