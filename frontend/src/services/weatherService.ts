import { Coordinates, WeatherCondition, WeatherData } from '../types';

const WEATHER_CACHE_KEY = 'terraguard_weather_cache';
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

function mapWmoToCondition(code: number): WeatherCondition {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'partly_cloudy';
}

export async function fetchLiveWeather(coords: Coordinates): Promise<WeatherData> {
  const cacheKey = `${WEATHER_CACHE_KEY}_${coords.latitude.toFixed(3)}_${coords.longitude.toFixed(3)}`;
  
  // Try fetching from Open-Meteo (real-time free open weather API)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for mountain connectivity

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation_probability,uv_index&forecast_days=1&timezone=auto`;
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const condition = mapWmoToCondition(current.weather_code);
    const warnings: string[] = [];

    // Wind Warnings
    if (current.wind_gusts_10m >= 55) {
      warnings.push(`Severe alpine wind gusts detected (${Math.round(current.wind_gusts_10m)} km/h). Avoid sheer ridge lines and exposed summits.`);
    } else if (current.wind_speed_10m >= 35) {
      warnings.push(`High steady winds (${Math.round(current.wind_speed_10m)} km/h). Increased wind chill and balance hazard.`);
    }

    // Thunderstorm / Precipitation Warnings
    if (condition === 'thunderstorm') {
      warnings.push('Thunderstorm activity detected. Lightning risk is extreme on exposed peaks. Descend below tree line immediately.');
    } else if (current.precipitation > 2.5) {
      warnings.push('Active precipitation causing slick granite and saturated mud tracks. Decreased rock friction.');
    }

    // Freezing temperatures
    if (current.temperature_2m <= 1) {
      warnings.push('Near/sub-freezing temperatures. Watch for black ice on north-facing rocky surfaces.');
    }

    const weatherData: WeatherData = {
      temperature: Math.round(current.temperature_2m * 10) / 10,
      apparentTemperature: Math.round(current.apparent_temperature * 10) / 10,
      condition,
      weatherCode: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
      windGusts: Math.round(current.wind_gusts_10m),
      humidity: Math.round(current.relative_humidity_2m ?? 55),
      precipitation: current.precipitation ?? 0,
      precipitationProbability: data.hourly?.precipitation_probability?.[0] ?? 10,
      uvIndex: data.hourly?.uv_index?.[0] ?? 4,
      elevation: data.elevation ?? 0,
      lastUpdated: Date.now(),
      isStale: false,
      provider: 'Open-Meteo',
      warnings
    };

    // Cache latest successful reading
    try {
      localStorage.setItem(cacheKey, JSON.stringify(weatherData));
      localStorage.setItem(`${WEATHER_CACHE_KEY}_latest`, JSON.stringify(weatherData));
    } catch {
      // ignore storage quota issues
    }

    return weatherData;
  } catch (error) {
    console.warn('Live weather request failed or timed out:', error);

    // Check cached data for this location or latest saved snapshot
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem(`${WEATHER_CACHE_KEY}_latest`);
    if (cached) {
      try {
        const parsed: WeatherData = JSON.parse(cached);
        const ageMs = Date.now() - parsed.lastUpdated;
        parsed.isStale = ageMs > STALE_THRESHOLD_MS;
        parsed.provider = 'Cached Backup';
        if (parsed.isStale) {
          parsed.warnings.unshift(`Cached weather data is ${Math.round(ageMs / (1000 * 60))} minutes old. Current atmospheric shifts may not be reflected.`);
        }
        return parsed;
      } catch {
        // parsing failed, drop through
      }
    }

    // Fallback when totally offline with no prior cache
    return {
      temperature: 14.5,
      apparentTemperature: 12.0,
      condition: 'partly_cloudy',
      weatherCode: 2,
      windSpeed: 18,
      windGusts: 28,
      humidity: 55,
      precipitation: 0.1,
      precipitationProbability: 20,
      uvIndex: 4,
      elevation: coords.altitude ? Math.round(coords.altitude) : 1750,
      lastUpdated: Date.now() - 3600000 * 2,
      isStale: true,
      provider: 'Cached Backup',
      warnings: ['Offline / Network unavailable: Showing baseline mountain weather snapshot. Monitor skies directly.']
    };
  }
}
