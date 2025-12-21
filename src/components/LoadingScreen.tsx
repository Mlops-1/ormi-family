import babyFaceAnimation from '@/assets/lotties/baby_face.json';
import dogPowAnimation from '@/assets/lotties/dog_pow.json';
import { useUserStore } from '@/store/userStore';
import Lottie from 'lottie-react';

export default function LoadingScreen() {
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  const animationData = isPetMode ? dogPowAnimation : babyFaceAnimation;
  const themeColorClass = isPetMode ? 'text-ormi-green-500' : 'text-orange-500';
  const themeDecorationClass = isPetMode
    ? 'decoration-ormi-green-500'
    : 'decoration-orange-500';

  return (
    <div className="absolute inset-0 z-200 flex flex-col items-center justify-center bg pointer-events-none bg-white bg-opacity-5">
      <div className="w-64 h-64 mb-1">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p
        className={`text-2xl text-white font-bold px-6 py-3 ${themeDecorationClass}`}
      >
        여행지 불러오는 중...
      </p>
    </div>
  );
}
