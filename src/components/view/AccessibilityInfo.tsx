import iconBabyChair from '@/assets/images/icon_baby_chair.svg';
import iconLactation from '@/assets/images/icon_lactation.svg';
import iconStroller from '@/assets/images/icon_stroller.svg';
import { useUserStore } from '@/store/userStore';
import type { SpotCard } from '@/types/spot';
import {
  Accessibility,
  ChevronsUp,
  Dog,
  Footprints,
  ParkingCircle,
} from 'lucide-react';

interface Props {
  spot: SpotCard;
}

interface IconItem {
  key: keyof SpotCard;
  label: string;
  renderIcon: (props: { size?: number; className?: string }) => React.ReactNode;
}

export default function AccessibilityInfo({ spot }: Props) {
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  const mainSubColorClass = isPetMode ? 'bg-ormi-green-50' : 'bg-orange-50';
  const mainTextColorClass = isPetMode
    ? 'text-ormi-green-500'
    : 'text-orange-500';

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
  const activeIcons = icons.filter((item) => spot[item.key] === 1);

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
            className="flex flex-col items-center gap-2 group relative"
          >
            <div
              className={`
              w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-300
              ${mainSubColorClass} ${mainTextColorClass}
            `}
            >
              {item.renderIcon({ size: 28 })}
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
