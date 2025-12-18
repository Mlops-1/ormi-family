import type { SpotCategoryType } from '@/types/spot';
import { SpotCategory } from '@/types/spot';
import { Bed, Coffee, Landmark, Utensils } from 'lucide-react';

interface Props {
  selected: SpotCategoryType[];
  onChange: (selected: SpotCategoryType[]) => void;
}

export default function CategoryFilter({ selected, onChange }: Props) {
  const toggle = (cat: SpotCategoryType) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  const isSelected = (cat: SpotCategoryType) => selected.includes(cat);

  const categories = [
    {
      id: SpotCategory.TOURIST_SPOT,
      label: '관광지',
      icon: <Landmark size={16} />,
    },
    { id: SpotCategory.CAFE, label: '카페', icon: <Coffee size={16} /> },
    {
      id: SpotCategory.RESTAURANT,
      label: '맛집',
      icon: <Utensils size={16} />,
    },
    {
      id: SpotCategory.ACCOMMODATION,
      label: '숙박',
      icon: <Bed size={16} />,
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full p-1 shadow-xl border border-white/20 dark:border-slate-600 overflow-x-auto no-scrollbar max-w-full">
      {categories.map((cat) => {
        const active = isSelected(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            className={`
                flex items-center justify-center gap-1.5 px-4 py-2 
                rounded-full transition-all duration-200 border text-sm font-bold whitespace-nowrap
                ${
                  active
                    ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-800 dark:border-gray-100 shadow-sm'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-black/5 dark:hover:bg-white/10'
                }
              `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
