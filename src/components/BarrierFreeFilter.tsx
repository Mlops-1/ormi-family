import { useFilterStore } from '@/store/filterStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Dog, X } from 'lucide-react';

import { BARRIER_CONFIG as OPTION_CONFIG } from '@/constants/filterConfig';

interface Props {
  className?: string;
}

import { useUserStore } from '@/store/userStore';

export default function BarrierFreeFilter({ className = '' }: Props) {
  const {
    barrierOrderedIds,
    selectedBarrierIds,
    toggleBarrierId,
    isBarrierOpen,
    setBarrierOpen,
  } = useFilterStore();
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  return (
    <div className={`relative z-50 ${className}`}>
      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setBarrierOpen(!isBarrierOpen)}
        className={`w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md flex items-center justify-center transition-colors duration-200 pointer-events-auto relative ${'bg-orange-500 hover:bg-orange-600 dark:bg-ormi-green-500 dark:hover:bg-ormi-green-600 text-white'}`}
        aria-label="장애인 편의시설 필터"
      >
        {isBarrierOpen ? (
          <X size={20} />
        ) : isPetMode ? (
          <Dog size={20} />
        ) : (
          <Baby size={20} />
        )}
        {selectedBarrierIds.length > 0 && !isBarrierOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {selectedBarrierIds.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isBarrierOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 flex flex-col gap-1.5 p-2 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[120px] pointer-events-auto z-50"
          >
            {barrierOrderedIds.map((id) => {
              const config = OPTION_CONFIG[id];
              const isActive = selectedBarrierIds.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => toggleBarrierId(id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-orange-500 dark:bg-ormi-green-500 text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="shrink-0">{config.icon}</span>
                  <span className="grow text-left">{config.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
