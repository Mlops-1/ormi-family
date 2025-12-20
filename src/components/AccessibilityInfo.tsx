import iconBabyChair from '@/assets/images/icon_baby_chair.svg';
import iconLactation from '@/assets/images/icon_lactation.svg';
import iconStroller from '@/assets/images/icon_stroller.svg';
import { useUserStore } from '@/store/userStore';
import type { SpotCard } from '@/types/spot';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Accessibility,
  ChevronsUp,
  Dog,
  Footprints,
  ParkingCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  spot: SpotCard;
}

interface IconItem {
  key: keyof SpotCard;
  label: string;
  renderIcon: (props: { size?: number; className?: string }) => React.ReactNode;
}

export default function AccessibilityInfo({ spot }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  const mainColorClass = isPetMode ? 'bg-ormi-green-500' : 'bg-orange-500';
  const mainSubColorClass = isPetMode ? 'bg-ormi-green-50' : 'bg-orange-50';
  const mainTextColorClass = isPetMode
    ? 'text-ormi-green-500'
    : 'text-orange-500';
  const mainTextSubClass = isPetMode
    ? 'text-ormi-green-400'
    : 'text-orange-400';
  const mainTooltipTextColor = isPetMode
    ? 'text-ormi-green-400'
    : 'text-orange-400';

  const icons: IconItem[] = [
    {
      key: 'stroller',
      label: '유모차',
      renderIcon: ({ size, className }) => (
        <img
          src={iconStroller}
          alt="stroller"
          width={size}
          height={size}
          className={className}
        />
      ),
    },
    {
      key: 'wheelchair',
      label: '휠체어',
      renderIcon: ({ size }) => <Accessibility size={size} />,
    },
    {
      key: 'lactation_room',
      label: '수유실',
      renderIcon: ({ size, className }) => (
        <img
          src={iconLactation}
          alt="lactation room"
          width={size}
          height={size}
          className={className}
        />
      ),
    },
    {
      key: 'baby_spare_chair',
      label: '유아의자',
      renderIcon: ({ size, className }) => (
        <img
          src={iconBabyChair}
          alt="baby chair"
          width={size}
          height={size}
          className={className}
        />
      ),
    },
    {
      key: 'help_dog',
      label: '반려견',
      renderIcon: ({ size }) => <Dog size={size} />,
    },
    {
      key: 'route',
      label: '산책로',
      renderIcon: ({ size }) => <Footprints size={size} />,
    },
    {
      key: 'parking',
      label: '주차장',
      renderIcon: ({ size }) => <ParkingCircle size={size} />,
    },
    {
      key: 'elevator',
      label: '엘리베이터',
      renderIcon: ({ size }) => <ChevronsUp size={size} />,
    },
  ];

  // Filter items that have content
  const activeIcons = icons.filter(
    (item) =>
      spot[item.key] &&
      typeof spot[item.key] === 'string' &&
      (spot[item.key] as string).length > 0
  );

  if (activeIcons.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-900">편의 시설</h3>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {activeIcons.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center gap-2 group cursor-pointer relative"
            onClick={() =>
              setActiveTooltip(
                activeTooltip === item.key ? null : (item.key as string)
              )
            }
          >
            <div
              className={`
              w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-300
              ${
                activeTooltip === item.key
                  ? `${mainColorClass} text-white shadow-lg scale-105`
                  : `${mainSubColorClass} ${mainTextColorClass} hover:opacity-80`
              }
            `}
            >
              {item.renderIcon({ size: 28 })}
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {item.label}
            </span>

            {/* Simple Tooltip for details */}
            <AnimatePresence>
              {activeTooltip === item.key && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full mb-2 w-48 z-50 pointer-events-none"
                  style={{ left: '50%', x: '-50%' }}
                >
                  <div className="bg-gray-900/95 text-white text-xs p-3 rounded-xl shadow-xl backdrop-blur-md border border-white/10">
                    <div className={`font-bold mb-1 ${mainTooltipTextColor}`}>
                      {item.label}
                    </div>
                    <div className="leading-relaxed text-gray-100">
                      {spot[item.key] as string}
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-gray-900/95 rotate-45"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
