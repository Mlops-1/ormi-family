import type { GeoCodingData } from '@/types/api/weather';
import type { Coordinates } from '@/types/geo';
import { Icon } from '@cloudscape-design/components';
import axios from 'axios';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  coordinates: Coordinates;
  onLocationClick?: () => void;
  onHelpClick?: () => void;
  onUserClick?: () => void;
}

export default function GeoLocation({
  coordinates,
  onLocationClick,
  onHelpClick,
  onUserClick,
}: Props) {
  const [address, setAddress] = useState<string>('위치 확인 중...');

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!API_KEY) {
          console.warn('No API Key found');
          return;
        }

        const res = await axios.get<GeoCodingData[]>(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${coordinates.lat}&lon=${coordinates.lon}&limit=1&lang=kr&appid=${API_KEY}`
        );
        const data = res.data;

        if (data && data.length > 0) {
          const item = data[0];
          const city = item.local_names?.ko || item.name;
          const state = item.state;

          let display = city;
          if (state && !city.includes(state)) {
            display = `${state} ${city}`;
          }

          setAddress(display);
        } else {
          setAddress('제주시');
        }
      } catch (e) {
        console.error('Failed to fetch address:', e);
        setAddress('제주시');
      }
    };

    fetchAddress();
  }, [coordinates]);

  return (
    <div className="w-full flex justify-between items-center px-4 py-2 mb-4">
      {/* a. 위치 (Location) - Clickable */}
      <button
        onClick={onLocationClick}
        className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-ormi-green-200 active:scale-95 transition-transform cursor-pointer"
      >
        <span className="text-ormi-ember-500">
          <MapPin size={18} />
        </span>
        <span className="font-bold text-gray-800 text-sm md:text-base">
          {address}
        </span>
        <span className="text-gray-400">
          <Icon name="angle-down" />
        </span>
      </button>

      {/* b. 도움말, c. 유저정보 */}
      <div className="flex gap-2">
        <button
          onClick={onUserClick}
          className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-ormi-pink-50 border border-transparent hover:border-ormi-pink-200 transition-colors cursor-pointer"
        >
          <Icon name="user-profile" />
        </button>
        <button
          onClick={onHelpClick}
          className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-ormi-pink-50 border border-transparent hover:border-ormi-pink-200 transition-colors cursor-pointer"
        >
          <Icon name="status-info" />
        </button>
      </div>
    </div>
  );
}
