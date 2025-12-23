import type { SpotCard, SpotRequest } from '@/types/spot';
import instance from './instance';

// In production, use direct Lambda URL; in development, always use Vite proxy
const getRecommendUrl = () => {
  // Only use Lambda URL if we're definitely in production
  if (import.meta.env.PROD) {
    const lambdaUrl = import.meta.env.VITE_RECOMMEND_API_URL;
    if (lambdaUrl) {
      return `${lambdaUrl}/prod/recommend`;
    }
  }
  // In development, always use Vite proxy
  return '/prod/recommend';
};

export const SpotAPI = {
  getRecommendedSpots: (data: SpotRequest) =>
    instance.post<SpotCard[]>(getRecommendUrl(), data),

  getSpotList: () => instance.get<SpotCard[]>('/spot'), // Placeholder endpoint

  getSpotDetailById: (id: number) => instance.get<SpotCard>(`/spot/${id}`), // Placeholder endpoint
};
