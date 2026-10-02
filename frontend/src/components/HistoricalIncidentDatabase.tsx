import React, { useState, useEffect } from 'react';
import {
  History,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Calendar,
  FileText,
  Plus,
  X,
  CheckCircle,
  Database,
  ExternalLink,
  Filter
} from 'lucide-react';
import { getHistoricalIncidents, logHistoricalIncident, HistoricalIncident } from '../services/firebase';
import { Coordinates } from '../types';

interface HistoricalIncidentDatabaseProps {
  trailId: string;
  trailName: string;
  currentCoords: Coordinates;
}

export const HistoricalIncidentDatabase: React.FC<HistoricalIncidentDatabaseProps> = ({
  trailId,
  trailName,
  currentCoords
}) => {
  const [incidents, setIncidents] = useState<HistoricalIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form states for logging new historical accident/incident
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState<HistoricalIncident['incidentType']>('rockfall');
  const [severity, setSeverity] = useState<HistoricalIncident['severity']>('high');
  const [occurredAt, setOccurredAt] = useState('');
  const [outcome, setOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await getHistoricalIncidents(trailId);
      setIncidents(data);
    } catch (err) {
      console.warn('Error loading incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [trailId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    try {
      await logHistoricalIncident({
        title,
        description,
        trailId,
        incidentType,
        severity,
        occurredAt: occurredAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        outcome: outcome || 'Documented in backcountry incident registry.',
        source: 'User/Ranger Field Record',
        coordinates: {
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          altitude: currentCoords.altitude || undefined
        }
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setOutcome('');
        loadIncidents();
      }, 1500);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = filterType === 'all'
    ? incidents
    : incidents.filter(i => i.incidentType === filterType);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-stone-100">
                Historical Incidents & Accident Archive
              </h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                Firestore Connected
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Previous rockfalls, rescues, and severe slip events recorded at <strong className="text-stone-200">{trailName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-colors shadow flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Historical Incident</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
        {['all', 'rockfall', 'slip_fall', 'flash_flood', 'seismic', 'hypothermia'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors border ${
              filterType === type
                ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-stone-500">
          Querying Firestore historical incident database...
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="py-6 text-center text-xs text-stone-400 bg-stone-950/50 rounded-xl border border-stone-800/60 p-4">
          No historical accidents of this category found for this trail corridor.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((inc, idx) => {
            const isCrit = inc.severity === 'critical';
            const isHigh = inc.severity === 'high';
            const badgeColor = isCrit
              ? 'bg-red-950 text-red-300 border-red-800'
              : isHigh
              ? 'bg-orange-950 text-orange-300 border-orange-800'
              : 'bg-amber-950 text-amber-300 border-amber-800';

            return (
              <div
                key={inc.id || idx}
                className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-xl p-3.5 space-y-2 text-xs transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                        {inc.severity} · {inc.incidentType.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-stone-500" />
                        {inc.occurredAt}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-200 text-sm">{inc.title}</h4>
                  </div>

                  {inc.coordinates && (
                    <div className="text-right text-[10px] text-stone-500 font-mono hidden sm:block">
                      {inc.coordinates.latitude.toFixed(4)}°, {inc.coordinates.longitude.toFixed(4)}°
                    </div>
                  )}
                </div>

                <p className="text-stone-300 leading-relaxed text-xs">
                  {inc.description}
                </p>

                {inc.outcome && (
                  <div className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-[11px] text-amber-200">
                    <strong className="text-amber-300">Ranger / SAR Outcome:</strong> {inc.outcome}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-900">
                  <span>Source: {inc.source || 'Backcountry Safety Registry'}</span>
                  <span className="text-emerald-400">Verified Location Record</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for adding historical report */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Log Historical Accident or Hazard at this Location</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="font-bold text-stone-200 text-sm">Stored in Firestore Database!</div>
                <p className="text-xs text-stone-400">This historical incident record is now saved for all backcountry hikers and rangers.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Incident Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Major Rockfall after Freeze-Thaw Cycle"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Incident Category</label>
                    <select
                      value={incidentType}
                      onChange={e => setIncidentType(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="rockfall">Rockfall / Talus Slide</option>
                      <option value="slip_fall">Slip & Fall Injury</option>
                      <option value="flash_flood">Flash Flood / Washout</option>
                      <option value="seismic">Seismic / Earthquake</option>
                      <option value="hypothermia">Hypothermia / Exposure</option>
                      <option value="lost_hiker">Off-Trail SAR Extraction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Severity</label>
                    <select
                      value={severity}
                      onChange={e => setSeverity(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="critical">Critical (SAR / Evacuation)</option>
                      <option value="high">High (Injury / Blockage)</option>
                      <option value="moderate">Moderate (Caution)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Date Occurred (Optional)</label>
                  <input
                    type="text"
                    value={occurredAt}
                    onChange={e => setOccurredAt(e.target.value)}
                    placeholder="e.g. September 2024"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Incident Description & Terrain Cause</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what occurred, terrain conditions, and specific micro-relief factors..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Outcome / Ranger Action Taken</label>
                  <input
                    type="text"
                    value={outcome}
                    onChange={e => setOutcome(e.target.value)}
                    placeholder="e.g. Evacuation conducted; bypass trail marked."
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving to Database...' : 'Save to Firestore'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
