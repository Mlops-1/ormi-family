import { useFilterStore } from '@/store/filterStore';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, X } from 'lucide-react';

// Remove Props
interface Props {
  className?: string; // Add className prop for positioning
}

import { CATEGORY_CONFIG as OPTION_CONFIG } from '@/constants/filterConfig';

export default function CategoryFilter({ className = '' }: Props) {
  const {
    categoryOrderedIds,
    selectedCategoryIds,
    toggleCategoryId,
    isCategoryOpen,
    setCategoryOpen,
  } = useFilterStore();

  return (
    <div className={`relative z-50 ${className}`}>
      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setCategoryOpen(!isCategoryOpen)}
        className={`w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md flex items-center justify-center transition-colors duration-200 pointer-events-auto relative ${'bg-orange-500 hover:bg-orange-600 dark:bg-ormi-green-500 dark:hover:bg-ormi-green-600 text-white'}`}
      >
        {isCategoryOpen ? <X size={18} /> : <LayoutGrid size={18} />}
        {selectedCategoryIds.length > 0 && !isCategoryOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {selectedCategoryIds.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isCategoryOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 flex flex-col gap-1.5 p-2 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[120px] pointer-events-auto z-50"
          >
            {categoryOrderedIds.map((id) => {
              const config = OPTION_CONFIG[id];
              const isActive = selectedCategoryIds.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => toggleCategoryId(id)}
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
