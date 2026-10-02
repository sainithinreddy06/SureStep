from pathlib import Path
import joblib
import numpy as np

model_path = Path(__file__).resolve().parents[1] / 'models' / 'terrain_risk_model.joblib'
artifact = joblib.load(model_path)
model = artifact['model'] if isinstance(artifact, dict) else artifact

sample = np.array([[2100, 28, 24, 76, 12, 34, 0.18, 3, 2]])
prediction = float(model.predict(sample)[0])
print('Sample predicted risk:', round(prediction))
print('Model:', artifact.get('model_name', type(model).__name__) if isinstance(artifact, dict) else type(model).__name__)
print('Version:', artifact.get('model_version', 'unknown') if isinstance(artifact, dict) else 'unknown')
if isinstance(artifact, dict):
    print('MAE:', round(artifact['mae'], 3))
    print('R2:', round(artifact['r2'], 3))
