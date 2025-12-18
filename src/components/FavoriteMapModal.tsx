import { FavoritesAPI } from '@/api/favorites';
import fallbackImage from '@/assets/images/fallback_spot.jpg';
import { TEMP_USER_ID } from '@/constants/temp_user';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function FavoriteMapModal({ onClose }: { onClose: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites', TEMP_USER_ID],
    queryFn: async () => {
      const response = await FavoritesAPI.getFavorites({
        user_id: TEMP_USER_ID,
      });
      return response.data;
    },
  });

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement || !window.Tmapv2 || !favorites || favorites.length === 0)
      return;

    // Initialize Map
    if (!mapInstance.current) {
      // Calculate center from favorites or default to Jeju
      const centerLat =
        favorites.reduce((sum, spot) => sum + spot.lat, 0) / favorites.length;
      const centerLon =
        favorites.reduce((sum, spot) => sum + spot.lon, 0) / favorites.length;

      mapInstance.current = new window.Tmapv2.Map(mapElement, {
        center: new window.Tmapv2.LatLng(centerLat, centerLon),
        width: '100%',
        height: '100%',
        zoom: 10,
      });
    }

    const map = mapInstance.current;
    if (!map) return;

    // Add Markers
    favorites.forEach((spot) => {
      const imgUrl = spot.second_image || spot.first_image || fallbackImage;

      // Custom HTML Marker content
      const content = `
                <div style="
                    position: relative;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 3px solid #FF6B00;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                ">
                    <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${fallbackImage}'" />
                </div>
            `;

      new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(spot.lat, spot.lon),
        map: map,
        iconHTML: content,
        offset: new window.Tmapv2.Point(25, 25), // Center the marker
        title: spot.title,
      });
    });

    // Fit bounds
    if (favorites.length > 0) {
      const bounds = new window.Tmapv2.LatLngBounds();
      favorites.forEach((spot) => {
        bounds.extend(new window.Tmapv2.LatLng(spot.lat, spot.lon));
      });
      map.fitBounds(bounds);
    }

    return () => {
      if (mapInstance.current && mapInstance.current.destroy) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      if (mapElement) {
        mapElement.innerHTML = '';
      }
    };
  }, [favorites]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 text-gray-800 dark:text-white p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-lg transition-transform hover:scale-110"
        >
          <X size={24} />
        </button>

        <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            나의 찜 지도
          </h2>
        </div>

        <div className="flex-1 relative bg-gray-100 dark:bg-slate-900">
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
