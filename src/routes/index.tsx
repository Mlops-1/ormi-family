import motherAnimation from '@/assets/lotties/mother.json';
import DogRiveAnimation from '@/components/view/DogRiveAnimation';
import { useFilterStore } from '@/store/filterStore';
import { useUserStore } from '@/store/userStore';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  const { setMode } = useUserStore();
  const { setFiltersForMode } = useFilterStore();

  const handleModeSelect = (mode: 'toddler' | 'pet') => {
    // Set Global Mode (handles theme side effects in store)
    setMode(mode);

    // Set Filters based on mode (handles filter selection and ordering)
    setFiltersForMode(mode);

    // Navigate to the main app (now at /map)
    navigate({ to: '/map' });
  };

  useEffect(() => {
    // Optional: Pre-load theme preference if needed
  }, []);

  // Responsive hook logic for icon positioning
  const [isDesktop, setIsDesktop] = useState(true);
  const [isBubbleMoved, setIsBubbleMoved] = useState(false);

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
      <div className="relative w-full max-w-3xl h-64 md:h-80 flex items-center justify-center -mb-8 -md:mb-10 z-10 group overflow-visible">
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
          // {
          //   id: 5,
          //   mobile: { left: '20%', top: '80%' },
          //   desktop: { left: '25%', top: '80%' },
          //   delay: 0.3,
          //   col: 4,
          //   row: 2,
          //   flip: false,
          // },

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
          // {
          //   id: 8,
          //   mobile: { left: '65%', top: '80%' },
          //   desktop: { left: '60%', top: '85%' },
          //   delay: 0.15,
          //   col: 0,
          //   row: 2,
          //   flip: true,
          // },

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
          // {
          //   id: 10,
          //   mobile: { left: '45%', top: '75%' },
          //   desktop: { left: '50%', top: '70%' },
          //   delay: 0.6,
          //   col: 3,
          //   row: 0,
          //   flip: false,
          // },
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
              left: isDesktop
                ? item.desktop.left
                : item.id === 6 && isBubbleMoved
                  ? '78%'
                  : item.mobile.left,
              top: isDesktop
                ? item.desktop.top
                : item.id === 6 && isBubbleMoved
                  ? '18%'
                  : item.mobile.top,
            }}
            transition={{
              duration: 1.2,
              ease: [0.34, 1.56, 0.64, 1],
              delay: item.delay * 0.2,
            }}
            className="absolute z-40" // Removed overflow-hidden from here to prevent clipping
            style={{
              width: isDesktop ? '58px' : '52px',
              height: isDesktop ? '58px' : '52px',
            }}
          >
            {/* Speech Bubble for Waving Orange (ID 6) */}
            {item.id === 6 && (
              <>
                {/* 1. First Bubble: "Who did you come with?" - Moves UP on click */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 10, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    // If moved, slide up significantly (-50px) to make room
                    y: isBubbleMoved ? -50 : [0, -4, 0],
                  }}
                  transition={{
                    opacity: { delay: 1.2, duration: 0.5 },
                    scale: { delay: 1.2, duration: 0.5, type: 'spring' },
                    x: { delay: 1.2, duration: 0.5, type: 'spring' },
                    y: isBubbleMoved
                      ? { duration: 0.4, type: 'spring' } // Smooth slide up
                      : {
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 1.2,
                        }, // Bobbing
                  }}
                  className="absolute right-[110%] top-[-20%] w-max bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-orange-100 z-50 cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBubbleMoved(!isBubbleMoved);
                  }}
                >
                  {/* Bubble Tail - Only show if NOT moved */}
                  {!isBubbleMoved && (
                    <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white/90 border-t border-r border-orange-100 transform rotate-45 -translate-y-1/2"></div>
                  )}

                  <p className="font-jeju text-jeju-light-text-primary text-xs md:text-sm leading-none pt-1">
                    제주도, 누구랑 오셨어요?
                  </p>
                </motion.div>

                {/* 2. Second Bubble: "Select companion!" - Appears below with 10px gap */}
                <AnimatePresence>
                  {isBubbleMoved && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: -10, x: 0 }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        delay: 0.1,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                      }}
                      // Positioned relative to the first bubble's original position but shifted down by the new layout
                      // Since first bubble moves UP to -50px, we position this one to naturally sit below it + 10px gap
                      // Top -20% (approx -10px) - 50px (animation) = -60px (Top of 1st)
                      // Height of bubble is approx 35px. Bottom of 1st = -25px.
                      // We want 2nd bubble top at -15px.
                      // Let's use absolute positioning relative to parent (icon).
                      // We'll hardcode the "moved up" state visual using top/margin logic or just simple pixel math relative to parent.
                      // Simpler: Just place it at top: -10px which is roughly 10px below the moved-up bubble (at -50px top + ~35px height)
                      className="absolute right-[110%] top-[-10px] w-max bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-orange-100 z-50 pointer-events-none origin-top-right"
                    >
                      {/* Tail for this new bubble pointing to the orange */}
                      <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white/90 border-t border-r border-orange-100 transform rotate-45 -translate-y-1/2"></div>

                      <p className="font-jeju text-jeju-light-text-primary text-xs md:text-sm leading-none pt-1">
                        여행 동반자를 선택해주세요!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* 2. BOBBING & INTERACTION WRAPPER (Handles Float Loop + Bounce Effect) */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, item.id % 2 === 0 ? 5 : -5, 0],
                ...(item.id === 6 && {
                  filter: [
                    'drop-shadow(0 0 2px rgba(251,146,60,0.4))',
                    'drop-shadow(0 0 10px rgba(251,146,60,0.7))',
                    'drop-shadow(0 0 2px rgba(251,146,60,0.4))',
                  ],
                }),
              }}
              // Bounce/Pop effect on hover/tap
              whileHover={{ scale: 1.2, rotate: item.id % 2 === 0 ? 15 : -15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                if (item.id === 6) {
                  e.stopPropagation();
                  setIsBubbleMoved(!isBubbleMoved);
                }
              }}
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
                // Glow pulse timing
                filter: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                // Quick transition for hover interactions
                scale: { duration: 0.2 },
              }}
              className="w-full h-full relative cursor-pointer"
            >
              {/* 3. CLIPPER (Actual Mask for the Sprite) - Now moves WITH the bobber, so no cutoff */}
              <div
                className={`w-full h-full overflow-hidden rounded-full shadow-sm bg-white/10 backdrop-blur-[1px] ${
                  item.id === 6 ? 'ring-1 ring-orange-100' : ''
                }`}
              >
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

      <div className="flex flex-col md:flex-row gap-0 md:gap-12 w-full max-w-4xl px-4 md:px-6 z-10 -mt-5 md:-mt-12">
        {/* Toddler Option */}
        <motion.button
          onClick={() => handleModeSelect('toddler')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 min-w-0 p-4 md:p-8 transition-all group relative flex flex-col items-center"
        >
          <div className="absolute inset-0 bg-linear-to-br transition-opacity rounded-3xl" />
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
          <p className="text-sm md:text-md text-gray-500">
            유모차 접근성, 수유실 정보
          </p>
          <p className="text-sm md:text-md text-gray-500">
            클릭해서 추천받고 시작하기
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
          <div className="w-full h-40 md:h-80 mb-4 md:mb-6 relative md:-bottom-4.5">
            <DogRiveAnimation />
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            반려견과 함께
          </h2>
          <p className="text-sm md:text-md text-gray-500">
            반려동물 동반 가능 장소
          </p>
          <p className="text-sm md:text-md text-gray-500">
            클릭해서 추천받고 시작하기
          </p>
        </motion.button>
      </div>

      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-120 h-120 bg-indigo-100/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse delay-700" />
    </div>
  );
}
