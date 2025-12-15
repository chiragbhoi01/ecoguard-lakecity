import React from 'react';

export default function Hero() {
  return (
    <div className="text-center space-y-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Sustainability powered by AI
      </div>

      {/* Heading */}
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
        AI Waste Identification <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
          EcoGuard
        </span>
      </h1>

      {/* Subtext */}
      <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
        Instantly analyze waste materials with advanced computer vision to ensure proper recycling and disposal.
      </p>
    </div>
  );
}