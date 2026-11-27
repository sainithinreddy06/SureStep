import type { WeatherCondition, WeatherData } from '../types';

const WEATHER_CACHE_KEY = 'surestep_weather_model_v1';
export const WEATHER_STALE_MS = 60 * 60 * 1000;

function mapWmoToCondition(code: number): WeatherCondition | null {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return null;
}

export async function fetchLiveWeather(latitude: number, longitude: number, signal: AbortSignal): Promise<WeatherData | null> {
  const cacheKey = `${WEATHER_CACHE_KEY}_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

  try {
    const fields = 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,precipitation_probability,uv_index';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${fields}&timeformat=unixtime`;
    const res = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]) });
    if (!res.ok) throw new Error(`Open-Meteo returned status ${res.status}`);

    const data = await res.json();
    const current = data?.current;
    if (!current || !Number.isFinite(current.time) || current.time <= 0 ||
        !Number.isFinite(data.elevation) || fields.split(',').some(field => !Number.isFinite(current[field]))) {
      throw new Error('Incomplete Open-Meteo data');
    }

    const condition = mapWmoToCondition(current.weather_code);
    if (!condition) throw new Error('Unknown Open-Meteo weather code');
    const validAt = current.time * 1000;
    if (validAt > Date.now() + 15 * 60 * 1000) throw new Error('Invalid Open-Meteo model time');

    const warnings: string[] = [];
    if (current.wind_gusts_10m >= 55) {
      warnings.push(`Modelled wind gusts of ${Math.round(current.wind_gusts_10m)} km/h.`);
    }
    if (condition === 'thunderstorm') warnings.push('The weather model indicates a thunderstorm.');
    if (current.temperature_2m <= 1) warnings.push('The weather model indicates near-freezing temperatures.');

    const weather: WeatherData = {
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      condition,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windGusts: current.wind_gusts_10m,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      precipitationProbability: current.precipitation_probability,
      uvIndex: current.uv_index,
      elevation: data.elevation,
      validAt,
      isCached: false,
      warnings,
    };

    if (signal.aborted) return null;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(weather));
    } catch {
      // Weather still works if local storage is unavailable.
    }
    return weather;
  } catch {
    if (signal.aborted) return null;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed: WeatherData = JSON.parse(cached);
        if (Number.isFinite(parsed?.validAt) && parsed.validAt > 0 && Array.isArray(parsed.warnings)) {
          return { ...parsed, isCached: true };
        }
      }
    } catch {
      // An unreadable cache cannot provide weather.
    }
    return null;
  }
}
