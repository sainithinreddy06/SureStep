import React from 'react';
import { BrainCircuit, CheckCircle2, Loader2, AlertTriangle, Gauge } from 'lucide-react';
import { TerrainRiskPrediction } from '../services/mlService';

interface TerrainMLCardProps {
  prediction: TerrainRiskPrediction | null;
  loading: boolean;
  error: string | null;
}

const levelStyles: Record<TerrainRiskPrediction['risk_level'], string> = {
  LOW: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  MODERATE: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  HIGH: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  CRITICAL: 'text-red-300 bg-red-500/10 border-red-500/25',
};

export const TerrainMLCard: React.FC<TerrainMLCardProps> = ({ prediction, loading, error }) => {
  return (
    <section className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
            </span>
            <span>AI Terrain Risk Prediction</span>
          </div>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            Machine-learning prediction combining terrain, weather, elevation and hazard context.
          </p>
        </div>
        <span className="text-[10px] font-mono text-stone-500 border border-stone-800 rounded-full px-2 py-1">
          TG-RISK-1.0
        </span>
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-2 text-xs text-stone-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          Running terrain model...
        </div>
      )}

      {error && !loading && (
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{error}. The existing local risk engine remains active.</span>
        </div>
      )}

      {prediction && !loading && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-stone-950 border border-stone-800 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                <Gauge className="w-3.5 h-3.5" /> Risk Score
              </div>
              <div className="mt-2 text-3xl font-black font-mono text-white">
                {prediction.risk_score}<span className="text-sm text-stone-500">/100</span>
              </div>
            </div>

            <div className="rounded-xl bg-stone-950 border border-stone-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Risk Level</div>
              <div className={`inline-flex mt-3 px-2.5 py-1 rounded-full border text-xs font-extrabold ${levelStyles[prediction.risk_level]}`}>
                {prediction.risk_level}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-stone-400">Model confidence</span>
              <span className="font-mono text-stone-200">{prediction.confidence}%</span>
            </div>
            <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${prediction.confidence}%` }} />
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">Primary factors</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {prediction.top_factors.map((factor) => (
                <div key={factor} className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs text-stone-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {factor}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-stone-500 font-mono">
            Model: {prediction.model} · Version: {prediction.model_version}
          </div>
        </div>
      )}
    </section>
  );
};
