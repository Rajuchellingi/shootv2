import React, { useState, useEffect } from 'react';
import type { GenerationOptions, SavedModel, Sequence, TextConfiguration, LogoConfiguration, AspectRatio, ModelAttributes } from '../types';
import { ModelType, Background, Lighting, ShotType, ProductCategory } from '../types';
import { BACKGROUND_OPTIONS, LIGHTING_OPTIONS } from './constants';
import { OptionSelector } from './OptionSelector';
import { UploadIcon, SparklesIcon, UserCircleIcon, LayersIcon, TypeIcon, LogoIcon, ViewBackIcon, PlusIcon, DimensionIcon, ViewDetailIcon, UsersIcon, SwatchIcon, CheckCircleIcon, EditIcon } from './Icons';
// Import Spinner component
import { Spinner } from './Spinner';
import { estimateTokenCount } from '../services/geminiService';

interface ControlPanelProps {
  onGenerate: (options: GenerationOptions) => void;
  onNavigate?: (view: string) => void;
  isLoading: boolean;
  selectedModelType?: ModelType;
  selectedModelName?: string;
  selectedModel?: SavedModel | null;
  activeSequence?: Sequence;
  activeText?: TextConfiguration | null;
  activeLogo?: LogoConfiguration | null;
  aspectRatio?: AspectRatio;
  background: Background;
  backgroundColorHex?: string;
  lighting: Lighting;
  prompt: string;
  setPrompt: (value: string) => void;
  
  // Edit Mode Props
  isEditMode?: boolean;
  editModeAttributes?: ModelAttributes | null;
  editModeReference?: string;

  // Lifted Upload Props
  uploadedFile: File | null;
  setUploadedFile: (f: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  fileName: string;
  setFileName: (n: string) => void;
  
  uploadedFileBack: File | null;
  setUploadedFileBack: (f: File | null) => void;
  previewUrlBack: string | null;
  setPreviewUrlBack: (url: string | null) => void;
  fileNameBack: string;
  setFileNameBack: (n: string) => void;
  
  uploadedFileFabric: File | null;
  setUploadedFileFabric: (f: File | null) => void;
  previewUrlFabric: string | null;
  setPreviewUrlFabric(url: string | null): void;
  fileNameFabric: string;
  setFileNameFabric: (n: string) => void;
  
  uploadedFileRef: File | null;
  setUploadedFileRef: (f: File | null) => void;
  previewUrlRef: string | null;
  setPreviewUrlRef(url: string | null): void;
  fileNameRef: string;
  setFileNameRef: (n: string) => void;

  // Style Reference
  uploadedFileStyleRef: File | null;
  setUploadedFileStyleRef: (f: File | null) => void;
  previewUrlStyleRef: string | null;
  setPreviewUrlStyleRef: (url: string | null) => void;
  fileNameStyleRef: string;
  setFileNameStyleRef: (n: string) => void;

  // TOP PRODUCT UPLOADS
  uploadedFileTop: File | null;
  setUploadedFileTop: (f: File | null) => void;
  previewUrlTop: string | null;
  setPreviewUrlTop: (url: string | null) => void;
  fileNameTop: string;
  setFileNameTop: (n: string) => void;
  
  // BOTTOM PRODUCT UPLOADS
  uploadedFileBottom: File | null;
  setUploadedFileBottom: (f: File | null) => void;
  previewUrlBottom: string | null;
  setPreviewUrlBottom: (url: string | null) => void;
  fileNameBottom: string;
  setFileNameBottom: (n: string) => void;
}

const StepNumber = ({ number }: { number: string }) => (
    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
        {number}
    </span>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    onGenerate, 
    onNavigate,
    isLoading, 
    selectedModelType, 
    selectedModelName,
    selectedModel,
    activeSequence,
    activeText,
    activeLogo,
    aspectRatio = '1:1',
    background,
    backgroundColorHex,
    lighting,
    prompt,
    setPrompt,
    
    isEditMode = false,
    editModeAttributes = null,
    editModeReference = undefined,

    uploadedFile, setUploadedFile, previewUrl, setPreviewUrl, fileName, setFileName,
    uploadedFileBack, setUploadedFileBack, previewUrlBack, setPreviewUrlBack, fileNameBack, setFileNameBack,
    uploadedFileFabric, setUploadedFileFabric, previewUrlFabric, setPreviewUrlFabric, fileNameFabric, setFileNameFabric,
    uploadedFileRef, setUploadedFileRef, previewUrlRef, setPreviewUrlRef, fileNameRef, setFileNameRef,
    uploadedFileStyleRef, setUploadedFileStyleRef, previewUrlStyleRef, setPreviewUrlStyleRef, fileNameStyleRef, setFileNameStyleRef,
    uploadedFileTop, setUploadedFileTop, previewUrlTop, setPreviewUrlTop, fileNameTop, setFileNameTop,
    uploadedFileBottom, setUploadedFileBottom, previewUrlBottom, setPreviewUrlBottom, fileNameBottom, setFileNameBottom
}) => {
  const [modelType, setModelType] = useState<ModelType>(selectedModelType || ModelType.Female);
  const [shotType, setShotType] = useState<ShotType>(ShotType.Standard);
  const [productCategory, setProductCategory] = useState<ProductCategory>(ProductCategory.Top); 
  
  const [showBackUpload, setShowBackUpload] = useState(false);
  const [showFabricUpload, setShowFabricUpload] = useState(false);
  const [showRefUpload, setShowRefUpload] = useState(false);
  const [showStyleRefUpload, setShowStyleRefUpload] = useState(false);

  useEffect(() => {
    if (selectedModelType) setModelType(selectedModelType);
  }, [selectedModelType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'fabric' | 'ref' | 'styleref' | 'top' | 'bottom') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        switch(type) {
            case 'back':
                setUploadedFileBack(file);
                setFileNameBack(file.name);
                setPreviewUrlBack(result);
                break;
            case 'fabric':
                setUploadedFileFabric(file);
                setFileNameFabric(file.name);
                setPreviewUrlFabric(result);
                break;
            case 'ref':
                setUploadedFileRef(file);
                setFileNameRef(file.name);
                setPreviewUrlRef(result);
                break;
            case 'styleref':
                setUploadedFileStyleRef(file);
                setFileNameStyleRef(file.name);
                setPreviewUrlStyleRef(result);
                break;
            case 'top':
                setUploadedFileTop(file);
                setFileNameTop(file.name);
                setPreviewUrlTop(result);
                break;
            case 'bottom':
                setUploadedFileBottom(file);
                setFileNameBottom(file.name);
                setPreviewUrlBottom(result);
                break;
            default:
                setUploadedFile(file);
                setFileName(file.name);
                setPreviewUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveView = (type: 'back' | 'fabric' | 'ref' | 'styleref' | 'top' | 'bottom') => {
      switch(type) {
          case 'back':
              setUploadedFileBack(null); setFileNameBack(''); setPreviewUrlBack(null); setShowBackUpload(false);
              break;
          case 'fabric':
              setUploadedFileFabric(null); setFileNameFabric(''); setPreviewUrlFabric(null); setShowFabricUpload(false);
              break;
          case 'ref':
              setUploadedFileRef(null); setFileNameRef(''); setPreviewUrlRef(null); setShowRefUpload(false);
              break;
          case 'styleref':
              setUploadedFileStyleRef(null); setFileNameStyleRef(''); setPreviewUrlStyleRef(null); setShowStyleRefUpload(false);
              break;
          case 'top':
              setUploadedFileTop(null); setFileNameTop(''); setPreviewUrlTop(null);
              break;
          case 'bottom':
              setUploadedFileBottom(null); setFileNameBottom(''); setPreviewUrlBottom(null);
              break;
      }
  };

  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
        if (!uploadedFile && !uploadedFileTop && !uploadedFileBottom) { 
            setEstimatedCost(0); return; 
        }
        setIsCalculatingCost(true);
        try {
            const cost = await estimateTokenCount({ 
                prompt: '', customInstructions: prompt,
                modelType, background, lighting, shotType, 
                uploadedFile, uploadedFileBack, uploadedFileFabric, uploadedFileRef, uploadedFileStyleRef,
                uploadedFileTop, uploadedFileBottom,
                productCategory, aspectRatio 
            });
            if (active) setEstimatedCost(cost);
        } catch (e) { console.error(e); } finally { if (active) setIsCalculatingCost(false); }
    }, 800);
    return () => { active = false; clearTimeout(timer); };
  }, [prompt, modelType, background, lighting, shotType, uploadedFile, uploadedFileBack, uploadedFileFabric, uploadedFileRef, uploadedFileStyleRef, uploadedFileTop, uploadedFileBottom, productCategory, aspectRatio]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on category
    if (productCategory === ProductCategory.CoordSet) {
        if (!uploadedFileTop && !uploadedFileBottom && !uploadedFile) {
            alert("Please upload at least one piece (Top or Bottom) for Co-ord Set.");
            return;
        }
    } else {
        if (!uploadedFile && !uploadedFileTop && !uploadedFileBottom) {
            alert("Please upload a product image to continue.");
            return;
        }
    }
    
    onGenerate({ 
        prompt: '', 
        customInstructions: prompt,
        modelType, 
        background, 
        backgroundColorHex, 
        lighting, 
        shotType,
        uploadedFile, 
        uploadedFileBack, 
        uploadedFileFabric, 
        uploadedFileRef,
        uploadedFileStyleRef,
        uploadedFileTop,
        uploadedFileBottom,
        productCategory, 
        aspectRatio,
        modelImageSrc: isEditMode ? editModeReference : (selectedModel?.imageSrc || undefined), 
        modelDescription: selectedModel?.description,
        modelAttributes: isEditMode ? (editModeAttributes || undefined) : selectedModel?.attributes,
        sequenceShots: activeSequence?.shots.map(s => s.prompt),
        logoConfig: activeLogo || undefined,
        textConfig: activeText || undefined,
        isEditMode,
        modelLockImage: isEditMode ? editModeReference : undefined
    });
  };

  const renderUploadBox = (type: 'front' | 'back' | 'fabric' | 'ref' | 'styleref' | 'top' | 'bottom') => {
      let currentPreview, currentFileName, label, id, icon;
      switch(type) {
          case 'back': currentPreview = previewUrlBack; currentFileName = fileNameBack; label = "Back View"; id = "image-upload-back"; icon = <ViewBackIcon className="w-5 h-5" />; break;
          case 'fabric': currentPreview = previewUrlFabric; currentFileName = fileNameFabric; label = "Fabric Detail"; id = "image-upload-fabric"; icon = <ViewDetailIcon className="w-5 h-5" />; break;
          case 'ref': currentPreview = previewUrlRef; currentFileName = fileNameRef; label = "Length Ref"; id = "image-upload-ref"; icon = <UsersIcon className="w-5 h-5" />; break;
          case 'styleref': currentPreview = previewUrlStyleRef; currentFileName = fileNameStyleRef; label = "Style Ref"; id = "image-upload-styleref"; icon = <LayersIcon className="w-5 h-5" />; break;
          case 'top': currentPreview = previewUrlTop; currentFileName = fileNameTop; label = "Top Garment"; id = "image-upload-top"; icon = <UploadIcon className="w-5 h-5" />; break;
          case 'bottom': currentPreview = previewUrlBottom; currentFileName = fileNameBottom; label = "Bottom Garment"; id = "image-upload-bottom"; icon = <UploadIcon className="w-5 h-5" />; break;
          default: currentPreview = previewUrl; currentFileName = fileName; label = isEditMode ? "New Product" : "Front View"; id = "image-upload-front"; icon = <UploadIcon className="w-5 h-5" />;
      }
      
      return (
        <div className="flex-1 min-w-0 animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{label}</label>
                {(type !== 'front' && type !== 'top' && type !== 'bottom') && (
                    <button type="button" onClick={() => handleRemoveView(type)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                    </button>
                )}
             </div>
             <div className={`relative group transition-all duration-300 rounded-xl border-2 border-dashed h-40 overflow-hidden ${currentPreview ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20'}`}>
                <input id={id} type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" onChange={(e) => handleFileChange(e, type)} accept="image/*" />
                {currentPreview ? (
                   <div className="absolute inset-0 w-full h-full">
                       <div className="absolute inset-0 bg-cover bg-center blur-md opacity-40" style={{ backgroundImage: `url(${currentPreview})` }}></div>
                       <img src={currentPreview} alt="Preview" className="relative w-full h-full object-contain z-10 p-2" />
                       <div className="absolute inset-0 z-20 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
                           <UploadIcon className="w-6 h-6 text-white mb-2" /><span className="text-xs font-bold text-white">Change</span>
                       </div>
                   </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 pointer-events-none p-4">
                        <div className={`p-2.5 rounded-full transition-all duration-300 bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300`}>{icon}</div>
                        <div>
                            <p className="text-xs font-bold text-gray-300 transition-colors">Drop Image</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      );
  }

  const isCoordSet = productCategory === ProductCategory.CoordSet;
  const activeUploadCount = 1 + (isCoordSet ? 1 : 0) + (showBackUpload ? 1 : 0) + (showFabricUpload ? 1 : 0) + (showRefUpload ? 1 : 0) + (showStyleRefUpload ? 1 : 0);
  const gridColsClass = activeUploadCount >= 3 ? 'grid-cols-1 sm:grid-cols-3' : activeUploadCount === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

  return (
    <form onSubmit={handleSubmit} className="bg-[#0a0a0a] bg-opacity-80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden h-[calc(100vh-120px)] lg:h-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-purple-500/50 blur-lg opacity-50"></div>
      <div className="flex-grow overflow-y-auto custom-scrollbar p-5 space-y-4 pb-40">
        
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2"><StepNumber number="1" /><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isEditMode ? 'New Shoot Set' : 'Product Input'}</h3></div>
            
            <div className="flex-1">
                <OptionSelector 
                    label="Shoot Type / Category" 
                    options={Object.values(ProductCategory)} 
                    selected={productCategory} 
                    onSelect={(v) => setProductCategory(v as ProductCategory)} 
                />
            </div>

            <div className={`grid gap-3 transition-all duration-300 ${gridColsClass}`}>
                {isCoordSet ? (
                    <>
                        {renderUploadBox('top')}
                        {renderUploadBox('bottom')}
                    </>
                ) : (
                    renderUploadBox('front')
                )}
                {showBackUpload && renderUploadBox('back')}
                {showFabricUpload && renderUploadBox('fabric')}
                {showRefUpload && renderUploadBox('ref')}
                {showStyleRefUpload && renderUploadBox('styleref')}
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-2">
                {!showBackUpload && <button type="button" onClick={() => setShowBackUpload(true)} className="h-[38px] px-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-purple-300 transition-all flex items-center gap-2 uppercase tracking-wide"><PlusIcon className="w-3 h-3" /> Back</button>}
                {!showFabricUpload && <button type="button" onClick={() => setShowFabricUpload(true)} className="h-[38px] px-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-purple-300 transition-all flex items-center gap-2 uppercase tracking-wide"><PlusIcon className="w-3 h-3" /> Fabric</button>}
                {!showRefUpload && <button type="button" onClick={() => setShowRefUpload(true)} className="h-[38px] px-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-purple-300 transition-all flex items-center gap-2 uppercase tracking-wide"><PlusIcon className="w-3 h-3" /> Length</button>}
                {!showStyleRefUpload && <button type="button" onClick={() => setShowStyleRefUpload(true)} className="h-[38px] px-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-purple-300 transition-all flex items-center gap-2 uppercase tracking-wide"><PlusIcon className="w-3 h-3" /> Style</button>}
            </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2"><StepNumber number="2" /><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Styling & Posture Notes</h3></div>
            <div className="relative group"><textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:border-purple-500 outline-none resize-none" placeholder="e.g. Model should be smiling, shirt half-tucked..." /></div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2"><StepNumber number="3" /><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Production Config</h3></div>
            <div className="space-y-2">
                <button type="button" onClick={() => onNavigate?.('models')} className="w-full bg-[#0f0f11] border border-white/10 rounded-xl p-2.5 flex items-center gap-3 text-left hover:border-purple-500/30 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {isEditMode && editModeReference ? <img src={editModeReference} className="w-full h-full object-cover" /> : (selectedModel?.imageSrc ? <img src={selectedModel.imageSrc} className="w-full h-full object-cover" /> : <UserCircleIcon className="w-5 h-5 text-gray-600" />)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Model Identity</p>
                        <p className="text-xs font-bold text-white truncate">{isEditMode ? 'Preserved' : (selectedModelName || 'Select Model')}</p>
                    </div>
                </button>
                <button type="button" onClick={() => onNavigate?.('environment')} className="w-full bg-[#0f0f11] border border-white/10 rounded-xl p-2.5 flex items-center gap-3 text-left hover:border-purple-500/30 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-purple-400"><SwatchIcon className="w-4 h-4" /></div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Environment</p>
                        <p className="text-xs font-bold text-white truncate">{background} • {lighting}</p>
                    </div>
                </button>
                <button type="button" onClick={() => onNavigate?.('dimension')} className="w-full bg-[#0f0f11] border border-white/10 rounded-xl p-2.5 flex items-center gap-3 text-left hover:border-purple-500/30 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-orange-400"><DimensionIcon className="w-4 h-4" /></div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Dimensions</p>
                        <p className="text-xs font-bold text-white truncate">{aspectRatio}</p>
                    </div>
                </button>
            </div>
        </div>
      </div>
      <div className="p-5 bg-[#050505] border-t border-white/[0.08] backdrop-blur-xl absolute bottom-0 left-0 right-0 z-20">
        <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl">
            {isLoading ? <Spinner /> : <SparklesIcon className="w-4 h-4 animate-pulse" />}
            <span className="text-xs tracking-wide font-bold uppercase">{isEditMode ? 'Update Outfit' : 'Generate Catalog Set'}</span>
        </button>
      </div>
    </form>
  );
};
