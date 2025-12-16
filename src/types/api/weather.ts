interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface MainWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

interface CurrentWeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: WeatherCondition[];
  main: MainWeather;
  dt: number;
  name: string;
  cod: number;
}

// Legacy UV or OneCall UV extraction
interface UVData {
  lat: number;
  lon: number;
  date_iso: string;
  date: number;
  value: number;
}

interface GeoCodingData {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface OneCallCurrent {
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  uvi: number;
  weather: WeatherCondition[];
  dt: number;
}

interface OneCallDaily {
  dt: number;
  temp: {
    min: number;
    max: number;
    day: number;
  };
}

interface OneCallData {
  lat: number;
  lon: number;
  timezone: string;
  current: OneCallCurrent;
  daily: OneCallDaily[];
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: WeatherCondition[];
}

export interface ForecastData {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
}

export type {
  CurrentWeatherData,
  ForecastData,
  GeoCodingData,
  OneCallData,
  UVData,
};
