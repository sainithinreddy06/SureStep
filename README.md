# SureStep

> AI-powered terrain intelligence and backcountry safety platform for smarter and safer hiking.

SureStep is an intelligent hiking and backcountry safety platform that combines **terrain analysis, machine learning, computer vision, weather awareness, geological hazard monitoring, navigation, session tracking, and an AI Ranger Copilot** into a unified application.

The platform is designed to provide hikers with contextual information about terrain conditions and potential hazards while supporting safer route planning and outdoor decision-making.

---

## Features

### AI Terrain Risk Prediction

SureStep includes a dedicated machine-learning engine that analyzes environmental and terrain-related factors to estimate terrain risk.

The system provides:

- Risk score from 0–100
- Risk level
- Model confidence
- Primary risk factors
- Random Forest model prediction
- Terrain-aware risk analysis

The ML service uses:

- Python
- FastAPI
- Scikit-learn
- Random Forest
- Pandas
- NumPy
- Joblib

---

### SureStep Vision

SureStep Vision provides camera-based environmental analysis using **YOLO object detection**.

The system supports:

- Live camera detection
- Image detection
- Video frame analysis
- Object detection
- Bounding boxes
- Confidence scores
- Adjustable confidence threshold
- Hazard classification
- Risk assessment
- Safety recommendations
- Detection history
- GPS-aware detection logging
- Tactical Map hazard integration

The current computer-vision service uses:

- Ultralytics YOLO
- PyTorch
- Torchvision
- OpenCV
- Pillow

The architecture is designed to support a future custom `best.pt` model trained specifically for hiking and outdoor hazards.

---

### Weather Awareness

SureStep integrates weather information into its safety intelligence layer.

Weather-related information can include:

- Temperature
- Humidity
- Rainfall
- Wind speed
- Weather conditions
- Visibility
- Forecast information

Weather information can also be incorporated into terrain-risk analysis and safety decisions.

---

### Geological Hazard Monitoring

The application can monitor geological and environmental hazards using external data sources.

Current functionality includes:

- USGS earthquake data
- Geological event information
- Seismic activity indicators
- Hazard alerts
- Event severity
- Distance information
- Historical incidents
- Alert dismissal
- Audio alert support

Hazard information can be associated with the user's location and hiking session.

---

### Tactical Navigation

SureStep provides an interactive map and GPS-based navigation experience.

Features include:

- Interactive maps
- GPS positioning
- Route tracking
- Trail visualization
- Location monitoring
- Hazard markers
- Reported hazard locations
- Vision-generated hazard locations
- Tactical map interface

Hazards detected through SureStep Vision can be logged directly to the Tactical Map.

---

### Hiking Session Tracking

Users can track hiking sessions and maintain information about previous activities.

Session-related functionality can include:

- Route tracking
- Session status
- GPS information
- Session history
- Location information
- Hiking activity data

---

### Hazard Reporting

SureStep allows users to manually report hazards encountered during a hike.

A hazard report can contain:

- Hazard type
- Severity
- Description
- GPS coordinates
- Timestamp
- Verification information

Computer-vision detections can also be converted into hazard reports for visualization on the Tactical Map.

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

The architecture allows terrain-risk predictions, weather information, and environmental data to be incorporated into AI-assisted responses.

---

### Historical Incident Database

SureStep maintains historical incident information to provide additional context around mountain and outdoor safety.

Historical information can be used alongside:

- Current terrain conditions
- Geological activity
- Weather conditions
- Hiking sessions
- Reported hazards

---

### Sunlight Active

SureStep includes a dedicated **Sunlight Active** interface designed for use in bright outdoor environments.

Instead of simply increasing contrast, Sunlight Active switches the application to a high-visibility light interface.

The mode uses:

- Light application surfaces
- High-contrast typography
- Green primary controls
- Clear warning colors
- Clear danger indicators
- Reduced visual clutter

The Sunlight Active interface is applied across the application, including:

- Navigation
- Tactical Map
- Vision controls
- YOLO results
- Weather
- Natural hazard alerts
- Ranger AI
- Safety Center
- Session information
- Forms
- Modals
- Mobile navigation

The camera and video preview remain dark to preserve visibility of the captured image.

---

## System Architecture

```text
                         SureStep
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │ React Frontend │ │ Express Backend│ │ Python ML API  │
     │ Vite + TS      │ │ Node.js + TS   │ │ FastAPI        │
     └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
             │                  │                  │
             │                  │                  │
             │                  ▼                  ▼
             │             AI / APIs          ML Models
             │                                YOLO + RF
             │
             └───────────────────────────────────────
                            │
                            ▼
                   User Safety Interface


## SureStep camera behavior

The Vision HUD keeps the original product layout while using the SureStep sunlight palette. On supported mobile browsers, Ground Vision requests the device rear camera with `getUserMedia`. Captured frames are sent to the backend footstep-analysis endpoint. Returned step targets are rendered as color-coded boxes: green for safe (80-100%), orange for caution (50-79%), and red for danger (0-49%), with the safety percentage displayed on each target.
