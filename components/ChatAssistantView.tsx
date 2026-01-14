import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, UploadIcon, SendIcon, UserCircleIcon, DownloadIcon, FolderIcon } from './Icons';
import { ProjectTemplate, GeneratedImage, AssistantMessage, Position } from '../types';
import { processAssistantMessage } from '../services/chatAssistantService';
import { Spinner } from './Spinner';

interface ProductFolder {
    folderName: string;
    files: File[];
    previewImage?: string;
}

interface ChatAssistantViewProps {
    templates: ProjectTemplate[];
    sequences: { id: string; name: string; shots: Position[]; }[];
    onTriggerShoot: (
        templateId: string, 
        productFiles: { front: File; back?: File; fabric?: File; reference?: File }, 
        poseCode?: string,
        customInstructions?: string
    ) => Promise<GeneratedImage[]>;
    onDownloadAll: () => Promise<void>;
    messages: AssistantMessage[];
    setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>;
}

const organizeFilesByProduct = async (files: File[]): Promise<ProductFolder[]> => {
    const productMap = new Map<string, File[]>();
    
    files.forEach(file => {
        const pathParts = file.webkitRelativePath?.split('/') || [file.name];
        const productFolderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Product';
        
        if (!productMap.has(productFolderName)) {
            productMap.set(productFolderName, []);
        }
        productMap.get(productFolderName)!.push(file);
    });

    const productFolders: ProductFolder[] = [];
    
    for (const [folderName, folderFiles] of productMap.entries()) {
        const frontFile = folderFiles.find(f => f.name.toLowerCase().includes('front'));
        const previewFile = frontFile || folderFiles[0];
        
        let previewImage: string | undefined;
        if (previewFile) {
            previewImage = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.readAsDataURL(previewFile);
            });
        }
        
        productFolders.push({
            folderName,
            files: folderFiles,
            previewImage
        });
    }
    
    return productFolders;
};

export const ChatAssistantView: React.FC<ChatAssistantViewProps> = ({ 
    templates, 
    sequences,
    onTriggerShoot, 
    onDownloadAll, 
    messages, 
    setMessages 
}) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [productFolders, setProductFolders] = useState<ProductFolder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const hasAnyResults = messages.some(m => m.resultImages && m.resultImages.length > 0);

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = (Array.from(e.target.files) as File[]).filter(f => f.type.startsWith('image/'));
            if (files.length === 0) return;

            setSelectedFiles(files);
            const organized = await organizeFilesByProduct(files);
            setProductFolders(organized);
        }
    };

    const handleDownload = (img: GeneratedImage) => {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `shoot-${img.id}.jpg`;
        link.click();
    };

    const handleSend = async () => {
        if (!inputValue.trim() && productFolders.length === 0) return;

        const totalProducts = productFolders.length;
        const representativePreview = productFolders[0]?.previewImage || null;
        
        const userMessage: AssistantMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue || `Process all ${totalProducts} products with template`,
            image: representativePreview || undefined,
            isBatch: totalProducts > 1,
            batchCount: totalProducts
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        const currentProductFolders = [...productFolders];
        setProductFolders([]);

        try {
            const response = await processAssistantMessage(
                inputValue, 
                representativePreview, 
                templates,
                totalProducts
            );
            
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: response.text
            }]);

            if (response.triggerTemplateId && response.processAllProducts && response.generateAllPoses && currentProductFolders.length > 0) {
                const triggerId = response.triggerTemplateId;
                const customInstructions = response.customInstructions;
                
                const template = templates.find(t => t.id === triggerId);
                const sequence = template ? sequences.find(s => s.id === template.sequenceId) : null;
                const poses = sequence?.shots || [];
                
                if (poses.length === 0) {
                    setMessages(prev => [...prev, {
                        id: `${Date.now()}-error`,
                        role: 'assistant',
                        text: "⚠️ Template has no pose sequence defined. Please add poses to the template first."
                    }]);
                    setIsLoading(false);
                    return;
                }

                const totalPoses = poses.length;
                const customInstMsg = customInstructions ? ` | Custom Styling: ${customInstructions}` : '';
                
                setMessages(prev => [...prev, {
                    id: `${Date.now()}-progress-intro`,
                    role: 'assistant',
                    text: `🎬 Starting complete generation: ${totalProducts} products × ${totalPoses} poses = ${totalProducts * totalPoses} total images${customInstMsg}...`
                }]);

                for (let productIdx = 0; productIdx < currentProductFolders.length; productIdx++) {
                    const productFolder = currentProductFolders[productIdx];
                    const productBubbleId = `${Date.now()}-product-${productIdx}`;
                    
                    setMessages(prev => [...prev, {
                        id: productBubbleId,
                        role: 'assistant',
                        text: `📦 Product ${productIdx + 1}/${currentProductFolders.length}: "${productFolder.folderName}" - Starting ${totalPoses} pose sequence...`,
                        isGenerating: true
                    }]);

                    const productResults: GeneratedImage[] = [];
                    
                    const views = {
                        front: productFolder.files.find(f => f.name.toLowerCase().includes('front')) || productFolder.files[0],
                        back: productFolder.files.find(f => f.name.toLowerCase().includes('back')),
                        fabric: productFolder.files.find(f => f.name.toLowerCase().includes('fabric')),
                        reference: productFolder.files.find(f => f.name.toLowerCase().includes('reference') || f.name.toLowerCase().includes('ref'))
                    };

                    for (let poseIdx = 0; poseIdx < poses.length; poseIdx++) {
                        const pose = poses[poseIdx];
                        const poseCode = typeof pose.code === 'string' ? pose.code : pose.prompt;
                        
                        setMessages(prev => prev.map(m => m.id === productBubbleId ? {
                            ...m,
                            text: `📦 Product ${productIdx + 1}/${currentProductFolders.length}: "${productFolder.folderName}" - Generating pose ${poseIdx + 1}/${totalPoses} (${pose.name})...`,
                        } : m));

                        try {
                            const poseResults = await onTriggerShoot(triggerId, views, poseCode, customInstructions);
                            productResults.push(...poseResults.map(img => ({
                                ...img,
                                folderName: productFolder.folderName,
                                prompt: `${pose.name} - ${img.prompt}`
                            })));
                            
                            await new Promise(r => setTimeout(r, 400));
                            
                        } catch (poseErr) {
                            console.error(`Error generating pose ${pose.name} for ${productFolder.folderName}:`, poseErr);
                            setMessages(prev => [...prev, {
                                id: `${Date.now()}-pose-error-${productIdx}-${poseIdx}`,
                                role: 'assistant',
                                text: `⚠️ Failed to generate ${pose.name} for ${productFolder.folderName}. Continuing...`
                            }]);
                        }
                    }

                    setMessages(prev => prev.map(m => m.id === productBubbleId ? {
                        ...m,
                        text: `✅ Completed: "${productFolder.folderName}" - ${productResults.length}/${totalPoses} poses generated successfully`,
                        isGenerating: false,
                        resultImages: productResults,
                        productFolderName: productFolder.folderName
                    } : m));
                    
                    await new Promise(r => setTimeout(r, 500));
                }

                const totalGenerated = currentProductFolders.length * totalPoses;
                setMessages(prev => [...prev, {
                    id: `${Date.now()}-complete`,
                    role: 'assistant',
                    text: `🎉 Complete! Generated ${totalGenerated} images across ${currentProductFolders.length} products${customInstMsg}. All images organized by product folder. Click "ZIP CATALOG" to download.`
                }]);
            }

        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                text: "I'm sorry, I encountered an error during processing. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] relative overflow-hidden animate-in fade-in duration-500">
            <div className="flex-shrink-0 flex items-center justify-center py-4 px-6 z-20">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-full backdrop-blur-md shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Orchestrator Online</span>
                    </div>
                    <div className="w-px h-3 bg-white/10"></div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{templates.length} Templates Synced</span>
                    {hasAnyResults && (
                        <>
                            <div className="w-px h-3 bg-white/10"></div>
                            <button onClick={onDownloadAll} className="flex items-center gap-2 text-[10px] font-bold text-white hover:text-purple-400 uppercase tracking-widest transition-colors">
                                <DownloadIcon className="w-3.5 h-3.5" /> ZIP CATALOG
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-40">
                <div className="max-w-3xl mx-auto py-4 space-y-10">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${msg.role === 'user' ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-purple-600/10 border-purple-500/20 shadow-lg shadow-purple-900/10'}`}>
                                {msg.role === 'user' ? <UserCircleIcon className="w-5 h-5 text-indigo-400" /> : <SparklesIcon className="w-5 h-5 text-purple-400" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-2 leading-none">{msg.role === 'user' ? 'Client' : 'Production AI'}</div>
                                {msg.image && (
                                    <div className="mb-4 flex flex-col gap-2">
                                        <div className="rounded-2xl overflow-hidden border border-white/10 max-w-sm shadow-2xl bg-black/40 relative">
                                            <img src={msg.image} alt="Input" className="w-full h-auto object-contain max-h-96" />
                                            {msg.isBatch && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                                    <div className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl">Batch: {msg.batchCount} Products</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className={`text-base sm:text-lg leading-relaxed ${msg.role === 'user' ? 'text-gray-100 font-medium' : 'text-gray-300 font-serif'}`}>{msg.text}</div>
                                {msg.isGenerating && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mt-6 animate-pulse">
                                        <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5 flex items-center justify-center"><Spinner /></div>
                                        <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5"></div>
                                        <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5"></div>
                                    </div>
                                )}
                                {msg.resultImages && msg.resultImages.length > 0 && (
                                    <div className="mt-6">
                                        {msg.productFolderName && (
                                            <div className="mb-3 text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                                <FolderIcon className="w-3.5 h-3.5" /> {msg.productFolderName}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl">
                                            {msg.resultImages.map((img, idx) => (
                                                <div 
                                                    key={img.id} 
                                                    onClick={() => setViewingImage(img)}
                                                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/40 animate-in zoom-in-95 duration-500 cursor-pointer" 
                                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                                >
                                                    <img src={img.src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDownload(img); }} 
                                                                className="flex-1 bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-lg backdrop-blur-md border border-white/20 flex items-center justify-center"
                                                            >
                                                                <DownloadIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {img.prompt && (
                                                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[8px] px-2 py-1 rounded-md backdrop-blur-sm border border-white/5 truncate max-w-[80%]">
                                                            {img.prompt.split(' - ')[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 sm:gap-6 animate-in fade-in duration-300">
                             <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-purple-600/5 border border-purple-500/10"><Spinner /></div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em] mb-4">Orchestrating Sequence</div>
                                <div className="h-4 w-64 bg-white/5 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 pointer-events-none">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    {productFolders.length > 0 && (
                        <div className="mb-4 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
                            <div className="relative p-3 bg-[#111] border border-purple-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl">
                                <div className="flex -space-x-3 items-center px-2">
                                    {productFolders.slice(0, 5).map((f, i) => (
                                        <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#111] shadow-lg bg-black">
                                            {f.previewImage && <img src={f.previewImage} className="w-full h-full object-cover" />}
                                        </div>
                                    ))}
                                    {productFolders.length > 5 && (
                                        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#111] z-10">
                                            +{productFolders.length - 5}
                                        </div>
                                    )}
                                    <div className="ml-4 pr-2">
                                         <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mb-1">{productFolders.length} Products Identified</p>
                                         <p className="text-[9px] text-gray-500 uppercase tracking-widest">Complete sequence processing ready</p>
                                    </div>
                                    <button onClick={() => { setProductFolders([]); }} className="bg-black border border-white/10 p-1.5 rounded-full text-white hover:text-red-400 transition-colors ml-4"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative bg-[#0d0d0f]/90 border border-white/[0.08] rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-end gap-2 group focus-within:border-purple-500/50 transition-all duration-300">
                        <div className="flex gap-1">
                            <button onClick={() => folderInputRef.current?.click()} className={`p-3 rounded-2xl transition-all flex-shrink-0 ${productFolders.length > 0 ? 'bg-purple-600/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:text-white'}`} title="Upload Catalog Folder"><FolderIcon className="w-6 h-6" /></button>
                        </div>
                        
                        <input type="file" ref={folderInputRef} onChange={handleFilesChange} className="hidden" {...({ webkitdirectory: "", directory: "", multiple: true } as any)} />
                        
                        <div className="flex-1 px-2 py-1">
                            <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={productFolders.length > 0 ? "Specify template for complete sequence... (e.g. 'Use Amazon template')" : "Upload product folder... (e.g. 'Use Amazon template')"} className="w-full bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 outline-none py-2.5 text-base resize-none max-h-48 custom-scrollbar leading-relaxed" rows={1} style={{ minHeight: '44px' }} />
                        </div>

                        <button onClick={handleSend} disabled={(!inputValue.trim() && productFolders.length === 0) || isLoading} className={`p-3 rounded-2xl transition-all shadow-lg flex-shrink-0 ${(!inputValue.trim() && productFolders.length === 0) || isLoading ? 'bg-white/5 text-gray-700' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/40 active:scale-95'}`}><SendIcon className="w-6 h-6" /></button>
                    </div>
                </div>
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
        </div>
    );
};