import { AnimatePresence, motion } from 'framer-motion';
import { Hand } from 'lucide-react';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

export default function OnboardingOverlay({ isVisible, onClose }: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[999] bg-black/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative cursor-default"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              환영합니다! 👋
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              오르미패밀리 사용 가이드
            </p>

            <div className="h-48 bg-gray-50 rounded-2xl mb-8 flex flex-col items-center justify-center border border-gray-100 overflow-hidden relative shadow-inner">
              {/* Swipe Animation Hand */}
              <motion.div
                animate={{ x: [0, 60, 0, -60, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: 'easeInOut',
                }}
                className="text-ormi-ember-500 drop-shadow-md z-10"
              >
                <Hand
                  size={64}
                  className="rotate-12"
                  strokeWidth={1.5}
                  fill="currentColor"
                  fillOpacity={0.1}
                />
              </motion.div>

              {/* Decorative Cards Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-32 h-40 bg-gray-300 rounded-xl transform -rotate-6 translate-x-4"></div>
                <div className="w-32 h-40 bg-gray-200 rounded-xl transform rotate-6 -translate-x-4 absolute"></div>
              </div>

              <div className="absolute bottom-4 text-xs text-gray-500 font-bold bg-white/90 px-4 py-1.5 rounded-full shadow-sm z-20 border border-gray-100">
                좌우로 스와이프
              </div>
            </div>

            <div className="space-y-2 mb-8 text-gray-600">
              <p>
                카드를 <strong>오른쪽</strong>으로 당기면
                <br />
                관심 있는 장소를{' '}
                <span className="text-ormi-pink-500 font-bold">찜</span>할 수
                있어요.
              </p>
              <p className="text-xs text-gray-400">
                왼쪽으로 당기면 다음 장소를 볼 수 있습니다.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-linear-to-r from-ormi-green-400 to-ormi-green-500 hover:from-ormi-green-500 hover:to-ormi-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-ormi-green-200/50 transition-all active:scale-95 text-lg"
            >
              알겠어요!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
