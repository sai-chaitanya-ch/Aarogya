import React, { useState } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeScreenTitle?: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  activeScreenTitle
}) => {
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[calc(100vh-58px)] p-2 sm:p-4">
      {/* Top Device View Mode Switcher Pill */}
      <div className="mb-3 flex items-center justify-between w-full max-w-md px-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-700">{activeScreenTitle || 'Mobile First Copilot'}</span>
        </div>

        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/50 shadow-sm">
          <button
            onClick={() => setIsMobileFrame(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              isMobileFrame ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Display inside Mobile Frame as per Design Mockup"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone View</span>
          </button>
          <button
            onClick={() => setIsMobileFrame(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              !isMobileFrame ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Display expanded view"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expanded</span>
          </button>
        </div>
      </div>

      {isMobileFrame ? (
        /* Phone Mockup Container */
        <div className="relative w-full max-w-[420px] bg-slate-950 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800/80 transition-all duration-300">
          {/* Inner Phone Bezel */}
          <div className="relative w-full bg-[#f8faf9] rounded-[36px] overflow-hidden min-h-[820px] flex flex-col shadow-inner">
            {/* Status Bar */}
            <div className="w-full px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-slate-800 select-none bg-white/70 backdrop-blur-sm z-20">
              <span>9:41</span>
              {/* Dynamic Island / Speaker Pill */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 text-slate-700">
                <Signal className="w-3 h-3 stroke-[2.5]" />
                <Wifi className="w-3 h-3 stroke-[2.5]" />
                <Battery className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* App Screen Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className="w-full py-1.5 flex justify-center bg-white/60 backdrop-blur-sm z-20">
              <div className="w-32 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Full Screen Container */
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
          {children}
        </div>
      )}
    </div>
  );
};
