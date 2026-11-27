import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

interface OfflineConnectivityBannerProps {
  isOffline: boolean;
  onRetryConnection: () => Promise<void> | void;
  isSimulatedOffline?: boolean;
  onToggleSimulateOffline?: () => void;
}

export const OfflineConnectivityBanner: React.FC<OfflineConnectivityBannerProps> = ({
  isOffline,
  onRetryConnection,
  isSimulatedOffline,
  onToggleSimulateOffline
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!isOffline) setDismissed(false);
  }, [isOffline]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetryConnection();
    } finally {
      setTimeout(() => setIsRetrying(false), 800);
    }
  };

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="bg-stone-900/95 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl backdrop-blur-md text-stone-200 transition-all animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Icon & Heading */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0 mt-0.5">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                Offline Connectivity
              </h2>
              {isSimulatedOffline && (
                <span className="text-[10px] bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded font-mono">
                  Simulated
                </span>
              )}
            </div>

            <p className="text-xs text-stone-200 leading-relaxed">
              New map tiles and provider updates may be unavailable while offline.
            </p>


          </div>
        </div>

        {/* Right Dismiss Button */}
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors shrink-0"
          title="Dismiss banner"
          aria-label="Dismiss offline banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Footer */}
      <div className="mt-3.5 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2.5">


        <div className="flex items-center gap-2">
          {onToggleSimulateOffline && (
            <button
              onClick={onToggleSimulateOffline}
              className="px-2.5 py-1.5 text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors"
            >
              {isSimulatedOffline ? 'End Offline Test' : 'Test Offline Mode'}
            </button>
          )}

          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking Network...' : 'Check Connection'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
