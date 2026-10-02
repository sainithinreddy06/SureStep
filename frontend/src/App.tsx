import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Coordinates,
  GpsStatus,
  HazardReport,
  HikeSession,
  RiskAssessment,
  SafeLocation,
  TrailRoute,
  WeatherData
} from './types';
import { MOCK_TRAILS } from './services/mockTrails';
import { fetchLiveWeather } from './services/weatherService';
import { calculateTerrainRisk } from './services/riskEngine';
import { predictTerrainRisk, TerrainRiskPrediction } from './services/mlService';
import {
  addCustomHazard,
  deleteHikeSession,
  getCustomHazards,
  getEmergencyContacts,
  getSavedSessions,
  getUserSettings,
  saveHikeSession,
  saveUserSettings
} from './services/storageService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TacticalMap } from './components/TacticalMap';
import { RiskEngineCard } from './components/RiskEngineCard';
import { TerrainMLCard } from './components/TerrainMLCard';
import { WeatherWidget } from './components/WeatherWidget';
import { SafetyCenter } from './components/SafetyCenter';
import { GroundVision } from './components/GroundVision';
import { HazardsList } from './components/HazardsList';
import { HazardReportingModal } from './components/HazardReportingModal';
import { SessionTracker } from './components/SessionTracker';
import { OfflineConnectivityBanner } from './components/OfflineConnectivityBanner';
import { NaturalHazardAlerts } from './components/NaturalHazardAlerts';
import { RangerAiChat } from './components/RangerAiChat';
import { LandingPage } from './components/LandingPage';
import { FloatingWindowHUD } from './components/FloatingWindowHUD';
import { HistoricalIncidentDatabase } from './components/HistoricalIncidentDatabase';
import {
  AlertTriangle,
  Compass,
  Footprints,
  Info,
  MapPin,
  Mountain,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Smartphone,
  Eye,
  CheckCircle2,
  Bot,
  X
} from 'lucide-react';

function getHaversineDistance(c1: Coordinates, c2: Coordinates): number {
  const R = 6371e3;
  const lat1 = (c1.latitude * Math.PI) / 180;
  const lat2 = (c2.latitude * Math.PI) / 180;
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const [settings, setSettings] = useState(getUserSettings);
  // CAMERA FIRST: 'vision' is the primary default screen!
  const [activeTab, setActiveTab] = useState<string>('vision');
  const [selectedTrail, setSelectedTrail] = useState<TrailRoute>(MOCK_TRAILS[0]);

  // GPS & Position State
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('simulating');
  const [currentCoords, setCurrentCoords] = useState<Coordinates>({
    latitude: MOCK_TRAILS[0].coordinates[0][0],
    longitude: MOCK_TRAILS[0].coordinates[0][1],
    altitude: MOCK_TRAILS[0].baseElevationM,
    accuracy: 8,
    heading: 45,
    speed: 1.2,
    timestamp: Date.now()
  });

  // Trail Simulation State (indoor / testing fallback)
  const [simulationIndex, setSimulationIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Breadcrumbs & Session
  const [breadcrumbs, setBreadcrumbs] = useState<Coordinates[]>([]);
  const [currentSession, setCurrentSession] = useState<HikeSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<HikeSession[]>(getSavedSessions);

  // Weather & Risk
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [currentSlope, setCurrentSlope] = useState<number>(12);
  const [mlPrediction, setMlPrediction] = useState<TerrainRiskPrediction | null>(null);
  const [mlLoading, setMlLoading] = useState<boolean>(false);
  const [mlError, setMlError] = useState<string | null>(null);

  // Hazards & Safe Places
  const [customHazards, setCustomHazards] = useState<HazardReport[]>(getCustomHazards);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [gpsDeniedAlert, setGpsDeniedAlert] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isFloatingWindowOpen, setIsFloatingWindowOpen] = useState<boolean>(true);

  // Network & Offline Connectivity State
  const [isNetworkOffline, setIsNetworkOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const isEffectivelyOffline = isNetworkOffline || isSimulatedOffline;

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => setIsNetworkOffline(false);
    const handleOffline = () => setIsNetworkOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Connection retry handler
  const handleRetryConnection = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setIsNetworkOffline(false);
      setIsSimulatedOffline(false);
      await loadWeather(currentCoords);
    } else {
      setIsNetworkOffline(true);
    }
  };

  const emergencyContacts = getEmergencyContacts();

  const allHazards = [
    ...(selectedTrail ? selectedTrail.knownHazards : []),
    ...customHazards
  ];

  const allSafePoints: SafeLocation[] = selectedTrail ? selectedTrail.safePoints : [];

  // Toggle Outdoor High-Visibility Mode
  const handleToggleOutdoorMode = () => {
    const nextVal = !settings.outdoorHighContrast;
    const updated = { ...settings, outdoorHighContrast: nextVal };
    setSettings(updated);
    saveUserSettings(updated);
    if (nextVal) {
      document.body.classList.add('outdoor-mode');
    } else {
      document.body.classList.remove('outdoor-mode');
    }
  };

  // Toggle Units
  const handleToggleUnits = () => {
    const nextUnits: 'metric' | 'imperial' = settings.units === 'metric' ? 'imperial' : 'metric';
    const updated = { ...settings, units: nextUnits };
    setSettings(updated);
    saveUserSettings(updated);
  };

  useEffect(() => {
    document.body.classList.toggle('outdoor-mode', settings.outdoorHighContrast);
    return () => document.body.classList.remove('outdoor-mode');
  }, [settings.outdoorHighContrast]);

  // Fetch Weather
  const loadWeather = useCallback(async (coords: Coordinates) => {
    setWeatherLoading(true);
    try {
      const data = await fetchLiveWeather(coords);
      setWeather(data);
    } catch (err) {
      console.error('Weather load error:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(currentCoords);
  }, [selectedTrail.id]);

  // Recalculate Risk Engine
  useEffect(() => {
    const distFraction = simulationIndex / Math.max(1, selectedTrail.coordinates.length - 1);
    const elev = selectedTrail.baseElevationM + (selectedTrail.maxElevationM - selectedTrail.baseElevationM) * Math.sin(distFraction * Math.PI);
    
    const baseSlope = selectedTrail.difficulty === 'Extreme' ? 26 : selectedTrail.difficulty === 'Hard' ? 18 : 12;
    const nextSlope = Math.round(baseSlope + Math.sin(simulationIndex) * 8);
    setCurrentSlope(nextSlope);

    const assessment = calculateTerrainRisk({
      coordinates: {
        ...currentCoords,
        altitude: elev
      },
      weather,
      slopeDegrees: nextSlope,
      trailDifficulty: selectedTrail.difficulty,
      activeHazards: allHazards,
      gpsAccuracyMeters: currentCoords.accuracy,
      previousLevel: riskAssessment?.level
    });

    setRiskAssessment(assessment);
  }, [currentCoords, weather, allHazards.length, selectedTrail.id, simulationIndex]);

  // ML Terrain Risk Prediction
  useEffect(() => {
    let cancelled = false;

    const runTerrainModel = async () => {
      setMlLoading(true);
      setMlError(null);

      try {
        const terrainType = selectedTrail.difficulty === 'Extreme'
          ? 'scree'
          : selectedTrail.difficulty === 'Hard'
            ? 'rocky'
            : selectedTrail.difficulty === 'Moderate'
              ? 'mixed'
              : 'forest';

        const prediction = await predictTerrainRisk({
          elevation: Number(currentCoords.altitude || selectedTrail.baseElevationM),
          slope: currentSlope,
          temperature: weather?.temperature ?? 15,
          humidity: weather?.humidity ?? 55,
          rainfall: weather?.precipitation ?? 0,
          wind_speed: weather?.windSpeed ?? 15,
          earthquake_activity: Math.min(1, allHazards.filter((h) => h.type === 'rockfall').length / 10),
          historical_incidents: Math.min(12, selectedTrail.knownHazards.length),
          terrain_type: terrainType,
        });

        if (!cancelled) setMlPrediction(prediction);
      } catch (error: any) {
        if (!cancelled) {
          setMlPrediction(null);
          setMlError(error?.message || 'ML service unavailable');
        }
      } finally {
        if (!cancelled) setMlLoading(false);
      }
    };

    const timer = window.setTimeout(runTerrainModel, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentCoords.altitude, currentSlope, weather?.temperature, weather?.humidity, weather?.precipitation, weather?.windSpeed, selectedTrail.id, selectedTrail.difficulty, selectedTrail.baseElevationM, selectedTrail.knownHazards.length, allHazards.length]);

  // Browser Geolocation Watcher
  const watchIdRef = useRef<number | null>(null);

  const startBrowserGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      setGpsDeniedAlert(true);
      return;
    }

    setGpsStatus('requesting');
    setIsSimulating(false);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };
        setCurrentCoords(coords);
        setGpsStatus('tracking');
        setGpsDeniedAlert(false);

        if (currentSession && currentSession.status === 'active') {
          handleNewLocationPoint(coords);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatus('denied');
        setGpsDeniedAlert(true);
        setIsSimulating(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  };

  const stopBrowserGps = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Trail Simulation Stepper
  const stepSimulation = useCallback(() => {
    if (!selectedTrail || selectedTrail.coordinates.length === 0) return;

    setSimulationIndex((prev) => {
      const nextIdx = (prev + 1) % selectedTrail.coordinates.length;
      const point = selectedTrail.coordinates[nextIdx];
      const distFraction = nextIdx / (selectedTrail.coordinates.length - 1);
      const elev = selectedTrail.baseElevationM + (selectedTrail.maxElevationM - selectedTrail.baseElevationM) * Math.sin(distFraction * Math.PI);

      const nextCoords: Coordinates = {
        latitude: point[0],
        longitude: point[1],
        altitude: elev,
        accuracy: 6 + Math.round(Math.random() * 4),
        heading: (prev * 35) % 360,
        speed: 1.1 + Math.random() * 0.4,
        timestamp: Date.now()
      };

      setCurrentCoords(nextCoords);
      handleNewLocationPoint(nextCoords);

      return nextIdx;
    });
  }, [selectedTrail, currentSession]);

  useEffect(() => {
    if (isSimulating && gpsStatus === 'simulating' && currentSession?.status === 'active') {
      simulationTimerRef.current = setInterval(stepSimulation, 3000);
    } else {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    }
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [isSimulating, gpsStatus, currentSession?.status, stepSimulation]);

  // Record Location Breadcrumbs
  const handleNewLocationPoint = (newPt: Coordinates) => {
    setBreadcrumbs((prev) => {
      if (prev.length === 0) return [newPt];
      const lastPt = prev[prev.length - 1];
      const distDelta = getHaversineDistance(lastPt, newPt);
      if (distDelta < 2) return prev;

      if (currentSession && currentSession.status === 'active') {
        const altDelta = Math.max(0, (newPt.altitude || 0) - (lastPt.altitude || 0));
        setCurrentSession((curr) => {
          if (!curr) return null;
          return {
            ...curr,
            distanceMeters: curr.distanceMeters + distDelta,
            elevationGainM: curr.elevationGainM + altDelta,
            currentElevationM: newPt.altitude || curr.currentElevationM,
            maxElevationM: Math.max(curr.maxElevationM, newPt.altitude || 0),
            breadcrumbs: [...curr.breadcrumbs, newPt]
          };
        });
      }

      return [...prev, newPt];
    });
  };

  // Session Duration Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentSession && currentSession.status === 'active') {
      timer = setInterval(() => {
        setCurrentSession((curr) => {
          if (!curr) return null;
          return {
            ...curr,
            durationSeconds: curr.durationSeconds + 1
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentSession?.status]);

  // Session Control Handlers
  const handleStartSession = () => {
    const newSession: HikeSession = {
      id: `session-${Date.now()}`,
      trailId: selectedTrail.id,
      trailName: selectedTrail.name,
      startTime: Date.now(),
      status: 'active',
      durationSeconds: 0,
      distanceMeters: 0,
      elevationGainM: 0,
      currentElevationM: currentCoords.altitude || selectedTrail.baseElevationM,
      maxElevationM: currentCoords.altitude || selectedTrail.baseElevationM,
      avgSpeedKmh: 3.6,
      maxRiskLevel: riskAssessment?.level || 'low',
      breadcrumbs: [currentCoords]
    };
    setCurrentSession(newSession);
    setBreadcrumbs([currentCoords]);
  };

  const handlePauseSession = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'paused' });
    }
  };

  const handleResumeSession = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'active' });
    }
  };

  const handleEndSession = () => {
    if (!currentSession) return;
    const completedSession: HikeSession = {
      ...currentSession,
      endTime: Date.now(),
      status: 'completed',
      maxRiskLevel: riskAssessment?.level || currentSession.maxRiskLevel
    };
    saveHikeSession(completedSession);
    setSavedSessions(getSavedSessions());
    setCurrentSession(null);
  };

  const handleDeleteSession = (id: string) => {
    deleteHikeSession(id);
    setSavedSessions(getSavedSessions());
  };

  const handleAddHazard = (newHz: HazardReport) => {
    addCustomHazard(newHz);
    setCustomHazards(getCustomHazards());
  };

  const handleVerifyHazard = (id: string) => {
    setCustomHazards((prev) =>
      prev.map((h) => (h.id === id ? { ...h, verifiedCount: h.verifiedCount + 1 } : h))
    );
  };

  const handleSelectTrail = (trail: TrailRoute) => {
    setSelectedTrail(trail);
    setSimulationIndex(0);
    const startPoint = trail.coordinates[0];
    const newCoords: Coordinates = {
      latitude: startPoint[0],
      longitude: startPoint[1],
      altitude: trail.baseElevationM,
      accuracy: 8,
      heading: 0,
      speed: 0,
      timestamp: Date.now()
    };
    setCurrentCoords(newCoords);
    setBreadcrumbs([newCoords]);
    loadWeather(newCoords);
  };

  if (showLandingPage) {
    return (
      <LandingPage
        onLaunchHUD={() => {
          setShowLandingPage(false);
          setActiveTab('vision');
        }}
        onOpenMap={() => {
          setShowLandingPage(false);
          setActiveTab('map');
        }}
        onOpenRisk={() => {
          setShowLandingPage(false);
          setActiveTab('risk');
        }}
        onOpenSafety={() => {
          setShowLandingPage(false);
          setActiveTab('safety');
        }}
        onOpenChat={() => {
          setShowLandingPage(false);
          setIsChatOpen(true);
        }}
        activeTrail={selectedTrail}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-16 md:pb-0">
      {/* Strict Top Bar Contract Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        outdoorMode={settings.outdoorHighContrast}
        onToggleOutdoorMode={handleToggleOutdoorMode}
        units={settings.units}
        onToggleUnits={handleToggleUnits}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        showLandingPage={showLandingPage}
        onToggleLandingPage={() => setShowLandingPage(true)}
        isFloatingWindowOpen={isFloatingWindowOpen}
        onToggleFloatingWindow={() => setIsFloatingWindowOpen(w => !w)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
        {/* Offline Connectivity Banner */}
        <OfflineConnectivityBanner
          isOffline={isEffectivelyOffline}
          onRetryConnection={handleRetryConnection}
          isSimulatedOffline={isSimulatedOffline}
          onToggleSimulateOffline={() => setIsSimulatedOffline(v => !v)}
        />

          {/* Real-Time Natural & Geological Hazards Monitor (Earthquakes / Landslides / Flash Floods) */}
          <NaturalHazardAlerts
            currentCoords={currentCoords}
            elevationMeters={currentCoords.altitude || selectedTrail.baseElevationM}
          />

        {/* GPS Permission Warning Banner if Denied */}
        {gpsDeniedAlert && (
          <div className="bg-amber-950/60 border border-amber-500/60 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Device GPS permission was denied or is unavailable. Switched to high-precision trail simulation mode ({selectedTrail.name}) so you can explore all features safely.
              </span>
            </div>
            <button
              onClick={() => setGpsDeniedAlert(false)}
              className="p-1 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1 (MAIN / CAMERA FIRST): Ground Hazard Vision HUD */}
        {activeTab === 'vision' && (
          <div className="space-y-4">
            {/* Quick Context Bar */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Target Trail:</span>
                <strong className="text-stone-100">{selectedTrail.name}</strong>
                <span className="text-stone-600">·</span>
                <span className="text-amber-400 font-mono">{selectedTrail.difficulty} Difficulty</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('map')}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md font-medium transition-colors border border-stone-700 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Switch to Tactical Map</span>
                </button>
              </div>
            </div>

            {/* Primary Camera-First HUD */}
            <GroundVision
              currentCoords={currentCoords}
              onLogHazardToMap={handleAddHazard}
              onNavigateToMap={() => setActiveTab('map')}
            />
          </div>
        )}

        {/* TAB 2: Tactical Map (Crisp, Neat, High-Performance) */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* Trail & GPS Selector Ribbon */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-medium">Selected Mountain Trail:</span>
                <select
                  value={selectedTrail.id}
                  onChange={(e) => {
                    const t = MOCK_TRAILS.find((x) => x.id === e.target.value);
                    if (t) handleSelectTrail(t);
                  }}
                  className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 font-semibold text-stone-200 focus:outline-none focus:border-emerald-500"
                >
                  {MOCK_TRAILS.map((trail) => (
                    <option key={trail.id} value={trail.id}>
                      {trail.name} ({trail.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (gpsStatus === 'tracking') {
                      stopBrowserGps();
                      setGpsStatus('simulating');
                      setIsSimulating(true);
                    } else {
                      startBrowserGps();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border ${
                    gpsStatus === 'tracking'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {gpsStatus === 'tracking' ? 'Live Satellite GPS' : 'Connect Device GPS'}
                </button>

                {isSimulating && (
                  <button
                    onClick={stepSimulation}
                    className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                    title="Advance to next trail waypoint"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Advance Step</span>
                  </button>
                )}
              </div>
            </div>

            {/* Split View: Tactical Map + Hike Session Recorder */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8">
                <TacticalMap
                  currentCoords={currentCoords}
                  trail={selectedTrail}
                  breadcrumbs={breadcrumbs}
                  hazards={allHazards}
                  safePoints={allSafePoints}
                  isTracking={gpsStatus === 'tracking' || (isSimulating && currentSession?.status === 'active')}
                  isOffline={isEffectivelyOffline}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  units={settings.units}
                />
              </div>

              <div className="lg:col-span-4 space-y-4">
                {/* Active Hike Session Recorder */}
                <SessionTracker
                  currentSession={currentSession}
                  onStartSession={handleStartSession}
                  onPauseSession={handlePauseSession}
                  onResumeSession={handleResumeSession}
                  onEndSession={handleEndSession}
                  savedSessions={savedSessions}
                  onDeleteSession={handleDeleteSession}
                  units={settings.units}
                />

                {/* Quick Camera Shortcut */}
                <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-200 font-bold">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Inspect Ground Hazard Ahead</span>
                  </div>
                  <p className="text-stone-400 text-[11px] leading-relaxed">
                    Encountered suspicious scree, slick algae, or loose rock? Switch directly to the Vision HUD to assess ground friction.
                  </p>
                  <button
                    onClick={() => setActiveTab('vision')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    Launch Ground Vision HUD
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Risk & Mountain Weather Hub */}
        {activeTab === 'risk' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Top Summary */}
            <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-stone-100 mb-1">
                Risk Engine & Mountain Telemetry
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                Combines transparent 5-factor mathematical weighting (Slope 25%, Weather 20%, Trail Condition 20%, Known Hazards 20%, Elevation 15%) with live meteorological readings.
              </p>
            </div>

            {/* Risk Engine Card */}
            {riskAssessment && (
              <RiskEngineCard assessment={riskAssessment} />
            )}

            <TerrainMLCard
              prediction={mlPrediction}
              loading={mlLoading}
              error={mlError}
            />

            {/* Live Weather Widget */}
            <WeatherWidget
              weather={weather}
              isLoading={weatherLoading}
              onRefresh={() => loadWeather(currentCoords)}
              units={settings.units}
            />

            {/* Crowdsourced Hazards Log */}
            <HazardsList
              hazards={allHazards}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onVerifyHazard={handleVerifyHazard}
            />

            {/* Persistent Firestore Historical Incidents Archive */}
            <HistoricalIncidentDatabase
              trailId={selectedTrail.id}
              trailName={selectedTrail.name}
              currentCoords={currentCoords}
            />
          </div>
        )}

        {/* TAB 4: Safety & Emergency SOS Hub */}
        {activeTab === 'safety' && (
          <div className="max-w-3xl mx-auto">
            <SafetyCenter
              currentCoords={currentCoords}
              safePoints={allSafePoints}
              emergencyContacts={emergencyContacts}
              elevationMeters={currentCoords.altitude || selectedTrail.baseElevationM}
            />
          </div>
        )}
      </main>

      {/* Floating Tactical Picture-in-Picture Window HUD */}
      <FloatingWindowHUD
        isOpen={isFloatingWindowOpen}
        onClose={() => setIsFloatingWindowOpen(false)}
        currentCoords={currentCoords}
        onOpenFullHUD={() => {
          setShowLandingPage(false);
          setActiveTab('vision');
          setIsFloatingWindowOpen(false);
        }}
      />

      {/* Hazard Reporting Modal */}
      {isReportModalOpen && (
        <HazardReportingModal
          currentCoords={currentCoords}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleAddHazard}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasCriticalAlert={riskAssessment?.level === 'critical'}
      />

      {/* Floating Ranger AI Copilot Button (Direct Thumb Access) */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-18 md:bottom-6 right-4 md:right-6 z-40 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-xs transition-transform hover:scale-105 border border-emerald-400/50"
        title="Open Ranger AI Copilot"
      >
        <Bot className="w-4 h-4 text-white" />
        <span className="hidden sm:inline">Ranger AI</span>
      </button>

      {/* Ranger AI Chat Dialog */}
      <RangerAiChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentCoords={currentCoords}
        elevationMeters={currentCoords.altitude || selectedTrail.baseElevationM}
        weatherSummary={weather ? `${weather.condition}, ${weather.temperature}°C, ${weather.windSpeed}km/h winds` : undefined}
        riskLevel={riskAssessment?.level}
      />
    </div>
  );
}
