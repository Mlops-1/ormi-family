import useTmapScript from '@/hooks/useTmapScript';
import { useUserStore } from '@/store/userStore';
import type {
  TmapPoiResponse,
  TmapReverseGeocodeResponse,
} from '@/types/api/tmap';
import type { Coordinates } from '@/types/geo';
import { createPinMarker } from '@/utils/marker';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  coordinates: Coordinates;
  onLocationChange?: (coords: Coordinates, address?: string) => void;
  onHelpClick?: () => void;
  onUserClick?: () => void;
  user?: {
    nickname?: string;
    profileImage?: string | null;
  } | null;
  compact?: boolean;
  hideUserIcon?: boolean; // New prop
}

interface PoiSuggestion {
  name: string;
  lat: number;
  lon: number;
  address: string;
}

export default function GeoLocation({
  coordinates,
  onLocationChange,
  onUserClick,
  user,
  compact = false,
  hideUserIcon = false, // New prop default value
}: Props) {
  const { isLoaded } = useTmapScript();
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  // Theme colors
  const mainColorClass = isPetMode ? 'bg-ormi-green-500' : 'bg-orange-500';
  const mainHoverColorClass = isPetMode
    ? 'hover:bg-ormi-green-600'
    : 'hover:bg-orange-600';
  const mainTextColorClass = isPetMode
    ? 'text-ormi-green-500'
    : 'text-orange-500';
  const ringColorClass = isPetMode
    ? 'focus:ring-ormi-green-400'
    : 'focus:ring-orange-400';
  const mainHexColor = isPetMode ? '#10B981' : '#FFA500';

  // Helper to format address
  const formatAddress = (info: any) => {
    const city = (info.city_do || '').replace(/제주특별자치도\s*/g, '').trim();
    const gu = info.gu_gun || '';
    const dong = info.legalDong || info.adminDong || '';
    const bunji = info.bunji || '';
    const ri = info.ri || '';

    const parts = [];
    if (city) parts.push(city);
    if (gu) parts.push(gu);
    if (dong) parts.push(dong);
    if (ri) parts.push(ri);
    if (bunji) parts.push(bunji);

    return parts.join(' ');
  };

  // Map related states
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);
  const markerInstance = useRef<Tmapv2.Marker | null>(null);

  // Search related states
  const [searchQuery, setSearchQuery] = useState('');
  const [mapAddress, setMapAddress] = useState('');
  const [suggestions, setSuggestions] = useState<PoiSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
          return formatAddress(info);
        }
        return '주소 찾기 실패';
      } catch (e) {
        console.error('Tmap Reverse Geocoding Error:', e);
        return '위치 확인 불가';
      }
    },
    enabled: !!APP_KEY,
    staleTime: 1000 * 60 * 5,
  });

  const fetchTmapAddress = useCallback(
    async (lat: number, lon: number) => {
      if (!APP_KEY) return 'API Key Missing';
      try {
        const res = await axios.get<TmapReverseGeocodeResponse>(
          `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${lat}&lon=${lon}&addressType=A02&appKey=${APP_KEY}`
        );
        const info = res.data.addressInfo;
        if (info) {
          return formatAddress(info);
        }
        return '주소 찾기 실패';
      } catch (e) {
        console.error('Tmap Reverse Geocoding Error:', e);
        return '위치 확인 불가';
      }
    },
    [APP_KEY]
  );

  const checkMarkerPosition = useCallback(
    async (latLng: Tmapv2.LatLng) => {
      const lat = latLng.lat();
      const lon = latLng.lng();
      const addr = await fetchTmapAddress(lat, lon);
      setMapAddress(addr);
    },
    [fetchTmapAddress]
  );

  // Map Initialization
  useEffect(() => {
    if (isMapOpen && isLoaded && mapRef.current && !mapInstance.current) {
      if (!window.Tmapv2) return;

      try {
        const latlng = new window.Tmapv2.LatLng(
          coordinates.lat,
          coordinates.lon
        );

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

        // Use Orange Marker
        const marker = new window.Tmapv2.Marker({
          position: latlng,
          map: map,
          draggable: true,
          iconHTML: createPinMarker(mainHexColor, true), // Using active pin marker with theme color
        });
        markerInstance.current = marker;

        // Initialize marker position logic moved to handleOpenMap to avoid side effects
        // But if coordinates change while open, we might need to update?
        // For now, assuming map opens at coordinates.
        // We still need to fetch if addressData is missing but that's handled by queries usually.

        // Just ensure marker is at center (already done strictly above via latlng)

        map.addListener('click', (evt: { latLng: Tmapv2.LatLng }) => {
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
      mapInstance.current = null;
      markerInstance.current = null;
    }
  }, [
    isMapOpen,
    isLoaded,
    coordinates.lat,
    coordinates.lon,
    addressData,
    fetchTmapAddress,
    checkMarkerPosition,
    mainHexColor,
  ]);

  // Autocomplete Search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length > 1) {
      debounceRef.current = setTimeout(async () => {
        if (!APP_KEY) return;
        try {
          const res = await axios.get<TmapPoiResponse>(
            `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(value)}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&count=5&appKey=${APP_KEY}`
          );
          const pois = res.data.searchPoiInfo?.pois?.poi || [];
          const newSuggestions = pois.map((poi) => ({
            name: poi.name,
            lat: parseFloat(poi.noorLat),
            lon: parseFloat(poi.noorLon),
            address:
              poi.newAddressList?.newAddress?.[0]?.fullAddressRoad ||
              poi.upperAddrName +
                ' ' +
                poi.middleAddrName +
                ' ' +
                poi.lowerAddrName,
          }));
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Autocomplete Error:', error);
        }
      }, 300); // 300ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: PoiSuggestion) => {
    if (window.Tmapv2 && mapInstance.current && markerInstance.current) {
      const newPos = new window.Tmapv2.LatLng(suggestion.lat, suggestion.lon);
      mapInstance.current.setCenter(newPos);
      markerInstance.current.setPosition(newPos);
      checkMarkerPosition(newPos);
    }
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !APP_KEY) return;
    // ... existing search logic if needed as fallback, but suggestions are primary
    // Re-use autocomplete logic effectively or just pick top 1
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    } else {
      // Perform a fresh search if suggestions were closed or empty
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
        console.error(e);
      }
    }
  };

  const handleOpenMap = () => {
    setIsMapOpen(true);
    if (addressData) {
      setMapAddress(addressData);
    } else {
      fetchTmapAddress(coordinates.lat, coordinates.lon).then(setMapAddress);
    }
  };

  const handleConfirmLocation = () => {
    if (markerInstance.current && onLocationChange) {
      const pos = markerInstance.current.getPosition();
      onLocationChange({ lat: pos.lat(), lon: pos.lng() }, mapAddress);
    }
    setIsMapOpen(false);
  };

  return (
    <>
      <div
        className={`flex items-center gap-2 max-w-full relative z-10 ${
          compact
            ? 'px-2 py-1'
            : 'bg-white/80 dark:bg-slate-700/80 px-4 py-2 shadow-sm border border-ormi-green-200 dark:border-slate-600 rounded-full'
        }`}
      >
        {/* Address Area (Clickable) */}
        {/* Address Area (Clickable) */}
        <div
          className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden cursor-pointer active:opacity-70 transition-opacity justify-start px-2"
          onClick={handleOpenMap}
        >
          <MapPin
            size={compact ? 16 : 20}
            className={`${mainTextColorClass} shrink-0`}
          />
          <div className="flex flex-col items-start min-w-0 w-full">
            <span className="text-base md:text-lg text-gray-800 dark:text-gray-100 leading-tight text-left w-full">
              {addressData ? (
                <>
                  <span className="md:hidden truncate block w-full">
                    {/* Mobile: Try to show Dong only. 
                        formatAddress returns "Jeju-si Gu Dong Bunji"
                        Split by space.
                    */}
                    {(() => {
                      const parts = addressData.split(' ');
                      // Find the part ending with '동' or '읍' or '면'
                      const dongPart = parts.find(
                        (p) =>
                          p.endsWith('동') ||
                          p.endsWith('읍') ||
                          p.endsWith('면')
                      );
                      return dongPart || parts[parts.length - 1]; // Fallback to last part
                    })()}
                  </span>
                  <span className="hidden md:inline truncate block w-full">
                    {/* Tablet/Desktop: Full Address */}
                    {addressData}
                  </span>
                </>
              ) : (
                '위치 확인 중...'
              )}
            </span>
          </div>
        </div>

        {/* User Icon (Optional) */}
        {!hideUserIcon && user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUserClick?.();
            }}
            className="shrink-0 ml-1"
          >
            <div
              className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: user.profileImage
                  ? `url(${user.profileImage})`
                  : 'none',
              }}
            >
              {!user.profileImage && (
                <span className="text-orange-500 font-bold text-xs">
                  {user.nickname?.[0] || 'U'}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Map Modal - Portalled to body to avoid clipping */}
      {isMapOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-slate-700">
              <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  위치 설정
                </h3>
                <button
                  onClick={() => setIsMapOpen(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                  aria-label="닫기"
                >
                  <X size={24} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search Bar with Autocomplete */}
              <div className="relative z-50">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex gap-2 bg-white dark:bg-slate-800">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="장소 검색 (예: 제주국제공항)"
                    className={`flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 ${ringColorClass} bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400`}
                  />
                  <button
                    onClick={handleSearch}
                    className={`${mainColorClass} ${mainHoverColorClass} text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shrink-0`}
                  >
                    <Search size={18} />
                  </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border-b border-l border-r border-gray-100 dark:border-slate-700 shadow-lg max-h-60 overflow-y-auto z-50">
                    {suggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-none"
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.address}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hint for search */}
              <div className="px-4 py-1 bg-gray-50 dark:bg-slate-900 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <MapPin size={12} className="inline" />
                마커를 끌어 출발위치를 지정해주세요.
              </div>

              <div className="relative w-full h-80 md:h-96 bg-gray-100 dark:bg-slate-900">
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

              <div className="p-4 bg-gray-50 dark:bg-slate-900 flex flex-col gap-3 border-t border-gray-100 dark:border-slate-700">
                <div className="text-center text-gray-700 dark:text-gray-300 font-medium break-keep">
                  {mapAddress || '지도를 움직여 위치를 선택하세요'}
                </div>
                <button
                  onClick={handleConfirmLocation}
                  className={`w-full ${mainColorClass} text-white py-3 rounded-xl font-bold ${mainHoverColorClass} transition-colors shadow-md`}
                >
                  이 위치로 설정
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
