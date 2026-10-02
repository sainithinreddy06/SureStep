import React, { useState } from 'react';
import { HazardReport, HazardSeverity } from '../types';
import { AlertOctagon, AlertTriangle, Check, Filter, Info, MapPin, Plus, ThumbsUp } from 'lucide-react';

interface HazardsListProps {
  hazards: HazardReport[];
  onOpenReportModal: () => void;
  onVerifyHazard: (id: string) => void;
}

export const HazardsList: React.FC<HazardsListProps> = ({
  hazards,
  onOpenReportModal,
  onVerifyHazard
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});

  const filtered = hazards.filter(h => {
    if (filterSeverity === 'all') return true;
    return h.severity === filterSeverity;
  });

  const handleVerify = (id: string) => {
    if (verifiedMap[id]) return;
    setVerifiedMap(prev => ({ ...prev, [id]: true }));
    onVerifyHazard(id);
  };

  const getSeverityBadge = (sev: HazardSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-800">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-950/80 text-orange-300 border border-orange-800">
            High
          </span>
        );
      case 'moderate':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800">
            Moderate
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/90 border border-stone-800 p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-base text-stone-100">Trail Hazards Feed</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Crowdsourced and ranger-verified backcountry trail hazards along your route.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Report New Hazard
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-lg text-xs overflow-x-auto">
        <button
          onClick={() => setFilterSeverity('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterSeverity === 'all'
              ? 'bg-stone-800 text-white shadow-sm font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          All Hazards ({hazards.length})
        </button>
        <button
          onClick={() => setFilterSeverity('critical')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterSeverity === 'critical'
              ? 'bg-red-950/80 text-red-300 border border-red-800/80 font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Critical ({hazards.filter(h => h.severity === 'critical').length})
        </button>
        <button
          onClick={() => setFilterSeverity('high')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterSeverity === 'high'
              ? 'bg-orange-950/80 text-orange-300 border border-orange-800/80 font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          High ({hazards.filter(h => h.severity === 'high').length})
        </button>
        <button
          onClick={() => setFilterSeverity('moderate')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterSeverity === 'moderate'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80 font-semibold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Moderate ({hazards.filter(h => h.severity === 'moderate').length})
        </button>
      </div>

      {/* Hazards Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-stone-900/60 rounded-xl border border-stone-800 text-stone-400 text-xs">
            No hazards match the selected severity category.
          </div>
        ) : (
          filtered.map(hazard => (
            <div
              key={hazard.id}
              className="p-4 bg-stone-900/90 rounded-xl border border-stone-800 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityBadge(hazard.severity)}
                    <span className="text-[11px] text-stone-400 capitalize">
                      {hazard.type.replace('_', ' ')}
                    </span>
                    <span className="text-stone-500" aria-hidden="true">·</span>
                    <span className="text-[11px] text-stone-500">
                      {new Date(hazard.reportedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-stone-100">{hazard.title}</h4>
                </div>

                <button
                  onClick={() => handleVerify(hazard.id)}
                  disabled={verifiedMap[hazard.id]}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
                    verifiedMap[hazard.id]
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                  title="Confirm this hazard is still present"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>
                    {hazard.verifiedCount + (verifiedMap[hazard.id] ? 1 : 0)} Verified
                  </span>
                </button>
              </div>

              <p className="text-stone-300 leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
                {hazard.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                <div className="flex items-center gap-1 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {hazard.coordinates.latitude.toFixed(4)}°, {hazard.coordinates.longitude.toFixed(4)}°
                  </span>
                </div>
                <span>Stay on designated bypass route</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
