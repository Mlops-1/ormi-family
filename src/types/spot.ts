export const SpotCategory = {
  TOUR_SPOT: 'TOUR_SPOT',
  ACCOMMODATION: 'ACCOMMODATION',
  RESTAURANT: 'RESTAURANT',
  CAFE: 'CAFE',
  FOOD: 'FOOD',
  EVENT: 'EVENT',
  SHOPPING: 'SHOPPING',
  TRANSPORT: 'TRANSPORT',
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
  cat1: string;
  cat2: string;
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
  baby_spare_chair: number;
  stroller: number;
  wheelchair: number;
  lactation_room: number;
  help_dog: number;
  route: number;
  elevator: number;
  parking: number;
  reviews: Review[];
  festivalcontents?: string; // JSON string containing {st_dt, ed_dt, pricetype}
  sbst?: string; // Festival description
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
