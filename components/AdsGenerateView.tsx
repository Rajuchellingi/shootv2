
import React, { useState } from 'react';
import { MegaphoneIcon, UploadIcon, FilmIcon, PlayIcon, DownloadIcon, CheckCircleIcon, SparklesIcon } from './Icons';
import { generateCatalogVideo } from '../services/videoGenerator';
import { generateVideo as generateVeoVideo } from '../services/geminiService';
import { Spinner } from './Spinner';
import { OptionSelector } from './OptionSelector';
import { VideoResolution, VideoStyle, VideoDuration } from '../types';

const MOTION_PRESETS = [
    { 
        label: 'Runway Walk', 
        prompt: 'Cinematic Fashion Shot: The model walks forward with a confident, steady runway stride. The clothing fabric reacts naturally to physics/gravity. Sharp 4K focus, consistent anatomy, photorealistic textures, professional studio lighting. No morphing, no distortion, steady camera.' 
    },
    { 
        label: '360° Spin', 
        prompt: 'Studio Product Showcase: The model performs a slow, controlled 360-degree turn on the spot. The outfit maintains perfect structural consistency. Even lighting from all angles. Smooth motion, no blurring, consistent facial features throughout the spin.' 
    },
    { 
        label: 'Wind & Flow', 
        prompt: 'High-Speed Editorial: The model stands confidently while a strong wind blows the fabric of the outfit. The fabric ripples and flows realistically with complex cloth physics. The model remains sharp and in focus. Ultra-detailed texture rendering, slow motion.' 
    },
    { 
        label: 'Lifestyle Movement', 
        prompt: 'Natural Lifestyle: The model shifts weight comfortably and adjusts the outfit slightly with natural hand movements. Candid interaction, soft sunlight, shallow depth of field. Human-like micro-movements, no robotic stiffness.' 
    },
    { 
        label: 'Close-Up Detail', 
        prompt: 'Macro Detail Shot: Slow camera push-in on the fabric texture and details of the outfit. Subtle breathing movement from the model. The focus remains locked on the material quality. 8K resolution, sharp details.' 
    }
];

export const AdsGenerateView: React.FC = () => {
    // Mode State
    const [mode, setMode] = useState<'slideshow' | 'ai-motion'>('slideshow');

    // Slideshow State
    const [images, setImages] = useState<{ front?: File; side?: File; back?: File; detail?: File }>({});
    const [previews, setPreviews] = useState<{ front?: string; side?: string; back?: string; detail?: string }>({});
    
    // AI Motion State
    const [motionFile, setMotionFile] = useState<File | null>(null);
    const [motionPreview, setMotionPreview] = useState<string | null>(null);
    const [motionPrompt, setMotionPrompt] = useState('');
    const [hasPaidKey, setHasPaidKey] = useState(false);

    // Configuration State
    const [resolution, setResolution] = useState<VideoResolution>('9:16');
    const [durationStr, setDurationStr] = useState<VideoDuration>('8s');
    const [style, setStyle] = useState<VideoStyle>('Studio Pan & Zoom');

    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const checkKey = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio && aistudio.hasSelectedApiKey) {
                const hasKey = await aistudio.hasSelectedApiKey();
                setHasPaidKey(hasKey);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio && aistudio.openSelectKey) {
            await aistudio.openSelectKey();
            setHasPaidKey(true); // Optimistic update
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'back' | 'detail' | 'motion') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            if (type === 'motion') {
                setMotionFile(file);
                reader.onload = (ev) => setMotionPreview(ev.target?.result as string);
            } else {
                setImages(prev => ({ ...prev, [type]: file }));
                reader.onload = (ev) => {
                    setPreviews(prev => ({ ...prev, [type]: ev.target?.result as string }));
                };
            }
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);

        try {
            if (mode === 'slideshow') {
                if (!images.front && !images.side && !images.back && !images.detail) {
                    throw new Error("Please upload at least one image.");
                }
                const duration = parseInt(durationStr.replace('s', ''));
                const url = await generateCatalogVideo(images, {
                    resolution,
                    duration,
                    style
                });
                setVideoUrl(url);
            } else {
                // AI Motion (Veo)
                if (!motionFile) throw new Error("Please upload an image to animate.");
                if (!motionPrompt) throw new Error("Please describe the motion.");
                
                // Veo only supports 9:16 or 16:9 roughly mapped
                const targetRes = resolution === '1:1' ? '9:16' : resolution; 
                const url = await generateVeoVideo(motionFile, motionPrompt, targetRes as '16:9' | '9:16');
                setVideoUrl(url);
            }
        } catch (err: any) {
            console.error(err);
            if (err.message.includes("Requested entity was not found")) {
                setHasPaidKey(false); // Reset key state if invalid
                setError("API Key Error: Please select a valid paid API key.");
            } else {
                setError(err.message || "Failed to generate video.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const renderUploadSlot = (label: string, type: 'front' | 'side' | 'back' | 'detail', required: boolean = false) => {
        const preview = previews[type];
        return (
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                    {label}
                    {!required && <span className="text-gray-700 normal-case font-normal text-[9px]">(Optional)</span>}
                </label>
                <div className={`relative group aspect-[3/4] rounded-xl border-2 border-dashed transition-all duration-300 ${preview ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20'}`}>
                    <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleFileChange(e, type)} 
                        accept="image/png,image/jpeg,image/webp" 
                    />
                    
                    {preview ? (
                        <div className="absolute inset-0 p-2 overflow-hidden rounded-xl">
                            <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <UploadIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1 shadow-md">
                                <CheckCircleIcon className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <UploadIcon className="w-6 h-6 text-gray-600 mb-2 group-hover:text-gray-400 transition-colors" />
                            <span className="text-[10px] text-gray-500 font-medium">Browse</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Ads Generation</h2>
                    <p className="text-gray-400 text-sm">Create professional video ads using Studio Animation or Generative AI.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setMode('slideshow')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'slideshow' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Studio Slideshow
                    </button>
                    <button
                        onClick={() => setMode('ai-motion')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'ai-motion' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        AI Motion (Veo)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Configuration / Inputs */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {mode === 'slideshow' ? (
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <FilmIcon className="w-5 h-5 text-purple-400" />
                                <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wide">Source Images</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {renderUploadSlot('Front View', 'front', true)}
                                {renderUploadSlot('Side / 45°', 'side')}
                                {renderUploadSlot('Back View', 'back')}
                                {renderUploadSlot('Detail Shot', 'detail')}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <SparklesIcon className="w-5 h-5 text-purple-400" />
                                <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wide">AI Motion Input</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group h-64 rounded-xl border-2 border-dashed transition-all duration-300 border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        onChange={(e) => handleFileChange(e, 'motion')} 
                                        accept="image/png,image/jpeg,image/webp" 
                                    />
                                    {motionPreview ? (
                                        <div className="absolute inset-0 p-2">
                                            <img src={motionPreview} alt="Motion Input" className="w-full h-full object-contain rounded-lg" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <span className="text-white font-bold text-xs">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <UploadIcon className="w-8 h-8 text-gray-600 mb-2" />
                                            <p className="text-gray-400 text-xs">Upload image to animate</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Motion Description</label>
                                        <span className="text-[10px] text-purple-400 font-medium">Quick Presets</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {MOTION_PRESETS.map((preset) => (
                                            <button
                                                key={preset.label}
                                                onClick={() => setMotionPrompt(preset.prompt)}
                                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-gray-300 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-white transition-all whitespace-nowrap"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={motionPrompt}
                                        onChange={(e) => setMotionPrompt(e.target.value)}
                                        placeholder="e.g. The model turns to the side, fabric flowing in the wind..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none h-32 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 relative overflow-visible">
                        <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wide mb-4">Video Specs</h3>
                        <div className="space-y-4">
                            <div>
                                <OptionSelector 
                                    label="Resolution" 
                                    options={mode === 'ai-motion' ? ['9:16', '16:9'] : ['9:16', '16:9', '1:1']} 
                                    selected={resolution} 
                                    onSelect={(v) => setResolution(v as VideoResolution)} 
                                />
                            </div>
                            
                            {mode === 'slideshow' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Format</label>
                                            <div className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-3 text-sm text-gray-400 cursor-not-allowed">
                                                MP4 / WebM
                                            </div>
                                        </div>
                                        <OptionSelector 
                                            label="Duration" 
                                            options={['2s', '4s', '6s', '8s', '10s', '12s']} 
                                            selected={durationStr} 
                                            onSelect={(v) => setDurationStr(v as VideoDuration)} 
                                        />
                                    </div>
                                    <div>
                                        <OptionSelector 
                                            label="Motion Style" 
                                            options={['Studio Pan & Zoom', 'Zoom Focus', 'Dynamic Pan', '360° Turn']} 
                                            selected={style} 
                                            onSelect={(v) => setStyle(v as VideoStyle)} 
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    {mode === 'ai-motion' && !hasPaidKey ? (
                        <button
                            onClick={handleSelectKey}
                            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>Unlock AI Motion (Select API Key)</span>
                        </button>
                    ) : (
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || (mode === 'slideshow' && !images.front) || (mode === 'ai-motion' && (!motionFile || !motionPrompt))}
                            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-pink-900/20 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner />
                                    <span>{mode === 'ai-motion' ? 'Generating with Veo...' : 'Rendering Video...'}</span>
                                </>
                            ) : (
                                <>
                                    <MegaphoneIcon className="w-5 h-5" />
                                    <span>Generate Video</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Preview / Result */}
                <div className="lg:col-span-7">
                    <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-2xl p-6 h-[750px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-200 text-sm uppercase tracking-wide">
                                {mode === 'ai-motion' ? 'AI Motion Preview' : 'Studio Preview'}
                            </h3>
                            {videoUrl && (
                                <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">READY</span>
                            )}
                        </div>

                        <div className="flex-1 bg-black/40 rounded-xl overflow-hidden relative group flex items-center justify-center border border-white/5">
                            {videoUrl ? (
                                <video 
                                    src={videoUrl} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <PlayIcon className="w-8 h-8 text-gray-600 ml-1" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">Video preview will appear here</p>
                                    <p className="text-gray-600 text-xs mt-1">Upload images to start</p>
                                </div>
                            )}
                            
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-pink-300 font-bold mt-4 animate-pulse tracking-widest text-xs">
                                        {mode === 'ai-motion' ? 'CREATING MAGIC WITH VEO...' : 'RENDERING FRAME BY FRAME...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {videoUrl && (
                            <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
                                <a 
                                    href={videoUrl} 
                                    download={`studio-ad-${Date.now()}.mp4`}
                                    className="flex-1 bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    Download MP4
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
