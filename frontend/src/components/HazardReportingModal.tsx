import React, { useState } from 'react';
import { Coordinates, HazardReport, HazardSeverity, HazardType } from '../types';
import { AlertTriangle, MapPin, X, Check, ShieldAlert } from 'lucide-react';

interface HazardReportingModalProps {
  currentCoords: Coordinates;
  onClose: () => void;
  onSubmit: (hazard: HazardReport) => void;
}

export const HazardReportingModal: React.FC<HazardReportingModalProps> = ({
  currentCoords,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<HazardType>('rockfall');
  const [severity, setSeverity] = useState<HazardSeverity>('high');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a concise hazard title.');
      return;
    }
    if (!description.trim() || description.length < 8) {
      setFormError('Please provide descriptive trail details (minimum 8 characters).');
      return;
    }

    const newHazard: HazardReport = {
      id: `hz-user-${Date.now()}`,
      title: title.trim(),
      type,
      severity,
      description: description.trim(),
      coordinates: {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        altitude: currentCoords.altitude,
        accuracy: currentCoords.accuracy
      },
      reportedAt: Date.now(),
      verifiedCount: 1
    };

    onSubmit(newHazard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-stone-100 text-sm">Report Trail Hazard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs text-stone-300">
          {formError && (
            <div className="p-2.5 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-xs">
              {formError}
            </div>
          )}

          {/* Location stamp */}
          <div className="p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Current GPS Anchor:</span>
            </div>
            <span className="font-mono text-stone-200 tabular-nums">
              {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
            </span>
          </div>

          {/* Hazard Type */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">Hazard Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HazardType)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="rockfall">Rockfall / Active Falling Debris</option>
              <option value="scree">Loose Scree / Shifting Talus</option>
              <option value="ice">Snow Bridge / Black Ice / Snowfield</option>
              <option value="water">Swollen Stream / Slick Waterfall Rock</option>
              <option value="mud">Deep Saturated Mud / Quagmire</option>
              <option value="trail_damage">Washed Out Bridge / Trail Collapse</option>
              <option value="wildlife">Wildlife Sighting (Bear / Cougar)</option>
              <option value="other">Other Trail Hazard</option>
            </select>
          </div>

          {/* Hazard Severity */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">Severity Level</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('moderate')}
                className={`py-2 px-2.5 rounded-lg border font-medium text-xs transition-colors ${
                  severity === 'moderate'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                Moderate (Passable)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('high')}
                className={`py-2 px-2.5 rounded-lg border font-medium text-xs transition-colors ${
                  severity === 'high'
                    ? 'bg-orange-950/70 border-orange-500 text-orange-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                High (Difficult)
              </button>
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`py-2 px-2.5 rounded-lg border font-medium text-xs transition-colors ${
                  severity === 'critical'
                    ? 'bg-red-950/70 border-red-500 text-red-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                Critical (Blocked)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">Hazard Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unstable boulders on steep switchback"
              maxLength={70}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">Detailed Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, passability, bypass options, and equipment recommendations..."
              rows={3}
              maxLength={280}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Publish Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
