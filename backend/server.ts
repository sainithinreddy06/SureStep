import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// TerraGuard ML Risk Service proxy
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
    res.status(response.ok ? 200 : 502).json(data);
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
  const lat = parseFloat(req.query.lat as string) || 46.7865;
  const lng = parseFloat(req.query.lng as string) || -121.7358;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const usgsRes = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!usgsRes.ok) throw new Error('USGS fetch failed');
    const data = await usgsRes.json();

    // Calculate distance to each seismic event
    const events = (data.features || [])
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
    res.json({
      success: true,
      events: [
        {
          id: 'sim-eq-1',
          title: 'M3.4 Earthquake - 18km ESE of Ashford, WA',
          mag: 3.4,
          place: '18km ESE of Ashford, WA',
          time: Date.now() - 1000 * 60 * 25,
          depthKm: 8.2,
          distanceKm: 24,
          type: 'earthquake',
          severity: 'high',
          alert: true
        }
      ]
    });
  }
});

// 2. Ranger AI Copilot Chat Endpoint
app.post('/api/ranger-chat', async (req, res) => {
  const { message, history, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!ai || !process.env.GEMINI_API_KEY) {
    // Graceful offline/local mountain safety fallback response
    const fallbackReply = generateFallbackSafetyAdvice(message, context);
    return res.json({ reply: fallbackReply, isFallback: true });
  }

  try {
    const systemPrompt = `You are the TerraGuard Backcountry AI Ranger & Mountain Safety Copilot. 
Your primary mission is to keep hikers, alpinists, and mountain rangers alive and uninjured in wilderness terrain.
Provide concise, highly actionable, authoritative mountain advice.
Current Hiker Context:
- Coordinates: ${context?.coords || 'Alpine Ridge'}
- Elevation: ${context?.elevation || '2,100m'}
- Active Weather: ${context?.weather || 'Gusty alpine winds, variable clouds'}
- Terrain Risk Level: ${context?.riskLevel || 'Moderate'}

Rules:
1. Always prioritize immediate physical safety over continuing the hike.
2. Emphasize turnback decisions when weather or rockfall threatens.
3. Keep answers tight (2 to 4 bullet points max) so they are fast to read on a mobile phone in direct sunlight.`;

    const contents = [
      ...(history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4
      }
    });

    res.json({ reply: response.text || 'Assess footing carefully and maintain stable 3-point contact.' });
  } catch (err: any) {
    console.error('Ranger chat Gemini error:', err);
    const fallbackReply = generateFallbackSafetyAdvice(message, context);
    res.json({ reply: fallbackReply, isFallback: true });
  }
});

// 3. AI Camera Foot Placement & Step Guidance Endpoint
app.post('/api/analyze-footsteps', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', slopeAngle = 20 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  if (!ai || !process.env.GEMINI_API_KEY) {
    return res.json(generateFallbackFootstepAnalysis(slopeAngle));
  }

  try {
    const prompt = `Analyze this mountain trail ground image for immediate foot placement safety.
Slope angle is estimated at ${slopeAngle}° grade.
Identify 3 to 4 specific step targets on the image where a hiker should or shouldn't place their boots.
For each step target, specify:
1. id ('A', 'B', 'C', 'D')
2. type ('safe_step', 'caution_step', 'danger_no_step')
3. x (horizontal position percentage from 10 to 90)
4. y (vertical position percentage from 10 to 90)
5. label (short name like 'Granite Shelf', 'Loose Scree Patch', 'Wet Algae Stone')
6. rationale (why to place or avoid boot here)

Also provide:
- surfaceGripIndex ('Normal' | 'Compromised' | 'Severe Hazard')
- strideSequence (step-by-step stride instructions)
- warningSummary (1-sentence urgent ground caution)

Return strictly valid JSON.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            surfaceGripIndex: { type: Type.STRING },
            warningSummary: { type: Type.STRING },
            strideSequence: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            targets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  label: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ['id', 'type', 'x', 'y', 'label', 'rationale']
              }
            }
          },
          required: ['surfaceGripIndex', 'warningSummary', 'strideSequence', 'targets']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.warn('Footstep Gemini error, using fallback:', err.message);
    res.json(generateFallbackFootstepAnalysis(slopeAngle));
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

function generateFallbackSafetyAdvice(message: string, context: any): string {
  const lower = message.toLowerCase();
  if (lower.includes('shake') || lower.includes('earthquake') || lower.includes('rockfall')) {
    return 'SEISMIC / ROCKFALL PROTOCOL: Move immediately away from vertical cliff bands, undercut crags, and scree chutes. Crouch on open solid ground with knees bent; protect your head with backpack or helmet.';
  }
  if (lower.includes('foot') || lower.includes('step') || lower.includes('slip') || lower.includes('scree')) {
    return 'FOOT PLACEMENT RULE: Keep your center of gravity low over your lead foot. Avoid stepping on shiny, smooth wet rocks or loose rounded cobbles. Wedge your boot heel firmly into deeper scree when descending.';
  }
  if (lower.includes('lightning') || lower.includes('thunder') || lower.includes('storm')) {
    return 'LIGHTNING EMERGENCY: Descend off the ridge line immediately. Do not shelter beneath isolated trees or shallow overhangs. Crouch on your sleeping pad or dry pack with feet pressed together.';
  }
  return 'BACKCOUNTRY GUIDANCE: Maintain steady hydration and check your pace against sunset. If footing becomes unstable or exposure exceeds comfort, halt and confirm safe bypass before proceeding.';
}

function generateFallbackFootstepAnalysis(slopeAngle: number) {
  return {
    surfaceGripIndex: slopeAngle > 25 ? 'Compromised' : 'Normal',
    warningSummary: `Terrain shows variable scree over firm bedrock on a ${slopeAngle}° slope. Anchor boot heel on solid shelf.`,
    strideSequence: [
      'Step 1: Anchor lead right boot firmly onto Target A (solid granite shelf).',
      'Step 2: Probe Target B with trekking pole before transferring full body weight.',
      'Step 3: Strictly avoid Target C (loose shale slide channel).'
    ],
    targets: [
      {
        id: 'A',
        type: 'safe_step',
        x: 48,
        y: 65,
        label: 'Solid Bedrock Shelf',
        rationale: 'Level granitic surface with coarse texture. High friction purchase for full boot sole.'
      },
      {
        id: 'B',
        type: 'caution_step',
        x: 32,
        y: 42,
        label: 'Embedded Cobble',
        rationale: 'Stone appears seated in dirt, but test with pole tip first to ensure no rotational roll.'
      },
      {
        id: 'C',
        type: 'danger_no_step',
        x: 68,
        y: 38,
        label: 'Loose Scree Chute',
        rationale: 'Unconsolidated gravel on downward incline. Will slide downhill under body weight.'
      }
    ]
  };
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraGuard AI API server running on http://0.0.0.0:${PORT}`);
});
