import React from "react";

export default function OlympiaLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0E] text-white flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-3 rounded-full border border-white/15" />
          <div className="absolute inset-6 rounded-full border-2 border-transparent border-t-white/90 border-r-white/90 animate-spin" />
          <div className="absolute inset-10 rounded-full border border-white/20 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center">
            <span className="text-lg font-black tracking-tight">O</span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Olympia</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-white/65">Loading Performance</p>
        </div>
      </div>
    </div>
  );
}
