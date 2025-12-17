/**
 * Weather Service
 * Handles weather data retrieval and caching
 */

import type { WeatherData } from '@/types/analytics';

export class WeatherService {
  private weatherCache: Map<string, WeatherData> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly API_BASE_URL =
    'https://api.openweathermap.org/data/2.5/weather';

  constructor(private apiKey: string) {}

  /**
   * Get current weather for given coordinates
   */
  async getCurrentWeather(
    lat: number,
    lng: number
  ): Promise<WeatherData | null> {
    try {
      // Check cache first
      const cached = this.getCachedWeather(lat, lng);
      if (cached) {
        return cached;
      }

      // Fetch from API
      const weather = await this.fetchWeatherFromAPI(lat, lng);
      if (weather) {
        this.cacheWeather(lat, lng, weather);
      }

      return weather;
    } catch (error) {
      console.warn('Failed to get weather data:', error);
      return null;
    }
  }

  /**
   * Get cached weather data if available and not expired
   */
  getCachedWeather(lat: number, lng: number): WeatherData | null {
    const key = this.getCacheKey(lat, lng);
    const cached = this.weatherCache.get(key);

    if (cached && Date.now() < cached.cacheExpiry) {
      return cached;
    }

    // Remove expired cache
    if (cached) {
      this.weatherCache.delete(key);
    }

    return null;
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  private async fetchWeatherFromAPI(
    lat: number,
    lng: number
  ): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.warn('Weather API key not configured');
      return null;
    }

    try {
      const url = `${this.API_BASE_URL}?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        condition: this.mapWeatherCondition(data.weather[0].main),
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        timestamp: Date.now(),
        cacheExpiry: Date.now() + this.CACHE_DURATION,
      };
    } catch (error) {
      console.error('Failed to fetch weather from API:', error);
      return null;
    }
  }

  /**
   * Map OpenWeatherMap weather conditions to simplified conditions
   */
  private mapWeatherCondition(condition: string): string {
    const conditionMap: Record<string, string> = {
      Clear: 'sunny',
      Clouds: 'cloudy',
      Rain: 'rainy',
      Drizzle: 'rainy',
      Thunderstorm: 'stormy',
      Snow: 'snowy',
      Mist: 'foggy',
      Fog: 'foggy',
      Haze: 'hazy',
    };

    return conditionMap[condition] || 'unknown';
  }

  /**
   * Cache weather data
   */
  private cacheWeather(lat: number, lng: number, weather: WeatherData): void {
    const key = this.getCacheKey(lat, lng);
    this.weatherCache.set(key, weather);

    // Clean up expired cache entries periodically
    setTimeout(() => {
      if (
        this.weatherCache.get(key)?.cacheExpiry &&
        Date.now() > this.weatherCache.get(key)!.cacheExpiry
      ) {
        this.weatherCache.delete(key);
      }
    }, this.CACHE_DURATION);
  }

  /**
   * Generate cache key for coordinates
   */
  private getCacheKey(lat: number, lng: number): string {
    // Round to 2 decimal places for reasonable cache granularity
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `${roundedLat}_${roundedLng}`;
  }
}
