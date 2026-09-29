from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / 'models'
MODEL_DIR.mkdir(parents=True, exist_ok=True)

rng = np.random.default_rng(42)
N = 2400

elevation = rng.uniform(500, 4200, N)
slope = rng.uniform(2, 42, N)
temperature = rng.uniform(-8, 38, N)
humidity = rng.uniform(20, 100, N)
rainfall = np.clip(rng.gamma(1.4, 4.5, N), 0, 45)
wind_speed = np.clip(rng.normal(22, 14, N), 0, 90)
earthquake_activity = rng.beta(1.2, 7, N)
historical_incidents = np.clip(rng.poisson(1.8, N), 0, 12)
terrain_type = rng.integers(0, 5, N)

# Transparent baseline target function used only to bootstrap the demo model.
terrain_risk = np.choose(terrain_type, [15, 30, 55, 72, 78])
score = (
    np.clip(slope / 35 * 100, 0, 100) * 0.24
    + np.clip(rainfall / 25 * 100, 0, 100) * 0.16
    + np.clip(wind_speed / 60 * 100, 0, 100) * 0.12
    + humidity * 0.08
    + terrain_risk * 0.16
    + np.clip(elevation / 3500 * 100, 0, 100) * 0.08
    + np.clip(earthquake_activity * 100, 0, 100) * 0.10
    + np.clip(historical_incidents / 10 * 100, 0, 100) * 0.06
    + rng.normal(0, 4, N)
)
score = np.clip(score, 0, 100)

X = np.column_stack([
    elevation, slope, temperature, humidity, rainfall,
    wind_speed, earthquake_activity, historical_incidents, terrain_type
])

X_train, X_test, y_train, y_test = train_test_split(
    X, score, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=220,
    max_depth=14,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

pred = model.predict(X_test)
print(f'MAE: {mean_absolute_error(y_test, pred):.2f}')
print(f'R2: {r2_score(y_test, pred):.3f}')

artifact = {
    'model': model,
    'model_name': 'Random Forest',
    'model_version': 'TG-RISK-1.0',
    'mae': float(mean_absolute_error(y_test, pred)),
    'r2': float(r2_score(y_test, pred)),
    'feature_names': [
        'elevation', 'slope', 'temperature', 'humidity', 'rainfall',
        'wind_speed', 'earthquake_activity', 'historical_incidents', 'terrain_type'
    ],
}
joblib.dump(artifact, MODEL_DIR / 'terrain_risk_model.joblib')
print(f'Saved {MODEL_DIR / "terrain_risk_model.joblib"}')
