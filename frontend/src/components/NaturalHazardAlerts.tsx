import React, { useState, useEffect } from 'react';
import { AlertOctagon, Activity, Mountain, CloudLightning, Bell, Volume2, VolumeX, X, ShieldAlert } from 'lucide-react';
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
  currentCoords: Coordinates;
  elevationMeters: number;
}

export const NaturalHazardAlerts: React.FC<NaturalHazardAlertsProps> = ({
  currentCoords,
  elevationMeters
}) => {
  const [events, setEvents] = useState<GeologicalEvent[]>([]);
  const [activeAlert, setActiveAlert] = useState<GeologicalEvent | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  // Sound generator using Web Audio API
  const playAlertTone = () => {
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
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext unavailable/blocked by autoplay policy
    }
  };

  // Poll natural hazards endpoint
  const checkHazards = async () => {
    try {
      const res = await fetch(`/api/natural-hazards?lat=${currentCoords.latitude}&lng=${currentCoords.longitude}`);
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          const urgent = data.events.find((e: GeologicalEvent) => e.alert && !dismissedAlerts[e.id]);
          if (urgent) {
            setActiveAlert(urgent);
            playAlertTone();
          }
        }
      }
    } catch (err) {
      console.warn('Natural hazards fetch skipped:', err);
    }
  };

  useEffect(() => {
    checkHazards();
    const interval = setInterval(checkHazards, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, [currentCoords.latitude, currentCoords.longitude]);

  // Simulate an earthquake/landslide trigger for instant field verification
  const handleSimulateEarthquake = () => {
    const simEvent: GeologicalEvent = {
      id: `sim-${Date.now()}`,
      title: 'M3.9 Seismic Shaking - 14km NW of Summit Ridge',
      mag: 3.9,
      place: '14km NW of Summit Ridge',
      time: Date.now(),
      depthKm: 6.4,
      distanceKm: 14,
      type: 'earthquake',
      severity: 'critical',
      alert: true
    };
    setEvents(prev => [simEvent, ...prev]);
    setActiveAlert(simEvent);
    playAlertTone();
  };

  const handleDismiss = (id: string) => {
    setDismissedAlerts(prev => ({ ...prev, [id]: true }));
    if (activeAlert?.id === id) {
      setActiveAlert(null);
    }
  };

  if (!activeAlert) {
    return (
      <div className="flex items-center justify-between bg-stone-950/80 border border-stone-800/80 px-3 py-1.5 rounded-xl text-xs text-stone-300">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-stone-200">USGS Seismic & Geological Monitor:</span>
          <span className="text-stone-400">
            {events.length > 0 ? `${events[0].title} (${events[0].distanceKm}km away)` : 'No active geological tremors within 100km'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateEarthquake}
            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono"
            title="Simulate a nearby earthquake/landslide alert"
          >
            Test Tremor Alert
          </button>
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
                GEOLOGICAL & SEISMIC ALERT
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

            {/* Tactical Mountain Ranger Warning */}
            <div className="p-2.5 bg-stone-950/80 border border-red-800/80 rounded-lg text-xs leading-relaxed text-amber-200 mt-2">
              <strong className="text-red-300 block mb-0.5 uppercase tracking-wider text-[10px]">
                Immediate Mountain Hazard: High Rockfall & Talus Slide Risk
              </strong>
              Seismic tremors trigger violent rock exfoliations and talus slides on slopes above 20°.
              <strong> Move immediately away from vertical cliff bands, overhangs, and couloirs.</strong> Avoid resting at the base of crumbly bluffs.
            </div>
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
