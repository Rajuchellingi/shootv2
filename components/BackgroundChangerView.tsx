
import React, { useState } from 'react';
import { UploadIcon, SwatchIcon, SparklesIcon, DownloadIcon } from './Icons';
import { replaceBackgroundImage } from '../services/geminiService';
import { Spinner } from './Spinner';

export const BackgroundChangerView: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    
    const [color, setColor] = useState('#ffffff');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreview(event.target?.result as string);
                setProcessedImage(null); // Reset result on new upload
            };
            reader.readAsDataURL(f);
        }
    };

    const handleProcess = async () => {
        if (!preview) return;
        setIsProcessing(true);
        setError(null);

        try {
            const result = await replaceBackgroundImage(preview, color);
            setProcessedImage(result);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to replace background.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `bg-changed-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Background Changer</h2>
                <p className="text-gray-400 text-sm">Remove and replace backgrounds instantly with AI.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Controls */}
                <div className="space-y-6">
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Image</h3>
                        </div>
                        <div className="relative group transition-all duration-300 rounded-xl border border-dashed border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20 h-64">
                            <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                onChange={handleFileChange} 
                                accept="image/png,image/jpeg,image/webp" 
                            />
                            
                            {preview ? (
                                <div className="absolute inset-0 p-2">
                                     <img src={preview} alt="Upload" className="w-full h-full object-contain" />
                                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                         <UploadIcon className="w-8 h-8 text-white mb-2" />
                                         <span className="text-xs font-bold text-white">Change Image</span>
                                     </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                    <div className="p-4 rounded-full bg-white/5 text-gray-500 mb-3 group-hover:bg-white/10 group-hover:text-gray-300 transition-colors">
                                        <UploadIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-300">Drop image here</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">PNG, JPG up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                             <SwatchIcon className="w-4 h-4 text-purple-400" />
                             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Background Color</h3>
                        </div>
                        
                        <div className="flex gap-4 items-center">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-inner">
                                <input 
                                    type="color" 
                                    value={color} 
                                    onChange={(e) => setColor(e.target.value)}
                                    className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Hex Code</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">#</span>
                                    <input 
                                        type="text" 
                                        value={color.replace('#', '')}
                                        onChange={(e) => setColor(`#${e.target.value}`)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-white font-mono uppercase focus:border-purple-500 outline-none"
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={handleProcess}
                        disabled={!preview || isProcessing}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Spinner />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                <span>Process Background</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Preview */}
                <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-2xl p-6 flex flex-col h-[600px]">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Result
                    </h3>
                    
                    <div className="flex-1 rounded-xl relative overflow-hidden flex items-center justify-center group shadow-inner bg-[#1a1a1a] border border-white/5">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                        
                        {!processedImage && (
                            <div className="text-gray-600 text-sm flex flex-col items-center">
                                <SwatchIcon className="w-12 h-12 mb-3 opacity-20" />
                                <span>Generated preview will appear here</span>
                            </div>
                        )}

                        {processedImage && (
                            <img 
                                src={processedImage} 
                                alt="Processed" 
                                className="max-w-full max-h-full object-contain relative z-10" 
                            />
                        )}
                    </div>

                     {processedImage && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <button 
                                onClick={handleDownload}
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download Image
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
