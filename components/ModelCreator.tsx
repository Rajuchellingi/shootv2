import React, { useState } from 'react';
import { 
  SavedModel, 
  ModelAttributes,
  ModelType,
  // Common
  SKIN_TONES, 
  HAIR_COLORS, 
  AGE_RANGES,
  ETHNICITIES,
  // Male
  MALE_BODY_TYPES,
  MALE_HAIR_STYLES,
  FACIAL_HAIR_STYLES,
  MALE_TOP_STYLES,
  MALE_BOTTOM_STYLES,
  MALE_SHOE_STYLES,
  // Female
  FEMALE_BODY_TYPES,
  FEMALE_HAIR_STYLES,
  MAKEUP_STYLES,
  FEMALE_TOP_STYLES,
  FEMALE_BOTTOM_STYLES,
  FEMALE_SHOE_STYLES
} from '../types';
import { Spinner } from './Spinner';

interface ModelCreatorProps {
  onSave: (model: SavedModel) => void;
  onCancel: () => void;
  editingModel?: SavedModel;
  userId: string;
}

// Curated Studio Palette for clean, commercial-ready looks
const COLOR_PALETTE = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Light Gray', hex: '#D3D3D3' },
  { name: 'Navy Blue', hex: '#001F3F' },
  { name: 'Royal Blue', hex: '#0074D9' },
  { name: 'Light Blue', hex: '#7FDBFF' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Denim Blue', hex: '#1560BD' },
  { name: 'Red', hex: '#FF4136' },
  { name: 'Maroon', hex: '#85144B' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Green', hex: '#2ECC40' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Lime', hex: '#01FF70' },
  { name: 'Yellow', hex: '#FFDC00' },
  { name: 'Orange', hex: '#FF851B' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Khaki', hex: '#C3B091' },
  { name: 'Purple', hex: '#B10DC9' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Burgundy', hex: '#800020' }
];

export const ModelCreator: React.FC<ModelCreatorProps> = ({ 
  onSave, 
  onCancel, 
  editingModel,
  userId 
}) => {
  const [modelName, setModelName] = useState(editingModel?.name || '');
  
  // Primary function to populate initial attributes
  const getDefaultAttributes = (gender: 'male' | 'female'): ModelAttributes => {
    if (gender === 'male') {
      return {
        gender: 'male',
        skinTone: 'Fair',
        hairColor: 'Dark Brown',
        hairStyle: 'Short Cropped',
        facialHair: 'Clean Shaven',
        bodyType: 'Average',
        age: '25-35',
        ethnicity: 'Caucasian',
        topColor: '#FFFFFF',
        topStyle: 'T-Shirt',
        bottomColor: '#001F3F',
        bottomStyle: 'Slim Fit Jeans',
        shoesColor: '#000000',
        shoesStyle: 'White Sneakers',
        accessories: []
      };
    } else {
      return {
        gender: 'female',
        skinTone: 'Fair',
        hairColor: 'Brown',
        hairStyle: 'Straight Long',
        makeup: 'Natural/Minimal',
        nailColor: '#FFB6C1',
        bodyType: 'Average',
        age: '25-35',
        ethnicity: 'Caucasian',
        topColor: '#FFFFFF',
        topStyle: 'T-Shirt',
        bottomColor: '#001F3F',
        bottomStyle: 'Skinny Jeans',
        shoesColor: '#000000',
        shoesStyle: 'White Sneakers',
        accessories: []
      };
    }
  };
  
  const [attributes, setAttributes] = useState<ModelAttributes>(
    editingModel?.attributes || getDefaultAttributes('female')
  );

  const handleGenderChange = (gender: 'male' | 'female') => {
    // Hard Reset: Prevent state bleeding between personas
    setAttributes(getDefaultAttributes(gender));
  };

  const [imageSrc, setImageSrc] = useState(editingModel?.imageSrc || '');
  const [description, setDescription] = useState(editingModel?.description || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImageSrc(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!modelName.trim()) {
      alert('Please name this persona.');
      return;
    }

    const model: SavedModel = {
      id: editingModel?.id || crypto.randomUUID(),
      userId,
      name: modelName,
      type: 'Attribute',
      modelType: attributes.gender === 'male' ? ModelType.Male : ModelType.Female,
      imageSrc: imageSrc || generatePlaceholderImage(),
      description,
      isActive: true,
      attributes,
      createdAt: editingModel?.createdAt || Date.now()
    };

    onSave(model);
  };

  const generatePlaceholderImage = () => {
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" fill="#111"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#555" font-size="16" font-family="sans-serif" font-weight="bold">
          ${attributes.gender === 'male' ? '👨 Male' : '👩 Female'}
        </text>
      </svg>`
    )}`;
  };

  const ColorPicker = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: string; 
    onChange: (color: string) => void; 
    label: string;
  }) => {
    const [showPicker, setShowPicker] = useState(false);
    const selectedColor = COLOR_PALETTE.find(c => c.hex.toUpperCase() === value?.toUpperCase());

    return (
      <div className="relative">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-full flex items-center gap-3 px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
        >
          <div 
            className="w-8 h-8 rounded-lg border-2 border-white/5 shadow-inner"
            style={{ backgroundColor: value || '#FFFFFF' }}
          />
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-bold text-white leading-none truncate">{selectedColor?.name || 'Custom'}</div>
            <div className="text-[10px] font-mono text-gray-500 mt-1 uppercase">{value}</div>
          </div>
          <svg className={`w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-transform ${showPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPicker && (
          <div className="absolute z-[200] mt-2 p-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">Wardrobe Palette</h4>
              <button type="button" onClick={() => setShowPicker(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => { onChange(color.hex); setShowPicker(false); }}
                  className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                    value?.toUpperCase() === color.hex.toUpperCase() 
                      ? 'border-purple-500 ring-2 ring-purple-500/20' 
                      : 'border-transparent hover:border-white/20'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="border-t border-white/5 mt-4 pt-4">
               <div className="flex gap-2">
                    <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="w-12 h-10 bg-black border border-white/10 rounded-lg cursor-pointer" />
                    <input 
                        type="text" 
                        value={value} 
                        onChange={(e) => onChange(e.target.value.toUpperCase())} 
                        placeholder="#HEX"
                        className="flex-1 bg-black border border-white/10 rounded-lg px-3 text-xs font-mono text-white focus:border-purple-500 outline-none"
                    />
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isMale = attributes.gender === 'male';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[150] p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 z-[160] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {editingModel ? 'Edit Persona Configuration' : 'Assemble New Persona'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Customize physical traits and wardrobe context for the AI model.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full text-gray-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Identity & Reference Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Spatial Anchor</label>
                <div className="relative group aspect-[3/4] rounded-2xl overflow-hidden bg-black border-2 border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                    {imageSrc ? (
                        <img src={imageSrc} alt="Persona Anchor" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-tight">Drop Portrait for Facial Anchoring</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Persona Alias</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. Classic Chic, Urban Professional"
                    className="w-full px-5 py-4 bg-black border border-white/10 rounded-2xl text-white font-bold focus:border-purple-500 outline-none transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Core Gender assignment</label>
                  <div className="flex gap-4 p-1 bg-black rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleGenderChange('male')}
                      className={`flex-1 py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isMale ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      MALE PERSONA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenderChange('female')}
                      className={`flex-1 py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        !isMale ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      FEMALE PERSONA
                    </button>
                  </div>
                </div>
            </div>
          </div>

          {/* Dynamic Physical Configuration Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">👤</span>
              Physical Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Ethnicity</label>
                <select value={attributes.ethnicity} onChange={(e) => setAttributes({ ...attributes, ethnicity: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-purple-500 outline-none appearance-none cursor-pointer">
                  {ETHNICITIES.map(eth => (<option key={eth} value={eth}>{eth}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Age Range</label>
                <select value={attributes.age} onChange={(e) => setAttributes({ ...attributes, age: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-purple-500 outline-none appearance-none cursor-pointer">
                  {AGE_RANGES.map(age => (<option key={age} value={age}>{age}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Anatomical Skin Tone</label>
                <select value={attributes.skinTone} onChange={(e) => setAttributes({ ...attributes, skinTone: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-purple-500 outline-none appearance-none cursor-pointer">
                  {SKIN_TONES.map(tone => (<option key={tone} value={tone}>{tone}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Body Architecture</label>
                <select value={attributes.bodyType} onChange={(e) => setAttributes({ ...attributes, bodyType: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                  {(isMale ? MALE_BODY_TYPES : FEMALE_BODY_TYPES).map(type => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Groomed Hair Color</label>
                <select value={attributes.hairColor} onChange={(e) => setAttributes({ ...attributes, hairColor: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                  {HAIR_COLORS.map(color => (<option key={color} value={color}>{color}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Signature Hairstyle</label>
                <select value={attributes.hairStyle} onChange={(e) => setAttributes({ ...attributes, hairStyle: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                  {(isMale ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES).map(style => (<option key={style} value={style}>{style}</option>))}
                </select>
              </div>

              {isMale ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Facial Grooming</label>
                  <select value={attributes.facialHair} onChange={(e) => setAttributes({ ...attributes, facialHair: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                    {FACIAL_HAIR_STYLES.map(style => (<option key={style} value={style}>{style}</option>))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Makeup Palette</label>
                  <select value={attributes.makeup} onChange={(e) => setAttributes({ ...attributes, makeup: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                    {MAKEUP_STYLES.map(style => (<option key={style} value={style}>{style}</option>))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Iris Pigmentation</label>
                <select value={attributes.eyeColor || 'Brown'} onChange={(e) => setAttributes({ ...attributes, eyeColor: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                  {['Brown', 'Deep Blue', 'Emerald Green', 'Hazel', 'Silver Gray', 'Amber'].map(color => (<option key={color} value={color}>{color}</option>))}
                </select>
              </div>
              
              {!isMale && (
                  <ColorPicker
                    value={attributes.nailColor || '#FFB6C1'}
                    onChange={(color) => setAttributes({ ...attributes, nailColor: color })}
                    label="Manicure Finish"
                  />
              )}
            </div>
          </section>

          {/* Unified Wardrobe Context Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">👕</span>
              Wardrobe Fallback Context
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Upper Silhouette</label>
                  <select value={attributes.topStyle} onChange={(e) => setAttributes({ ...attributes, topStyle: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                    {(isMale ? MALE_TOP_STYLES : FEMALE_TOP_STYLES).map(style => (<option key={style} value={style}>{style}</option>))}
                  </select>
                </div>
                <ColorPicker
                  value={attributes.topColor || '#FFFFFF'}
                  onChange={(color) => setAttributes({ ...attributes, topColor: color })}
                  label="Upper Colorway"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Lower Silhouette</label>
                  <select value={attributes.bottomStyle} onChange={(e) => setAttributes({ ...attributes, bottomStyle: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                    {(isMale ? MALE_BOTTOM_STYLES : FEMALE_BOTTOM_STYLES).map(style => (<option key={style} value={style}>{style}</option>))}
                  </select>
                </div>
                <ColorPicker
                  value={attributes.bottomColor || '#001F3F'}
                  onChange={(color) => setAttributes({ ...attributes, bottomColor: color })}
                  label="Lower Colorway"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Footwear Silhouette</label>
                  <select value={attributes.shoesStyle} onChange={(e) => setAttributes({ ...attributes, shoesStyle: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer">
                    {(isMale ? MALE_SHOE_STYLES : FEMALE_SHOE_STYLES).map(style => (<option key={style} value={style}>{style}</option>))}
                  </select>
                </div>
                <ColorPicker
                  value={attributes.shoesColor || '#000000'}
                  onChange={(color) => setAttributes({ ...attributes, shoesColor: color })}
                  label="Footwear Colorway"
                />
              </div>
            </div>
          </section>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Directives</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inject specific behavioral or anatomical notes (e.g. 'Highly symmetrical features', 'Professional runway gaze')..."
              rows={3}
              className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-gray-300 text-sm focus:border-purple-500 outline-none transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 px-8 py-6 flex justify-end gap-4 rounded-b-[2.5rem]">
          <button type="button" onClick={onCancel} className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-2xl transition-all border border-white/5">DISCARD</button>
          <button type="button" onClick={handleSave} className="px-12 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-purple-900/40">
            {editingModel ? 'UPDATE PERSONA' : 'SAVE PERSONA'}
          </button>
        </div>
      </div>
    </div>
  );
};