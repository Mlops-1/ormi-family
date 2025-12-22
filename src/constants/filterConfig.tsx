import { type AccessibilityType, SpotCategory } from '@/types/spot';
import {
  Accessibility,
  Baby,
  Bus,
  Dog,
  Milk,
  ParkingCircle,
} from 'lucide-react';

import AccomIcon from '@/assets/icons/accommodation.svg';
import CafeIcon from '@/assets/icons/cafe.svg';
import EventIcon from '@/assets/icons/event.svg';
import FoodIcon from '@/assets/icons/food.svg';
import ShoppingIcon from '@/assets/icons/shopping.svg';
import TourIcon from '@/assets/icons/tour_spot.svg';

import YesKidsIcon from '@/assets/icons/yes_kids.svg';
import YesPetIcon from '@/assets/icons/yes_pet.svg';

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
  string, // Use string key to handle potential mismatches or subsets
  { label: string; icon: React.ReactNode; color: string }
> = {
  [SpotCategory.TOUR_SPOT]: {
    label: '관광지',
    icon: <img src={TourIcon} alt="Tour" className="w-5 h-5" />,
    color: 'bg-green-500',
  },
  [SpotCategory.ACCOMMODATION]: {
    label: '숙박',
    icon: <img src={AccomIcon} alt="Accommodation" className="w-5 h-5" />,
    color: 'bg-blue-600',
  },
  [SpotCategory.FOOD]: {
    label: '식당',
    icon: <img src={FoodIcon} alt="Food" className="w-5 h-5" />,
    color: 'bg-orange-500',
  },
  [SpotCategory.CAFE]: {
    label: '카페',
    icon: <img src={CafeIcon} alt="Cafe" className="w-5 h-5" />,
    color: 'bg-amber-700',
  },
  [SpotCategory.EVENT]: {
    label: '이벤트',
    icon: <img src={EventIcon} alt="Event" className="w-5 h-5" />,
    color: 'bg-pink-500',
  },
  [SpotCategory.SHOPPING]: {
    label: '쇼핑',
    icon: <img src={ShoppingIcon} alt="Shopping" className="w-5 h-5" />,
    color: 'bg-purple-600',
  },
  [SpotCategory.RESTAURANT]: {
    label: '식당',
    icon: <img src={FoodIcon} alt="Food" className="w-5 h-5" />,
    color: 'bg-orange-500',
  },
  // Fallback for TOURIST_SPOT if it exists in user storage
  ['TOURIST_SPOT']: {
    label: '관광지',
    icon: <img src={TourIcon} alt="Tour" className="w-5 h-5" />,
    color: 'bg-green-500',
  },
};

export const BARRIER_CONFIG: Record<
  AccessibilityType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  yes_kids: {
    label: '예스키즈존',
    icon: <img src={YesKidsIcon} alt="Yes Kids" className="w-5 h-5" />,
    color: 'bg-yellow-500',
  },
  yes_pet: {
    label: '예스독존',
    icon: <img src={YesPetIcon} alt="Yes Pet" className="w-5 h-5" />,
    color: 'bg-green-600',
  },
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
