import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, RefreshCw, Upload } from 'lucide-react';
import type { Coordinates } from '../types';

interface GroundVisionProps {
  currentCoords: Coordinates;
  hasDeviceGps: boolean;
  onNavigateToMap: () => void;
}

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const actionClass = 'px-3 py-2 rounded-lg border border-stone-700 bg-stone-800 text-xs font-semibold text-stone-100 hover:bg-stone-700 disabled:opacity-50 flex items-center gap-2';

export const GroundVision: React.FC<GroundVisionProps> = ({ currentCoords, hasDeviceGps, onNavigateToMap }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRequest = useRef<AbortController | null>(null);
  const analysisRequest = useRef<AbortController | null>(null);
  const fileReader = useRef<FileReader | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    cameraRequest.current?.abort();
    analysisRequest.current?.abort();
    fileReader.current?.abort();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (cameraRequest.current) return;
    const controller = new AbortController();
    cameraRequest.current = controller;
    setError(null);
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      const video = videoRef.current;
      if (controller.signal.aborted || !video) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      if (controller.signal.aborted) return;
      setCameraActive(true);
      setImage(null);
      setFeatures(null);
    } catch {
      if (!controller.signal.aborted) {
        stopCamera();
        setError('Camera unavailable. You can upload a trail photo instead.');
      }
    } finally {
      cameraRequest.current = null;
      if (!controller.signal.aborted) setCameraStarting(false);
    }
  };

  const analyzeImage = async (dataUrl: string) => {
    const controller = new AbortController();
    analysisRequest.current?.abort();
    analysisRequest.current = controller;
    stopCamera();
    setImage(dataUrl);
    setFeatures(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-terrain-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      if (!response.ok) throw new Error('Analysis unavailable');
      const result = await response.json();
      if (!Array.isArray(result?.features) || !result.features.every((feature: unknown) => typeof feature === 'string' && feature.trim())) {
        throw new Error('Invalid analysis response');
      }
      if (!controller.signal.aborted) setFeatures(result.features);
    } catch {
      if (!controller.signal.aborted) setError('Terrain image analysis unavailable. Try again later.');
    } finally {
      if (!controller.signal.aborted) setIsAnalyzing(false);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    void analyzeImage(canvas.toDataURL('image/jpeg', 0.85));
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!acceptedImageTypes.includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, or WebP image up to 8 MB.');
      return;
    }
    fileReader.current?.abort();
    const reader = new FileReader();
    fileReader.current = reader;
    reader.onload = () => {
      if (typeof reader.result === 'string') void analyzeImage(reader.result);
    };
    reader.onerror = () => setError('The photo could not be read.');
    reader.readAsDataURL(file);
  };

  return (
    <section className="max-w-4xl mx-auto rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
      <header className="p-4">
        <h2 className="text-sm font-bold text-stone-100">Ground Vision</h2>
        <p className="mt-1 text-xs text-stone-400">Capture or upload a photo to send for AI analysis. Results describe visible features only.</p>
      </header>

      <div className="surestep-camera-surface relative aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted className={cameraStarting || cameraActive ? 'w-full h-full object-cover' : 'hidden'} />
        {image && !cameraStarting && !cameraActive && <img src={image} alt="Selected trail photo" className="w-full h-full object-contain" />}
        {!image && !cameraActive && !cameraStarting && <Camera aria-hidden="true" className="w-12 h-12 text-stone-600" />}
      </div>

      <div className="p-3 flex flex-wrap items-center gap-2 border-t border-stone-800">
        {cameraActive ? (
          <>
            <button onClick={handleCapture} className={actionClass}><Camera className="w-4 h-4" /> Capture and Analyze</button>
            <button onClick={stopCamera} className={actionClass}>Stop Camera</button>
          </>
        ) : (
          <button onClick={startCamera} disabled={cameraStarting || isAnalyzing} className={actionClass}>
            <Camera className="w-4 h-4" /> {cameraStarting ? 'Starting Camera' : 'Open Camera'}
          </button>
        )}
        <button onClick={() => uploadRef.current?.click()} disabled={cameraStarting || isAnalyzing} className={actionClass}>
          <Upload className="w-4 h-4" /> Upload Photo
        </button>
        {error && image && (
          <button onClick={() => analyzeImage(image)} disabled={cameraStarting || isAnalyzing} className={actionClass}>Retry Analysis</button>
        )}
        <input ref={uploadRef} type="file" accept={acceptedImageTypes.join(',')} onChange={handleUpload} className="hidden" />
        <span className="text-xs text-stone-400">
          {hasDeviceGps ? 'Device GPS' : 'Demo coordinates'} · {currentCoords.latitude.toFixed(4)}°, {currentCoords.longitude.toFixed(4)}°
        </span>
        <button onClick={onNavigateToMap} className={actionClass}>Open Tactical Map <ArrowRight className="w-3.5 h-3.5" /></button>
      </div>

      {isAnalyzing && <p role="status" className="px-4 pb-4 flex items-center gap-2 text-xs text-stone-300"><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing photo</p>}
      {error && <p role="alert" className="px-4 pb-4 text-xs text-amber-300">{error}</p>}
      {features && (
        <div role="status" className="px-4 pb-4 text-xs text-stone-300">
          <h3 className="font-semibold text-stone-100">Possible features in the photo</h3>
          <p>{features.length > 0 ? features.join(', ') : 'The model could not identify a surface feature.'}</p>
        </div>
      )}
    </section>
  );
};
