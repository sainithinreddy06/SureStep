from pathlib import Path
from typing import Literal

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'models' / 'terrain_risk_model.joblib'

app = FastAPI(
    title='TerraGuard AI ML Service',
    description='Terrain and backcountry risk prediction service for TerraGuard AI.',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

artifact = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None
model = artifact.get('model') if isinstance(artifact, dict) else artifact

FEATURES = [
    'elevation',
    'slope',
    'temperature',
    'humidity',
    'rainfall',
    'wind_speed',
    'earthquake_activity',
    'historical_incidents',
    'terrain_type',
]

TERRAIN_ENCODING = {
    'forest': 0,
    'mixed': 1,
    'rocky': 2,
    'scree': 3,
    'snow': 4,
}

class RiskRequest(BaseModel):
    elevation: float = Field(default=1800, ge=-500, le=10000)
    slope: float = Field(default=12, ge=0, le=90)
    temperature: float = Field(default=15, ge=-50, le=60)
    humidity: float = Field(default=55, ge=0, le=100)
    rainfall: float = Field(default=0, ge=0, le=500)
    wind_speed: float = Field(default=15, ge=0, le=250)
    earthquake_activity: float = Field(default=0, ge=0, le=1)
    historical_incidents: float = Field(default=0, ge=0, le=100)
    terrain_type: str = 'mixed'

class RiskResponse(BaseModel):
    risk_score: int
    risk_level: Literal['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
    confidence: int
    top_factors: list[str]
    model: str
    model_version: str


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def fallback_prediction(payload: RiskRequest) -> float:
    terrain_score = {
        'forest': 15,
        'mixed': 30,
        'rocky': 55,
        'scree': 72,
        'snow': 78,
    }.get(payload.terrain_type.lower(), 30)

    score = (
        clamp(payload.slope / 35 * 100, 0, 100) * 0.24
        + clamp((payload.rainfall / 25) * 100, 0, 100) * 0.16
        + clamp((payload.wind_speed / 60) * 100, 0, 100) * 0.12
        + clamp(payload.humidity, 0, 100) * 0.08
        + terrain_score * 0.16
        + clamp(payload.elevation / 3500 * 100, 0, 100) * 0.08
        + clamp(payload.earthquake_activity * 100, 0, 100) * 0.10
        + clamp(payload.historical_incidents / 10 * 100, 0, 100) * 0.06
    )
    return clamp(score, 0, 100)


def build_features(payload: RiskRequest):
    terrain = TERRAIN_ENCODING.get(payload.terrain_type.lower(), TERRAIN_ENCODING['mixed'])
    return [[
        payload.elevation,
        payload.slope,
        payload.temperature,
        payload.humidity,
        payload.rainfall,
        payload.wind_speed,
        payload.earthquake_activity,
        payload.historical_incidents,
        terrain,
    ]]


def get_level(score: float) -> str:
    if score >= 85:
        return 'CRITICAL'
    if score >= 65:
        return 'HIGH'
    if score >= 40:
        return 'MODERATE'
    return 'LOW'


def get_factors(payload: RiskRequest):
    factors = []
    if payload.slope >= 25:
        factors.append('Steep terrain slope')
    if payload.rainfall >= 5:
        factors.append('Recent precipitation')
    if payload.wind_speed >= 35:
        factors.append('Strong wind conditions')
    if payload.earthquake_activity >= 0.35:
        factors.append('Elevated seismic activity')
    if payload.historical_incidents >= 4:
        factors.append('Historical incidents in the area')
    if payload.terrain_type.lower() in {'scree', 'snow'}:
        factors.append(f'{payload.terrain_type.title()} terrain')
    if not factors:
        factors.append('No dominant high-risk input detected')
    return factors[:4]


@app.get('/health')
def health():
    return {
        'status': 'healthy',
        'model_loaded': model is not None,
        'model': 'Random Forest',
        'model_version': 'TG-RISK-1.0',
    }


@app.post('/predict-risk', response_model=RiskResponse)
def predict_risk(payload: RiskRequest):
    if model is not None:
        prediction = float(model.predict(build_features(payload))[0])
        score = clamp(prediction, 0, 100)
        tree_predictions = np.array([tree.predict(build_features(payload))[0] for tree in model.estimators_])
        uncertainty = float(np.std(tree_predictions))
        confidence = int(round(clamp(96 - uncertainty * 2.5, 65, 96)))
    else:
        score = fallback_prediction(payload)
        confidence = 68

    return RiskResponse(
        risk_score=round(score),
        risk_level=get_level(score),
        confidence=confidence,
        top_factors=get_factors(payload),
        model='Random Forest' if model is not None else 'Rule-based fallback',
        model_version='TG-RISK-1.0',
    )
