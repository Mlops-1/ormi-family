import { SpotAPI } from '@/api/spot';
import type { SpotRequest } from '@/types/spot';
import { useQuery } from '@tanstack/react-query';

const SpotKeys = {
  all: () => ['spots'] as const,
  recommend: (filters: SpotRequest) =>
    [...SpotKeys.all(), 'recommend', filters] as const,
  details: () => [...SpotKeys.all(), 'detail'] as const,
  detail: (id: number) => [...SpotKeys.details(), id] as const,
  transport: (params?: { userId?: number; lat?: number; lon?: number }) =>
    [...SpotKeys.all(), 'transport', params] as const,
};

function useGetSpotList() {
  return useQuery({
    queryKey: SpotKeys.all(),
    queryFn: () => SpotAPI.getSpotList().then((response) => response.data),
  });
}

function useGetRecommendedSpots(params: SpotRequest) {
  return useQuery({
    queryKey: SpotKeys.recommend(params),
    queryFn: () => SpotAPI.getRecommendedSpots(params).then((r) => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!params.mapx && !!params.mapy,
  });
}

function useGetTransportSpots(userId: number, lat: number, lon: number) {
  return useQuery({
    queryKey: SpotKeys.transport({ userId, lat, lon }),
    queryFn: () =>
      SpotAPI.getRecommendedSpots({
        user_id: userId,
        mapx: lon,
        mapy: lat,
        category: ['TRANSPORT'],
      }).then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!lat && !!lon,
  });
}

function useGetSpotDetailById(id: number) {
  return useQuery({
    queryKey: SpotKeys.detail(id),
    queryFn: () =>
      SpotAPI.getSpotDetailById(id).then((response) => response.data),
    enabled: !!id,
  });
}

export const SPOT_QUERY = {
  useGetSpotList,
  useGetRecommendedSpots,
  useGetSpotDetailById,
  useGetTransportSpots,
};
