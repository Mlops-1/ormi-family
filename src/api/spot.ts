import type { SpotCard } from '@/types/spot';
import instance from './instance';

// Define expected response structure if needed.
// For now assuming the endpoint returns the data directly or wrapped.
// Based on instance interceptors, it returns 'response'.
// We usually expect response.data to be the payload.

export const SpotAPI = {
  getSpotList: () => instance.get<SpotCard[]>('/api/v1/spots'),

  getSpotDetailById: (id: number) =>
    instance.get<SpotCard>(`/api/v1/spots/${id}`),
};
