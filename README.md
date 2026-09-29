# TerraGuard AI

> AI-powered terrain intelligence and backcountry safety platform for smarter, safer hiking.

TerraGuard AI combines terrain analysis, weather awareness, camera-based ground guidance, geological hazard monitoring, navigation, session tracking, an AI Ranger Copilot, and a machine-learning terrain risk engine in one application.

## Core capabilities

- AI ground-vision guidance for trail surfaces and foot placement
- Live weather awareness through Open-Meteo
- USGS earthquake and geological hazard monitoring
- Tactical map and GPS trail tracking
- Hiking session tracking and historical incident storage
- Gemini-powered Ranger AI Copilot
- **Machine-learning terrain risk prediction** using a Random Forest model
- Risk score, risk level, model confidence, and primary risk factors

## Architecture

```text
TerraGuard AI
│
├── frontend/       React + Vite + TypeScript
│       │
│       └── /api/*
│               │
├── backend/        Node.js + Express + Gemini
│       │
│       └── /api/ml/*
│               │
└───────┬───────────┘
        ▼
   ml-service/      Python + FastAPI + scikit-learn
        │
        └── Random Forest Terrain Risk Model
```

## Project structure

```text
TerraGuard-AI/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── TerrainMLCard.tsx
│   │   ├── services/
│   │   │   └── mlService.ts
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── server.ts
│   ├── .env.example
│   └── package.json
│
├── ml-service/
│   ├── data/
│   ├── models/
│   │   └── terrain_risk_model.joblib
│   ├── training/
│   │   ├── train.py
│   │   └── evaluate.py
│   ├── services/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
│
├── .gitignore
└── README.md
```

# Run locally

You need three terminal windows.

## 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 2. Express backend

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example`:

```env
GEMINI_API_KEY="your_key_here"
PORT=3000
ML_SERVICE_URL=http://127.0.0.1:8000
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:3000
```

## 3. Machine-learning service

```bash
cd ml-service
python -m pip install -r requirements.txt
```

The repository already contains the trained model artifact. To retrain it:

```bash
python training/train.py
```

Evaluate the model:

```bash
python training/evaluate.py
```

Start the ML API:

```bash
python -m uvicorn main:app --reload --port 8000
```

ML service:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
```

Prediction:

```text
POST http://localhost:8000/predict-risk
```

# Machine-learning integration

The ML engine predicts a terrain risk score from 0 to 100 using:

- Elevation
- Slope
- Temperature
- Humidity
- Rainfall
- Wind speed
- Seismic activity indicator
- Historical incident count
- Terrain type

Example response:

```json
{
  "risk_score": 72,
  "risk_level": "HIGH",
  "confidence": 88,
  "top_factors": [
    "Steep terrain slope",
    "Recent precipitation",
    "Strong wind conditions"
  ],
  "model": "Random Forest",
  "model_version": "TG-RISK-1.0"
}
```

The frontend displays the prediction in the **Risk & Incidents** section through the `TerrainMLCard` component.

## Model note

The included model is a **bootstrap/demo ML model** trained by `ml-service/training/train.py` from a transparent generated dataset so the project can run end-to-end without requiring a separate dataset download.

The current training evaluation produced approximately:

```text
MAE: 3.69
R²: 0.803
```

These metrics describe the generated bootstrap dataset and **must not be interpreted as real-world hiking safety accuracy**. For production or research use, replace the generated training data with a documented real-world dataset and independently validate the model.

# API flow

```text
React Frontend
      │
      │ POST /api/ml/predict-risk
      ▼
Express Backend
      │
      │ POST /predict-risk
      ▼
Python ML Service
      │
      ▼
Random Forest Model
      │
      ▼
Risk prediction
      │
      ▼
Express → React
```

## Vite proxy

During local development, Vite forwards `/api/*` requests to the Express backend on port 3000.

The frontend therefore calls:

```text
/api/ml/predict-risk
```

instead of exposing the ML service URL directly in the browser.

# Security

- Never commit `backend/.env`.
- Keep `GEMINI_API_KEY` on the backend.
- Do not put private API keys in frontend source code.
- Use HTTPS for production deployments.
- Review ML outputs before using them for any real-world safety decision.

# Branding

The application branding is **TerraGuard AI**.

The selected TG mountain logo is stored at:

```text
frontend/src/assets/images/terraguard-logo.png
```

# Deployment

Recommended production layout:

```text
Vercel / Netlify
       │
       ▼
   Frontend
       │
       ▼
Render / Railway
       │
       ├── Express Backend
       │
       └── Python ML Service
       │
       ├── Gemini API
       └── Firebase / Firestore
```

For production, set the backend `ML_SERVICE_URL` to the deployed Python ML service URL.

# Git workflow

```bash
git add .
git commit -m "Integrate machine learning terrain risk engine"
git push origin main
```

# Author

**Sai Nithin Reddy Tadugam**

Computer Science & Engineering

**TerraGuard AI**
