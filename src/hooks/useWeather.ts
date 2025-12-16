import type { CurrentWeatherData, ForecastData } from '@/types/api/weather';
import type { Coordinates } from '@/types/geo';
import axios from 'axios';
import { useEffect, useState } from 'react';

export interface WeatherResult {
  current?: {
    temp: number;
    feels_like: number;
    humidity: number;
    uvi: number; // Might be missing in 2.5 fallback
    weather: { icon: string; description: string }[];
  };
  // Hourly/Forecast: simplified structure
  forecast?: {
    dt: number;
    temp: number;
    weather: { icon: string; description: string }[];
  }[];
  daily?: {
    temp: { min: number; max: number };
  }[];
  loading: boolean;
  error: string | null;
}

export default function useWeather(
  coordinates: Coordinates | undefined
): WeatherResult {
  const [data, setData] = useState<WeatherResult>({
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!coordinates) return;

    const fetchData = async () => {
      setData((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!API_KEY) throw new Error('No API Key');

        // Use 2.5 Weather API (Current) as primary to avoid 401 on OneCall 3.0
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&units=metric&lang=kr&appid=${API_KEY}`;

        // Axios
        const res = await axios.get<CurrentWeatherData>(currentUrl);
        const json = res.data;

        // Fetch UV separately (Legacy 2.5/uvi)
        let uvi = 0;
        try {
          const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${API_KEY}`;
          const uvRes = await axios.get(uvUrl);
          if (uvRes.status === 200) {
            uvi = uvRes.data.value;
          } else {
            // Mock UV if API fails/missing
            uvi = 7;
          }
        } catch {
          uvi = 7; // Fallback
        }

        // Fetch Forecast (3-hour steps)
        let forecastList: {
          dt: number;
          temp: number;
          weather: { icon: string; description: string }[];
        }[] = [];
        try {
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=metric&lang=kr&appid=${API_KEY}`;
          const forecastRes = await axios.get<ForecastData>(forecastUrl);
          if (forecastRes.data && forecastRes.data.list) {
            // Get next 5 items
            forecastList = forecastRes.data.list.slice(0, 5).map((item) => ({
              dt: item.dt,
              temp: item.main.temp,
              weather: item.weather,
            }));
          }
        } catch (e) {
          console.error('Forecast fetch failed', e);
        }

        setData({
          loading: false,
          error: null,
          current: {
            temp: json.main.temp,
            feels_like: json.main.feels_like,
            humidity: json.main.humidity,
            uvi: uvi,
            weather: json.weather,
          },
          // Mock daily for compatibility
          daily: [
            { temp: { min: json.main.temp_min, max: json.main.temp_max } },
          ],
          forecast: forecastList,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown Error';
        console.error(e);
        setData({ loading: false, error: message, current: undefined });
      }
    };

    fetchData();
  }, [coordinates]);

  return data;
}
