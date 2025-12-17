import useTmapScript from '@/hooks/useTmapScript';
import type {
  TmapPoiResponse,
  TmapReverseGeocodeResponse,
} from '@/types/api/tmap';
import type { Coordinates } from '@/types/geo';
import { Icon } from '@cloudscape-design/components';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  coordinates: Coordinates;
  onLocationChange?: (coords: Coordinates) => void;
  onHelpClick?: () => void;
  onUserClick?: () => void;
  user?: {
    nickname?: string;
    profileImage?: string | null;
  } | null;
}

export default function GeoLocation({
  coordinates,
  onLocationChange,
  onHelpClick,
  onUserClick,
  user,
}: Props) {
  const { isLoaded } = useTmapScript();
  const [address, setAddress] = useState<string>('위치 확인 중...');
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Map related states
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);
  const markerInstance = useRef<Tmapv2.Marker | null>(null);

  // Search related states
  const [searchQuery, setSearchQuery] = useState('');
  const [mapAddress, setMapAddress] = useState(''); // Address shown in map modal

  const APP_KEY = import.meta.env.VITE_TMAP_APP_KEY;

  // Fetch address using TanStack Query
  const { data: addressData } = useQuery({
    queryKey: ['tmapAddress', coordinates.lat, coordinates.lon],
    queryFn: async () => {
      if (!APP_KEY) return 'API Key Missing';
      try {
        const res = await axios.get<TmapReverseGeocodeResponse>(
          `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${coordinates.lat}&lon=${coordinates.lon}&addressType=A02&appKey=${APP_KEY}`
        );
        const info = res.data.addressInfo;
        if (info) {
          const city = (info.city_do || '')
            .replace(/제주특별자치도\s*/g, '')
            .trim();
          const gu = info.gu_gun || '';
          const dong = info.legalDong || info.adminDong || '';

          if (gu && dong) return `${gu} ${dong}`;
          if (city && gu) return `${city} ${gu} ${dong}`;
          return (info.fullAddress || '주소 미상')
            .replace(/제주특별자치도\s*/g, '')
            .trim();
        }
        return '주소 찾기 실패';
      } catch (e) {
        console.error('Tmap Reverse Geocoding Error:', e);
        return '위치 확인 불가';
      }
    },
    enabled: !!APP_KEY,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Update local address state when query data changes
  useEffect(() => {
    if (addressData) setAddress(addressData);
  }, [addressData]);

  const fetchTmapAddress = async (lat: number, lon: number) => {
    if (!APP_KEY) return 'API Key Missing';
    try {
      const res = await axios.get<TmapReverseGeocodeResponse>(
        `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${lat}&lon=${lon}&addressType=A02&appKey=${APP_KEY}`
      );
      const info = res.data.addressInfo;
      if (info) {
        const city = (info.city_do || '')
          .replace(/제주특별자치도\s*/g, '')
          .trim();
        const gu = info.gu_gun || '';
        const dong = info.legalDong || info.adminDong || '';

        if (gu && dong) return `${gu} ${dong}`;
        if (city && gu) return `${city} ${gu} ${dong}`;
        return (info.fullAddress || '주소 미상')
          .replace(/제주특별자치도\s*/g, '')
          .trim();
      }
      return '주소 찾기 실패';
    } catch (e) {
      console.error('Tmap Reverse Geocoding Error:', e);
      return '위치 확인 불가';
    }
  };

  const checkMarkerPosition = async (latLng: Tmapv2.LatLng) => {
    const lat = latLng.lat();
    const lon = latLng.lng();
    console.log('New Coords (Marker):', { lat, lon });
    const addr = await fetchTmapAddress(lat, lon);
    setMapAddress(addr);
  };

  // 2. Map Initialization when Modal opens
  useEffect(() => {
    if (isMapOpen && isLoaded && mapRef.current && !mapInstance.current) {
      if (!window.Tmapv2) return;

      try {
        const latlng = new window.Tmapv2.LatLng(
          coordinates.lat,
          coordinates.lon
        );

        // Generate unique ID for map div if needed, but ref is safer
        // Tmap usually needs an ID string, but some versions accept element.
        // Let's ensure the div has an ID.
        if (!mapRef.current.id) {
          mapRef.current.id = 'tmap_container_' + Date.now();
        }

        const map = new window.Tmapv2.Map(mapRef.current, {
          center: latlng,
          width: '100%',
          height: '100%',
          zoom: 16,
          zoomControl: true,
          scrollwheel: true,
        });
        mapInstance.current = map;

        const marker = new window.Tmapv2.Marker({
          position: latlng,
          map: map,
          draggable: true,
        });
        markerInstance.current = marker;

        // Initial address in modal
        // Use the cached query data if available and matches, otherwise fetch
        if (
          coordinates.lat === latlng.lat() &&
          coordinates.lon === latlng.lng() &&
          addressData
        ) {
          setMapAddress(addressData);
        } else {
          fetchTmapAddress(coordinates.lat, coordinates.lon).then(
            setMapAddress
          );
        }

        // Events
        map.addListener('click', (evt: any) => {
          // evt.latLng is Tmapv2.LatLng
          const newPos = evt.latLng;
          marker.setPosition(newPos);
          checkMarkerPosition(newPos);
        });

        marker.addListener('dragend', () => {
          const newPos = marker.getPosition();
          checkMarkerPosition(newPos);
        });
      } catch (e) {
        console.error('Tmap Init Error:', e);
      }
    } else if (!isMapOpen && mapInstance.current) {
      // Cleanup
      try {
        // mapInstance.current.destroy(); // Tmap destroy method
      } catch (e) {
        /* ignore */
      }
      mapInstance.current = null;
      markerInstance.current = null;
    }
  }, [isMapOpen, isLoaded]); // Re-init if opened

  const handleSearch = async () => {
    if (!searchQuery.trim() || !APP_KEY) return;

    try {
      const res = await axios.get<TmapPoiResponse>(
        `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(searchQuery)}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&count=1&appKey=${APP_KEY}`
      );

      const pois = res.data.searchPoiInfo?.pois?.poi;
      if (pois && pois.length > 0) {
        const poi = pois[0];
        const lat = parseFloat(poi.noorLat);
        const lon = parseFloat(poi.noorLon);

        if (window.Tmapv2 && mapInstance.current && markerInstance.current) {
          const newPos = new window.Tmapv2.LatLng(lat, lon);
          mapInstance.current.setCenter(newPos);
          markerInstance.current.setPosition(newPos);
          checkMarkerPosition(newPos);
        }
      } else {
        alert('검색 결과가 없습니다.');
      }
    } catch (e) {
      console.error('Search Error:', e);
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmLocation = () => {
    if (markerInstance.current && onLocationChange) {
      const pos = markerInstance.current.getPosition();
      onLocationChange({ lat: pos.lat(), lon: pos.lng() });
    }
    setIsMapOpen(false);
  };

  return (
    <>
      <div className="w-full flex justify-between items-center px-4 py-2">
        {/* Location Button */}
        <button
          onClick={() => setIsMapOpen(true)}
          className="flex items-center gap-2 bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-full shadow-sm border border-ormi-green-200 dark:border-slate-600 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="text-ormi-ember-500 dark:text-ormi-ember-400">
            <MapPin size={18} />
          </span>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base">
            {address}
          </span>
          <span className="text-gray-400">
            <Icon name="angle-down" />
          </span>
        </button>

        {/* Right Buttons */}
        <div className="flex gap-2 items-center">
          {user?.nickname && (
            <span className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-slate-700/80 px-3 py-2 rounded-full shadow-sm">
              {user.nickname}님
            </span>
          )}
          <button
            onClick={onUserClick}
            className="p-2 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm hover:bg-ormi-pink-50 dark:hover:bg-slate-600 border border-transparent hover:border-ormi-pink-200 transition-colors cursor-pointer text-gray-700 dark:text-gray-200"
          >
            <Icon name="user-profile" />
          </button>
          <button
            onClick={onHelpClick}
            className="p-2 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm hover:bg-ormi-pink-50 dark:hover:bg-slate-600 border border-transparent hover:border-ormi-pink-200 transition-colors cursor-pointer text-gray-700 dark:text-gray-200"
          >
            <Icon name="status-info" />
          </button>
        </div>
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">위치 설정</h3>
              <button
                onClick={() => setIsMapOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="닫기"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="장소 검색 (예: 서울시청)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ormi-green-400"
              />
              <button
                onClick={handleSearch}
                className="bg-ormi-green-500 text-white px-4 py-2 rounded-lg hover:bg-ormi-green-600 transition-colors flex items-center gap-1"
              >
                <Search size={18} />
              </button>
            </div>

            <div className="relative w-full h-80 md:h-96 bg-gray-100">
              {!isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  지도 로딩 중...
                  {!APP_KEY && (
                    <span className="text-xs text-red-500 block">
                      API Key 누락
                    </span>
                  )}
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-full" />
              )}
            </div>

            <div className="p-4 bg-gray-50 flex flex-col gap-3">
              <div className="text-center text-gray-700 font-medium">
                {mapAddress || '지도를 움직여 위치를 선택하세요'}
              </div>
              <button
                onClick={handleConfirmLocation}
                className="w-full bg-ormi-ember-500 text-white py-3 rounded-xl font-bold hover:bg-ormi-ember-600 transition-colors shadow-md"
              >
                이 위치로 설정
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
