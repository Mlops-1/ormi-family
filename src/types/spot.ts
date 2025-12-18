export const SpotCategory = {
  TOURIST_SPOT: '관광지',
  ACCOMMODATION: '숙박',
  RESTAURANT: '식당',
  CAFE: '카페',
} as const;

export type SpotCategoryType = (typeof SpotCategory)[keyof typeof SpotCategory];

export type AccessibilityType =
  | 'wheelchair'
  | 'stroller'
  | 'lactation_room'
  | 'baby_spare_chair'
  | 'help_dog'
  | 'route'
  | 'elevator'
  | 'parking';

export interface SpotRequest {
  user_id: number;
  mapy: number; // lat
  mapx: number; // lon
  filter_type?: SpotCategoryType[] | null;
}

export interface SpotCard {
  content_id: number;
  title: string;
  addr_1: string;
  addr_2: string;
  area_code: number;
  category_1: string;
  category_2: string;
  category_3: string;
  content_type_id: number;
  created_at: string; // ISO string
  first_image: string;
  second_image: string;
  lat: number;
  lon: number;
  map_level: number | null;
  updated_at: string;
  show_flag: number;
  sigungu_code: number;
  tel: string;
  zip_code: string;
  score: number;
  distance: number;
  filter_type: string;
  baby_spare_chair: string;
  stroller: string;
  wheelchair: string;
  lactation_room: string;
  help_dog: string;
  route: string;
  elevator: string;
  parking: string;
  reviews: Review[];
}

export interface Review {
  review_id: number;
  content_id: number;
  user_id: number;
  created_at: string;
  detail: string;
}
