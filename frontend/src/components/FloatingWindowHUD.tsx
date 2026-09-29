import React, { useState } from 'react';
import {
  Eye,
  Minimize2,
  Maximize2,
  X,
  Compass,
  Mountain,
  Footprints,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { Coordinates } from '../types';

interface FloatingWindowHUDProps {
  currentCoords: Coordinates;
  onOpenFullHUD: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FloatingWindowHUD: React.FC<FloatingWindowHUDProps> = ({
  currentCoords,
  onOpenFullHUD,
  isOpen,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-40 transition-all duration-200 select-none ${
        isMinimized
          ? 'bottom-20 md:bottom-6 left-4 w-52'
          : 'bottom-20 md:bottom-6 left-4 w-72 sm:w-84'
      } bg-stone-900/95 border-2 border-emerald-500/70 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-stone-200 font-sans`}
    >
      {/* Header Bar */}
      <div className="p-2.5 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
        <button
          onClick={onOpenFullHUD}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          title="Click to open whole project"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider text-[11px]">Vision HUD PiP</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(m => !m)}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
            title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
            title="Close floating window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-2.5 text-xs">
          {/* Mini Viewfinder Reticle Simulation - Clickable to open whole project */}
          <div
            onClick={onOpenFullHUD}
            className="relative aspect-video bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center cursor-pointer group hover:border-emerald-500/60 transition-colors"
            title="Click to open whole project"
          >
            {/* Background terrain pattern */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Tactical Crosshair */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-10 h-10 border border-emerald-400/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <span className="text-[9px] font-mono text-emerald-300 bg-stone-950/80 px-1.5 py-0.5 rounded">
                SLOPE ~22° · LIVE GPS
              </span>
            </div>

            {/* Footstep Indicator Tag */}
            <div className="absolute bottom-1.5 left-2 bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.5 rounded text-[9px] text-emerald-300 font-bold flex items-center gap-1">
              <Footprints className="w-3 h-3" />
              <span>Target A: Solid Step</span>
            </div>

            <div className="absolute top-1.5 right-2 bg-stone-950/80 px-1.5 py-0.5 rounded text-[9px] text-stone-400 group-hover:text-emerald-300 transition-colors font-mono">
              Click to Open ↗
            </div>
          </div>

          {/* Quick Telemetry Row */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <div className="p-1.5 bg-stone-950/70 border border-stone-800 rounded-lg flex items-center gap-1 text-stone-300">
              <Mountain className="w-3 h-3 text-stone-500" />
              <span>{Math.round(currentCoords.altitude || 1840)}m Elev</span>
            </div>
            <div className="p-1.5 bg-stone-950/70 border border-stone-800 rounded-lg flex items-center gap-1 text-stone-300">
              <Compass className="w-3 h-3 text-stone-500" />
              <span>{Math.round(currentCoords.heading || 45)}° Heading</span>
            </div>
          </div>

          {/* Action Trigger: Open Whole Project */}
          <button
            onClick={onOpenFullHUD}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-wider"
          >
            <span>Open Whole Project</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isMinimized && (
        <div
          onClick={onOpenFullHUD}
          className="p-2.5 flex items-center justify-between text-[11px] cursor-pointer hover:bg-stone-800/60 transition-colors"
          title="Click to open whole project"
        >
          <span className="font-mono text-emerald-300 font-bold">
            {Math.round(currentCoords.altitude || 1840)}m · 22°
          </span>
          <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
            <span>Open Project</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
};
