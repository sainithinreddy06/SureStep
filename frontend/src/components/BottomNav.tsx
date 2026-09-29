import React from 'react';
import { Eye, Map, Activity, ShieldAlert } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasCriticalAlert?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasCriticalAlert
}) => {
  const tabs = [
    { id: 'vision', label: 'Vision HUD', icon: Eye },
    { id: 'map', label: 'Tactical Map', icon: Map },
    { id: 'risk', label: 'Risk & Weather', icon: Activity },
    { id: 'safety', label: 'SOS & Safety', icon: ShieldAlert, alert: hasCriticalAlert }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 md:hidden safe-area-bottom">
      <div className="grid grid-cols-4 h-14 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] relative transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? tab.id === 'safety'
                        ? 'text-red-400'
                        : 'text-emerald-400'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                />
                {tab.alert && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                  isActive
                    ? tab.id === 'safety'
                      ? 'text-red-400 font-bold'
                      : 'text-emerald-400 font-bold'
                    : 'text-stone-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
