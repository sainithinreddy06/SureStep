import React, { useState } from 'react';
import { WeatherData } from '../types';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, RefreshCw, Sun, Wind, AlertTriangle, Clock } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  units: 'metric' | 'imperial';
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  isLoading,
  onRefresh,
  units
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const formatTemp = (celsius: number) => {
    if (units === 'imperial') {
      const f = (celsius * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const formatSpeed = (kmh: number) => {
    if (units === 'imperial') {
      const mph = kmh * 0.621371;
      return `${Math.round(mph)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
  };

  const getWeatherIcon = (cond: string) => {
    switch (cond) {
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-amber-400" />;
      case 'snow':
        return <CloudSnow className="w-5 h-5 text-sky-200" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'fog':
        return <CloudFog className="w-5 h-5 text-stone-300" />;
      case 'cloudy':
      case 'partly_cloudy':
        return <Cloud className="w-5 h-5 text-stone-300" />;
      case 'windy':
        return <Wind className="w-5 h-5 text-teal-300" />;
      case 'sunny':
      default:
        return <Sun className="w-5 h-5 text-amber-400" />;
    }
  };

  if (!weather) {
    return (
      <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-4 text-xs text-stone-400 flex items-center justify-between">
        <span>Awaiting mountain meteorological telemetry...</span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded text-stone-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  const minutesAgo = Math.max(0, Math.floor((Date.now() - weather.lastUpdated) / 60000));

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/90 backdrop-blur-sm p-4 text-stone-100 shadow-sm">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.condition)}
          <span className="font-bold text-sm tracking-tight capitalize">
            {weather.condition.replace('_', ' ')}
          </span>
          <span className="text-stone-500" aria-hidden="true">·</span>
          <span className="text-xs text-stone-400">
            {weather.provider}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {weather.isStale && (
            <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
              <Clock className="w-3 h-3" />
              Stale Data ({minutesAgo}m ago)
            </span>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 active:bg-stone-700 rounded transition-colors"
            title="Refresh current meteorological reading"
            aria-label="Refresh weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Temperature */}
        <div className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
          <div className="text-stone-400 text-[11px]">Temperature</div>
          <div className="text-lg font-bold font-mono tabular-nums text-stone-100">
            {formatTemp(weather.temperature)}
          </div>
          <div className="text-[10px] text-stone-400">
            Feels {formatTemp(weather.apparentTemperature)}
          </div>
        </div>

        {/* Wind & Gusts */}
        <div className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
          <div className="text-stone-400 text-[11px]">Wind / Gusts</div>
          <div className="text-lg font-bold font-mono tabular-nums text-stone-100">
            {formatSpeed(weather.windSpeed)}
          </div>
          <div className="text-[10px] text-amber-400/90 font-mono">
            Gusts: {formatSpeed(weather.windGusts)}
          </div>
        </div>

        {/* Rain Probability */}
        <div className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
          <div className="text-stone-400 text-[11px]">Precipitation</div>
          <div className="text-lg font-bold font-mono tabular-nums text-stone-100">
            {weather.precipitationProbability}%
          </div>
          <div className="text-[10px] text-stone-400">
            {weather.precipitation} mm volume
          </div>
        </div>

        {/* Elevation / UV */}
        <div className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
          <div className="text-stone-400 text-[11px]">Elevation / UV</div>
          <div className="text-lg font-bold font-mono tabular-nums text-stone-100">
            {Math.round(weather.elevation)}m
          </div>
          <div className="text-[10px] text-stone-400">
            UV Index {weather.uvIndex}
          </div>
        </div>
      </div>

      {/* Weather Warnings if any */}
      {weather.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {weather.warnings.map((warn, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-amber-950/30 border border-amber-800/50 p-2 rounded-lg text-xs text-amber-200 leading-tight"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
