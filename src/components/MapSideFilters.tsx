import { BARRIER_CONFIG, CATEGORY_CONFIG } from '@/constants/filterConfig';
import { useFilterStore } from '@/store/filterStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  isVisible: boolean;
}

export default function MapSideFilters({ isVisible }: Props) {
  const {
    categoryOrderedIds,
    selectedCategoryIds,
    toggleCategoryId,
    barrierOrderedIds,
    selectedBarrierIds,
    toggleBarrierId,
  } = useFilterStore();

  const [isFiltersHidden, setFiltersHidden] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect Theme for Ordering
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Sort Barrier IDs based on Mode
  const sortedBarrierIds = [...barrierOrderedIds].sort((a, b) => {
    if (isDarkMode) {
      // Dog Mode: Help Dog first
      if (a === 'help_dog') return -1;
      if (b === 'help_dog') return 1;
    } else {
      // Child Mode: Stroller first
      if (a === 'stroller') return -1;
      if (b === 'stroller') return 1;
    }
    return 0; // Keep original order for others
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Main Filter Container - Conditional Render based on Hidden State */}
          {!isFiltersHidden ? (
            <>
              {/* Left Side - Categories */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="absolute left-0 top-[18%] z-40 flex flex-col gap-0 pointer-events-auto filter drop-shadow-xl"
              >
                {categoryOrderedIds.map((id, index) => {
                  const config = CATEGORY_CONFIG[id];
                  const isActive = selectedCategoryIds.includes(id);

                  return (
                    <motion.button
                      key={id}
                      onClick={() => toggleCategoryId(id)}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        w-14 md:w-16 h-12 flex items-center justify-center
                        first:rounded-tr-xl last:rounded-br-xl
                        border-r-4 border-r-black/5 dark:border-r-white/10
                        transition-colors duration-200
                        ${
                          isActive
                            ? 'bg-orange-500 dark:bg-ormi-green-500 text-white'
                            : 'bg-white/95 dark:bg-slate-800/90 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }
                      `}
                      style={{ marginBottom: '2px' }}
                      aria-label={config.label}
                    >
                      {config.icon}
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Right Side - Accessibility */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="absolute right-0 top-[18%] z-40 flex flex-col items-end pointer-events-auto filter drop-shadow-xl"
              >
                <div className="flex flex-col gap-0 items-end">
                  {sortedBarrierIds.map((id, index) => {
                    const config = BARRIER_CONFIG[id];
                    const isActive = selectedBarrierIds.includes(id);

                    return (
                      <motion.button
                        key={id}
                        onClick={() => toggleBarrierId(id)}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          w-14 md:w-16 h-12 flex items-center justify-center
                          first:rounded-tl-xl
                          border-l-4 border-l-black/5 dark:border-l-white/10
                          transition-colors duration-200
                          ${
                            isActive
                              ? 'bg-orange-500 dark:bg-ormi-green-500 text-white'
                              : 'bg-white/95 dark:bg-slate-800/90 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                          }
                        `}
                        style={{ marginBottom: '2px' }}
                        aria-label={config.label}
                      >
                        {config.icon}
                      </motion.button>
                    );
                  })}

                  {/* Hide Button - Styled like piano keys */}
                  <motion.button
                    onClick={() => setFiltersHidden(true)}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 w-14 md:w-16 h-12 flex flex-col items-center justify-center rounded-l-xl bg-white/95 dark:bg-slate-800/90 border-l-4 border-l-black/5 dark:border-l-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shadow-none"
                    style={{ marginBottom: '2px' }}
                    aria-label="필터 숨김"
                  >
                    <div className="flex flex-col items-center justify-center -space-y-0.5 pointer-events-none">
                      <span className="text-[10px] font-extrabold leading-tight">
                        필터
                      </span>
                      <span className="text-[10px] font-extrabold leading-tight">
                        숨김
                      </span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              {/* Hidden State - Thin Galaxy-style Sidebar Handles */}

              {/* Left Handle */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Just for click/touch feel
                onDragEnd={(e, info) => {
                  if (info.offset.x > 20) setFiltersHidden(false);
                }}
                onClick={() => setFiltersHidden(false)}
                className="absolute left-0 top-[25%] z-50 cursor-pointer pointer-events-auto group pl-1 py-4"
              >
                <div className="w-1.5 h-24 bg-orange-400/80 dark:bg-ormi-green-500/80 rounded-r-full shadow-md group-hover:w-2 transition-all duration-200" />
              </motion.div>

              {/* Right Handle */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -20) setFiltersHidden(false);
                }}
                onClick={() => setFiltersHidden(false)}
                className="absolute right-0 top-[25%] z-50 cursor-pointer pointer-events-auto group pr-1 py-4"
              >
                <div className="w-1.5 h-24 bg-orange-400/80 dark:bg-ormi-green-500/80 rounded-l-full shadow-md group-hover:w-2 transition-all duration-200" />
              </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
