// === 요청 타입 ===
export interface RecommendRequest {
  // 필수 공통
  mode: PromptType;
  user_mode: 'baby' | 'pet' | 'general';
  start_lat: number;
  start_lon: number;
  start_datetime: string; // ISO 8601, 예: "2025-12-22T08:30:00"

  // 선택 공통
  start_name?: string;

  // 시나리오별 필수/선택
  end_spot_id?: string; // destination_only (DB 스팟일 경우)
  end_lat?: number; // destination_only (임의 장소일 경우)
  end_lon?: number; // destination_only (임의 장소일 경우)
  end_name?: string; // destination_only (임의 장소일 경우)
  user_id?: string; // favorites_* 에서 필수
  spot_ids?: string[]; // favorites_route에서 필수
}

// 프롬프트 타입 (시나리오)
export type PromptType =
  | 'destination_only' // 도착지까지 경로 추천
  | 'favorites_route' // 찜 목록 경로 최적화
  | 'favorites_recommend' // 찜 기반 유사 추천
  | 'start_end' // 출발-도착 사이 추천
  | 'location_time'; // 주변 AI 추천

// === 응답 타입 ===
export interface RecommendResponse {
  success: boolean;
  error?: string;
  missing_fields?: string[];

  mode?: PromptType;
  user_mode?: string;
  start_location?: string;
  end_location?: string;
  start_hour?: string;
  description?: string;
  preferences?: string[];
  spots_count?: number;
  route_info?: RouteInfo;
  spots?: Spot[];
  skipped_spots?: SkippedSpot[];
  log?: string[];
}

export interface RouteInfo {
  total_duration_minutes: number;
  total_distance_km: number;
  segments: Segment[];
}

export interface Segment {
  from_name: string;
  to_name: string;
  from_content_id: string | null;
  to_content_id: string;
  duration: number;
  distance: number;
}

export interface Spot {
  content_id: string;
  title: string;
  addr1: string; // 주소
  addr2?: string; // 상세주소 (선택)
  first_image: string; // 대표 이미지 URL
  cat1: 'RESTAURANT' | 'FESTIVAL' | 'ACCOMMODATION' | 'TOUR_SPOT'; // 대분류
  cat2: string; // 소분류 (예: 전통시장, 숙소, 관광지)
  lat: number | null;
  lon: number | null;

  // 배리어프리
  yes_kids: boolean;
  stroller: boolean;
  wheelchair: boolean;
  lactation_room: boolean;
  parking: boolean;
  restroom: boolean;
  help_dog: boolean;

  // 태그
  tags: string[];

  // AI 생성 (추천 결과에서만)
  short_summary?: string; // AI 생성 요약
  estimated_stay_minutes?: number;
  travel_from_prev?: {
    duration_minutes: number;
    distance_km: number;
  };
  schedule?: {
    arrival_time: string;
    departure_time: string;
    stay_minutes: number;
  };
  raw_reviews?: string[];
}

export interface SkippedSpot {
  title: string;
  reason: string;
}

// === SSE 스트리밍 이벤트 타입 ===
export interface StreamLogEvent {
  type: 'log';
  msg: string;
}

export interface StreamDoneEvent {
  type: 'done';
  result: RecommendResponse;
}

export type StreamEvent = StreamLogEvent | StreamDoneEvent;

// === 시나리오 설명 ===
export const SCENARIO_DESCRIPTIONS: Record<PromptType, string> = {
  destination_only: '도착지까지 경로 추천',
  favorites_route: '찜 목록 최적 경로',
  favorites_recommend: '찜 기반 유사 추천',
  start_end: '출발↔도착 사이',
  location_time: '주변 AI 추천',
};
