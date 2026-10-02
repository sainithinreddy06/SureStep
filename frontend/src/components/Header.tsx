import React from 'react';
import surestepLogo from '../assets/images/surestep-logo.png';
import {
  SunMedium,
  Eye,
  Map,
  Activity,
  ShieldAlert,
  Plus,
  Bot,
  PictureInPicture2,
  Home
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  outdoorMode: boolean;
  onToggleOutdoorMode: () => void;
  units: 'metric' | 'imperial';
  onToggleUnits: () => void;
  onOpenReportModal: () => void;
  onOpenChat: () => void;
  showLandingPage?: boolean;
  onToggleLandingPage?: () => void;
  isFloatingWindowOpen?: boolean;
  onToggleFloatingWindow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  outdoorMode,
  onToggleOutdoorMode,
  units,
  onToggleUnits,
  onOpenReportModal,
  onOpenChat,
  showLandingPage,
  onToggleLandingPage,
  isFloatingWindowOpen,
  onToggleFloatingWindow
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
      {/* Zone 1: SureStep Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleLandingPage}
          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer focus:outline-none group"
          title="Return to SureStep Launch Page"
          aria-label="SureStep home"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
            <img
              src={surestepLogo}
              alt="SureStep logo"
              className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </span>

          <span className="hidden sm:block truncate">
            <span className="block text-[15px] font-extrabold tracking-tight text-white transition-colors group-hover:text-emerald-300">
              SureStep <span className="text-emerald-400">AI</span>
            </span>
            <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Intelligent Hiking
            </span>
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-300">
        <button
          onClick={() => {
            if (showLandingPage && onToggleLandingPage) onToggleLandingPage();
            setActiveTab('vision');
          }}
          className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
            !showLandingPage && activeTab === 'vision' ? 'text-emerald-400 font-bold' : 'text-stone-300'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vision HUD</span>
        </button>

        <button
          onClick={() => {
            if (showLandingPage && onToggleLandingPage) onToggleLandingPage();
            setActiveTab('map');
          }}
          className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
            !showLandingPage && activeTab === 'map' ? 'text-emerald-400 font-bold' : 'text-stone-300'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Tactical Map</span>
        </button>

        <button
          onClick={() => {
            if (showLandingPage && onToggleLandingPage) onToggleLandingPage();
            setActiveTab('risk');
          }}
          className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
            !showLandingPage && activeTab === 'risk' ? 'text-emerald-400 font-bold' : 'text-stone-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Risk & Incidents</span>
        </button>

        <button
          onClick={() => {
            if (showLandingPage && onToggleLandingPage) onToggleLandingPage();
            setActiveTab('safety');
          }}
          className={`whitespace-nowrap transition-colors hover:text-white flex items-center gap-1.5 ${
            !showLandingPage && activeTab === 'safety' ? 'text-red-400 font-bold' : 'text-stone-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Safety & SOS</span>
        </button>
      </nav>

      {/* Zone 3: Essential Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Floating PiP Window Toggle */}
        {onToggleFloatingWindow && (
          <button
            onClick={onToggleFloatingWindow}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
              isFloatingWindowOpen
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
            }`}
            title={isFloatingWindowOpen ? 'Close Floating PiP HUD' : 'Open Floating PiP HUD'}
            aria-label="Toggle floating HUD window"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>
        )}

        {/* Ranger AI Copilot Trigger */}
        <button
          onClick={onOpenChat}
          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          title="Open Ranger AI Mountain Copilot"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span className="whitespace-nowrap hidden sm:inline">Ranger AI</span>
        </button>

        {/* Outdoor High Contrast Toggle */}
        <button
          onClick={onToggleOutdoorMode}
          className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            outdoorMode
              ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md font-bold'
              : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
          }`}
          title={outdoorMode ? 'Disable High Contrast Sunlight Mode' : 'Enable High Contrast Sunlight Mode'}
          aria-label="Toggle outdoor sunlight mode"
        >
          <SunMedium className="w-4 h-4" />
          <span className="hidden lg:inline whitespace-nowrap text-[11px]">
            {outdoorMode ? 'Sunlight Active' : 'Sunlight'}
          </span>
        </button>

        {/* Units Toggle */}
        <button
          onClick={onToggleUnits}
          className="px-2 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg text-xs font-mono font-medium border border-stone-800 transition-colors whitespace-nowrap"
          title="Toggle Metric / Imperial units"
        >
          {units === 'metric' ? 'KM/°C' : 'MI/°F'}
        </button>

        {/* Quick Report Hazard Button */}
        <button
          onClick={onOpenReportModal}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Hazard</span>
        </button>
      </div>
    </header>
  );
};
