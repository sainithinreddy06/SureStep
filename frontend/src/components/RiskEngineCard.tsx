import React, { useState } from 'react';
import { RiskAssessment, RiskLevel } from '../types';
import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, ShieldAlert } from 'lucide-react';

interface RiskEngineCardProps {
  assessment: RiskAssessment;
  compact?: boolean;
}

export const RiskEngineCard: React.FC<RiskEngineCardProps> = ({ assessment, compact = false }) => {
  const [showFactorDetails, setShowFactorDetails] = useState(false);

  const getLevelTheme = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-950/30',
          border: 'border-red-600/50',
          text: 'text-red-400',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
          icon: AlertOctagon,
          title: 'Critical Risk'
        };
      case 'high':
        return {
          bg: 'bg-orange-950/30',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          icon: AlertTriangle,
          title: 'High Risk'
        };
      case 'moderate':
        return {
          bg: 'bg-amber-950/30',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: Info,
          title: 'Moderate Risk'
        };
      case 'low':
      default:
        return {
          bg: 'bg-emerald-950/20',
          border: 'border-emerald-600/40',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: CheckCircle2,
          title: 'Low Risk'
        };
    }
  };

  const theme = getLevelTheme(assessment.level);
  const StatusIcon = theme.icon;

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} p-4 backdrop-blur-sm transition-all shadow-sm`}>
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${theme.badgeBg} border`}>
            <StatusIcon className={`w-5 h-5 ${theme.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-100 text-base tracking-tight">{theme.title}</h3>
              <span className="text-xs text-stone-400 font-mono tabular-nums">
                Score {assessment.overallScore}/100
              </span>
            </div>
            <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
              <span>Confidence: <strong className="text-stone-200 font-mono">{assessment.confidence}%</strong></span>
              {assessment.cooldownActive && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">Cooldown Active</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toggle factors button */}
        <button
          onClick={() => setShowFactorDetails(v => !v)}
          className="px-2.5 py-1 text-xs font-medium text-stone-300 hover:text-white bg-stone-900/80 hover:bg-stone-800 rounded-md border border-stone-700/60 flex items-center gap-1 transition-colors"
          aria-expanded={showFactorDetails}
        >
          {showFactorDetails ? 'Hide Breakdown' : 'Factor Breakdown'}
          {showFactorDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Primary Tactical Recommendation */}
      <div className="mt-3.5 p-3 rounded-lg bg-stone-900/90 border border-stone-800 text-xs leading-relaxed text-stone-200">
        <strong className="text-stone-100 font-semibold block mb-1">Recommended Action:</strong>
        {assessment.primaryRecommendation}
      </div>

      {/* Confidence Penalties if any */}
      {assessment.confidencePenalties.length > 0 && (
        <div className="mt-2 text-[11px] text-amber-400/90 flex flex-wrap gap-x-3 gap-y-1">
          {assessment.confidencePenalties.map((pen, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              {pen}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Factor Breakdown */}
      {showFactorDetails && (
        <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-3">
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
            Weighted Risk Model (Transparent 5-Factor Formulation)
          </div>

          <div className="space-y-2.5">
            {assessment.factors.map(factor => (
              <div key={factor.id} className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-stone-200">
                    {factor.label} <span className="text-stone-400 font-normal">({Math.round(factor.weight * 100)}% weight)</span>
                  </span>
                  <span className="font-mono text-stone-300 tabular-nums">
                    {factor.score}/100 <span className="text-stone-400">→ +{factor.weightedScore} pts</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      factor.score >= 75 ? 'bg-red-500' :
                      factor.score >= 50 ? 'bg-orange-500' :
                      factor.score >= 30 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(4, factor.score))}%` }}
                  />
                </div>

                <p className="text-[11px] text-stone-400 leading-tight">
                  {factor.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
