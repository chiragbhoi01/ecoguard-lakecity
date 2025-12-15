import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ResultCard() {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
        <CheckCircle className="w-4 h-4" />
        Sample Result
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">
        Plastic Bottle – 96% Recyclable
      </h2>

      {/* Progress Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-slate-400">Confidence Score</span>
          <span className="text-emerald-400">96%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-[96%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-slate-800 pt-6">
        <div>
          <p className="text-slate-500 text-xs mb-1">Material</p>
          <p className="text-slate-200 font-medium">PET Plastic</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Category</p>
          <p className="text-slate-200 font-medium">Recyclable</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Est. CO2 Saved</p>
          <p className="text-slate-200 font-medium">0.4 kg</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs mb-1">Disposal</p>
          <p className="text-slate-200 font-medium">Blue Bin</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mt-8">
        {['Recyclable', 'Plastic', 'Household'].map((tag) => (
          <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}