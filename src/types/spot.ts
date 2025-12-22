export const SpotCategory = {
  TOUR_SPOT: 'TOUR_SPOT',
  ACCOMMODATION: 'ACCOMMODATION',
  RESTAURANT: 'RESTAURANT',
  CAFE: 'CAFE',
  FOOD: 'FOOD',
  EVENT: 'EVENT',
  SHOPPING: 'SHOPPING',
} as const;

export type SpotCategoryType = (typeof SpotCategory)[keyof typeof SpotCategory];

export type AccessibilityType =
  | 'yes_kids'
  | 'yes_pet'
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
  category?: string[] | null;
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
  yes_kids: number;
  yes_pet: number;
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

export interface FavoriteSpot extends SpotCard {
  favorite_created_at: string; // ISO string
  tag?: string; // JSON string array of tags
}

export interface Review {
  review_id: number;
  content_id: number;
  user_id: number;
  created_at: string;
  detail: string;
}
