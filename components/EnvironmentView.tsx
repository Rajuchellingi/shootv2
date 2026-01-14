
import React from 'react';
import { Background, Lighting } from '../types';
import { BACKGROUND_OPTIONS, LIGHTING_OPTIONS } from './constants';
import { SwatchIcon, SparklesIcon, CheckCircleIcon, ArrowLeftIcon } from './Icons';

interface EnvironmentViewProps {
    activeBackground: Background;
    activeLighting: Lighting;
    activeBackgroundColor?: string;
    onUpdateBackground: (bg: Background) => void;
    onUpdateLighting: (l: Lighting) => void;
    onUpdateBackgroundColor: (color: string) => void;
}

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({
    activeBackground,
    activeLighting,
    activeBackgroundColor = '#FFFFFF',
    onUpdateBackground,
    onUpdateLighting,
    onUpdateBackgroundColor
}) => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Production Environment</h2>
                <p className="text-gray-400 text-sm">Configure the global world settings for your photoshoot.</p>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <SwatchIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Background Selection</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {BACKGROUND_OPTIONS.map((bg) => {
                        const isActive = activeBackground === bg;
                        return (
                            <div 
                                key={bg}
                                onClick={() => onUpdateBackground(bg)}
                                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-4 ${
                                    isActive 
                                    ? 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-900/10' 
                                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                                    <SwatchIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>{bg}</h4>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-medium">Studio Setting</p>
                                </div>
                                {isActive && (
                                    <div className="absolute top-3 right-3 animate-in zoom-in">
                                        <CheckCircleIcon className="w-4 h-4 text-purple-500" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {activeBackground === Background.Studio && (
                    <div className="mt-6 p-6 bg-white/[0.03] border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Studio Background Color</h4>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                value={activeBackgroundColor}
                                onChange={(e) => onUpdateBackgroundColor?.(e.target.value)}
                                className="w-20 h-20 rounded-xl cursor-pointer border-2 border-white/20 bg-transparent"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={activeBackgroundColor}
                                    onChange={(e) => onUpdateBackgroundColor?.(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-200 font-mono uppercase"
                                    placeholder="#FFFFFF"
                                />
                                <p className="text-xs text-gray-500 mt-2">Choose any color for your studio background. This will be used as the solid color cyclorama.</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Lighting Architecture</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {LIGHTING_OPTIONS.map((l) => {
                        const isActive = activeLighting === l;
                        return (
                            <div 
                                key={l}
                                onClick={() => onUpdateLighting(l)}
                                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-4 ${
                                    isActive 
                                    ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-900/10' 
                                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>{l}</h4>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-medium">Global Illumination</p>
                                </div>
                                {isActive && (
                                    <div className="absolute top-3 right-3 animate-in zoom-in">
                                        <CheckCircleIcon className="w-4 h-4 text-indigo-500" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
            
            <div className="mt-8 p-6 bg-white/[0.03] border border-white/10 rounded-3xl flex items-start gap-4 max-w-2xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-400">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Production Tip</h4>
                    <p className="text-xs text-gray-400 leading-relaxed italic">
                        "Background and Lighting choices define the mood of your brand. Golden Hour is best for lifestyle, while Studio Light is preferred for high-volume catalog grids."
                    </p>
                </div>
            </div>
        </div>
    );
};
