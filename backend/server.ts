import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// SureStep ML Risk Service proxy
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

app.get('/api/ml/health', async (_req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    const data = await response.json();
    res.status(response.ok ? 200 : 503).json(data);
  } catch (error: any) {
    res.status(503).json({ status: 'unavailable', error: error?.message || 'ML service unavailable' });
  }
});

app.post('/api/ml/predict-risk', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (response.status === 422) return res.status(422).json({ error: 'Invalid terrain inputs' });
    if (!response.ok) return res.status(response.status === 503 ? 503 : 502).json({ error: 'Terrain model unavailable' });
    res.json(data);
  } catch (error: any) {
    console.warn('ML service proxy warning:', error?.message || error);
    res.status(503).json({
      error: 'ML service unavailable',
      message: 'Start the Python ML service on port 8000 and try again.'
    });
  }
});

// Server-side Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Natural Hazards API (Live USGS Earthquakes & Geological Alerts)
app.get('/api/natural-hazards', async (req, res) => {
  const { lat: latitude, lng: longitude } = req.query;
  const lat = typeof latitude === 'string' && latitude.trim() ? Number(latitude) : NaN;
  const lng = typeof longitude === 'string' && longitude.trim() ? Number(longitude) : NaN;
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }

  try {
    const usgsRes = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      { signal: AbortSignal.timeout(5000) }
    );

    if (!usgsRes.ok) throw new Error('USGS fetch failed');
    const data = await usgsRes.json();

    if (!Array.isArray(data.features)) throw new Error('Invalid USGS feed');

    // Calculate distance to each seismic event
    const events = data.features
      .map((f: any) => {
        const [eLng, eLat, depth] = f.geometry.coordinates;
        const distKm = getDistanceKm(lat, lng, eLat, eLng);
        return {
          id: f.id,
          title: f.properties.title,
          mag: f.properties.mag,
          place: f.properties.place,
          time: f.properties.time,
          depthKm: depth,
          distanceKm: Math.round(distKm),
          type: 'earthquake',
          severity: f.properties.mag >= 4.5 ? 'critical' : f.properties.mag >= 3.0 ? 'high' : 'moderate',
          alert: f.properties.mag >= 3.5 && distKm < 250
        };
      })
      .filter((e: any) => e.distanceKm < 500)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    res.json({ success: true, events });
  } catch (err: any) {
    console.warn('Natural hazards fetch warning:', err.message);
    res.status(503).json({ error: 'USGS earthquake data is unavailable' });
  }
});

// Ranger AI provides general information and never fills in missing conditions.
app.post('/api/ranger-chat', async (req, res) => {
  const { message, history, context } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!ai) return res.status(503).json({ error: 'Ranger AI is unavailable' });

  try {
    const systemPrompt = `You are SureStep Ranger AI. Provide general outdoor information in plain language.
Do not give foot-placement instructions or make claims about the user's immediate safety.
Do not infer a location, elevation, weather, hazards, or trail conditions when information is missing.
Weather context, when provided, comes from a model.
Device coordinates: ${typeof context?.coords === 'string' ? context.coords : 'Unavailable'}
Device elevation: ${typeof context?.elevation === 'string' ? context.elevation : 'Unavailable'}
Weather model: ${typeof context?.weather === 'string' ? context.weather : 'Unavailable'}`;

    const contents = [
      ...(Array.isArray(history) ? history.slice(-6)
        .filter(item => (item?.role === 'user' || item?.role === 'model') && typeof item.text === 'string')
        .map(item => ({ role: item.role, parts: [{ text: item.text }] })) : []),
      { role: 'user', parts: [{ text: message.trim() }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: { systemInstruction: systemPrompt, temperature: 0.4 },
    });
    const reply = response.text?.trim();
    if (!reply) return res.status(503).json({ error: 'Ranger AI is unavailable' });
    return res.json({ reply });
  } catch {
    return res.status(503).json({ error: 'Ranger AI is unavailable' });
  }
});

const terrainFeatures = ['Rock', 'Loose stones', 'Soil', 'Vegetation', 'Snow', 'Surface water'];
const trailImagePattern = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

app.post('/api/analyze-footsteps', (_req, res) => {
  res.status(410).json({ error: 'Foot-placement analysis has been retired' });
});

app.post('/api/analyze-terrain-image', async (req, res) => {
  const { imageBase64 } = req.body ?? {};
  const image = typeof imageBase64 === 'string' && imageBase64.length <= Math.ceil(8 * 1024 * 1024 / 3) * 4 + 23
    ? trailImagePattern.exec(imageBase64)
    : null;
  if (!image || image[2].length % 4 !== 0 || Buffer.byteLength(image[2], 'base64') > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'Provide a JPEG, PNG, or WebP image up to 8 MB' });
  }

  if (!ai) return res.status(503).json({ error: 'Terrain image analysis is unavailable' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: image[1], data: image[2] } },
          { text: 'List only recognizable surface features directly visible in the image. Return an empty list if none can be identified. Do not estimate slope, safety, hazards, friction, or foot placement.' },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            features: { type: Type.ARRAY, items: { type: Type.STRING, enum: terrainFeatures } },
          },
          required: ['features'],
        },
      },
    });
    const features: unknown = JSON.parse(response.text ?? '').features;
    if (!Array.isArray(features) || !features.every(feature => terrainFeatures.includes(feature))) {
      return res.status(503).json({ error: 'Terrain image analysis is unavailable' });
    }
    return res.json({ features: [...new Set(features)] });
  } catch {
    return res.status(503).json({ error: 'Terrain image analysis is unavailable' });
  }
});

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SureStep API server running on http://0.0.0.0:${PORT}`);
});
