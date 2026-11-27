import React, { useState } from 'react';
import { Coordinates, SafeLocation } from '../types';
import { AlertOctagon, Check, Copy, Shield, Share2, MapPin, HeartPulse } from 'lucide-react';

interface SafetyCenterProps {
  currentCoords: Coordinates;
  hasDeviceGps: boolean;
  safePoints: SafeLocation[];
  elevationMeters: number | null;
}

export const SafetyCenter: React.FC<SafetyCenterProps> = ({
  currentCoords,
  hasDeviceGps,
  safePoints,
  elevationMeters
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [preparedMessage, setPreparedMessage] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [sharing, setSharing] = useState(false);

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
  const altitudeLabel = elevationMeters == null ? 'Unavailable' : `${Math.round(elevationMeters)} m`;
  const accuracyLabel = currentCoords.accuracy == null ? 'Unavailable' : `±${Math.round(currentCoords.accuracy)} m`;

  // Copy coordinates
  const handleCopyCoords = async () => {
    if (!hasDeviceGps) return;
    const text = `${coordString} (Altitude: ${altitudeLabel}, Accuracy: ${accuracyLabel})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    } catch {
      // Fallback
    }
  };

  const prepareMessage = () => {
    if (!hasDeviceGps) return;
    const fixTime = currentCoords.timestamp == null ? 'Unavailable' : new Date(currentCoords.timestamp).toISOString();
    setPreparedMessage(`Emergency location message
I need assistance.
Device coordinates: ${coordString}
GPS fix time: ${fixTime}
GPS accuracy: ${accuracyLabel}
Altitude: ${altitudeLabel}
Map: https://maps.google.com/?q=${currentCoords.latitude.toFixed(6)},${currentCoords.longitude.toFixed(6)}`);
    setShareStatus('Message prepared.');
  };

  const shareMessage = async () => {
    if (!hasDeviceGps || !preparedMessage || sharing || !navigator.share) return;
    setSharing(true);
    setShareStatus('');
    try {
      await navigator.share({ title: 'Emergency location', text: preparedMessage });
      setShareStatus('Device sharing completed. Delivery is unconfirmed.');
    } catch (error) {
      setShareStatus(error instanceof DOMException && error.name === 'AbortError'
        ? 'Sharing cancelled.'
        : 'Device sharing failed. You can copy the message instead.');
    } finally {
      setSharing(false);
    }
  };

  const copyMessage = async () => {
    if (!hasDeviceGps || !preparedMessage || sharing) return;
    try {
      await navigator.clipboard.writeText(preparedMessage);
      setShareStatus('Message copied to clipboard.');
    } catch {
      setShareStatus('Clipboard unavailable. Select and copy the message text manually.');
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
              Emergency location sharing
            </h2>
            <p className="text-xs text-stone-300">
              Prepare a message to share from your device. If you need emergency help, call local emergency services directly.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={prepareMessage}
            disabled={!hasDeviceGps || sharing}
            className="px-4 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
          >
            {preparedMessage ? 'Refresh Emergency Message' : 'Prepare Emergency Message'}
          </button>
          {!hasDeviceGps && <p className="text-xs text-stone-400">Connect device GPS to prepare a location message.</p>}
          {hasDeviceGps && preparedMessage && (
            <>
              <textarea aria-label="Prepared emergency message" value={preparedMessage} readOnly rows={7}
                className="w-full p-2 rounded-lg border border-stone-700 bg-stone-950 text-xs text-stone-200 font-mono" />
              <div className="flex flex-wrap gap-2">
                {typeof navigator.share === 'function' && (
                  <button type="button" onClick={shareMessage} disabled={sharing}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-100 rounded-lg text-xs flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Share Message
                  </button>
                )}
                <button type="button" onClick={copyMessage} disabled={sharing}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-100 rounded-lg text-xs flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Copy Message
                </button>
              </div>
              <p role="status" className="text-xs text-stone-300">{shareStatus}</p>
            </>
          )}
        </div>
      </div>

      {/* GPS Coordinate Card */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-stone-100">{hasDeviceGps ? 'Device GPS coordinates' : 'Simulated trail coordinates'}</h3>
          </div>
          <button
            onClick={handleCopyCoords}
            disabled={!hasDeviceGps}
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
            <span className="font-mono font-bold text-stone-200">{altitudeLabel}</span>
          </div>
          <div className="bg-stone-950/40 p-2 rounded border border-stone-800/60">
            <span className="text-[10px] text-stone-400 block">Precision</span>
            <span className="font-mono font-bold text-stone-200">{accuracyLabel}</span>
          </div>
          <div className="bg-stone-950/40 p-2 rounded border border-stone-800/60">
            <span className="text-[10px] text-stone-400 block">Heading</span>
            <span className="font-mono font-bold text-stone-200">{currentCoords.heading == null ? 'Unavailable' : `${Math.round(currentCoords.heading)}°`}</span>
          </div>
        </div>
      </div>

      {/* Nearby Safe Locations & Ranger Stations */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-sm text-stone-100">Selected trail reference points</h3>
        </div>

        <p className="mb-3 text-xs text-stone-400">Example trail data. Location details and operating hours are unverified.</p>
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
