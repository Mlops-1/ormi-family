import { AnimatePresence, motion } from 'framer-motion';
import {
  Accessibility,
  Baby, // For lactation room proxy & stroller fallback
  ChevronUp, // For Elevator proxy
  Dog,
  Info, // For Baby chair proxy
  ParkingCircle,
  Waypoints,
} from 'lucide-react';
import { useState } from 'react';

export type AccessibilityType =
  | 'wheelchair'
  | 'stroller'
  | 'lactation_room'
  | 'baby_spare_chair'
  | 'help_dog'
  | 'route'
  | 'elevator'
  | 'parking';

interface Props {
  selected: AccessibilityType[];
  onChange: (selected: AccessibilityType[]) => void;
}

export default function BarrierFreeFilter({ selected, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (type: AccessibilityType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const options: {
    id: AccessibilityType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'wheelchair', label: '휠체어', icon: <Accessibility size={20} /> },
    { id: 'stroller', label: '유모차', icon: <Baby size={20} /> }, // Using Baby icon as fallback
    { id: 'lactation_room', label: '수유실', icon: <Baby size={20} /> },
    { id: 'baby_spare_chair', label: '유아의자', icon: <Info size={20} /> },
    { id: 'help_dog', label: '보조견', icon: <Dog size={20} /> },
    { id: 'route', label: '대중교통', icon: <Waypoints size={20} /> },
    { id: 'elevator', label: '엘리베이터', icon: <ChevronUp size={20} /> },
    { id: 'parking', label: '주차장', icon: <ParkingCircle size={20} /> },
  ];

  return (
    <div className="relative z-50">
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 pointer-events-auto ${
          isOpen || selected.length > 0
            ? 'bg-ormi-green-500 text-white border-2 border-white'
            : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-white/20 dark:border-slate-600 backdrop-blur-md'
        }`}
        aria-label="장애인 편의시설 필터"
      >
        <Accessibility className={isOpen ? 'scale-110' : ''} size={24} />
      </button>

      {/* Floating Options (Vertical list below) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute top-14 right-0 md:left-0 flex flex-col gap-2 p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-600 min-w-[140px] pointer-events-auto"
          >
            {options.map((opt) => {
              const isActive = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleFilter(opt.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left ${
                    isActive
                      ? 'bg-ormi-green-100 dark:bg-ormi-green-900/30 text-ormi-green-700 dark:text-ormi-green-300 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium'
                  }`}
                >
                  <span
                    className={
                      isActive ? 'text-ormi-green-600' : 'text-gray-500'
                    }
                  >
                    {opt.icon}
                  </span>
                  <span className="text-sm whitespace-nowrap">{opt.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ormi-green-500 shadow-sm" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
