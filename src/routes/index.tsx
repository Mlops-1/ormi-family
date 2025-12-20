import motherAnimation from '@/assets/lotties/mother.json';
import DogRiveAnimation from '@/components/DogRiveAnimation';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

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

  // Responsive hook logic for icon positioning
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center bg-white transition-colors duration-500 overflow-hidden relative">
      {/* Container for Title and Floating Icons - Added group for hover effect */}
      <div className="relative w-full max-w-3xl h-64 md:h-80 flex items-center justify-center mb-8 md:mb-12 z-10 group overflow-visible">
        {/* Main Title Logo Image - Elegant & Clean */}
        <motion.img
          src="/src/assets/images/title_logo_elegant.png"
          alt="탐라는가족"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="relative z-30 w-full h-full object-contain pointer-events-none"
        />

        {/* Floating Icons Animation - Responsive Positioning via JS \u0026 Motion */}
        {[
          // ID 1: Jumping Orange (Col 0, Row 0) -> Moved to Right Top for balance
          {
            id: 1,
            mobile: { left: '85%', top: '10%' },
            desktop: { left: '10%', top: '30%' },
            delay: 0,
            col: 0,
            row: 0,
            flip: true,
          }, // Flipped for right side

          // ID 2: Sleeping Orange (Col 1, Row 0) -> Right Side
          {
            id: 2,
            mobile: { left: '75%', top: '25%' },
            desktop: { left: '80%', top: '20%' },
            delay: 0.2,
            col: 1,
            row: 0,
            flip: true,
          },

          // ID 3: Waving Leaf (Col 2, Row 2) -> Bottom Left
          {
            id: 3,
            mobile: { left: '5%', top: '65%' },
            desktop: { left: '5%', top: '65%' },
            delay: 0.4,
            col: 2,
            row: 2,
            flip: false,
          },

          // ID 4: Meditating Leaf (Col 3, Row 2) -> Bottom Right
          {
            id: 4,
            mobile: { left: '85%', top: '60%' },
            desktop: { left: '85%', top: '60%' },
            delay: 0.1,
            col: 3,
            row: 2,
            flip: true,
          },

          // ID 5: Rolling Leaf (Col 4, Row 2) -> Bottom Center-Left
          {
            id: 5,
            mobile: { left: '20%', top: '80%' },
            desktop: { left: '25%', top: '80%' },
            delay: 0.3,
            col: 4,
            row: 2,
            flip: false,
          },

          // ID 6: Waving Orange (Col 2, Row 0) -> Right Middle (Moved UP to avoid covering text)
          {
            id: 6,
            mobile: { left: '65%', top: '30%' },
            desktop: { left: '70%', top: '10%' },
            delay: 0.5,
            col: 2,
            row: 0,
            flip: true,
          },

          // ID 7: Surprised/Happy Orange (Col 0, Row 1) -> Top Left
          {
            id: 7,
            mobile: { left: '15%', top: '10%' },
            desktop: { left: '40%', top: '15%' },
            delay: 0.25,
            col: 0,
            row: 1,
            flip: false,
          },

          // ID 8: Jumping Leaf (Col 0, Row 2) -> Bottom Rightish
          {
            id: 8,
            mobile: { left: '65%', top: '80%' },
            desktop: { left: '60%', top: '85%' },
            delay: 0.15,
            col: 0,
            row: 2,
            flip: true,
          },

          // ID 9: Sleeping Leaf (Col 1, Row 2) -> Left Middle
          {
            id: 9,
            mobile: { left: '5%', top: '35%' },
            desktop: { left: '15%', top: '15%' },
            delay: 0.35,
            col: 1,
            row: 2,
            flip: false,
          },

          // ID 10: NEW! Meditating Orange (Col 3, Row 0) -> Bottom Center (Below Title)
          {
            id: 10,
            mobile: { left: '45%', top: '75%' },
            desktop: { left: '50%', top: '70%' },
            delay: 0.6,
            col: 3,
            row: 0,
            flip: false,
          },
        ].map((item) => (
          <motion.div
            key={item.id}
            // 1. POSITIONING WRAPPER (Handles spread from center)
            initial={{
              opacity: 0,
              scale: 0,
              left: '50%',
              top: '50%',
            }}
            animate={{
              opacity: 1,
              scale: 1,
              left: isDesktop ? item.desktop.left : item.mobile.left,
              top: isDesktop ? item.desktop.top : item.mobile.top,
            }}
            transition={{
              duration: 1.2,
              ease: [0.34, 1.56, 0.64, 1],
              delay: item.delay * 0.2,
            }}
            className="absolute z-40" // Removed overflow-hidden from here to prevent clipping
            style={{
              width: '52px',
              height: '52px',
            }}
          >
            {/* 2. BOBBING & INTERACTION WRAPPER (Handles Float Loop + Bounce Effect) */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, item.id % 2 === 0 ? 5 : -5, 0],
              }}
              // Bounce/Pop effect on hover/tap
              whileHover={{ scale: 1.2, rotate: item.id % 2 === 0 ? 15 : -15 }}
              whileTap={{ scale: 0.9 }}
              transition={{
                y: {
                  duration: 3 + (item.id % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                rotate: {
                  duration: 3 + (item.id % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                // Quick transition for hover interactions
                scale: { duration: 0.2 },
              }}
              className="w-full h-full relative cursor-pointer"
            >
              {/* 3. CLIPPER (Actual Mask for the Sprite) - Now moves WITH the bobber, so no cutoff */}
              <div className="w-full h-full overflow-hidden rounded-full shadow-sm bg-white/10 backdrop-blur-[1px]">
                <img
                  src="/src/assets/images/floating_icons_diverse.png"
                  alt="decoration"
                  className="max-w-none absolute object-cover"
                  style={{
                    width: '500%', // 5x5 grid
                    height: '500%',
                    left: `calc(-${item.col * 100}% + 0.5%)`,
                    top: `calc(-${item.row * 100}% + 0.5%)`,
                    transform: item.flip ? 'scaleX(-1)' : 'none',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-12 w-full max-w-4xl px-4 md:px-6 z-10">
        {/* Toddler Option */}
        <motion.button
          onClick={() => handleModeSelect('toddler')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 min-w-0 p-4 md:p-8 transition-all group relative flex flex-col items-center"
        >
          <div className="absolute inset-0 bg-linear-to-br from-orange-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
          <div className="w-full h-40 md:h-80 mb-4 md:mb-6 relative">
            <Lottie
              animationData={motherAnimation}
              loop={true}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            아이와 함께
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            유모차 접근성, 수유실 정보
          </p>
        </motion.button>

        {/* Pet Option */}
        <motion.button
          onClick={() => handleModeSelect('pet')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 min-w-0 p-4 md:p-8 transition-all group relative flex flex-col items-center"
        >
          {/* Rive Animation Wrapper for Alignment */}
          <div className="w-full h-40 md:h-80 mb-4 md:mb-6 relative">
            <DogRiveAnimation />
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            반려견과 함께
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            반려동물 동반 가능 장소
          </p>
        </motion.button>
      </div>

      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-120 h-120 bg-indigo-100/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse delay-700" />
    </div>
  );
}
