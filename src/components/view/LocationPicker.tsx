import useTmapScript from '@/hooks/useTmapScript';
import { useUserStore } from '@/store/userStore';
import type {
  TmapPoiResponse,
  TmapReverseGeocodeResponse,
} from '@/types/api/tmap';
import type { Coordinates } from '@/types/geo';
import { createPinMarker } from '@/utils/marker';
import axios from 'axios';
import { MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PoiSuggestion {
  name: string;
  lat: number;
  lon: number;
  address: string;
}

export interface LocationPickerProps {
  initialCoordinates: Coordinates;
  onConfirm: (coords: Coordinates, address: string) => void;
  confirmLabel?: string;
  height?: string;
}

export default function LocationPicker({
  initialCoordinates,
  onConfirm,
  confirmLabel = '이 위치로 설정',
  height = '400px',
}: LocationPickerProps) {
  const { isLoaded } = useTmapScript();
  const { mode } = useUserStore();
  const isPetMode = mode === 'pet';

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Tmapv2.Map | null>(null);
  const markerInstance = useRef<Tmapv2.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [mapAddress, setMapAddress] = useState('');
  const [suggestions, setSuggestions] = useState<PoiSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const APP_KEY = import.meta.env.VITE_TMAP_APP_KEY;

  const mainColorClass = isPetMode ? 'bg-ormi-green-500' : 'bg-orange-500';
  const mainHoverColorClass = isPetMode
    ? 'hover:bg-ormi-green-600'
    : 'hover:bg-orange-600';
  const ringColorClass = isPetMode
    ? 'focus:ring-ormi-green-400'
    : 'focus:ring-orange-400';
  const mainHexColor = isPetMode ? '#10B981' : '#FFA500';

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

  // Initialize Map
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance.current) {
      if (!window.Tmapv2) return;

      try {
        const latlng = new window.Tmapv2.LatLng(
          initialCoordinates.lat,
          initialCoordinates.lon
        );

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
          iconHTML: createPinMarker(mainHexColor, true),
        });
        markerInstance.current = marker;

        checkMarkerPosition(latlng);

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
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        // Tmapv2 doesn't always handle cleanup gracefully, but we can clear innerHTML if needed in parent
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [
    isLoaded,
    // dependencies reduced to avoid re-init
    // initialCoordinates only used for initial center
    // mainHexColor
  ]);

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
      }, 300);
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
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    } else {
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

  const handleConfirm = () => {
    if (markerInstance.current) {
      const pos = markerInstance.current.getPosition();
      onConfirm({ lat: pos.lat(), lon: pos.lng() }, mapAddress);
    }
  };

  return (
    <div className="flex flex-col w-full h-full border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Search Bar */}
      <div className="relative z-50">
        <div className="p-3 border-b border-gray-100 flex gap-2 bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="장소 검색 (예: 제주국제공항)"
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${ringColorClass} bg-white text-gray-900 placeholder-gray-400`}
          />
          <button
            onClick={handleSearch}
            className={`${mainColorClass} ${mainHoverColorClass} text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shrink-0`}
          >
            <Search size={18} />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-l border-r border-gray-100 shadow-lg max-h-48 overflow-y-auto z-50">
            {suggestions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(item)}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-none"
              >
                <div className="font-medium text-gray-800 text-sm">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {item.address}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="relative w-full bg-gray-100" style={{ height }}>
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            지도 로딩 중...
            {!APP_KEY && (
              <span className="text-xs text-red-500 block ml-1">
                API Key 누락
              </span>
            )}
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}

        {/* Helper Badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-700 z-[999] pointer-events-none flex items-center gap-1">
          <MapPin size={12} className="text-gray-500" />
          마커를 움직여 위치를 선택하세요
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-3 bg-gray-50 flex flex-col gap-2 border-t border-gray-100">
        <div className="text-center text-gray-700 text-sm font-medium break-keep px-2">
          {mapAddress || '위치 확인 중...'}
        </div>
        <button
          onClick={handleConfirm}
          className={`w-full ${mainColorClass} text-white py-2.5 rounded-xl text-sm font-bold ${mainHoverColorClass} transition-colors shadow-sm`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
