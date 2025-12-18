import useWeather from '@/hooks/useWeather';
import type { Coordinates } from '@/types/geo';

interface Props {
  coordinates: Coordinates;
}

export default function WeatherWidget({ coordinates }: Props) {
  const { current, loading, error } = useWeather(coordinates);

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse px-3 h-full">
        <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
        <div className="w-12 h-6 bg-gray-200 dark:bg-slate-600 rounded"></div>
      </div>
    );
  }

  if (error || !current || !current.weather || current.weather.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 px-3">
        날씨 정보 없음
      </div>
    );
  }

  const weather = current.weather[0];
  const iconUrl = `http://openweathermap.org/img/wn/${weather.icon}.png`;

  return (
    <div className="flex items-center gap-1 h-full px-2">
      <img
        src={iconUrl}
        alt={weather.description}
        className="w-8 h-8 drop-shadow-sm"
      />
      <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
        {Math.round(current.temp)}°
      </span>
      <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 font-medium">
        {weather.description}
      </span>
    </div>
  );
}
