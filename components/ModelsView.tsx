
import React, { useState } from 'react';
import { 
  UserCircleIcon, SlidersIcon, PlusIcon, 
  CheckCircleIcon, SparklesIcon, ArrowLeftIcon, 
  UploadIcon, EditIcon, TrashIcon, EyeIcon, SwatchIcon
} from './Icons';
import { 
  ModelType, SavedModel, ModelSourceType, ModelCreationTab, ModelAttributes,
  SKIN_TONES, HAIR_COLORS, AGE_RANGES, ETHNICITIES,
  MALE_BODY_TYPES, MALE_HAIR_STYLES, FACIAL_HAIR_STYLES, MALE_TOP_STYLES, MALE_BOTTOM_STYLES, MALE_SHOE_STYLES,
  FEMALE_BODY_TYPES, FEMALE_HAIR_STYLES, MAKEUP_STYLES, FEMALE_TOP_STYLES, FEMALE_BOTTOM_STYLES, FEMALE_SHOE_STYLES
} from '../types';
import { OptionSelector } from './OptionSelector';
import { generateModelPreview } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';

interface ModelsViewProps {
    userId: string;
    savedModels: SavedModel[];
    isLoading: boolean;
    onSaveNewModel: (model: SavedModel) => Promise<void>;
    onUpdateModel: (model: SavedModel) => Promise<void>;
    onDeleteModel: (id: string) => Promise<void>;
    onSetActiveModel: (id: string) => void;
}

const PREBUILT_CATEGORIES = ['Men', 'Women', 'Kids Boy', 'Kids Girl'];

const PREBUILT_MODELS_DATA: Record<string, { id: string; name: string; image: string; desc: string; type: ModelType }[]> = {
  'Men': [
    { id: 'pb-m-1', name: 'Classic Male', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=500&auto=format&fit=crop', desc: 'Professional male model with sharp features, Studio portrait.', type: ModelType.Male },
    { id: 'pb-m-2', name: 'Urban Male', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=format&fit=crop', desc: 'Stylish urban look with a beard, Casual lifestyle.', type: ModelType.Male },
    { id: 'pb-m-3', name: 'Business Male', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop', desc: 'Clean shaven professional look in suit.', type: ModelType.Male },
  ],
  'Women': [
    { id: 'pb-f-1', name: 'Studio Female', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop', desc: 'High fashion studio look.', type: ModelType.Female },
    { id: 'pb-f-2', name: 'Natural Female', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=500&auto=format&fit=crop', desc: 'Soft natural lighting and features.', type: ModelType.Female },
    { id: 'pb-f-3', name: 'Edgy Female', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=500&auto=format&fit=crop', desc: 'Modern edgy aesthetic.', type: ModelType.Female },
  ],
  'Kids Boy': [
    { id: 'pb-kb-1', name: 'Young Boy', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop', desc: 'Energetic look for sports wear.', type: ModelType.Unisex },
    { id: 'pb-kb-3', name: 'Casual Kid', image: 'https://images.unsplash.com/photo-1519238263496-6362d74c1123?q=80&w=500&auto=format&fit=crop', desc: 'Smart casual look.', type: ModelType.Unisex }
  ],
  'Kids Girl': [
     { id: 'pb-kg-1', name: 'Young Girl', image: 'https://images.unsplash.com/photo-1519456264917-42d0aa2e0625?q=80&w=500&auto=format&fit=crop', desc: 'Bright and happy young girl.', type: ModelType.Unisex },
     { id: 'pb-kg-2', name: 'Little Fashionista', image: 'https://images.unsplash.com/photo-1475518845976-0d16ce48e50b?q=80&w=500&auto=format&fit=crop', desc: 'Stylish kid model portrait.', type: ModelType.Unisex }
  ]
};

export const ModelsView: React.FC<ModelsViewProps> = ({ 
    userId,
    savedModels, 
    isLoading: isGlobalLoading,
    onSaveNewModel,
    onUpdateModel,
    onDeleteModel, 
    onSetActiveModel 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [activeTab, setActiveTab] = useState<ModelCreationTab>('prebuilt');
  const [filter, setFilter] = useState<'All' | ModelSourceType>('All');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [viewModel, setViewModel] = useState<SavedModel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Prebuilt State
  const [activeCategory, setActiveCategory] = useState('Women');
  const [selectedPrebuiltId, setSelectedPrebuiltId] = useState<string | null>(null);
  const [prebuiltName, setPrebuiltName] = useState('');

  // Attribute Creation State
  const [attributes, setAttributes] = useState<ModelAttributes>({
    gender: 'female',
    ageRange: 'Young Adult',
    ethnicity: 'East Asian',
    skinTone: 'Medium',
    bodyType: 'Average',
    eyeColor: 'Brown',
    hairLength: 'Long',
    hairType: 'Wavy',
    hairColor: 'Black',
    hairStyle: 'Straight Long',
    facialHair: 'Clean Shaven',
    makeup: 'Natural/Minimal',
    // Wardrobe & Colors
    topStyle: 'T-Shirt',
    topColor: '#FFFFFF',
    bottomStyle: 'Leggings',
    bottomColor: '#001F3F',
    shoesStyle: 'White Sneakers',
    shoesColor: '#000000',
    accessories: []
  });

  const handleGenderChange = (gender: 'male' | 'female') => {
    setAttributes(prev => ({
      ...prev,
      gender,
      hairStyle: gender === 'male' ? 'Short Cropped' : 'Straight Long',
      bodyType: gender === 'male' ? 'Average' : 'Slim/Petite',
      topStyle: 'T-Shirt',
      bottomStyle: gender === 'male' ? 'Regular Fit Jeans' : 'Leggings',
      shoesStyle: 'White Sneakers',
      facialHair: gender === 'male' ? 'Clean Shaven' : undefined,
      makeup: gender === 'female' ? 'Natural/Minimal' : undefined
    }));
  };

  const [attributeName, setAttributeName] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Custom Reference State
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  const constructModelPrompt = () => {
    const clothingDesc = `Wearing a ${attributes.topColor} ${attributes.topStyle} and ${attributes.bottomColor} ${attributes.bottomStyle}. Footwear: ${attributes.shoesColor} ${attributes.shoesStyle}.`;
    const specialized = attributes.gender === 'male' ? `Facial hair: ${attributes.facialHair}.` : `Makeup: ${attributes.makeup}.`;
    
    return `${attributes.gender}, ${attributes.ageRange} Age Range, ${attributes.ethnicity} Ethnicity, ${attributes.skinTone} Skin Tone, ${attributes.bodyType} Body Type, ${attributes.eyeColor} eyes. ${attributes.hairLength} ${attributes.hairType} ${attributes.hairColor} hair styled in ${attributes.hairStyle}. Full-Body Shot, Head-to-Toe View. ${specialized} ${clothingDesc}. Lit with soft, even studio lighting against a plain white background. Photorealistic, ultra-detailed, 8K resolution.`;
  };

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    setPreviewError(null);
    setGeneratedPreview(null);
    try {
        const prompt = constructModelPrompt();
        const generatedImageBase64 = await generateModelPreview(prompt);
        setGeneratedPreview(generatedImageBase64);
    } catch (err) {
        console.error("Preview generation failed:", err);
        setPreviewError("Failed to generate preview. Please try again.");
    } finally {
        setIsGeneratingPreview(false);
    }
  };

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveModelToLibrary = async (modelData: SavedModel) => {
    setIsSaving(true);
    try {
        if (editingModelId) {
            await onUpdateModel(modelData);
        } else {
            await onSaveNewModel(modelData);
        }
        setViewMode('list');
        setEditingModelId(null);
        setGeneratedPreview(null);
    } catch (e) {
        console.error("Failed save/update", e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
      if (deleteConfirm.id) {
          setIsDeleting(true);
          try {
             await onDeleteModel(deleteConfirm.id);
             setDeleteConfirm({isOpen: false, id: null});
          } catch (e) {
              console.error("Delete failed", e);
          } finally {
              setIsDeleting(false);
          }
      }
  };

  const handleSaveAttributeModel = () => {
    let imageToUse = generatedPreview;
    if (!imageToUse && editingModelId) {
         const existing = savedModels.find(m => m.id === editingModelId);
         if (existing) imageToUse = existing.imageSrc;
    }
    if (!imageToUse) return;

    const id = editingModelId || crypto.randomUUID();
    saveModelToLibrary({
      id,
      userId,
      name: attributeName || `Custom ${attributes.gender} Model`,
      type: 'Attribute',
      imageSrc: imageToUse,
      description: constructModelPrompt(),
      isActive: editingModelId ? (savedModels.find(m => m.id === editingModelId)?.isActive || false) : true,
      modelType: attributes.gender === 'female' ? ModelType.Female : ModelType.Male,
      attributes: attributes
    });
  };

  const handleEditModel = (model: SavedModel) => {
      setEditingModelId(model.id);
      if (model.type === 'Attribute') {
          setActiveTab('attribute');
          if (model.attributes) setAttributes(prev => ({ ...prev, ...model.attributes }));
          setGeneratedPreview(model.imageSrc);
          setAttributeName(model.name);
      } else if (model.type === 'Custom') {
          setActiveTab('custom');
          setCustomName(model.name);
          setCustomPreview(model.imageSrc);
      } else {
          setActiveTab('prebuilt');
          setPrebuiltName(model.name);
      }
      setViewMode('create');
  };

  const renderAttributeCreation = () => {
    const isMale = attributes.gender === 'male';
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6 text-purple-300">
                      <SlidersIcon className="w-5 h-5" />
                      <h3 className="font-bold text-lg">Physical Attributes</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <OptionSelector label="Gender" options={['female', 'male']} selected={attributes.gender} onSelect={(v) => handleGenderChange(v as any)} />
                      <OptionSelector label="Age Range" options={AGE_RANGES} selected={attributes.ageRange || ''} onSelect={(v) => setAttributes({...attributes, ageRange: v})} />
                      <OptionSelector label="Ethnicity" options={ETHNICITIES} selected={attributes.ethnicity || ''} onSelect={(v) => setAttributes({...attributes, ethnicity: v})} />
                      <OptionSelector label="Skin Tone" options={SKIN_TONES} selected={attributes.skinTone || ''} onSelect={(v) => setAttributes({...attributes, skinTone: v})} />
                      <OptionSelector label="Body Type" options={isMale ? MALE_BODY_TYPES : FEMALE_BODY_TYPES} selected={attributes.bodyType || ''} onSelect={(v) => setAttributes({...attributes, bodyType: v})} />
                      <OptionSelector label="Iris Color" options={['Brown', 'Blue', 'Green', 'Hazel', 'Grey']} selected={attributes.eyeColor || ''} onSelect={(v) => setAttributes({...attributes, eyeColor: v})} />
                      <OptionSelector label="Hair Length" options={['Short', 'Medium', 'Long', 'Bald']} selected={attributes.hairLength || ''} onSelect={(v) => setAttributes({...attributes, hairLength: v})} />
                      <OptionSelector label="Hair Color" options={HAIR_COLORS} selected={attributes.hairColor || ''} onSelect={(v) => setAttributes({...attributes, hairColor: v})} />
                      <OptionSelector label="Hair Style" options={isMale ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES} selected={attributes.hairStyle || ''} onSelect={(v) => setAttributes({...attributes, hairStyle: v})} />
                      {isMale ? (
                          <OptionSelector label="Facial Hair" options={FACIAL_HAIR_STYLES} selected={attributes.facialHair || ''} onSelect={(v) => setAttributes({...attributes, facialHair: v})} />
                      ) : (
                          <OptionSelector label="Makeup Style" options={MAKEUP_STYLES} selected={attributes.makeup || ''} onSelect={(v) => setAttributes({...attributes, makeup: v})} />
                      )}
                  </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6 text-purple-300">
                      <SlidersIcon className="w-5 h-5" />
                      <h3 className="font-bold text-lg">Outfit & Footwear</h3>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <OptionSelector label="Top Style" options={isMale ? MALE_TOP_STYLES : FEMALE_TOP_STYLES} selected={attributes.topStyle || ''} onSelect={(v) => setAttributes({...attributes, topStyle: v})} />
                          <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Top Color</label>
                              <div className="flex gap-2 bg-black/20 border border-white/10 rounded-xl p-1.5">
                                  <input type="color" value={attributes.topColor} onChange={(e) => setAttributes({...attributes, topColor: e.target.value.toUpperCase()})} className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer" />
                                  <input type="text" value={attributes.topColor} onChange={(e) => setAttributes({...attributes, topColor: e.target.value.toUpperCase()})} className="flex-1 bg-transparent text-xs font-mono text-gray-300 outline-none uppercase" />
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <OptionSelector label="Bottom Style" options={isMale ? MALE_BOTTOM_STYLES : FEMALE_BOTTOM_STYLES} selected={attributes.bottomStyle || ''} onSelect={(v) => setAttributes({...attributes, bottomStyle: v})} />
                          <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Bottom Color</label>
                              <div className="flex gap-2 bg-black/20 border border-white/10 rounded-xl p-1.5">
                                  <input type="color" value={attributes.bottomColor} onChange={(e) => setAttributes({...attributes, bottomColor: e.target.value.toUpperCase()})} className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer" />
                                  <input type="text" value={attributes.bottomColor} onChange={(e) => setAttributes({...attributes, bottomColor: e.target.value.toUpperCase()})} className="flex-1 bg-transparent text-xs font-mono text-gray-300 outline-none uppercase" />
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <OptionSelector label="Footwear" options={isMale ? MALE_SHOE_STYLES : FEMALE_SHOE_STYLES} selected={attributes.shoesStyle || ''} onSelect={(v) => setAttributes({...attributes, shoesStyle: v})} />
                          <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Footwear Color</label>
                              <div className="flex gap-2 bg-black/20 border border-white/10 rounded-xl p-1.5">
                                  <input type="color" value={attributes.shoesColor} onChange={(e) => setAttributes({...attributes, shoesColor: e.target.value.toUpperCase()})} className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer" />
                                  <input type="text" value={attributes.shoesColor} onChange={(e) => setAttributes({...attributes, shoesColor: e.target.value.toUpperCase()})} className="flex-1 bg-transparent text-xs font-mono text-gray-300 outline-none uppercase" />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-6 text-purple-300">
                      <UserCircleIcon className="w-5 h-5" />
                      <h3 className="font-bold text-lg">AI Preview (Full Body)</h3>
                  </div>

                  <div className="flex-grow flex items-center justify-center min-h-[500px] aspect-[9/16] bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group shadow-inner">
                      {generatedPreview ? (
                          <img src={generatedPreview} alt="AI Preview" className="w-full h-full object-cover animate-in fade-in duration-700" />
                      ) : (
                          <div className="flex flex-col items-center justify-center text-gray-600 gap-3">
                              <UserCircleIcon className="w-20 h-20 opacity-20" />
                              <span className="text-sm font-medium">{previewError || "Full body preview not generated"}</span>
                          </div>
                      )}
                      {isGeneratingPreview && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                              <Spinner />
                              <span className="text-xs text-purple-300 font-mono animate-pulse">GENERATING FULL MODEL...</span>
                          </div>
                      )}
                  </div>

                  <div className="mt-6 space-y-3">
                     <button 
                          onClick={handleGeneratePreview}
                          disabled={isGeneratingPreview}
                          className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          <SparklesIcon className="w-5 h-5 text-purple-600" />
                          {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
                      </button>

                      {(generatedPreview || editingModelId) && (
                          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model Name</label>
                                  <input 
                                      type="text" 
                                      value={attributeName}
                                      onChange={(e) => setAttributeName(e.target.value)}
                                      placeholder={`e.g. Custom ${attributes.gender} Model`}
                                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                                  />
                              </div>
                              <button 
                                  onClick={handleSaveAttributeModel}
                                  disabled={isSaving || !attributeName}
                                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                              >
                                  {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                                  {isSaving ? 'Saving...' : (editingModelId ? 'Update Model' : 'Save & Finish')}
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    );
  };

  const renderPrebuiltSelection = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {PREBUILT_CATEGORIES.map(cat => (
             <button
               key={cat}
               onClick={() => { setActiveCategory(cat); setSelectedPrebuiltId(null); }}
               className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-purple-500 text-white shadow-lg shadow-purple-900/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
             >
               {cat}
             </button>
          ))}
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PREBUILT_MODELS_DATA[activeCategory]?.map(model => (
            <div 
              key={model.id}
              onClick={() => {
                  setSelectedPrebuiltId(model.id);
                  setPrebuiltName(model.name); 
              }}
              className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${selectedPrebuiltId === model.id ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-transparent hover:border-white/20'}`}
            >
               <img src={model.image} alt={model.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white font-bold">{model.name}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{model.desc}</p>
               </div>
               {selectedPrebuiltId === model.id && (
                 <div className="absolute top-3 right-3 bg-purple-500 rounded-full p-1 shadow-lg">
                    <CheckCircleIcon className="w-4 h-4 text-white" />
                 </div>
               )}
            </div>
          ))}
       </div>

       {(selectedPrebuiltId || editingModelId) && (
         <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom-full duration-300">
             <div className="container mx-auto max-w-screen-lg flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="w-full sm:w-auto flex-1">
                    <input 
                        type="text" 
                        value={prebuiltName}
                        onChange={(e) => setPrebuiltName(e.target.value)}
                        placeholder="Name your model..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                    />
                </div>
                <button 
                    onClick={() => {
                        const modelData = PREBUILT_MODELS_DATA[activeCategory]?.find(m => m.id === selectedPrebuiltId);
                        if (modelData) {
                            saveModelToLibrary({
                                id: crypto.randomUUID(),
                                userId,
                                name: prebuiltName || modelData.name,
                                type: 'Prebuilt',
                                imageSrc: modelData.image,
                                description: modelData.desc,
                                isActive: true,
                                modelType: modelData.type,
                                attributes: { gender: modelData.type === ModelType.Male ? 'male' : 'female' }
                            });
                        }
                    }}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                >
                    {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : (editingModelId ? 'Update Model' : 'Save & Finish')}
                </button>
             </div>
         </div>
       )}
    </div>
  );

  const renderCustomReference = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-8 text-center border-dashed border-2 hover:border-purple-500/30 transition-colors">
            <input 
                type="file" 
                onChange={handleCustomFileChange}
                accept="image/*"
                className="hidden" 
                id="custom-upload" 
            />
            <label htmlFor="custom-upload" className="cursor-pointer block">
                {customPreview ? (
                    <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                        <img src={customPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-white uppercase">Change Image</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                        <UploadIcon className="w-10 h-10" />
                    </div>
                )}
                <h3 className="text-xl font-bold text-white mt-4">{customPreview ? 'Image Uploaded' : 'Upload Reference Image'}</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Upload a clear front-facing photo to use as your model reference.</p>
            </label>
        </div>

        {customPreview && (
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model Name</label>
                    <input 
                        type="text" 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Summer Campaign Face"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors"
                    />
                </div>
                <button 
                    onClick={() => {
                        saveModelToLibrary({
                            id: editingModelId || crypto.randomUUID(),
                            userId,
                            name: customName,
                            type: 'Custom',
                            imageSrc: customPreview,
                            description: 'Custom uploaded reference model.',
                            isActive: true,
                            modelType: ModelType.Influencer,
                            attributes: { gender: 'female' }
                        });
                    }}
                    disabled={!customName || isSaving}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                >
                    {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : (editingModelId ? 'Update Model' : 'Save & Finish')}
                </button>
            </div>
        )}
    </div>
  );

  const renderCreateView = () => (
    <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => { setViewMode('list'); setEditingModelId(null); }}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-white">{editingModelId ? 'Edit Model' : 'Create New Model'}</h2>
                <p className="text-gray-400 text-sm">{editingModelId ? 'Update model details.' : 'Choose attributes or upload a reference.'}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { id: 'prebuilt', label: 'Prebuilt AI Models', desc: 'Standard categories', icon: UserCircleIcon },
                { id: 'attribute', label: 'Create Model', desc: 'Customize attributes', icon: SlidersIcon },
                { id: 'custom', label: 'Custom Reference', desc: 'Upload your own', icon: UserCircleIcon }
            ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if(!editingModelId) setActiveTab(tab.id as ModelCreationTab);
                        }}
                        disabled={!!editingModelId}
                        className={`relative p-6 rounded-2xl border transition-all duration-300 text-center group ${isActive ? 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-900/10' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'}`}
                    >
                        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 transition-colors ${isActive ? 'bg-purple-500 text-white' : 'bg-white/5 text-purple-400 group-hover:bg-white/10'}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <h3 className={`font-bold mb-1 ${isActive ? 'text-white' : 'text-gray-200'}`}>{tab.label}</h3>
                        <p className="text-xs text-gray-500">{tab.desc}</p>
                    </button>
                );
            })}
        </div>
        
        <div className="pt-4">
            {activeTab === 'prebuilt' && renderPrebuiltSelection()}
            {activeTab === 'attribute' && renderAttributeCreation()}
            {activeTab === 'custom' && renderCustomReference()}
        </div>
    </div>
  );

  const renderModelList = () => {
    const filteredModels = savedModels.filter(m => filter === 'All' || m.type === filter);
    if (isGlobalLoading) return <div className="flex items-center justify-center h-96"><Spinner /><span className="ml-3 text-gray-400">Loading your models...</span></div>;

    return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
           <h2 className="text-2xl font-bold text-white mb-2">My Models</h2>
           <p className="text-gray-400 text-sm">Select a model for your photoshoot or create a new one.</p>
         </div>
         <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 self-start md:self-end overflow-x-auto max-w-full">
            {['All', 'Prebuilt', 'Attribute', 'Custom'].map((opt) => (
                <button key={opt} onClick={() => setFilter(opt as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === opt ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{opt}</button>
            ))}
         </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filter === 'All' && (
              <button onClick={() => { setEditingModelId(null); setViewMode('create'); }} className="group relative aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-purple-400 transition-all group-hover:scale-110"><PlusIcon className="w-8 h-8" /></div>
                 <div className="text-center"><h3 className="text-white font-bold group-hover:text-purple-300 transition-colors">Create New Model</h3></div>
              </button>
          )}
          {filteredModels.map((model) => (
             <div key={model.id} onClick={() => onSetActiveModel(model.id)} className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 bg-[#111] flex flex-col ${model.isActive ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10 hover:border-white/20'}`}>
                <div className="flex-1 relative overflow-hidden bg-[#1a1a1a]">
                    <img src={model.imageSrc} alt={model.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-3 left-3"><span className="bg-black/60 backdrop-blur-md text-[9px] font-bold text-white px-2 py-1 rounded-lg uppercase tracking-wide border border-white/10">{model.type}</span></div>
                    {model.isActive && <div className="absolute top-3 right-3 bg-purple-600 rounded-full p-1.5 shadow-lg border border-white/10"><CheckCircleIcon className="w-3.5 h-3.5 text-white" /></div>}
                </div>
                <div className="h-14 px-4 flex items-center justify-between bg-[#0a0a0a] border-t border-white/5 shrink-0">
                    <div className="min-w-0 pr-2">
                        {model.isActive && <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-0.5 leading-none">Active</p>}
                        <h4 className="text-gray-200 font-bold truncate text-sm leading-tight">{model.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                             <button onClick={(e) => { e.stopPropagation(); setViewModel(model); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><EyeIcon className="w-4 h-4" /></button>
                             <button onClick={(e) => { e.stopPropagation(); handleEditModel(model); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                             <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: model.id }); }} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
  };
  
  const renderViewModal = () => {
    if (!viewModel) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewModel(null)}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <div className="md:w-1/2 bg-black h-96 md:h-auto relative"><img src={viewModel.imageSrc} alt={viewModel.name} className="w-full h-full object-cover" /></div>
                <div className="md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto">
                    <div>
                        <div className="flex items-center justify-between mb-4"><span className="text-xs font-bold text-purple-400 uppercase tracking-widest border border-purple-500/30 px-2 py-1 rounded bg-purple-500/10">{viewModel.type}</span><button onClick={() => setViewModel(null)} className="text-gray-500 hover:text-white transition-colors p-1 bg-white/5 rounded-full"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                        <h2 className="text-3xl font-bold text-white mb-4">{viewModel.name}</h2>
                        <div className="space-y-4">
                            <div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</h3><p className="text-gray-300 leading-relaxed text-sm">{viewModel.description}</p></div>
                            {viewModel.attributes && (
                                <div><h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attributes</h3><div className="flex flex-wrap gap-2">
                                        {Object.entries(viewModel.attributes).map(([key, value]) => (
                                            <span key={key} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300"><span className="text-gray-500 mr-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{String(value)}</span>
                                        ))}
                                    </div></div>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3 flex-shrink-0">
                        <button onClick={() => { setViewModel(null); onSetActiveModel(viewModel.id); }} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20">Select Model</button>
                        <button onClick={() => { setViewModel(null); handleEditModel(viewModel); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10">Edit Details</button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-full">
        {viewMode === 'list' ? renderModelList() : renderCreateView()}
        {renderViewModal()}
        <ConfirmationModal isOpen={deleteConfirm.isOpen} title="Delete Model" message="Are you sure you want to delete this model? This action cannot be undone." onConfirm={handleDeleteConfirm} onCancel={() => setDeleteConfirm({isOpen: false, id: null})} isDeleting={isDeleting} />
    </div>
  );
};
