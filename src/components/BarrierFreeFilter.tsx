import { useFilterStore } from '@/store/filterStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Accessibility,
  Baby,
  ChevronUp,
  Dog,
  Info,
  ParkingCircle,
  Waypoints,
  X,
} from 'lucide-react';

export type AccessibilityType =
  | 'wheelchair'
  | 'stroller'
  | 'lactation_room'
  | 'baby_spare_chair'
  | 'help_dog'
  | 'route'
  | 'elevator'
  | 'parking';

// Remove Props interface as we use store now
interface Props {
  className?: string; // Keep className for positioning override
}

const OPTION_CONFIG: Record<
  AccessibilityType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  wheelchair: {
    label: '휠체어',
    icon: <Accessibility size={20} />,
    color: 'bg-blue-500',
  },
  stroller: {
    label: '유모차',
    icon: <Baby size={20} />,
    color: 'bg-pink-500',
  },
  lactation_room: {
    label: '수유실',
    icon: <Baby size={20} />,
    color: 'bg-yellow-500',
  },
  baby_spare_chair: {
    label: '유아의자',
    icon: <Info size={20} />,
    color: 'bg-green-500',
  },
  help_dog: {
    label: '보조견',
    icon: <Dog size={20} />,
    color: 'bg-orange-500',
  },
  route: {
    label: '대중교통',
    icon: <Waypoints size={20} />,
    color: 'bg-purple-500',
  },
  elevator: {
    label: '엘리베이터',
    icon: <ChevronUp size={20} />,
    color: 'bg-indigo-500',
  },
  parking: {
    label: '주차장',
    icon: <ParkingCircle size={20} />,
    color: 'bg-slate-500',
  },
};

export default function BarrierFreeFilter({ className = '' }: Props) {
  const {
    barrierOrderedIds,
    selectedBarrierIds,
    toggleBarrierId,
    isBarrierOpen,
    setBarrierOpen,
  } = useFilterStore();

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
        ) : (
          <Accessibility className="" size={20} />
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
