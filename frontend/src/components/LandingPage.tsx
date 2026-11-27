import React from 'react';
import {
  Eye,
  Map,
  Activity,
  ArrowRight,
  Footprints,
  History
} from 'lucide-react';
import { TrailRoute } from '../types';
import { MovingBackcountryBackground } from './MovingBackcountryBackground';
import surestepLogo from '../assets/images/surestep-logo.png';

interface LandingPageProps {
  onUseDeviceGps: () => void;
  onLaunchHUD: () => void;
  onOpenMap: () => void;
  onOpenChat: () => void;
  onOpenRisk?: () => void;
  onOpenSafety?: () => void;
  activeTrail: TrailRoute;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchHUD,
  onUseDeviceGps,
  onOpenMap,
  onOpenRisk,
  activeTrail
}) => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-stone-950 relative overflow-hidden">
      {/* Dynamic Project-Themed Moving Alpine Background (Parallax Mountain + Topo Contours + AI LiDAR Scan) */}
      <MovingBackcountryBackground />

      {/* Launchpage Dedicated Header */}
      <header className="sticky top-0 z-30 flex items-center px-4 sm:px-8 py-3.5 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
        <div className="flex items-center gap-3">
          <img
            src={surestepLogo}
            alt="SureStep logo"
            className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
          />

          <div className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
            SureStep <span className="text-emerald-400">AI</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-6xl mx-auto flex-1 flex flex-col justify-center">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none">
            Explore the trail. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Plan your hike.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-400 leading-relaxed max-w-2xl mx-auto">
            SureStep includes experimental trail photo analysis, USGS earthquake reports, GPS tracking, and a community incident archive.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={onLaunchHUD}
              className="py-4 px-8 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-2xl shadow-emerald-950/80 flex items-center gap-2.5 uppercase tracking-wider group"
            >
              <Eye className="w-5 h-5 text-white" />
              <span>Explore Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onUseDeviceGps}
              className="py-4 px-6 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 font-bold rounded-2xl text-sm transition-all flex items-center gap-2"
            >
              <Map className="w-4 h-4 text-amber-400" />
              <span>Use Device GPS</span>
            </button>
          </div>
        </div>

        {/* 4 Core Mission Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 relative z-10">
          {/* Card 1 */}
          <div
            onClick={onLaunchHUD}
            className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-3 hover:border-emerald-500/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Footprints className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-100 group-hover:text-emerald-300 transition-colors">
              Trail Photo Analysis
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Capture or upload a photo to identify possible visible surface features.
            </p>
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 pt-1">
              <span>Open Demo Camera View</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={onOpenMap}
            className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-3 hover:border-amber-500/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition-colors">
              Tactical Topo & Sat Map
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Explore sample trail waypoints or connect device GPS to track your position.
            </p>
            <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1 pt-1">
              <span>Explore Demo Map</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={onOpenRisk || onLaunchHUD}
            className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-3 hover:border-sky-500/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-100 group-hover:text-sky-300 transition-colors">
              Seismic & Geological Alerts
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Connect device GPS to check USGS earthquake reports near your location.
            </p>
            <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1 pt-1">
              <span>Explore Demo Risk Inputs</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={onOpenRisk || onLaunchHUD}
            className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-3 hover:border-purple-500/60 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-100 group-hover:text-purple-300 transition-colors">
              Firestore Accident Archive
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Browse unverified incident reports associated with selected trails.
            </p>
            <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1 pt-1">
              <span>Explore Demo Trail Archive</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-800 text-center text-xs text-stone-500 px-4">
        SureStep Alpine Terrain Intelligence & Safety System · Developed for Hikers & Mountain Rangers
      </footer>
    </div>
  );
};
