
import React, { useState } from 'react';
import type { GeneratedImage } from '../types';
import { DownloadIcon, MagicWandIcon, CameraIcon } from './Icons';
import { Spinner } from './Spinner';

interface ImageCardProps {
    image: GeneratedImage;
    onReusePrompt: (prompt: string) => void;
    onEditImage: (image: GeneratedImage) => void;
    onView: (image: GeneratedImage) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onReusePrompt, onEditImage, onView }) => {

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = image.src;
        link.download = `ai-photoshoot-${image.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditImage(image);
    };

    return (
        <div 
            onClick={() => onView(image)}
            className="relative group rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.08] shadow-lg transition-all duration-500 hover:shadow-purple-900/20 hover:border-purple-500/30 hover:-translate-y-1 cursor-pointer"
        >
            <div className="aspect-[3/4] w-full overflow-hidden bg-gray-900 relative">
                 <img 
                    src={image.src} 
                    alt={image.prompt} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                    loading="lazy"
                 />
                 
                 {/* Gradient Overlay on Hover */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            {image.usage && (
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-md border border-white/10 text-gray-300 text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]"></div>
                        {image.usage.totalTokens.toLocaleString()}
                    </div>
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20" onClick={(e) => e.stopPropagation()}>
                 <button
                    onClick={handleEdit}
                    className="flex-1 bg-purple-600/90 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg backdrop-blur-sm text-xs uppercase tracking-wide border border-white/10"
                    title="Edit"
                >
                    <MagicWandIcon className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={handleDownload}
                    className="flex-1 bg-white/90 text-black hover:bg-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg backdrop-blur-sm text-xs uppercase tracking-wide"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download
                </button>
            </div>
        </div>
    );
};


interface ImageGalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  expectedCount?: number;
  onReusePrompt: (prompt: string) => void;
  onEditImage: (image: GeneratedImage) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isLoading, expectedCount = 4, onReusePrompt, onEditImage }) => {
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);

  return (
    <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-12 min-h-[60vh]">
            {isLoading && (
                <>
                    {Array.from({ length: expectedCount }).map((_, i) => (
                        <div key={i} className="relative aspect-[3/4] bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col items-center justify-center gap-4 animate-pulse">
                            <Spinner />
                            <span className="text-xs text-gray-500 font-mono tracking-wider animate-pulse">DEVELOPING...</span>
                        </div>
                    ))}
                </>
            )}

            {!isLoading && images.length === 0 && (
                <div className="col-span-full h-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative w-full max-w-5xl aspect-video bg-white/[0.01] border-2 border-dashed border-white/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center p-8 group">
                        
                        {/* Background Light Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full group-hover:bg-purple-600/20 transition-all duration-700"></div>
                        
                        <div className="relative">
                            {/* Icon Container */}
                            <div className="w-20 h-20 bg-[#0d0d0f] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl mb-8 group-hover:scale-105 group-hover:border-purple-500/30 transition-all duration-500">
                                <CameraIcon className="w-8 h-8 text-purple-500" />
                            </div>
                            
                            {/* Inner Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent blur-xl opacity-50 pointer-events-none"></div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight text-center">Ready for Photoshoot</h2>
                        <p className="text-gray-500 text-center max-w-sm leading-relaxed font-medium">
                            Configure settings and upload a product to start generating professional shots.
                        </p>
                    </div>
                </div>
            )}

            {images.map((image) => (
                <ImageCard 
                    key={image.id} 
                    image={image} 
                    onReusePrompt={onReusePrompt}
                    onEditImage={onEditImage}
                    onView={setViewingImage}
                />
            ))}
        </div>

        {/* Full Screen Lightbox Modal */}
        {viewingImage && (
            <div 
                className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" 
                onClick={() => setViewingImage(null)}
            >
                <button 
                    onClick={() => setViewingImage(null)} 
                    className="absolute top-6 right-6 p-3 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 backdrop-blur-md border border-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <img 
                    src={viewingImage.src} 
                    alt="Full View" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()} 
                />
                
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                     <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs text-gray-300 pointer-events-auto">
                        Click anywhere to close
                     </div>
                </div>
            </div>
        )}
    </>
  );
};
