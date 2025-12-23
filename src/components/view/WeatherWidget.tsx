import useWeather from '@/hooks/useWeather';
import { useFilterStore } from '@/store/filterStore';
import type { Coordinates } from '@/types/geo';
import { AnimatePresence, motion } from 'framer-motion'; // Using Framer Motion for consistency
import { ChevronDown, Sun, Umbrella } from 'lucide-react';

interface Props {
  coordinates: Coordinates;
}

export default function WeatherWidget({ coordinates }: Props) {
  const { current, forecast, loading, error } = useWeather(coordinates);
  const { isWeatherOpen: isOpen, setWeatherOpen: setIsOpen } = useFilterStore();

  // Helper to format time (e.g., 15:00)
  const formatTime = (dt: number) => {
    const date = new Date(dt * 1000);
    return `${date.getHours().toString().padStart(2, '0')}시`;
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse px-1 h-full select-none">
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        <div className="w-6 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !current || !current.weather || current.weather.length === 0) {
    return (
      <div className="flex items-center text-xs text-gray-400 px-1 select-none">
        N/A
      </div>
    );
  }

  const weather = current.weather[0];
  const iconUrl = `http://openweathermap.org/img/wn/${weather.icon}.png`;

  return (
    <div className="relative z-50">
      {/* Main Clickable Widget */}
      <button
        onClick={toggleOpen}
        className="flex items-center gap-1 h-full px-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
      >
        <img
          src={iconUrl}
          alt={weather.description}
          className="w-6 h-6 drop-shadow-sm"
        />
        <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
          {Math.round(current.temp)}°
        </span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Forecast */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 pointer-events-auto"
          >
            {/* Title */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <span className="font-bold text-gray-800 text-sm flex items-center gap-1">
                <Sun size={14} className="text-orange-500" /> 시간별 예보
              </span>
              <span className="text-xs text-gray-400">3시간 간격</span>
            </div>

            {/* Hourly List */}
            <div className="flex justify-between gap-1 overflow-x-auto pb-2">
              {forecast?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center min-w-[36px]"
                >
                  <span className="text-[10px] text-gray-500 mb-1">
                    {formatTime(item.dt)}
                  </span>
                  <img
                    src={`http://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                    alt={item.weather[0].description}
                    className="w-8 h-8"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    {Math.round(item.temp)}°
                  </span>
                </div>
              ))}
              {(!forecast || forecast.length === 0) && (
                <div className="text-xs text-gray-400 text-center w-full py-2">
                  예보 정보 없음
                </div>
              )}
            </div>

            {/* Extra Info: UV Index */}
            <div className="mt-3 bg-gray-50 rounded-lg p-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-gray-600">
                <Umbrella size={14} className="text-purple-500" /> 자외선
                지수(UV)
              </span>
              <span
                className={`font-bold ${
                  current.uvi > 7
                    ? 'text-red-500'
                    : current.uvi > 5
                      ? 'text-orange-500'
                      : current.uvi > 2
                        ? 'text-yellow-600'
                        : 'text-green-500'
                }`}
              >
                {Math.round(current.uvi)}{' '}
                {current.uvi > 7
                  ? '(위험)'
                  : current.uvi > 5
                    ? '(높음)'
                    : current.uvi > 2
                      ? '(보통)'
                      : '(안전)'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
