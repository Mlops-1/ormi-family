import babyFaceAnimation from '@/assets/lotties/baby_face.json';
import dogPowAnimation from '@/assets/lotties/dog_pow.json';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

export default function LoadingScreen() {
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  const animationData = isPetMode ? dogPowAnimation : babyFaceAnimation;
  // 각 테마의 메인 컬러 (Jeju Tangerine: #FF8A00, Green Tea: #4CAF50)
  const themeColor = isPetMode ? '#4CAF50' : '#FF8A00';

  const loadingText = '여행지 불러오는 중...';

  return (
    <div className="absolute inset-0 z-200 flex flex-col items-center justify-center pointer-events-none bg-white/70 backdrop-blur-sm">
      <div className="w-64 h-64 mb-1">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="flex">
        {loadingText.split('').map((char, index) => (
          <motion.span
            key={index}
            className="text-2xl font-bold inline-block"
            style={{ color: themeColor }}
            animate={{
              y: [0, -6, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1.2, // 주기에 휴지기를 주어 리듬감 부여
              ease: 'backOut',
              delay: index * 0.08,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
