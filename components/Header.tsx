
import React from 'react';
import { CameraIcon } from './Icons';

interface HeaderProps {
    totalUsage?: number;
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ totalUsage = 0, title }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#020204]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020204]/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Logo: Shown only on small screens */}
        <div className="flex items-center gap-3 group cursor-pointer lg:hidden">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 transition-colors duration-300 shadow-lg shadow-purple-500/5">
            <CameraIcon className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
          </div>
          <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-100 tracking-wide leading-none group-hover:text-white transition-colors">STUDIO<span className="text-purple-500">.AI</span></h1>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em] leading-tight">Product Photography</span>
          </div>
        </div>

        {/* Desktop Title: Shown when sidebar is visible */}
        <div className="hidden lg:flex items-center gap-2">
            <span className="h-6 w-1 bg-purple-500 rounded-full"></span>
            <h2 className="text-lg font-semibold text-gray-200 tracking-tight">{title}</h2>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-full px-4 py-1.5 hover:bg-white/[0.05] transition-colors">
             <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Session Usage</span>
             </div>
             <div className="h-4 w-px bg-white/10"></div>
             <span className="text-xs font-mono font-bold text-purple-300">{totalUsage.toLocaleString()} <span className="text-gray-500 font-sans font-normal">Tokens</span></span>
          </div>
        </div>
      </div>
    </header>
  );
};
