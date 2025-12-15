import React from 'react';
import { Leaf } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-800/50 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight">
          <Leaf className="w-6 h-6 fill-emerald-500/20" />
          <span>EcoGuard</span>
        </div>
        
        {/* CTA Button */}
        <button className="px-5 py-2 rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm font-medium">
          Get Started
        </button>
      </div>
    </nav>
  );
}