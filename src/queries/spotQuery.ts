import { SpotAPI } from '@/api/spot';
import { useQuery } from '@tanstack/react-query';

const SpotKeys = {
  all: () => ['spots'] as const,
  details: () => [...SpotKeys.all(), 'detail'] as const,
  detail: (id: number) => [...SpotKeys.details(), id] as const,
};

function useGetSpotList() {
  return useQuery({
    queryKey: SpotKeys.all(),
    queryFn: () => SpotAPI.getSpotList().then((response) => response.data),
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
  useGetSpotDetailById,
};
