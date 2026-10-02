export interface YoloDetection {
  id: string;
  className: string;
  confidence: number;
  bbox: [number, number, number, number];
  center: [number, number];
  severity: 'low' | 'moderate' | 'high' | 'critical';
  hazard: boolean;
  recommendation: string;
}

export interface YoloDetectionResponse {
  success: boolean;
  model: string;
  modelVersion: string;
  imageWidth: number;
  imageHeight: number;
  processingMs: number;
  detections: YoloDetection[];
  hazardCount: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  summary: string;
  recommendations: string[];
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

export async function detectWithYolo(imageBase64: string, confidenceThreshold = 0.35): Promise<YoloDetectionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/vision/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, confidenceThreshold })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || 'YOLO detection failed');
  }

  return response.json();
}

export function getSeverityLabel(severity: YoloDetection['severity']): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
