# TerraGuard AI

> AI-powered terrain intelligence and backcountry safety platform for smarter and safer hiking.

TerraGuard AI is an intelligent hiking and backcountry safety platform that combines **terrain analysis, machine learning, weather awareness, camera-based ground guidance, geological hazard monitoring, navigation, session tracking, and an AI Ranger Copilot** into a unified application.

The platform is designed to provide hikers with contextual information about terrain conditions and potential hazards while supporting safer route planning and outdoor decision-making.

---

## Features

### AI Terrain Risk Prediction

TerraGuard AI includes a dedicated machine-learning engine that analyzes environmental and terrain-related factors to estimate terrain risk.

The system provides:

- Risk score from 0–100
- Risk level
- Model confidence
- Primary risk factors
- Random Forest model prediction
- Terrain-aware risk analysis

The current ML service uses:

- Python
- FastAPI
- Scikit-learn
- Random Forest
- Pandas
- NumPy
- Joblib

---

### AI Ground-Vision Guidance

The application supports camera-based terrain awareness designed to help identify ground conditions and provide contextual foot-placement guidance.

Potential terrain categories include:

- Stable rock
- Loose gravel
- Mud
- Snow
- Uneven terrain

The vision system can be extended with dedicated computer-vision models for more advanced terrain classification.

---

### Weather Awareness

TerraGuard AI integrates weather information into its safety intelligence layer.

Weather-related information can include:

- Temperature
- Humidity
- Rainfall
- Wind speed
- Weather conditions
- Visibility

Weather information can also be used as an input for terrain-risk analysis.

---

### Geological Hazard Monitoring

The application can monitor geological and environmental hazards using external data sources.

Current integrations include:

- USGS earthquake data
- Geological hazard information
- Seismic activity indicators
- Historical incidents

The system can associate hazard information with the user's location and hiking session.

---

### Tactical Navigation

TerraGuard AI provides an interactive map and GPS-based navigation experience.

Features include:

- Interactive maps
- GPS positioning
- Route tracking
- Trail visualization
- Location monitoring
- Tactical map interface

---

### Hiking Session Tracking

Users can track hiking sessions and maintain information about previous activities.

Session-related functionality can include:

- Route tracking
- Session history
- Location information
- Historical incidents
- Hiking activity data

---

### AI Ranger Copilot

The AI Ranger Copilot provides AI-powered assistance for hiking and backcountry scenarios.

It can provide contextual assistance related to:

- Hiking preparation
- Terrain conditions
- Weather
- Navigation
- Potential hazards
- Route information
- Outdoor safety

The architecture allows terrain-risk predictions and environmental information to be incorporated into AI-assisted responses.

---

# System Architecture

```text
                         TerraGuard AI
                              │
                              ▼
                    ┌──────────────────┐
                    │ React Frontend   │
                    │ Vite + TypeScript│
                    └────────┬─────────┘
                             │
                         /api/*
                             │
                             ▼
                    ┌──────────────────┐
                    │ Express Backend  │
                    │ Node.js + Gemini │
                    └────────┬─────────┘
                             │
                       /api/ml/*
                             │
                             ▼
                    ┌──────────────────┐
                    │ Python ML API    │
                    │ FastAPI          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Random Forest    │
                    │ Risk Model       │
                    └──────────────────┘
