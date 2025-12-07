import { SpotCategory } from '@/types/spot';
import { Check, Coffee, Landmark, Utensils } from 'lucide-react';

interface Props {
  selected: SpotCategory[];
  onChange: (selected: SpotCategory[]) => void;
}

export default function CategoryFilter({ selected, onChange }: Props) {
  const toggle = (cat: SpotCategory) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  const isSelected = (cat: SpotCategory) => selected.includes(cat);

  const categories = [
    {
      id: SpotCategory.LANDMARK,
      label: '관광지',
      icon: <Landmark size={18} />,
    },
    { id: SpotCategory.CAFE, label: '카페', icon: <Coffee size={18} /> },
    { id: SpotCategory.DINNER, label: '맛집', icon: <Utensils size={18} /> },
  ];

  return (
    <div className="w-full px-4 mb-4">
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat) => {
          const active = isSelected(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`
                relative flex flex-col md:flex-row items-center justify-center gap-1.5 py-2 px-2 
                rounded-xl transition-all duration-200 border
                ${
                  active
                    ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-800 dark:border-gray-100'
                    : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                }
              `}
            >
              <span
                className={`${active ? 'text-ormi-pink-300 dark:text-ormi-pink-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {cat.icon}
              </span>
              <span className="font-bold text-sm md:text-base">
                {cat.label}
              </span>

              {/* Active Indicator Badge (Optional aesthetic detail) */}
              {active && (
                <div className="absolute top-2 right-2 hidden md:block">
                  <Check
                    size={14}
                    className="text-white dark:text-gray-900"
                    strokeWidth={3}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
