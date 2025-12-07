import useWeather from '@/hooks/useWeather';
import type { Coordinates } from '@/types/geo';

interface Props {
  coordinates: Coordinates;
}

export default function WeatherWidget({ coordinates }: Props) {
  const { current, loading, error } = useWeather(coordinates);

  // Helper to interpret UV
  const getUVStatus = (uv: number) => {
    if (uv < 3)
      return {
        text: '낮음',
        color: 'text-ormi-green-600 dark:text-ormi-green-400',
        bg: 'bg-ormi-green-100 dark:bg-ormi-green-900/30',
      };
    if (uv < 6)
      return {
        text: '보통',
        color: 'text-ormi-ember-600 dark:text-ormi-ember-400',
        bg: 'bg-ormi-ember-100 dark:bg-ormi-ember-900/30',
      };
    if (uv < 8)
      return {
        text: '높음! 아기 선크림 필수',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
      };
    return {
      text: '매우 높음! 외출 자제',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    };
  };

  if (loading) {
    return (
      <div className="w-full px-4 mb-6 space-y-4">
        {/* Skeleton Weather Box */}
        <div className="bg-white dark:bg-slate-700 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-600 p-6 flex items-center justify-between h-[124px] animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
            <div className="space-y-2">
              <div className="w-16 h-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
          <div className="hidden md:flex gap-6">
            <div className="w-12 h-10 bg-gray-200 dark:bg-slate-600 rounded"></div>
            <div className="w-12 h-10 bg-gray-200 dark:bg-slate-600 rounded"></div>
            <div className="w-16 h-10 bg-gray-200 dark:bg-slate-600 rounded"></div>
          </div>
        </div>

        {/* Skeleton UV Banner */}
        <div className="h-[46px] bg-gray-100 dark:bg-slate-700 rounded-xl w-full animate-pulse border border-transparent"></div>
      </div>
    );
  }

  if (error || !current || !current.weather || current.weather.length === 0) {
    return (
      <div className="w-full px-4 mb-6">
        <div className="bg-white dark:bg-slate-700 rounded-3xl p-6 text-center text-gray-400 dark:text-gray-300 border border-ormi-blue-100 dark:border-slate-600">
          날씨 정보를 불러올 수 없습니다.
          {error && (
            <span className="block text-xs mt-2 text-red-300">({error})</span>
          )}
        </div>
      </div>
    );
  }

  const weather = current.weather[0];
  const uvStatus = getUVStatus(current.uvi || 0);
  const iconUrl = `http://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="w-full px-4 space-y-4">
      {/* d. 날씨 (Weather) */}
      <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-ormi-blue-100 dark:border-slate-600 p-6 flex flex-col md:flex-row items-center justify-between transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
          <img
            src={iconUrl}
            alt={weather.description}
            className="w-16 h-16 drop-shadow-sm"
          />
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
              {Math.round(current.temp)}°
            </div>
            <div className="text-gray-500 dark:text-gray-300 capitalize whitespace-nowrap break-keep text-sm">
              {weather.description}
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex gap-4 text-center text-sm text-gray-500 dark:text-gray-300">
          <div>
            <span className="block text-gray-400 dark:text-gray-400 text-xs mb-1 whitespace-nowrap">
              체감
            </span>
            <span className="font-semibold whitespace-nowrap">
              {Math.round(current.feels_like)}°
            </span>
          </div>
          <div>
            <span className="block text-gray-400 dark:text-gray-400 text-xs mb-1 whitespace-nowrap">
              습도
            </span>
            <span className="font-semibold whitespace-nowrap">
              {current.humidity}%
            </span>
          </div>
        </div>
      </div>

      {/* e. 자외선 지수 (UV Banner) */}
      {current.uvi > 0 && (
        <div
          className={`rounded-xl p-3 text-center font-bold text-sm ${uvStatus.bg} ${uvStatus.color} border border-transparent shadow-sm flex items-center justify-center gap-2`}
        >
          <span>☀️</span>
          <span>자외선 {uvStatus.text}</span>
        </div>
      )}
    </div>
  );
}
