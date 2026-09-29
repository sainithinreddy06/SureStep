/**
 * TerraGuard AI - Types and Interfaces
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export type GpsStatus = 
  | 'idle' 
  | 'requesting' 
  | 'tracking' 
  | 'paused' 
  | 'denied' 
  | 'unavailable' 
  | 'simulating';

export type WeatherCondition = 
  | 'sunny' 
  | 'partly_cloudy' 
  | 'cloudy' 
  | 'rain' 
  | 'thunderstorm' 
  | 'snow' 
  | 'fog' 
  | 'windy';

export interface WeatherData {
  temperature: number; // Celsius
  apparentTemperature: number;
  condition: WeatherCondition;
  weatherCode: number;
  windSpeed: number; // km/h
  windGusts: number; // km/h
  humidity: number; // %
  precipitation: number; // mm
  precipitationProbability: number; // %
  uvIndex: number;
  elevation: number; // meters
  lastUpdated: number; // epoch ms
  isStale: boolean;
  provider: 'Open-Meteo' | 'Cached Backup' | 'Custom API';
  warnings: string[];
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskFactor {
  id: 'slope' | 'weather' | 'terrain' | 'hazards' | 'elevation';
  label: string;
  weight: number; // e.g. 0.25
  score: number; // 0 to 100
  weightedScore: number;
  summary: string;
}

export interface RiskAssessment {
  overallScore: number; // 0 to 100
  level: RiskLevel;
  confidence: number; // 0 to 100
  confidencePenalties: string[];
  factors: RiskFactor[];
  primaryRecommendation: string;
  cooldownActive: boolean;
  timestamp: number;
}

export type HazardType = 
  | 'rockfall' 
  | 'scree' 
  | 'mud' 
  | 'ice' 
  | 'water' 
  | 'wildlife' 
  | 'trail_damage' 
  | 'other';

export type HazardSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface HazardReport {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  title: string;
  description: string;
  coordinates: Coordinates;
  reportedAt: number;
  verifiedCount: number;
  distanceFromUserMeters?: number;
}

export type SafeLocationType = 
  | 'ranger_station' 
  | 'shelter' 
  | 'medical_point' 
  | 'trailhead' 
  | 'water_source';

export interface SafeLocation {
  id: string;
  name: string;
  type: SafeLocationType;
  coordinates: Coordinates;
  distanceFromUserMeters?: number;
  emergencyContact?: string;
  amenities: string[];
  operatingHours?: string;
}

export interface TrailRoute {
  id: string;
  name: string;
  region: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  lengthKm: number;
  elevationGainM: number;
  baseElevationM: number;
  maxElevationM: number;
  coordinates: [number, number][]; // [lat, lng]
  elevationProfile: { distanceKm: number; elevationM: number }[];
  knownHazards: HazardReport[];
  safePoints: SafeLocation[];
}

export interface HikeSession {
  id: string;
  trailId?: string;
  trailName: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed';
  durationSeconds: number;
  distanceMeters: number;
  elevationGainM: number;
  currentElevationM: number;
  maxElevationM: number;
  avgSpeedKmh: number;
  maxRiskLevel: RiskLevel;
  breadcrumbs: Coordinates[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface GroundVisionResult {
  status: 'assessed' | 'unable_to_assess';
  hazardScore?: number;
  detectedIssues: string[];
  confidence: number;
  advice: string;
  timestamp: number;
  imageUrl?: string;
}
