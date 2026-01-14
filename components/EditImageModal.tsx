
import React, { useState } from 'react';
import { MagicWandIcon, ArrowLeftIcon } from './Icons';
import { Spinner } from './Spinner';

interface EditImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onConfirm: (prompt: string) => Promise<void>;
    isProcessing: boolean;
}

export const EditImageModal: React.FC<EditImageModalProps> = ({ 
    isOpen, onClose, imageSrc, onConfirm, isProcessing 
}) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        await onConfirm(prompt);
        setPrompt('');
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col md:flex-row shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Image Preview Panel */}
                <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative p-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-50">
                    <img 
                        src={imageSrc} 
                        alt="Edit Target" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                    <div className="absolute top-4 left-4">
                        <span className="bg-black/60 backdrop-blur-md text-xs font-bold text-white px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                           <MagicWandIcon className="w-3 h-3 text-purple-400" /> Original Image
                        </span>
                    </div>
                </div>

                {/* Controls Panel */}
                <div className="w-full md:w-1/3 bg-[#0f0f0f] border-l border-white/10 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MagicWandIcon className="w-5 h-5 text-purple-500" />
                                Edit
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Describe what you want to change in the image. The AI will modify the image while keeping the original composition.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Edit Instruction</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g. Add a silver watch to the wrist, change background to blue..."
                                    className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || isProcessing}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Spinner />
                                    <span>Processing Edit...</span>
                                </>
                            ) : (
                                <>
                                    <MagicWandIcon className="w-4 h-4" />
                                    <span>Generate Edit</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl transition-all border border-white/5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
