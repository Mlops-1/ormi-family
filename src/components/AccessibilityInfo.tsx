import iconBabyChair from '@/assets/images/icon_baby_chair.svg';
import iconLactation from '@/assets/images/icon_lactation.svg';
import iconStroller from '@/assets/images/icon_stroller.svg';
import type { SpotCard } from '@/types/spot';
import { AnimatePresence, motion } from 'framer-motion';
import { Accessibility, ChevronsUp, Dog, ParkingCircle } from 'lucide-react';
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

  const icons: IconItem[] = [
    {
      key: 'wheelchair',
      label: '휠체어 대여',
      renderIcon: ({ size }) => <Accessibility size={size} />,
    },
    {
      key: 'stroller',
      label: '유모차 대여',
      renderIcon: ({ size, className }) => (
        <img
          src={iconStroller}
          alt="stroller"
          width={size}
          height={size}
          className={`${className} dark:invert`} // Simple invert for dark mode if needed
        />
      ),
    },
    {
      key: 'baby_spare_chair',
      label: '유아 의자',
      renderIcon: ({ size, className }) => (
        <img
          src={iconBabyChair}
          alt="baby chair"
          width={size}
          height={size}
          className={`${className} dark:invert`}
        />
      ),
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
          className={`${className} dark:invert`}
        />
      ),
    },
    {
      key: 'elevator',
      label: '엘리베이터',
      renderIcon: ({ size }) => <ChevronsUp size={size} />,
    },
    {
      key: 'parking',
      label: '장애인 주차',
      renderIcon: ({ size }) => <ParkingCircle size={size} />,
    },
    {
      key: 'help_dog',
      label: '반려견 동반',
      renderIcon: ({ size }) => <Dog size={size} />,
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

  const handleIconClick = (key: string) => {
    setActiveTooltip(activeTooltip === key ? null : key);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 relative">
      {activeIcons.map((item, index) => {
        const content = spot[item.key] as string;
        const isActive = activeTooltip === item.key;

        // Tooltip alignment logic
        // If it's one of the first few items, align leftish. If last, align rightish.
        // Or simplified: center but clamp.
        // Actually, easiest is to ensure the parent has proper overflow handling, but user asked for "pulling inside".
        // Let's adjust the X offset based on column position or simply index.
        const isFirst = index === 0;
        const isLast = index === activeIcons.length - 1;

        let tooltipX = '-50%';
        let tooltipLeft = '50%';
        let originX = 0.5;

        if (isFirst && activeIcons.length > 1) {
          tooltipX = '0%';
          tooltipLeft = '0%';
          originX = 0;
        } else if (isLast && activeIcons.length > 1) {
          tooltipX = '-100%';
          tooltipLeft = '100%';
          originX = 1;
        }

        return (
          <div key={item.key} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card swipe or other clicks
                handleIconClick(item.key as string);
              }}
              className={`
                p-2 rounded-full border transition-all duration-200 flex items-center justify-center
                ${
                  isActive
                    ? 'bg-jeju-light-primary text-white border-jeju-light-primary shadow-md transform scale-110'
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:border-jeju-light-primary hover:text-jeju-light-primary'
                }
              `}
              aria-label={item.label}
            >
              {item.renderIcon({ size: 20 })}
            </button>

            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9, x: tooltipX }}
                  animate={{ opacity: 1, y: 0, scale: 1, x: tooltipX }}
                  exit={{ opacity: 0, y: 10, scale: 0.9, x: tooltipX }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    left: tooltipLeft,
                    transformOrigin: `${originX * 100}% bottom`,
                  }}
                  className="absolute bottom-full mb-2 w-48 z-50 pointer-events-none"
                >
                  <div className="bg-gray-900/95 text-white text-xs p-3 rounded-xl shadow-xl backdrop-blur-md border border-white/10">
                    <div className="font-bold mb-1 text-jeju-light-secondary flex items-center gap-1">
                      {item.renderIcon({
                        size: 14,
                        className: 'text-jeju-light-secondary',
                      })}
                      {item.label}
                    </div>
                    <div className="leading-relaxed text-gray-100">
                      {content}
                    </div>
                    {/* Arrow */}
                    <div
                      className="absolute bottom-0 w-3 h-3 bg-gray-900/95 border-b border-r border-white/10 rotate-45"
                      style={{
                        left: isFirst ? '15px' : isLast ? 'auto' : '50%',
                        right: isLast ? '15px' : 'auto',
                        transform:
                          isFirst || isLast
                            ? 'translateY(50%) rotate(45deg)'
                            : 'translate(-50%, 50%) rotate(45deg)',
                      }}
                    ></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
