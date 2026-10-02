export interface TerrainRiskInput {
  elevation: number;
  slope: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  earthquake_activity: number;
  historical_incidents: number;
  terrain_type: string;
}

export interface TerrainRiskPrediction {
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  top_factors: string[];
  model: string;
  model_version: string;
}

export async function predictTerrainRisk(input: TerrainRiskInput): Promise<TerrainRiskPrediction> {
  const response = await fetch('/api/ml/predict-risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || error?.error || 'ML prediction failed');
  }

  return response.json();
}
