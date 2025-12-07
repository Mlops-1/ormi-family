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
      icon: <Landmark size={14} />,
    },
    { id: SpotCategory.CAFE, label: '카페', icon: <Coffee size={14} /> },
    { id: SpotCategory.DINNER, label: '맛집', icon: <Utensils size={14} /> },
  ];

  return (
    <div className="flex gap-2 mb-4 w-full px-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {categories.map((cat) => {
        const active = isSelected(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-300 border whitespace-nowrap shrink-0
              ${
                active
                  ? 'bg-gray-800 text-white border-gray-800 shadow-md scale-105 ring-2 ring-gray-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            {cat.icon}
            <span>{cat.label}</span>
            {active && <Check size={12} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
