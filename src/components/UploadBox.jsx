import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function UploadBox() {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-2xl shadow-emerald-900/5">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold">Upload Waste Image</h3>
          <span className="text-xs text-slate-500">Supports JPG, PNG</span>
        </div>

        {/* Drop Zone */}
        <div className="group relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer bg-slate-950/30">
          <div className="p-4 rounded-full bg-slate-900 group-hover:scale-110 transition-transform mb-4">
            <UploadCloud className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium">Drop image here or click to browse</p>
          <p className="text-slate-500 text-sm mt-2">Maximum file size 5MB</p>
        </div>

        <div className="flex justify-end">
          <button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20">
            Analyze Image
          </button>
        </div>
      </div>
    </div>
  );
}