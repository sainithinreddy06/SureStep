import React, { useState, useEffect, useRef } from 'react';
import { Activity, Volume2, VolumeX, X, ShieldAlert } from 'lucide-react';
import { Coordinates } from '../types';

interface GeologicalEvent {
  id: string;
  title: string;
  mag: number;
  place: string;
  time: number;
  depthKm: number;
  distanceKm: number;
  type: 'earthquake' | 'landslide' | 'flood';
  severity: 'moderate' | 'high' | 'critical';
  alert: boolean;
}

interface NaturalHazardAlertsProps {
  currentCoords: Coordinates | null;
}

export const NaturalHazardAlerts: React.FC<NaturalHazardAlertsProps> = ({
  currentCoords
}) => {
  const [events, setEvents] = useState<GeologicalEvent[] | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  const lastAnnouncedId = useRef<string | null>(null);
  const latitude = currentCoords?.latitude;
  const longitude = currentCoords?.longitude;
  const activeAlert = currentCoords
    ? events?.find(event => event.alert && !dismissedAlerts[event.id])
    : undefined;

  // Sound generator using Web Audio API
  useEffect(() => {
    if (!activeAlert || activeAlert.id === lastAnnouncedId.current) return;
    lastAnnouncedId.current = activeAlert.id;
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.onended = () => { void audioCtx.close().catch(() => {}); };
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext unavailable/blocked by autoplay policy
    }
  }, [activeAlert, soundEnabled]);

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      setEvents(null);
      return;
    }

    const controller = new AbortController();
    const checkHazards = async () => {
      try {
        const res = await fetch(`/api/natural-hazards?lat=${latitude}&lng=${longitude}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('USGS earthquake data is unavailable');
        const data = await res.json();
        if (!Array.isArray(data.events)) throw new Error('Invalid earthquake data');
        if (!controller.signal.aborted) setEvents(data.events);
      } catch {
        if (!controller.signal.aborted) setEvents(null);
      }
    };

    void checkHazards();
    const interval = setInterval(checkHazards, 45000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [latitude, longitude]);

  const handleDismiss = (id: string) => {
    setDismissedAlerts(prev => ({ ...prev, [id]: true }));
  };

  if (!activeAlert) {
    return (
      <div className="flex items-center justify-between bg-stone-950/80 border border-stone-800/80 px-3 py-1.5 rounded-xl text-xs text-stone-300">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-stone-200">USGS earthquake monitor</span>
          <span className="text-stone-400">
            {!currentCoords ? 'Waiting for device GPS' : events === null ? 'Earthquake data unavailable' : events[0] ? `${events[0].title} (${events[0].distanceKm} km away)` : 'No earthquakes reported within 500 km in the past day'}
          </span>
        </div>

      </div>
    );
  }

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="bg-gradient-to-r from-red-950/95 via-stone-900/95 to-amber-950/90 border-2 border-red-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-stone-100 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-600/30 border border-red-500 rounded-xl text-red-400 animate-pulse mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-extrabold uppercase tracking-widest">
                USGS EARTHQUAKE ALERT
              </span>
              <span className="font-bold text-sm text-red-200 font-mono">
                Magnitude {activeAlert.mag} · {activeAlert.distanceKm}km Away
              </span>
              <span className="text-stone-400 text-xs font-mono">
                Depth {activeAlert.depthKm}km
              </span>
            </div>

            <div className="text-xs font-semibold text-stone-100">
              {activeAlert.title}
            </div>

            <p className="text-xs text-stone-300">USGS earthquake feed · Local trail conditions are unknown.</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
            title={soundEnabled ? 'Mute alert sound' : 'Unmute alert sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleDismiss(activeAlert.id)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
            title="Acknowledge alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
