import type { SpotCard } from '@/types/spot';
import instance from './instance';

export interface AddFavoriteRequest {
  user_id: number;
  content_id: number;
}

export interface GetFavoritesRequest {
  user_id: number;
  lat?: number;
  lon?: number;
}

export const FavoritesAPI = {
  /**
   * Add a spot to favorites
   */
  addFavorite: (data: AddFavoriteRequest) => instance.post('/favorites', data),

  /**
   * Remove a spot from favorites
   */
  removeFavorite: (contentId: number, userId: number | null) =>
    instance.delete(`/favorites/${contentId}`, {
      params: { user_id: userId },
    }),

  /**
   * Get list of favorites
   */
  getFavorites: (params: GetFavoritesRequest) =>
    instance.get<SpotCard[]>('/favorites', {
      params,
    }),
};
