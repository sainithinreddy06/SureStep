import { Coordinates, HazardReport, RiskAssessment, RiskFactor, RiskLevel, WeatherData } from '../types';

interface RiskEngineInputs {
  coordinates: Coordinates;
  weather: WeatherData | null;
  slopeDegrees?: number; // e.g. 0 to 45 deg
  trailDifficulty?: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  activeHazards: HazardReport[];
  gpsAccuracyMeters?: number | null;
  previousLevel?: RiskLevel;
  previousTimestamp?: number;
}

// Cooldown buffer to prevent jittery transitions
const HYSTERESIS_BUFFER = 3; // points required to cross threshold downwards

export function calculateTerrainRisk(inputs: RiskEngineInputs): RiskAssessment {
  const {
    coordinates,
    weather,
    slopeDegrees = 14,
    trailDifficulty = 'Moderate',
    activeHazards,
    gpsAccuracyMeters = 8,
    previousLevel
  } = inputs;

  const penalties: string[] = [];
  let confidence = 100;

  // 1. Evaluate Slope / Grade (25%)
  // Gentle (<8°): 10-25; Moderate (8°-18°): 25-50; Steep (18°-30°): 50-80; Extreme (>30°): 85-100
  let slopeScore = Math.min(100, Math.round((Math.max(0, slopeDegrees) / 38) * 100));
  let slopeSummary = `Slope measured at ~${Math.round(slopeDegrees)}° grade. `;
  if (slopeDegrees > 28) {
    slopeScore = Math.max(85, slopeScore);
    slopeSummary += 'Steep technical grade, heightened slip and slide potential.';
  } else if (slopeDegrees > 16) {
    slopeSummary += 'Moderate alpine incline. Trekking poles advised for knee stabilization.';
  } else {
    slopeSummary += 'Mild grade; stable horizontal purchase under normal conditions.';
  }

  // 2. Evaluate Weather Factor (20%)
  let weatherScore = 15;
  let weatherSummary = 'Clear conditions with low atmospheric risk.';
  if (!weather) {
    confidence -= 25;
    penalties.push('Live weather unavailable (confidence -25%)');
    weatherScore = 40;
    weatherSummary = 'No live meteorological feed; unverified mountain atmospheric risk.';
  } else {
    if (weather.isStale) {
      confidence -= 15;
      penalties.push('Weather reading stale (>1h old, confidence -15%)');
    }

    let wScore = 10;
    if (weather.condition === 'thunderstorm') {
      wScore = 95;
      weatherSummary = 'Active or imminent thunderstorm. Lightning strike exposure on ridges is life-threatening.';
    } else if (weather.condition === 'snow' || weather.condition === 'fog') {
      wScore = 75;
      weatherSummary = 'Severe visibility reduction and frozen ground traction penalty.';
    } else if (weather.condition === 'rain') {
      wScore = 65;
      weatherSummary = 'Wet precipitation reducing granite friction and softening trail verges.';
    } else if (weather.windGusts >= 50) {
      wScore = 70;
      weatherSummary = `High wind gusts up to ${weather.windGusts} km/h threatening balance on narrow passes.`;
    } else if (weather.windSpeed >= 30) {
      wScore = 45;
      weatherSummary = `Sustained wind at ${weather.windSpeed} km/h; rapid cooling and wind-chill stress.`;
    } else if (weather.temperature <= 0) {
      wScore = 60;
      weatherSummary = `Freezing ambient temperature (${weather.temperature}°C). Black ice hazard.`;
    } else {
      wScore = Math.min(30, Math.round(weather.precipitationProbability * 0.3));
      weatherSummary = `Favorable ambient weather (${weather.temperature}°C, ${weather.windSpeed} km/h wind).`;
    }
    weatherScore = wScore;
  }

  // 3. Evaluate Terrain & Trail Condition (20%)
  let terrainScore = 20;
  let terrainSummary = 'Solid bedrock and packed single-track with reliable purchase.';
  if (trailDifficulty === 'Extreme') {
    terrainScore = 90;
    terrainSummary = 'Technical exposure, knife-edge ridgelines, and unroped scrambling zones.';
  } else if (trailDifficulty === 'Hard') {
    terrainScore = 65;
    terrainSummary = 'Uneven mountain surface with loose gravel, tree root steps, and talus sections.';
  } else if (trailDifficulty === 'Moderate') {
    terrainScore = 38;
    terrainSummary = 'Standard alpine trail with occasional gravel stretches and root obstacles.';
  }

  // 4. Evaluate Known Hazards in Proximity (20%)
  let hazardScore = 10;
  let hazardSummary = 'No active critical hazards reported within 1,000m corridor.';

  // Check nearby hazards
  const nearbyCritical = activeHazards.filter(h => h.severity === 'critical');
  const nearbyHigh = activeHazards.filter(h => h.severity === 'high');
  const nearbyModerate = activeHazards.filter(h => h.severity === 'moderate');

  if (nearbyCritical.length > 0) {
    hazardScore = 92;
    hazardSummary = `CRITICAL HAZARD IN PROXIMITY: ${nearbyCritical[0].title}. Verified by ${nearbyCritical[0].verifiedCount} reports.`;
  } else if (nearbyHigh.length > 0) {
    hazardScore = 72;
    hazardSummary = `High severity alert active: ${nearbyHigh[0].title}. Caution mandatory.`;
  } else if (nearbyModerate.length > 0) {
    hazardScore = 48;
    hazardSummary = `Moderate obstacle reported: ${nearbyModerate[0].title}.`;
  }

  // 5. Evaluate Elevation & Exposure (15%)
  const elevationMeters = coordinates.altitude || (weather?.elevation ?? 1600);
  let elevationScore = 15;
  let elevationSummary = `Altitude at ${Math.round(elevationMeters)}m. Normal oxygenation zone.`;

  if (elevationMeters >= 3500) {
    elevationScore = 85;
    elevationSummary = `High altitude (${Math.round(elevationMeters)}m). Acute mountain sickness (AMS) risk and severe environmental exposure.`;
  } else if (elevationMeters >= 2500) {
    elevationScore = 60;
    elevationSummary = `Moderate alpine altitude (${Math.round(elevationMeters)}m). Subalpine thin air and rapid microclimate volatility.`;
  } else if (elevationMeters >= 1800) {
    elevationScore = 35;
    elevationSummary = `Subalpine threshold (${Math.round(elevationMeters)}m). Increased UV radiation and wind exposure.`;
  }

  // GPS Accuracy penalty
  if (!gpsAccuracyMeters || gpsAccuracyMeters > 35) {
    confidence -= 20;
    penalties.push(`Degraded GPS accuracy (±${gpsAccuracyMeters ? Math.round(gpsAccuracyMeters) : 50}m, confidence -20%)`);
  }

  confidence = Math.max(20, Math.min(100, confidence));

  // Compute weighted sum
  // Slope: 25%, Weather: 20%, Terrain: 20%, Hazards: 20%, Elevation: 15%
  const factors: RiskFactor[] = [
    {
      id: 'slope',
      label: 'Slope & Grade',
      weight: 0.25,
      score: slopeScore,
      weightedScore: Math.round(slopeScore * 0.25 * 10) / 10,
      summary: slopeSummary
    },
    {
      id: 'weather',
      label: 'Weather & Wind',
      weight: 0.20,
      score: weatherScore,
      weightedScore: Math.round(weatherScore * 0.20 * 10) / 10,
      summary: weatherSummary
    },
    {
      id: 'terrain',
      label: 'Trail Condition',
      weight: 0.20,
      score: terrainScore,
      weightedScore: Math.round(terrainScore * 0.20 * 10) / 10,
      summary: terrainSummary
    },
    {
      id: 'hazards',
      label: 'Reported Hazards',
      weight: 0.20,
      score: hazardScore,
      weightedScore: Math.round(hazardScore * 0.20 * 10) / 10,
      summary: hazardSummary
    },
    {
      id: 'elevation',
      label: 'Elevation & Exposure',
      weight: 0.15,
      score: elevationScore,
      weightedScore: Math.round(elevationScore * 0.15 * 10) / 10,
      summary: elevationSummary
    }
  ];

  let rawTotal = factors.reduce((acc, f) => acc + f.weightedScore, 0);
  rawTotal = Math.max(5, Math.min(100, Math.round(rawTotal)));

  // Determine Level with Hysteresis
  let level: RiskLevel = 'low';
  if (rawTotal >= 80) {
    level = 'critical';
  } else if (rawTotal >= 60) {
    level = 'high';
  } else if (rawTotal >= 30) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  // Prevent flapping downwards if previous state was higher and change is within hysteresis window
  let cooldownActive = false;
  if (previousLevel && previousLevel !== level) {
    const ranks: Record<RiskLevel, number> = { low: 1, moderate: 2, high: 3, critical: 4 };
    if (ranks[level] < ranks[previousLevel]) {
      // If moving down, check if raw score is within hysteresis threshold of lower bracket
      const thresholds: Record<RiskLevel, number> = { low: 0, moderate: 30, high: 60, critical: 80 };
      const currentThreshold = thresholds[previousLevel];
      if (rawTotal >= currentThreshold - HYSTERESIS_BUFFER) {
        level = previousLevel; // Hold prior elevated level for safety damping
        cooldownActive = true;
      }
    }
  }

  // Recommendation generator based on dominant factor
  let recommendation = 'Standard hiking caution: maintain situational awareness, hydrate, and verify your turnback timeline.';
  if (level === 'critical') {
    recommendation = 'HALT OR RETREAT: Terrain or atmospheric risk is critical. Do not attempt unroped exposed sections. Seek shelter or reverse along known route.';
  } else if (level === 'high') {
    if (hazardScore >= 70) {
      recommendation = 'HAZARD AHEAD: Active hazard reported in your immediate path. Slow pace, scout foot placement, and do not cross unstable debris.';
    } else if (weatherScore >= 65) {
      recommendation = 'WEATHER THREAT: High winds or wet precipitation significantly reducing traction. Prepare rain gear and watch for slick rock slabs.';
    } else if (slopeScore >= 70) {
      recommendation = 'STEEP INCLINE: Utilize trekking poles, secure foot placement on firm rock or steps, and maintain safe spacing behind other hikers.';
    } else {
      recommendation = 'HIGH EXPOSURE: Exercise heightened vigilance. Stay centered on trail, avoid edge margins, and evaluate energy levels.';
    }
  } else if (level === 'moderate') {
    recommendation = 'MODERATE CONDITIONS: Terrain contains uneven surfaces and moderate grade. Maintain steady pace and stay alert for trail markers.';
  }

  return {
    overallScore: rawTotal,
    level,
    confidence,
    confidencePenalties: penalties,
    factors,
    primaryRecommendation: recommendation,
    cooldownActive,
    timestamp: Date.now()
  };
}
