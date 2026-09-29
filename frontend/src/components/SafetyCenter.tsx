import React, { useState, useEffect } from 'react';
import { Coordinates, EmergencyContact, SafeLocation } from '../types';
import { AlertOctagon, Check, Copy, Phone, Shield, Share2, MapPin, Compass, HeartPulse, Radio, AlertTriangle, X } from 'lucide-react';

interface SafetyCenterProps {
  currentCoords: Coordinates;
  safePoints: SafeLocation[];
  emergencyContacts: EmergencyContact[];
  elevationMeters: number;
}

export const SafetyCenter: React.FC<SafetyCenterProps> = ({
  currentCoords,
  safePoints,
  emergencyContacts,
  elevationMeters
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedSosPayload, setCopiedSosPayload] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'arming' | 'dispatched'>('idle');
  const [countdown, setCountdown] = useState<number>(5);
  const [shareResultNote, setShareResultNote] = useState<string>('');

  // Convert decimal to DMS
  const toDms = (deg: number, isLat: boolean) => {
    const absolute = Math.abs(deg);
    const d = Math.floor(absolute);
    const m = Math.floor((absolute - d) * 60);
    const s = Math.round(((absolute - d) * 60 - m) * 60);
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    return `${d}° ${m}' ${s}" ${dir}`;
  };

  const latDms = toDms(currentCoords.latitude, true);
  const lngDms = toDms(currentCoords.longitude, false);
  const coordString = `${currentCoords.latitude.toFixed(6)}, ${currentCoords.longitude.toFixed(6)}`;

  // Copy coordinates
  const handleCopyCoords = async () => {
    const text = `${coordString} (Alt: ${Math.round(elevationMeters)}m, Acc: ±${Math.round(currentCoords.accuracy || 12)}m)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    } catch {
      // Fallback
    }
  };

  // SOS Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosStatus === 'arming' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
    } else if (sosStatus === 'arming' && countdown === 0) {
      triggerSosDispatch();
    }
    return () => clearTimeout(timer);
  }, [sosStatus, countdown]);

  const handleStartSosArming = () => {
    setCountdown(5);
    setSosStatus('arming');
  };

  const handleCancelSos = () => {
    setSosStatus('idle');
    setCountdown(5);
  };

  const buildSosMessage = () => {
    const mapsLink = `https://maps.google.com/?q=${currentCoords.latitude.toFixed(6)},${currentCoords.longitude.toFixed(6)}`;
    return `[EMERGENCY BACKCOUNTRY SOS]
I require emergency assistance.
Coordinates: ${currentCoords.latitude.toFixed(6)}, ${currentCoords.longitude.toFixed(6)}
DMS: ${latDms}, ${lngDms}
Altitude: ${Math.round(elevationMeters)}m (±${Math.round(currentCoords.accuracy || 15)}m accuracy)
Map: ${mapsLink}
Timestamp: ${new Date().toISOString()}
Message prepared via TerraGuard AI.`;
  };

  const triggerSosDispatch = async () => {
    const payload = buildSosMessage();
    setSosStatus('dispatched');

    // Attempt Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BACKCOUNTRY EMERGENCY SOS',
          text: payload
        });
        setShareResultNote('Device share sheet opened successfully. Please select your emergency dispatch contact or messaging app.');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShareResultNote('Device share sheet was closed or unsupported. Coordinates copied to clipboard for direct paste into SMS/Radio.');
        } else {
          setShareResultNote('Share sheet cancelled by user. Coordinates copied to clipboard.');
        }
      }
    } else {
      setShareResultNote('Native share sheet not supported in this browser. Emergency text copied to clipboard.');
    }

    // Copy to clipboard as reliable fallback
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedSosPayload(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Deliberate SOS Action Box */}
      <div className="bg-gradient-to-b from-red-950/40 to-stone-900 border-2 border-red-600/70 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-200 uppercase tracking-wide">
              Emergency SOS Beacon Flow
            </h2>
            <p className="text-xs text-stone-300">
              Prepares high-precision GPS distress coordinates for emergency services. Never sends silently without user confirmation.
            </p>
          </div>
        </div>

        {sosStatus === 'idle' && (
          <div className="mt-4">
            <button
              onClick={handleStartSosArming}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all text-sm uppercase tracking-wider"
            >
              <AlertOctagon className="w-5 h-5" />
              Arm Deliberate Emergency SOS (2-Step)
            </button>
            <div className="text-[11px] text-stone-400 text-center mt-2">
              Features a 5-second countdown to prevent accidental activation.
            </div>
          </div>
        )}

        {sosStatus === 'arming' && (
          <div className="mt-4 bg-red-950/90 border border-red-500 rounded-xl p-4 text-center">
            <div className="text-xs font-semibold text-red-300 uppercase tracking-widest mb-1">
              ARMING SOS DISPATCH
            </div>
            <div className="text-4xl font-extrabold font-mono text-white my-2 animate-bounce">
              {countdown}s
            </div>
            <p className="text-xs text-red-200 mb-4">
              Opening device share sheet with your verified location in {countdown} seconds...
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={handleCancelSos}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                ABORT / CANCEL
              </button>
              <button
                onClick={triggerSosDispatch}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors"
              >
                DISPATCH NOW
              </button>
            </div>
          </div>
        )}

        {sosStatus === 'dispatched' && (
          <div className="mt-4 bg-stone-950/80 border border-red-500/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-2">
              <Check className="w-4 h-4" />
              Location Payload Prepared
            </div>
            <p className="text-xs text-stone-300 leading-relaxed mb-3">
              {shareResultNote || 'Emergency location payload prepared and copied.'}
            </p>

            {/* Quick SMS and Call triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <a
                href={`sms:?body=${encodeURIComponent(buildSosMessage())}`}
                className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                Open SMS App with Coordinates
              </a>
              <a
                href="tel:911"
                className="py-2 px-3 bg-red-700/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call 911 / Park Rescue
              </a>
            </div>

            <button
              onClick={() => setSosStatus('idle')}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-200 text-center transition-colors underline"
            >
              Reset SOS Status
            </button>
          </div>
        )}
      </div>

      {/* GPS Coordinate Card */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-stone-100">Live Backcountry Coordinates</h3>
          </div>
          <button
            onClick={handleCopyCoords}
            className="px-2.5 py-1 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-md border border-stone-700 flex items-center gap-1.5 transition-colors"
          >
            {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCoords ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800/80">
            <div className="text-stone-400 text-[11px] mb-1">Decimal Degrees (WGS84)</div>
            <div className="font-mono text-sm font-bold text-stone-100 tabular-nums">
              {coordString}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">Standard for search engines & mobile maps</div>
          </div>

          <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800/80">
            <div className="text-stone-400 text-[11px] mb-1">Degrees, Minutes, Seconds (DMS)</div>
            <div className="font-mono text-xs font-bold text-stone-100">
              {latDms} / {lngDms}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">Aviation & Mountain Rescue VHF radio standard</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
          <div className="bg-stone-950/40 p-2 rounded border border-stone-800/60">
            <span className="text-[10px] text-stone-400 block">Altitude</span>
            <span className="font-mono font-bold text-stone-200">{Math.round(elevationMeters)}m</span>
          </div>
          <div className="bg-stone-950/40 p-2 rounded border border-stone-800/60">
            <span className="text-[10px] text-stone-400 block">Precision</span>
            <span className="font-mono font-bold text-stone-200">±{Math.round(currentCoords.accuracy || 12)}m</span>
          </div>
          <div className="bg-stone-950/40 p-2 rounded border border-stone-800/60">
            <span className="text-[10px] text-stone-400 block">Heading</span>
            <span className="font-mono font-bold text-stone-200">{Math.round(currentCoords.heading || 0)}°</span>
          </div>
        </div>
      </div>

      {/* Nearby Safe Locations & Ranger Stations */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-sm text-stone-100">Nearby Safe Refuges & Ranger Posts</h3>
        </div>

        <div className="space-y-2.5">
          {safePoints.map(point => (
            <div
              key={point.id}
              className="p-3 bg-stone-950/60 rounded-lg border border-stone-800 flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-stone-100 font-semibold">{point.name}</strong>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40 uppercase">
                    {point.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-stone-400 mt-1">
                  Amenities: {point.amenities.join(', ')}
                </div>
                {point.operatingHours && (
                  <div className="text-[11px] text-stone-500 mt-0.5">Hours: {point.operatingHours}</div>
                )}
              </div>

              {point.emergencyContact && (
                <a
                  href={`tel:${point.emergencyContact.replace(/-/g, '')}`}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-sky-300 rounded-md font-mono text-xs flex items-center gap-1.5 shrink-0 transition-colors border border-stone-700"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  {point.emergencyContact}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Emergency First Aid & Triage Guidelines */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <h3 className="font-bold text-sm text-stone-100">Essential Backcountry Triage</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-stone-950/60 rounded-lg border border-stone-800">
            <strong className="text-stone-200 block mb-1">Hypothermia</strong>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Insulate from ground immediately. Replace wet layers with dry wool/fleece. Add windproof shell. Warm sweet fluids if conscious. Do not rub frostbitten skin.
            </p>
          </div>

          <div className="p-3 bg-stone-950/60 rounded-lg border border-stone-800">
            <strong className="text-stone-200 block mb-1">Severe Bleeding & Sprains</strong>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Apply direct continuous pressure with clean gauze. Elevate injury above heart. For joint sprains, immobilize using trekking pole and ace bandage.
            </p>
          </div>

          <div className="p-3 bg-stone-950/60 rounded-lg border border-stone-800">
            <strong className="text-stone-200 block mb-1">Lightning Protocol (30/30)</strong>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              If thunder occurs within 30 seconds of flash, descend immediately below ridge. Avoid isolated tall trees. Crouch on sleeping pad with feet together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
