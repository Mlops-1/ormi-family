import { SpotAPI } from '@/api/spot';
import type { SpotRequest } from '@/types/spot';
import { useQuery } from '@tanstack/react-query';

const SpotKeys = {
  all: () => ['spots'] as const,
  recommend: (filters: SpotRequest) =>
    [...SpotKeys.all(), 'recommend', filters] as const,
  details: () => [...SpotKeys.all(), 'detail'] as const,
  detail: (id: number) => [...SpotKeys.details(), id] as const,
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
};
