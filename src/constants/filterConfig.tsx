import {
  type AccessibilityType,
  SpotCategory,
  type SpotCategoryType,
} from '@/types/spot';
import {
  Accessibility,
  Baby,
  Bed,
  Bus,
  Coffee,
  Dog,
  Landmark,
  Milk,
  ParkingCircle,
  Utensils,
} from 'lucide-react';

// Custom Icons
const HighChairIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
    <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
    <path d="M5 11h14" />
  </svg>
);

const ElevatorIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="m8 10 4-4 4 4" />
    <path d="m8 14 4 4 4-4" />
  </svg>
);

export const CATEGORY_CONFIG: Record<
  SpotCategoryType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  [SpotCategory.TOURIST_SPOT]: {
    label: '관광지',
    icon: <Landmark size={20} />,
    color: 'bg-green-500',
  },
  [SpotCategory.CAFE]: {
    label: '카페',
    icon: <Coffee size={20} />,
    color: 'bg-amber-700',
  },
  [SpotCategory.RESTAURANT]: {
    label: '맛집',
    icon: <Utensils size={20} />,
    color: 'bg-orange-500',
  },
  [SpotCategory.ACCOMMODATION]: {
    label: '숙박',
    icon: <Bed size={20} />,
    color: 'bg-blue-600',
  },
};

export const BARRIER_CONFIG: Record<
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
    icon: <Milk size={20} />,
    color: 'bg-yellow-500',
  },
  baby_spare_chair: {
    label: '유아의자',
    icon: <HighChairIcon size={20} />,
    color: 'bg-green-500',
  },
  help_dog: {
    label: '애견동반',
    icon: <Dog size={20} />,
    color: 'bg-orange-500',
  },
  route: {
    label: '대중교통',
    icon: <Bus size={20} />,
    color: 'bg-purple-500',
  },
  elevator: {
    label: '엘리베이터',
    icon: <ElevatorIcon size={20} />,
    color: 'bg-indigo-500',
  },
  parking: {
    label: '주차장',
    icon: <ParkingCircle size={20} />,
    color: 'bg-slate-500',
  },
};
