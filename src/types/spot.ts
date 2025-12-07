export const SpotCategory = {
  CAFE: 'CAFE',
  DINNER: 'DINNER',
  LANDMARK: 'LANDMARK',
} as const;

export type SpotCategory = (typeof SpotCategory)[keyof typeof SpotCategory];

export interface SpotCard {
  contentid: number;
  title: string;
  img_url: string;
  description: string;
  category: SpotCategory;
  createdtime: string;
  mapy: number; // lat
  mapx: number; // lon
  addr1: string;
  addr2: string;
  areacode: number;
  cat1: string;
  cat2: string;
  cat3: string;
  firstimage: string;
  firstimage2: string;
  cpyrhtDivCd: string;
  mlevel: number;
  modifiedtime: string;
  sigungucode: number;
  tel: string;
  zipcode: number;
  parking?: string;
}
