import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ImageGallery } from './components/ImageGallery';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ModelsView } from './components/ModelsView';
import { PositionView, STANDARD_POSITIONS } from './components/PositionView';
import { LogoSetupView } from './components/LogoSetupView';
import { TextSetupView } from './components/TextSetupView';
import { BackgroundChangerView } from './components/BackgroundChangerView';
import { ImageEditorView } from './components/ImageEditorView';
import { DimensionView } from './components/DimensionView';
import { TemplatesView } from './components/TemplatesView';
import { ChatAssistantView } from './components/ChatAssistantView';
import { EnvironmentView } from './components/EnvironmentView';
import { AuthScreen } from './components/AuthScreen';
import { EditImageModal } from './components/EditImageModal';
import { generateProductImage, editGeneratedImage, extractModelAttributes } from './services/geminiService';
import { fetchModelsFromDB, saveModelToDB, deleteModelFromDB, updateModelInDB } from './services/modelService';
import { fetchSequencesFromDB, saveSequenceToDB, deleteSequenceFromDB, updateSequenceInDB } from './services/sequenceService';
import { fetchDimensionsFromDB } from './services/dimensionService';
import { fetchLogos } from './services/logoService';
import { fetchTexts } from './services/textService';
import { fetchTemplates } from './services/templateService';
import { supabase } from './services/supabase';
import type { GenerationOptions, GeneratedImage, SavedModel, Sequence, LogoConfiguration, TextConfiguration, AspectRatio, ProjectTemplate, AssistantMessage, ModelAttributes } from './types';
import { ModelType, ShotType, Background, Lighting, ProductCategory } from './types';
import { PlusIcon, DownloadIcon, EditIcon } from './components/Icons';
import { Spinner } from './components/Spinner';

declare var JSZip: any;

const DEFAULT_ASSISTANT_MSG: AssistantMessage = { 
    id: '1', 
    role: 'assistant', 
    text: "Welcome to the Production Studio. I can help you start a professional photoshoot instantly. Upload your product (or a folder of products) and tell me which template to apply." 
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState('generation');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(4); 
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // Image Editing State
  const [editingImageTarget, setEditingImageTarget] = useState<GeneratedImage | null>(null);
  const [isEditProcessing, setIsEditProcessing] = useState(false);

  // Edit Mode / Model Preservation State
  const [editMode, setEditMode] = useState<{
      isEditing: boolean;
      modelReference: string;
      extractedAttributes: ModelAttributes | null;
  } | null>(null);
  const [isExtractingAttributes, setIsExtractingAttributes] = useState(false);

  // Product Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  
  const [uploadedFileBack, setUploadedFileBack] = useState<File | null>(null);
  const [previewUrlBack, setPreviewUrlBack] = useState<string | null>(null);
  const [fileNameBack, setFileNameBack] = useState('');
  
  const [uploadedFileFabric, setUploadedFileFabric] = useState<File | null>(null);
  const [previewUrlFabric, setPreviewUrlFabric] = useState<string | null>(null);
  const [fileNameFabric, setFileNameFabric] = useState('');
  
  const [uploadedFileRef, setUploadedFileRef] = useState<File | null>(null);
  const [previewUrlRef, setPreviewUrlRef] = useState<string | null>(null);
  const [fileNameRef, setFileNameRef] = useState('');

  // NEW: Style Reference
  const [uploadedFileStyleRef, setUploadedFileStyleRef] = useState<File | null>(null);
  const [previewUrlStyleRef, setPreviewUrlStyleRef] = useState<string | null>(null);
  const [fileNameStyleRef, setFileNameStyleRef] = useState('');

  // NEW: TOP and BOTTOM product state
  const [uploadedFileTop, setUploadedFileTop] = useState<File | null>(null);
  const [previewUrlTop, setPreviewUrlTop] = useState<string | null>(null);
  const [fileNameTop, setFileNameTop] = useState('');
  
  const [uploadedFileBottom, setUploadedFileBottom] = useState<File | null>(null);
  const [previewUrlBottom, setPreviewUrlBottom] = useState<string | null>(null);
  const [fileNameBottom, setFileNameBottom] = useState('');

  const [sessionKey, setSessionKey] = useState(0);
  const [prompt, setPrompt] = useState('');

  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [selectedModelType, setSelectedModelType] = useState<ModelType>(ModelType.Female);
  const [selectedModelName, setSelectedModelName] = useState<string>('Standard Studio Model');

  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);

  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isSequencesLoading, setIsSequencesLoading] = useState(false);

  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [allLogos, setAllLogos] = useState<LogoConfiguration[]>([]);
  const [allTexts, setAllTexts] = useState<TextConfiguration[]>([]);

  const [activeLogo, setActiveLogo] = useState<LogoConfiguration | null>(null);
  const [activeText, setActiveText] = useState<TextConfiguration | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [background, setBackground] = useState<Background>(Background.Studio);
  const [backgroundColorHex, setBackgroundColorHex] = useState<string>('#FFFFFF');
  const [lighting, setLighting] = useState<Lighting>(Lighting.Dramatic);

  // Persistent Assistant State
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([DEFAULT_ASSISTANT_MSG]);

  const hasInitializedDefaults = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      if (newUser?.id !== user?.id) {
          setGeneratedImages([]);
          setAssistantMessages([DEFAULT_ASSISTANT_MSG]);
          setPrompt('');
          setEditMode(null);
          hasInitializedDefaults.current = false;
      }
      setUser(newUser);
    });
    return () => subscription.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
        if (!user || hasInitializedDefaults.current) return;
        setIsModelsLoading(true);
        setIsSequencesLoading(true);
        try {
          const [models, seqs, dims, tmpls] = await Promise.all([
            fetchModelsFromDB(user.id),
            fetchSequencesFromDB(user.id),
            fetchDimensionsFromDB(user.id),
            fetchTemplates(user.id)
          ]);
          setSavedModels(models);
          const activeM = models.find(m => m.isActive);
          if (activeM) {
              setSelectedModel(activeM);
              setSelectedModelType(activeM.modelType);
              setSelectedModelName(activeM.name);
          }
          if (seqs.length > 0) {
             setSequences(seqs);
          } else {
             const defaultSeq: Sequence = {
                  id: '', 
                  name: 'Standard E-Commerce',
                  shots: [STANDARD_POSITIONS[0], STANDARD_POSITIONS[1], STANDARD_POSITIONS[4]],
                  isActive: true,
                  userId: user.id
             };
             const savedDefault = await saveSequenceToDB(defaultSeq);
             setSequences([savedDefault]);
          }
          const activeDim = dims.find(d => d.isActive);
          if (activeDim) {
              if (activeDim.originalId) setAspectRatio(activeDim.originalId);
              else setAspectRatio(`${activeDim.width}:${activeDim.height}`);
          }
          setTemplates(tmpls);
          await refreshBrandingData(user.id);
          hasInitializedDefaults.current = true;
        } catch (e) {
          console.error("Failed to load Studio data:", e);
        } finally {
          setIsModelsLoading(false);
          setIsSequencesLoading(false);
        }
    };
    if (!isAuthChecking && user) {
      loadData();
    }
  }, [user, isAuthChecking]);

  const refreshBrandingData = async (userId: string) => {
      try {
          const [logos, texts] = await Promise.all([fetchLogos(userId), fetchTexts(userId)]);
          setAllLogos(logos);
          setActiveLogo(logos.find(l => l.isActive) || null);
          setAllTexts(texts);
          setActiveText(texts.find(t => t.isActive) || null);
      } catch (e) {
          console.error("Failed to refresh Studio branding:", e);
      }
  };

  const handleSetActiveModel = async (id: string) => {
      const updatedModels = savedModels.map(m => ({...m, isActive: m.id === id}));
      setSavedModels(updatedModels);
      const newActive = updatedModels.find(m => m.id === id);
      if (newActive) {
          setSelectedModel(newActive);
          setSelectedModelName(newActive.name);
          setSelectedModelType(newActive.modelType);
      }
      try {
          const deactivations = savedModels.filter(m => m.isActive && m.id !== id).map(m => updateModelInDB({...m, isActive: false}));
          await Promise.all(deactivations);
          if (newActive) await updateModelInDB({...newActive, isActive: true});
      } catch (e) {
          console.error("Failed to persist model active state:", e);
      }
  };

  const handleApplyTemplate = (template: ProjectTemplate) => {
      const templateModel = savedModels.find(m => m.id === template.modelId);
      if (templateModel) handleSetActiveModel(templateModel.id);
      const templateSeq = sequences.find(s => s.id === template.sequenceId);
      if (templateSeq) handleSetActiveSequence(template.sequenceId);
      setAspectRatio(template.dimensionId);
      setActiveLogo(allLogos.find(l => l.id === template.logoId) || null);
      setActiveText(allTexts.find(t => t.id === template.textId) || null);
      if (template.background) setBackground(template.background);
      if (template.backgroundColorHex) setBackgroundColorHex(template.backgroundColorHex);
      if (template.lighting) setLighting(template.lighting);
      setCurrentView('generation');
  };

  const handleSetActiveSequence = async (id: string) => {
      const updatedSeqs = sequences.map(s => ({...s, isActive: s.id === id}));
      setSequences(updatedSeqs);
      try {
          await Promise.all(updatedSeqs.map(s => updateSequenceInDB(s)));
      } catch (e) {
          console.error("Failed to sync sequence active state:", e);
      }
  };

  const handleConfirmEdit = async (editPrompt: string) => {
    if (!editingImageTarget) return;
    setIsEditProcessing(true);
    try {
        const result = await editGeneratedImage(editingImageTarget.src, editPrompt);
        setGeneratedImages(prev => [result, ...prev]);
        setEditingImageTarget(null);
    } catch (err: any) {
        setError(err.message || "Failed to edit image.");
    } finally {
        setIsEditProcessing(false);
    }
  };

  const handleStartEdit = useCallback(async (images: GeneratedImage[]) => {
      if (images.length === 0) return;
      console.log('🔄 handleStartEdit triggered. Extracting attributes...');
      setIsExtractingAttributes(true);
      try {
          const attributes = await extractModelAttributes(images[0].src);
          console.log('✅ Extracted attributes:', attributes);
          
          setEditMode({
              isEditing: true,
              modelReference: images[0].src,
              extractedAttributes: attributes
          });
          
          setGeneratedImages([]);
          setUploadedFile(null);
          setUploadedFileBack(null);
          setUploadedFileFabric(null);
          setUploadedFileTop(null);
          setUploadedFileBottom(null);
          setFileName('');
          setFileNameBack('');
          setFileNameFabric('');
          setFileNameTop('');
          setFileNameBottom('');
          setPreviewUrl(null);
          setPreviewUrlBack(null);
          setPreviewUrlFabric(null);
          setPreviewUrlTop(null);
          setPreviewUrlBottom(null);
          
          setPrompt('Locked Model Persona. Please upload a new product to swap outfits.');
          setCurrentView('generation');
          
      } catch (err) {
          console.error("❌ Failed model extraction", err);
          setError("Failed to extract model attributes. Please try again.");
      } finally {
          setIsExtractingAttributes(false);
      }
  }, []);

  const handleAssistantShootRequest = async (
      templateId: string, 
      productFiles: { front: File; back?: File; fabric?: File; reference?: File; styleReference?: File; top?: File; bottom?: File },
      poseCode?: string,
      customInstructions?: string
  ): Promise<GeneratedImage[]> => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");
      const model = savedModels.find(m => m.id === template.modelId) || savedModels.find(m => m.isActive) || savedModels[0];
      const seq = sequences.find(s => s.id === template.sequenceId) || sequences.find(s => s.isActive) || sequences[0];
      const logo = allLogos.find(l => l.id === template.logoId);
      const text = allTexts.find(t => t.id === template.textId);
      
      const options: GenerationOptions = {
          prompt: '',
          customInstructions: customInstructions || prompt,
          modelType: model?.modelType || ModelType.Female,
          background: template.background || Background.Studio,
          backgroundColorHex: template.backgroundColorHex || (template.background === Background.Studio ? backgroundColorHex : undefined),
          lighting: template.lighting || Lighting.Dramatic,
          shotType: ShotType.Standard,
          uploadedFile: productFiles.front,
          uploadedFileBack: productFiles.back,
          uploadedFileFabric: productFiles.fabric,
          uploadedFileRef: productFiles.reference,
          uploadedFileStyleRef: productFiles.styleReference,
          uploadedFileTop: productFiles.top,
          uploadedFileBottom: productFiles.bottom,
          productCategory: ProductCategory.Top,
          aspectRatio: template.dimensionId,
          modelImageSrc: model?.imageSrc,
          modelDescription: model?.description,
          modelAttributes: model?.attributes,
          sequenceShots: poseCode ? [poseCode] : seq?.shots.map(s => s.prompt),
          logoConfig: logo,
          textConfig: text
      };
      
      const images = await generateProductImage(options);
      setGeneratedImages(prev => [...images, ...prev]);
      return images;
  };

  const handleGenerate = useCallback(async (options: GenerationOptions) => {
    if (!options.uploadedFile && !options.uploadedFileTop && !options.uploadedFileBottom) {
        alert("Please upload a product image to continue.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    let count = 4;
    if (options.sequenceShots && options.sequenceShots.length > 0) count = options.sequenceShots.length;
    setLoadingCount(count);

    const generationOptions: GenerationOptions = {
        ...options,
        logoConfig: activeLogo || undefined,
        textConfig: activeText || undefined,
        aspectRatio: aspectRatio,
        backgroundColorHex: background === Background.Studio ? backgroundColorHex : undefined,
        isEditMode: editMode?.isEditing || false,
        modelLockImage: editMode?.isEditing ? editMode.modelReference : undefined,
        modelAttributes: editMode?.isEditing ? editMode.extractedAttributes || undefined : selectedModel?.attributes
    };

    try {
      const results = await generateProductImage(generationOptions);
      if (editMode?.isEditing) {
          setGeneratedImages(results);
          setEditMode(null);
          setPrompt('');
      } else {
          setGeneratedImages(prevImages => [...results, ...prevImages]);
      }
      
      setUploadedFile(null);
      setUploadedFileBack(null);
      setUploadedFileFabric(null);
      setUploadedFileRef(null);
      setUploadedFileStyleRef(null);
      setUploadedFileTop(null);
      setUploadedFileBottom(null);
      setFileName('');
      setFileNameBack('');
      setFileNameFabric('');
      setFileNameRef('');
      setFileNameStyleRef('');
      setFileNameTop('');
      setFileNameBottom('');
      setPreviewUrl(null);
      setPreviewUrlBack(null);
      setPreviewUrlFabric(null);
      setPreviewUrlRef(null);
      setPreviewUrlStyleRef(null);
      setPreviewUrlTop(null);
      setPreviewUrlBottom(null);
      
      setSessionKey(prev => prev + 1);

    } catch (err: any) {
      console.error('❌ Generation process failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [activeLogo, activeText, selectedModel, aspectRatio, background, backgroundColorHex, editMode]); 

  const handleDownloadAllAsZip = async () => {
    if (generatedImages.length === 0) return;
    setIsLoading(true);
    try {
      const zip = new JSZip();
      
      const promises = generatedImages.map(async (img, index) => {
        const response = await fetch(img.src);
        const blob = await response.blob();
        
        // ORGANIZE BY FOLDER if present (from Orchestrator)
        const subfolder = img.folderName ? `${img.folderName}/` : '';
        const name = `shoot-image-${index + 1}.jpg`;
        
        zip.file(`${subfolder}${name}`, blob);
      });
      
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `studio-ai-photoshoot-catalog-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("ZIP creation failed", e);
      setError("Failed to create ZIP archive.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setAuthError(error.message);
  };

  const handleSignUp = async (email: string, pass: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) setAuthError(error.message);
    else alert("Sign up successful! Please check your email for verification.");
  };
  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleNewShoot = useCallback(() => {
    setGeneratedImages([]);
    setSessionKey(prev => prev + 1);
    setPrompt('');
    setEditMode(null);
  }, []);

  const getHeaderTitle = () => {
      switch(currentView) {
          case 'assistant': return 'AI Assistant';
          case 'templates': return 'Production Templates';
          case 'models': return 'Models';
          case 'environment': return 'Environment Settings';
          case 'dimension': return 'Dimensions';
          case 'position': return 'Position';
          case 'logosetup': return 'Logo Setup';
          case 'textsetup': return 'Text Setup';
          case 'bgchanger': return 'Background Changer';
          case 'imageeditor': return 'Image Editor';
          default: return 'Generation';
      }
  };

  if (isAuthChecking) return <div className="min-h-screen bg-[#020204] flex items-center justify-center"><Spinner /></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} error={authError} />;

  const activeSequence = sequences.find(s => s.isActive);
  const totalSessionUsage = generatedImages.reduce((sum, img) => sum + (img.usage?.totalTokens || 0), 0);

  return (
    <div className="min-h-screen bg-[#020204] text-gray-100 font-sans selection:bg-purple-500/30 flex">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} user={user} onLogout={handleLogout} />
      <div className="relative flex-1 flex flex-col min-w-0 z-10 h-screen overflow-y-auto custom-scrollbar">
        <Header totalUsage={totalSessionUsage} title={getHeaderTitle()} />
        <main 
          className="flex-grow container mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 relative" 
          style={{ backgroundColor: 'rgb(81 80(81 80 80 / 18%)' }}
        >
            {/* Global Atmospheric Light Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none z-0">
                <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full opacity-40"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10">
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                        <p className="font-bold text-red-100">Error</p>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                )}
                
                {editMode?.isEditing && currentView === 'generation' && (
                    <div className="mb-6 bg-purple-600/10 border border-purple-500/30 text-purple-200 px-6 py-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-lg relative">
                                <img src={editMode.modelReference} className="w-full h-full object-cover" alt="LOCKED" />
                                <div className="absolute inset-0 bg-purple-500/10"></div>
                            </div>
                            <div>
                                <p className="font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                    Model Identity Locked for Outfit Change
                                </p>
                                <p className="text-xs text-purple-300/80">The persona from the previous generation is preserved. Upload a new product to swap outfits on this model.</p>
                            </div>
                        </div>
                        <button onClick={() => setEditMode(null)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10">Cancel Swap</button>
                    </div>
                )}

                {currentView === 'generation' ? (
                    <div className="gap-8 grid grid-cols-1 lg:grid-cols-12 items-start">
                        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8 transition-all duration-500 ease-in-out">
                            <ControlPanel 
                                key={sessionKey} 
                                onGenerate={handleGenerate} 
                                onNavigate={setCurrentView}
                                isLoading={isLoading} 
                                selectedModelType={selectedModelType}
                                selectedModelName={selectedModelName}
                                selectedModel={selectedModel}
                                activeSequence={activeSequence} 
                                activeText={activeText}
                                activeLogo={activeLogo}
                                aspectRatio={aspectRatio}
                                background={background}
                                backgroundColorHex={backgroundColorHex}
                                lighting={lighting}
                                prompt={prompt}
                                setPrompt={setPrompt}
                                
                                isEditMode={editMode?.isEditing || false}
                                editModeAttributes={editMode?.extractedAttributes || null}
                                editModeReference={editMode?.modelReference}
                                
                                uploadedFile={uploadedFile}
                                setUploadedFile={setUploadedFile}
                                previewUrl={previewUrl}
                                setPreviewUrl={setPreviewUrl}
                                fileName={fileName}
                                setFileName={setFileName}
                                
                                uploadedFileBack={uploadedFileBack}
                                setUploadedFileBack={setUploadedFileBack}
                                previewUrlBack={previewUrlBack}
                                setPreviewUrlBack={setPreviewUrlBack}
                                fileNameBack={fileNameBack}
                                setFileNameBack={setFileNameBack}
                                
                                uploadedFileFabric={uploadedFileFabric}
                                setUploadedFileFabric={setUploadedFileFabric}
                                previewUrlFabric={previewUrlFabric}
                                setPreviewUrlFabric={setPreviewUrlFabric}
                                fileNameFabric={fileNameFabric}
                                setFileNameFabric={setFileNameFabric}
                                
                                uploadedFileRef={uploadedFileRef}
                                setUploadedFileRef={setUploadedFileRef}
                                previewUrlRef={previewUrlRef}
                                setPreviewUrlRef={setPreviewUrlRef}
                                fileNameRef={fileNameRef}
                                setFileNameRef={setFileNameRef}

                                uploadedFileStyleRef={uploadedFileStyleRef}
                                setUploadedFileStyleRef={setUploadedFileStyleRef}
                                previewUrlStyleRef={previewUrlStyleRef}
                                setPreviewUrlStyleRef={setPreviewUrlStyleRef}
                                fileNameStyleRef={fileNameStyleRef}
                                setFileNameStyleRef={setFileNameStyleRef}

                                uploadedFileTop={uploadedFileTop}
                                setUploadedFileTop={setUploadedFileTop}
                                previewUrlTop={previewUrlTop}
                                setPreviewUrlTop={setPreviewUrlTop}
                                fileNameTop={fileNameTop}
                                setFileNameTop={setFileNameTop}
                                
                                uploadedFileBottom={uploadedFileBottom}
                                setUploadedFileBottom={setUploadedFileBottom}
                                previewUrlBottom={previewUrlBottom}
                                setPreviewUrlBottom={setPreviewUrlBottom}
                                fileNameBottom={fileNameBottom}
                                setFileNameBottom={setFileNameBottom}
                            />
                        </div>
                        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                            {generatedImages.length > 0 && !isLoading && (
                            <div className="flex justify-between items-center bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl backdrop-blur-xl">
                                <h2 className="text-xl font-bold text-gray-100 tracking-tight">Gallery <span className="text-gray-500 font-normal text-sm ml-2">({generatedImages.length} items)</span></h2>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleNewShoot} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-purple-900/20">
                                        <PlusIcon className="w-4 h-4" /> New Shoot
                                    </button>
                                    <button onClick={handleDownloadAllAsZip} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-all border border-white/10">
                                        <DownloadIcon className="w-4 h-4" /> Download ZIP
                                    </button>
                                </div>
                            </div>
                            )}
                            <ImageGallery 
                            images={generatedImages} 
                            isLoading={isLoading} 
                            expectedCount={loadingCount} 
                            onReusePrompt={setPrompt} 
                            onEditImage={(img) => setEditingImageTarget(img)} 
                            />
                        </div>
                        <EditImageModal 
                        isOpen={!!editingImageTarget}
                        onClose={() => setEditingImageTarget(null)}
                        imageSrc={editingImageTarget?.src || ''}
                        onConfirm={handleConfirmEdit}
                        isProcessing={isEditProcessing}
                        />
                    </div>
                ) : currentView === 'assistant' ? (
                    <ChatAssistantView 
                        templates={templates}
                        sequences={sequences}
                        onTriggerShoot={handleAssistantShootRequest}
                        onDownloadAll={handleDownloadAllAsZip}
                        messages={assistantMessages}
                        setMessages={setAssistantMessages}
                    />
                ) : currentView === 'templates' ? (
                    <TemplatesView 
                        user={user}
                        models={savedModels}
                        sequences={sequences}
                        logos={allLogos}
                        texts={allTexts}
                        onApplyTemplate={handleApplyTemplate}
                    />
                ) : currentView === 'models' ? (
                    <ModelsView 
                        userId={user.id} 
                        savedModels={savedModels} 
                        isLoading={isModelsLoading} 
                        onSaveNewModel={async m => { await saveModelToDB(m); setSavedModels([...savedModels, m]); }} 
                        onUpdateModel={async m => { await updateModelInDB(m); }} 
                        onDeleteModel={async id => { await deleteModelFromDB(id); setSavedModels(savedModels.filter(m => m.id !== id)); }} 
                        onSetActiveModel={handleSetActiveModel} 
                    />
                ) : currentView === 'environment' ? (
                    <EnvironmentView 
                        activeBackground={background}
                        activeBackgroundColor={backgroundColorHex}
                        activeLighting={lighting}
                        onUpdateBackground={setBackground}
                        onUpdateLighting={setLighting}
                        onUpdateBackgroundColor={setBackgroundColorHex}
                    />
                ) : currentView === 'dimension' ? (
                    <DimensionView selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} user={user} />
                ) : currentView === 'position' ? (
                    <PositionView 
                        sequences={sequences} 
                        onSaveSequence={async s => { const saved = await saveSequenceToDB({ ...s, userId: user.id }); setSequences([...sequences, saved]); }} 
                        onUpdateSequence={async s => { await updateSequenceInDB({ ...s, userId: user.id }); setSequences(sequences.map(prev => prev.id === s.id ? { ...s, userId: user.id } : prev)); }} 
                        onDeleteSequence={id => { deleteSequenceFromDB(id); setSequences(sequences.filter(s => s.id !== id)); }} 
                        onSetActiveSequence={handleSetActiveSequence} 
                    />
                ) : currentView === 'logosetup' ? (
                    <LogoSetupView user={user} onActiveLogoUpdate={() => refreshBrandingData(user.id)} />
                ) : currentView === 'textsetup' ? (
                    <TextSetupView user={user} onActiveTextUpdate={() => refreshBrandingData(user.id)} />
                ) : currentView === 'bgchanger' ? (
                    <BackgroundChangerView />
                ) : currentView === 'imageeditor' ? (
                    <ImageEditorView />
                ) : (
                    <div className="flex items-center justify-center h-[50vh] text-gray-500"><p>Module under development.</p></div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;
