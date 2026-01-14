
import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, SparklesIcon, UsersIcon, LayersIcon, LogoIcon, TypeIcon, SwatchIcon, MagicWandIcon, DimensionIcon, ArchiveIcon, ChevronDownIcon, SlidersIcon } from './Icons';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Logical check: Is any config sub-item currently the active view?
  const isAnyConfigActive = ['models', 'environment', 'dimension', 'position', 'logosetup', 'textsetup'].includes(currentView);
  
  // Local state for toggling the accordion
  const [isConfigsExpanded, setIsConfigsExpanded] = useState(isAnyConfigActive);

  // Sync expanded state when currentView changes externally (like clicking a shortcut)
  useEffect(() => {
    if (isAnyConfigActive) {
      setIsConfigsExpanded(true);
    }
  }, [currentView, isAnyConfigActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
            setIsProfileOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (view: string) => {
      onNavigate(view);
      setIsMobileOpen(false); // Close mobile drawer after navigation
  };

  const renderNavButton = (id: string, label: string, Icon: React.FC<{className?: string}>, isSubmenu = false) => {
    const isActive = currentView === id;
    return (
        <button 
            key={id}
            onClick={() => handleNavigate(id)}
            className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
                isSubmenu ? 'px-4 ml-1 w-[calc(100%-4px)]' : 'px-3'
            } ${
                isActive 
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
            }`}
        >
            <Icon className={`transition-colors ${isActive ? 'text-purple-400' : 'group-hover:text-gray-300'} ${isSubmenu ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`font-medium truncate ${isSubmenu ? 'text-[13px]' : 'text-sm'}`}>{label}</span>
            
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-500 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
            )}
        </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#020204]/40 backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/5">
                <CameraIcon className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight uppercase">Studio<span className="text-purple-500">.AI</span></span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-4 space-y-7 overflow-y-auto custom-scrollbar">
        
        {/* CREATE SECTION */}
        <div className="space-y-1.5">
            <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] opacity-80">Create</div>
            {renderNavButton('generation', 'Start Generation', SparklesIcon)}
            
            {/* Configuration Accordion */}
            <div className="mt-2">
                <button 
                    onClick={() => setIsConfigsExpanded(!isConfigsExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                        isAnyConfigActive ? 'text-purple-300 bg-purple-500/5' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <SlidersIcon className={`w-5 h-5 transition-colors ${isAnyConfigActive ? 'text-purple-400' : 'group-hover:text-gray-300'}`} />
                        <span className="font-medium text-sm">Configuration</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 opacity-60 group-hover:opacity-100 ${isConfigsExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                    className={`submenu-transition overflow-hidden ${
                        isConfigsExpanded ? 'max-h-[400px] opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                >
                    <div className="space-y-1 border-l border-white/5 ml-5 py-1">
                        {renderNavButton('models', 'Models', UsersIcon, true)}
                        {renderNavButton('environment', 'Environment', SwatchIcon, true)}
                        {renderNavButton('dimension', 'Dimensions', DimensionIcon, true)}
                        {renderNavButton('position', 'Position', LayersIcon, true)}
                        {renderNavButton('logosetup', 'Logo Setup', LogoIcon, true)}
                        {renderNavButton('textsetup', 'Text Setup', TypeIcon, true)}
                    </div>
                </div>
            </div>
        </div>

        {/* AUTOMATE SECTION */}
        <div className="space-y-1.5">
            <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] opacity-80">Automate</div>
            {renderNavButton('assistant', 'Assistant', SparklesIcon)}
            {renderNavButton('templates', 'Templates', ArchiveIcon)}
        </div>

        {/* TOOLS SECTION */}
        <div className="space-y-1.5">
            <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] opacity-80">Tools</div>
            {renderNavButton('bgchanger', 'BG Changer', SwatchIcon)}
            {renderNavButton('imageeditor', 'Image Editor', MagicWandIcon)}
        </div>
      </div>

      {/* User / Profile Section */}
      <div className="p-4 border-t border-white/[0.05]" ref={profileRef}>
        <div className="relative">
            {isProfileOpen && (
                <div className="absolute bottom-full left-0 w-full mb-3 bg-[#0d0d0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <button 
                        onClick={() => { setIsProfileOpen(false); onLogout?.(); }}
                        className="w-full text-left px-4 py-3.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-bold flex items-center gap-3 uppercase tracking-widest"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            )}
            <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3 flex items-center gap-3 hover:bg-white/5 transition-all cursor-pointer group ${isProfileOpen ? 'ring-1 ring-purple-500/30' : ''}`}
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-900/20 group-hover:scale-105 transition-transform">
                    {user?.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-[13px] font-bold text-gray-200 truncate group-hover:text-white transition-colors">
                        {user?.email?.split('@')[0] || 'Studio User'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tight">Pro Studio License</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 rounded-2xl text-purple-400 hover:text-white shadow-2xl transition-all active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {/* Mobile Backdrop - THE CLICK TO CLOSE FEATURE */}
      {isMobileOpen && (
        <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Main Sidebar Container */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-[80] border-r border-white/[0.05] bg-[#020204] transition-transform duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] w-64 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
};
