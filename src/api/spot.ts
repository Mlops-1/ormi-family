import type { SpotCard, SpotRequest } from '@/types/spot';
import instance from './instance';

// In production, use direct Lambda URL; in development, use Vite proxy
const getRecommendUrl = () => {
  const lambdaUrl = import.meta.env.VITE_RECOMMEND_API_URL;
  // If Lambda URL is set and we're in production, use it directly
  if (lambdaUrl && import.meta.env.PROD) {
    return `${lambdaUrl}/prod/recommend`;
  }
  // In development, use Vite proxy
  return '/prod/recommend';
};

export const SpotAPI = {
  getRecommendedSpots: (data: SpotRequest) =>
    instance.post<SpotCard[]>(getRecommendUrl(), data),

  getSpotList: () => instance.get<SpotCard[]>('/spot'), // Placeholder endpoint

  getSpotDetailById: (id: number) => instance.get<SpotCard>(`/spot/${id}`), // Placeholder endpoint
};
