# TerraGuard AI ML Service

Python service for terrain and backcountry risk prediction.

## Model

The first integrated version uses a Random Forest regression model (`TG-RISK-1.0`) for a 0-100 terrain risk score. The included training script generates a transparent bootstrap/demo dataset from documented risk factors so the application is runnable without an external dataset.

For production research use, replace the bootstrap dataset with a documented real-world hiking, terrain, weather, and incident dataset and retrain/evaluate the model before using its predictions for operational decisions.

## Run

```bash
cd ml-service
python -m pip install -r requirements.txt
python training/train.py
python -m uvicorn main:app --reload --port 8000
```

Health check:

```text
GET http://localhost:8000/health
```

Prediction endpoint:

```text
POST http://localhost:8000/predict-risk
```
