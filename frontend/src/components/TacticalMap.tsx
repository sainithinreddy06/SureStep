import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Coordinates, HazardReport, SafeLocation, TrailRoute } from '../types';
import {
  Layers,
  Locate,
  AlertTriangle,
  Shield,
  Compass,
  Mountain,
  WifiOff,
  Plus
} from 'lucide-react';

interface TacticalMapProps {
  currentCoords: Coordinates;
  trail: TrailRoute | null;
  breadcrumbs: Coordinates[];
  hazards: HazardReport[];
  safePoints: SafeLocation[];
  isTracking: boolean;
  isOffline?: boolean;
  onOpenReportModal: () => void;
  onSelectHazard?: (hazard: HazardReport) => void;
  units: 'metric' | 'imperial';
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  currentCoords,
  trail,
  breadcrumbs,
  hazards,
  safePoints,
  isTracking,
  isOffline = false,
  onOpenReportModal,
  onSelectHazard,
  units
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const breadcrumbsPolylineRef = useRef<L.Polyline | null>(null);
  const hazardGroupRef = useRef<L.LayerGroup | null>(null);
  const safeGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<'topo' | 'satellite' | 'standard'>('topo');
  const [followUser, setFollowUser] = useState<boolean>(true);

  // Tile Providers
  const getTileUrl = (style: 'topo' | 'satellite' | 'standard') => {
    switch (style) {
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'satellite':
        // ESRI World Imagery (high-resolution satellite with contours)
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'standard':
      default:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.latitude, currentCoords.longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 18,
      subdomains: mapStyle === 'topo' ? 'abc' : ''
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    hazardGroupRef.current = L.layerGroup().addTo(map);
    safeGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base tile style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();
    const newLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 18,
      subdomains: mapStyle === 'topo' ? 'abc' : ''
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Trail line
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (trailPolylineRef.current) {
      trailPolylineRef.current.remove();
      trailPolylineRef.current = null;
    }

    if (trail && trail.coordinates.length > 0) {
      const poly = L.polyline(trail.coordinates, {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '3, 6'
      }).addTo(mapInstanceRef.current);
      trailPolylineRef.current = poly;
    }
  }, [trail]);

  // Breadcrumbs path
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (breadcrumbsPolylineRef.current) {
      breadcrumbsPolylineRef.current.remove();
      breadcrumbsPolylineRef.current = null;
    }

    if (breadcrumbs.length > 1) {
      const pts = breadcrumbs.map(b => [b.latitude, b.longitude] as [number, number]);
      const poly = L.polyline(pts, {
        color: '#10b981',
        weight: 4,
        opacity: 0.95
      }).addTo(mapInstanceRef.current);
      breadcrumbsPolylineRef.current = poly;
    }
  }, [breadcrumbs]);

  // Hazards Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !hazardGroupRef.current) return;
    hazardGroupRef.current.clearLayers();

    hazards.forEach(hz => {
      const isCrit = hz.severity === 'critical';
      const isHigh = hz.severity === 'high';
      const color = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#eab308';

      const icon = L.divIcon({
        className: 'tactical-hz-marker',
        html: `
          <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.6); cursor: pointer;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([hz.coordinates.latitude, hz.coordinates.longitude], { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #f5f5f4;">
          <div style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
            ${hz.severity} HAZARD · ${hz.type}
          </div>
          <div style="font-weight: 600; font-size: 13px; margin: 2px 0 4px 0;">${hz.title}</div>
          <div style="color: #d6d3d1; font-size: 11px; margin-bottom: 6px;">${hz.description}</div>
          <div style="font-size: 10px; color: #a8a29e; border-top: 1px solid #44403c; padding-top: 4px;">
            Verified by ${hz.verifiedCount} mountain hikers
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectHazard) onSelectHazard(hz);
      });

      hazardGroupRef.current?.addLayer(marker);
    });
  }, [hazards, onSelectHazard]);

  // Safe Refuges Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !safeGroupRef.current) return;
    safeGroupRef.current.clearLayers();

    safePoints.forEach(sp => {
      const icon = L.divIcon({
        className: 'tactical-sp-marker',
        html: `
          <div style="background-color: #0284c7; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([sp.coordinates.latitude, sp.coordinates.longitude], { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #f5f5f4;">
          <div style="color: #38bdf8; font-size: 10px; font-weight: 700; text-transform: uppercase;">
            ${sp.type.replace('_', ' ')}
          </div>
          <div style="font-weight: 600; font-size: 13px; margin: 2px 0 4px 0;">${sp.name}</div>
          ${sp.emergencyContact ? `<div style="font-size: 11px; color: #38bdf8; margin-bottom: 4px;">Call: ${sp.emergencyContact}</div>` : ''}
          <div style="font-size: 10px; color: #d6d3d1;">Amenities: ${sp.amenities.join(', ')}</div>
        </div>
      `);

      safeGroupRef.current?.addLayer(marker);
    });
  }, [safePoints]);

  // Live Location & Accuracy Circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const lat = currentCoords.latitude;
    const lng = currentCoords.longitude;
    const acc = currentCoords.accuracy || 12;

    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div style="position: relative; width: 22px; height: 22px;">
            <div class="pulse-beacon" style="position: absolute; inset: -8px; background-color: rgba(16, 185, 129, 0.4); border-radius: 9999px;"></div>
            <div style="position: absolute; inset: 0; background-color: #10b981; border: 3px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 10px rgba(0,0,0,0.6);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: Math.min(60, acc),
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 1
      }).addTo(mapInstanceRef.current);
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([lat, lng]);
        accuracyCircleRef.current.setRadius(Math.min(60, acc));
      }
    }

    if (followUser && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.4 });
    }
  }, [currentCoords, followUser]);

  const handleRecenter = () => {
    setFollowUser(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentCoords.latitude, currentCoords.longitude], 15, { animate: true });
    }
  };

  const formatElevation = (m: number) => {
    if (units === 'imperial') {
      return `${Math.round(m * 3.28084)} ft`;
    }
    return `${Math.round(m)} m`;
  };

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl select-none">
      {/* Map DOM */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top HUD: Compact Tactical Telemetry */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-stone-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-800 text-xs flex items-center gap-2.5 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
            <span className="font-semibold text-stone-100">
              {currentCoords.latitude.toFixed(4)}°, {currentCoords.longitude.toFixed(4)}°
            </span>
          </div>
          <span className="text-stone-600" aria-hidden="true">|</span>
          <div className="flex items-center gap-1 text-stone-300 font-mono">
            <Mountain className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatElevation(currentCoords.altitude || 1650)}</span>
          </div>
          <span className="text-stone-600" aria-hidden="true">|</span>
          <div className="flex items-center gap-1 text-stone-300 font-mono">
            <Compass className="w-3.5 h-3.5 text-stone-400" />
            <span>{Math.round(currentCoords.heading || 0)}°</span>
          </div>
        </div>

        {isOffline && (
          <div className="bg-amber-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-amber-600/70 text-xs text-amber-300 flex items-center gap-1.5 shadow-md font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Map Mode</span>
          </div>
        )}
      </div>

      {/* Floating Tactical Controls (Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Style Switcher: Topo / Satellite / Standard */}
        <div className="flex bg-stone-950/90 backdrop-blur-md rounded-lg border border-stone-800 p-0.5 shadow-md">
          <button
            onClick={() => setMapStyle('topo')}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              mapStyle === 'topo' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Topo
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              mapStyle === 'satellite' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sat
          </button>
          <button
            onClick={() => setMapStyle('standard')}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              mapStyle === 'standard' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            OSM
          </button>
        </div>

        {/* Recenter */}
        <button
          onClick={handleRecenter}
          className={`p-2.5 rounded-lg border shadow-md backdrop-blur-md transition-colors self-end ${
            followUser
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-stone-950/90 text-stone-200 border-stone-800 hover:bg-stone-800'
          }`}
          title="Recenter on hiker location"
        >
          <Locate className="w-4 h-4" />
        </button>

        {/* Quick Log Hazard */}
        <button
          onClick={onOpenReportModal}
          className="p-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg border border-amber-400 shadow-lg transition-colors flex items-center justify-center self-end"
          title="Pin verified hazard at current location"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Status Bar: Legend & Quick Safe Refuge */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-800 text-[11px] text-stone-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded" />
            <span>Trail</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
            <span>Tracked</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{hazards.length} Hazards</span>
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>{safePoints.length} Refuges</span>
          </span>
        </div>

        {safePoints[0] && (
          <div className="pointer-events-auto bg-stone-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-sky-800/60 text-[11px] text-sky-200 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>Nearest Refuge: <strong>{safePoints[0].name}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
