import type { SpotCard, SpotRequest } from '@/types/spot';
import instance from './instance';

// Define expected response structure if needed.
// For now assuming the endpoint returns the data directly or wrapped.
// Based on instance interceptors, it returns 'response'.
// We usually expect response.data to be the payload.

export const SpotAPI = {
  getRecommendedSpots: (data: SpotRequest) =>
    instance.post<SpotCard[]>('/prod/recommend', data),

  getSpotList: () => instance.get<SpotCard[]>('/prod/spots'), // Placeholder endpoint

  getSpotDetailById: (id: number) =>
    instance.get<SpotCard>(`/prod/spots/${id}`), // Placeholder endpoint
};
