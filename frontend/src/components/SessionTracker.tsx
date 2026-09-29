import React, { useState } from 'react';
import { HikeSession, RiskLevel } from '../types';
import { Play, Pause, Square, History, Download, Trash2, Mountain, Clock, Navigation, ShieldCheck, Check } from 'lucide-react';

interface SessionTrackerProps {
  currentSession: HikeSession | null;
  onStartSession: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
  savedSessions: HikeSession[];
  onDeleteSession: (id: string) => void;
  units: 'metric' | 'imperial';
}

export const SessionTracker: React.FC<SessionTrackerProps> = ({
  currentSession,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onEndSession,
  savedSessions,
  onDeleteSession,
  units
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDistance = (meters: number) => {
    if (units === 'imperial') {
      const miles = (meters / 1000) * 0.621371;
      return `${miles.toFixed(2)} mi`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatElevation = (m: number) => {
    if (units === 'imperial') {
      return `${Math.round(m * 3.28084)} ft`;
    }
    return `${Math.round(m)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return <span className="text-red-400 font-semibold uppercase text-[10px]">Critical</span>;
      case 'high':
        return <span className="text-orange-400 font-semibold uppercase text-[10px]">High</span>;
      case 'moderate':
        return <span className="text-amber-400 font-semibold uppercase text-[10px]">Moderate</span>;
      case 'low':
      default:
        return <span className="text-emerald-400 font-semibold uppercase text-[10px]">Low</span>;
    }
  };

  // Export GPX summary
  const exportSessionGpx = (session: HikeSession) => {
    const pointsXml = session.breadcrumbs
      .map(b => `      <trkpt lat="${b.latitude}" lon="${b.longitude}"><ele>${b.altitude || 0}</ele><time>${new Date(b.timestamp || session.startTime).toISOString()}</time></trkpt>`)
      .join('\n');

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TerraGuard AI">
  <metadata>
    <name>${session.trailName}</name>
    <time>${new Date(session.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>${session.trailName}</name>
    <trkseg>
${pointsXml}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terraguard_${session.trailName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Active Session Card */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${currentSession?.status === 'active' ? 'bg-emerald-500 animate-pulse' : currentSession?.status === 'paused' ? 'bg-amber-400' : 'bg-stone-500'}`} />
            <h3 className="font-bold text-sm text-stone-100">
              {currentSession ? currentSession.trailName : 'Backcountry Hike Session'}
            </h3>
          </div>

          <button
            onClick={() => setShowHistory(v => !v)}
            className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 rounded-md border border-stone-700 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-stone-400" />
            <span>Past Hikes ({savedSessions.length})</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-4">
          <div className="p-2.5 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="text-stone-400 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <div className="text-base font-bold font-mono text-stone-100 mt-0.5">
              {currentSession ? formatDuration(currentSession.durationSeconds) : '00:00'}
            </div>
          </div>

          <div className="p-2.5 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="text-stone-400 text-[11px] flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              Distance
            </div>
            <div className="text-base font-bold font-mono text-stone-100 mt-0.5">
              {currentSession ? formatDistance(currentSession.distanceMeters) : '0.00 km'}
            </div>
          </div>

          <div className="p-2.5 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="text-stone-400 text-[11px] flex items-center gap-1">
              <Mountain className="w-3 h-3" />
              Elev Gain
            </div>
            <div className="text-base font-bold font-mono text-stone-100 mt-0.5">
              +{currentSession ? formatElevation(currentSession.elevationGainM) : '0 m'}
            </div>
          </div>

          <div className="p-2.5 bg-stone-950/70 border border-stone-800/80 rounded-lg">
            <div className="text-stone-400 text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Max Risk
            </div>
            <div className="text-base font-bold font-mono text-stone-100 mt-0.5">
              {currentSession ? getRiskBadge(currentSession.maxRiskLevel) : 'None'}
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex gap-2">
          {!currentSession && (
            <button
              onClick={onStartSession}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors uppercase tracking-wider"
            >
              <Play className="w-4 h-4" />
              Start Hike Recording
            </button>
          )}

          {currentSession && currentSession.status === 'active' && (
            <>
              <button
                onClick={onPauseSession}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause Hike
              </button>
              <button
                onClick={onEndSession}
                className="flex-1 py-2.5 px-4 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Square className="w-4 h-4" />
                Finish & Save
              </button>
            </>
          )}

          {currentSession && currentSession.status === 'paused' && (
            <>
              <button
                onClick={onResumeSession}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume Hike
              </button>
              <button
                onClick={onEndSession}
                className="flex-1 py-2.5 px-4 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Square className="w-4 h-4" />
                Finish & Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Past Hikes Drawer / History View */}
      {showHistory && (
        <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-stone-100">Saved Trail History</h4>
            <span className="text-xs text-stone-400">{savedSessions.length} recorded hikes</span>
          </div>

          {savedSessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-stone-400">
              No saved hike sessions yet. Start recording your trail above to store offline tracks.
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedSessions.map(session => (
                <div
                  key={session.id}
                  className="p-3 bg-stone-950/60 rounded-lg border border-stone-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-stone-200">{session.trailName}</strong>
                      <span className="text-[10px] text-stone-400">
                        {new Date(session.startTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-stone-400 mt-1 font-mono text-[11px]">
                      <span>{formatDistance(session.distanceMeters)}</span>
                      <span>·</span>
                      <span>{formatDuration(session.durationSeconds)}</span>
                      <span>·</span>
                      <span>+{formatElevation(session.elevationGainM)}</span>
                      <span>·</span>
                      <span>Risk: {getRiskBadge(session.maxRiskLevel)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => exportSessionGpx(session)}
                      className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                      title="Export GPX file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === session.id ? (
                      <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-800">
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-1 text-stone-400 hover:text-stone-200 text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors"
                        title="Delete hike record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
