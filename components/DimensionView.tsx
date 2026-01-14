
import React, { useState, useEffect } from 'react';
import { AspectRatio, SavedDimension } from '../types';
import { DimensionIcon, CheckCircleIcon, PlusIcon, TrashIcon, ArrowLeftIcon, EditIcon } from './Icons';
import { fetchDimensionsFromDB, saveDimensionToDB, deleteDimensionFromDB, updateDimensionInDB, setActiveSystemDimension } from '../services/dimensionService';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';
import { OptionSelector } from './OptionSelector';

interface DimensionViewProps {
    selectedRatio: AspectRatio;
    onSelectRatio: (ratio: AspectRatio) => void;
    user?: any;
}

const STANDARD_DIMENSIONS: SavedDimension[] = [
    { id: '1:1', name: 'Square', width: 1200, height: 1200, description: 'Instagram Post, Product Grid', isActive: false, isSystem: true },
    { id: '9:16', name: 'Portrait', width: 1080, height: 1920, description: 'Stories, Reels, TikTok', isActive: false, isSystem: true },
    { id: '16:9', name: 'Landscape', width: 1920, height: 1080, description: 'YouTube, Web Banners', isActive: false, isSystem: true },
    { id: '4:3', name: 'Standard', width: 1600, height: 1200, description: 'Classic Photography', isActive: false, isSystem: true },
    { id: '3:4', name: 'Vertical', width: 1200, height: 1600, description: 'Portrait Photography', isActive: false, isSystem: true },
];

const WIDTH_OPTIONS = ['512', '768', '1024', '1080', '1200', '1280', '1440', '1536', '1600', '1920', '2048', '3840'];
const HEIGHT_OPTIONS = ['512', '768', '1024', '1080', '1200', '1280', '1350', '1440', '1536', '1600', '1920', '2048', '2160', '3840'];

export const DimensionView: React.FC<DimensionViewProps> = ({ selectedRatio, onSelectRatio, user }) => {
    
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [savedDimensions, setSavedDimensions] = useState<SavedDimension[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Create/Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [dimName, setDimName] = useState('');
    const [dimWidth, setDimWidth] = useState('1080');
    const [dimHeight, setDimHeight] = useState('1080');
    const [dimDesc, setDimDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Delete Confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadDimensions = async () => {
            if (!user?.id) return;
            setIsLoading(true);
            try {
                const userDims = await fetchDimensionsFromDB(user.id);
                // Filter out the system persistence record so it doesn't show as a custom card
                setSavedDimensions(userDims.filter(d => !d.isSystem));
            } catch (e) {
                console.error("Failed to load dimensions", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadDimensions();
    }, [user]);

    // Combine standard and saved dimensions
    const allDimensions = [...STANDARD_DIMENSIONS, ...savedDimensions];

    const handleCreateNew = () => {
        setEditingId(null);
        setDimName('');
        setDimWidth('1080');
        setDimHeight('1080');
        setDimDesc('');
        setViewMode('create');
    };

    const handleEdit = (dim: SavedDimension) => {
        setEditingId(dim.id);
        setDimName(dim.name);
        setDimWidth(dim.width.toString());
        setDimHeight(dim.height.toString());
        setDimDesc(dim.description || '');
        setViewMode('create');
    };

    const handleSelectDimension = async (dim: SavedDimension) => {
        // 1. Calculate ratio string & Update Parent UI (Immediate Feedback)
        const ratioString = dim.isSystem ? dim.id : `${dim.width}:${dim.height}`;
        onSelectRatio(ratioString);

        if (!user?.id) return;

        try {
            if (!dim.isSystem) {
                // If Custom: Activate it and deactivate others (standard DB logic)
                const activeCustomDims = savedDimensions.filter(d => d.isActive);
                if (activeCustomDims.length > 0) {
                    await Promise.all(activeCustomDims.map(d => updateDimensionInDB({ ...d, isActive: false })));
                }
                
                await updateDimensionInDB({ ...dim, isActive: true });
                
                // Optimistic UI Update
                setSavedDimensions(prev => prev.map(d => ({
                    ...d,
                    isActive: d.id === dim.id
                })));

            } else {
                // If System: Use the special service function to persist this preference
                await setActiveSystemDimension(user.id, dim);
                
                // Optimistic UI Update: Deactivate all custom local ones
                setSavedDimensions(prev => prev.map(d => ({ ...d, isActive: false })));
            }

        } catch (e) {
            console.error("Failed to persist dimension selection", e);
        }
    };

    const handleSave = async () => {
        if (!user?.id || !dimName || !dimWidth || !dimHeight) return;

        setIsSaving(true);
        try {
            const width = parseInt(dimWidth);
            const height = parseInt(dimHeight);
            
            const newDim: SavedDimension = {
                id: editingId || '',
                name: dimName,
                width,
                height,
                description: dimDesc,
                userId: user.id,
                isActive: true // Newly created/saved ones become active by default
            };

            // Deactivate active custom ones locally
            setSavedDimensions(prev => prev.map(d => ({ ...d, isActive: false })));

            // Deactivate in DB logic is handled inside service usually, or we do manual batch?
            const activeCustomDims = savedDimensions.filter(d => d.isActive);
            if (activeCustomDims.length > 0) {
                await Promise.all(activeCustomDims.map(d => updateDimensionInDB({ ...d, isActive: false })));
            }

            if (editingId) {
                await updateDimensionInDB(newDim);
                setSavedDimensions(prev => prev.map(d => d.id === editingId ? newDim : { ...d, isActive: false }));
            } else {
                const saved = await saveDimensionToDB(newDim);
                setSavedDimensions(prev => [...prev.map(d => ({ ...d, isActive: false })), saved]);
            }
            
            // Auto-select the new dimension in UI
            onSelectRatio(`${width}:${height}`);
            
            setViewMode('list');
        } catch (e) {
            console.error("Failed to save dimension", e);
        } finally {
            setIsSaving(false);
        }
    };

    const executeDelete = async () => {
        if (!deleteConfirm.id) return;
        setIsDeleting(true);
        try {
            await deleteDimensionFromDB(deleteConfirm.id);
            setSavedDimensions(prev => prev.filter(d => d.id !== deleteConfirm.id));
            setDeleteConfirm({isOpen: false, id: null});
        } catch (e) {
            console.error("Failed to delete", e);
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper to determine aspect class for visual preview
    const getVisualClass = (w: number, h: number) => {
        const ratio = w / h;
        if (ratio >= 1.7) return 'w-28 h-16'; // 16:9
        if (ratio >= 1.3) return 'w-24 h-20'; // 4:3
        if (ratio >= 0.9) return 'w-24 h-24'; // 1:1
        if (ratio >= 0.7) return 'w-20 h-24'; // 3:4
        return 'w-16 h-28'; // 9:16
    };

    const renderList = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Output Dimensions</h2>
                <p className="text-gray-400 text-sm">Select the aspect ratio and resolution for your generation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Create New Card */}
                <button 
                    onClick={handleCreateNew}
                    className="group relative flex flex-col items-center justify-center h-full min-h-[300px] rounded-3xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 gap-4"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-purple-400 transition-all group-hover:scale-110">
                        <PlusIcon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold group-hover:text-purple-300 transition-colors">Create Custom</h3>
                        <p className="text-xs text-gray-500 mt-1">Define your own resolution</p>
                    </div>
                </button>

                {allDimensions.map((dim) => {
                    const ratioString = dim.isSystem ? dim.id : `${dim.width}:${dim.height}`;
                    const isSelected = selectedRatio === ratioString;

                    return (
                        <div 
                            key={dim.id}
                            onClick={() => handleSelectDimension(dim)}
                            className={`group relative flex flex-col h-full rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden border-2 ${
                                isSelected 
                                ? 'bg-[#121212] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                            }`}
                        >
                            {/* Visual Preview Area */}
                            <div className="h-40 flex-shrink-0 flex items-center justify-center bg-black/20 border-b border-white/5 relative">
                                <div className={`border-2 transition-all duration-500 rounded-md ${
                                    isSelected 
                                    ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                                    : 'border-gray-600 bg-white/5 group-hover:border-gray-400'
                                } ${getVisualClass(dim.width, dim.height)}`}></div>
                                
                                {isSelected && (
                                    <div className="absolute top-3 right-3 animate-in zoom-in duration-300">
                                        <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Text Content */}
                            <div className="p-5 flex flex-col items-center text-center flex-grow justify-between gap-4">
                                <div className="flex flex-col items-center w-full">
                                    <h3 className={`font-bold text-xl leading-tight ${isSelected ? 'text-white' : 'text-gray-300'}`}>{dim.name}</h3>
                                    {dim.isSystem && <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1.5">{dim.id}</p>}
                                </div>
                                
                                <div className="flex flex-col items-center w-full">
                                    <div className={`px-2.5 py-1 rounded-md text-xs font-mono mb-2 ${
                                        isSelected ? 'bg-purple-500/10 text-purple-300' : 'bg-white/5 text-gray-500'
                                    }`}>
                                        {dim.width} × {dim.height}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-tight px-1 min-h-[2.5em] flex items-center justify-center">{dim.description || 'Custom Resolution'}</p>
                                </div>

                                {/* Actions / Active Badge */}
                                <div className="h-8 flex items-center justify-center w-full mt-1">
                                    {isSelected ? (
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full animate-in fade-in slide-in-from-bottom-1 border border-purple-500/20">
                                            Active
                                        </span>
                                    ) : (
                                        !dim.isSystem ? (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(dim); }}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({isOpen: true, id: dim.id}); }}
                                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="h-1 w-1 rounded-full bg-white/10 group-hover:bg-white/20"></span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex items-start gap-4 max-w-2xl">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <DimensionIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white mb-1">About Aspect Ratios</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        The selected aspect ratio determines the shape of your generated images. 
                        Choosing the right ratio ensures your product is framed correctly for your target platform.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderEditor = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center gap-4">
                <button 
                    onClick={() => setViewMode('list')}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit Dimension' : 'Create Custom Dimension'}</h2>
                    <p className="text-gray-400 text-sm">Define custom resolution for your specific needs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="space-y-6">
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 space-y-4">
                         <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Name</label>
                            <input 
                                type="text"
                                value={dimName}
                                onChange={(e) => setDimName(e.target.value)}
                                placeholder="e.g. Website Banner, Blog Post"
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <OptionSelector 
                                    label="Width (px)"
                                    options={WIDTH_OPTIONS}
                                    selected={dimWidth}
                                    onSelect={setDimWidth}
                                />
                             </div>
                             <div>
                                <OptionSelector 
                                    label="Height (px)"
                                    options={HEIGHT_OPTIONS}
                                    selected={dimHeight}
                                    onSelect={setDimHeight}
                                />
                             </div>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description (Optional)</label>
                            <input 
                                type="text"
                                value={dimDesc}
                                onChange={(e) => setDimDesc(e.target.value)}
                                placeholder="Short description..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                            />
                         </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={!dimName || !dimWidth || !dimHeight || isSaving}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                        {isSaving ? 'Saving...' : (editingId ? 'Update Dimension' : 'Save Dimension')}
                    </button>
                </div>

                {/* Preview */}
                <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-2xl p-6 flex flex-col h-full min-h-[400px]">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Shape Preview
                    </h3>
                    
                    <div className="flex-1 rounded-xl relative overflow-hidden flex items-center justify-center group shadow-inner bg-[#1a1a1a] border border-white/5">
                         <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                         
                         {dimWidth && dimHeight ? (
                             <div 
                                className="border-2 border-purple-500 bg-purple-500/10 flex items-center justify-center relative transition-all duration-500"
                                style={{
                                    width: '100px', // base size
                                    height: `${(parseInt(dimHeight) / parseInt(dimWidth)) * 100}px`,
                                    maxHeight: '250px',
                                    maxWidth: '250px'
                                }}
                             >
                                <span className="text-[10px] text-purple-300 font-mono absolute -bottom-6">{dimWidth}x{dimHeight}</span>
                             </div>
                         ) : (
                             <div className="text-gray-600 text-sm">Enter dimensions to preview</div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-full">
            {viewMode === 'list' ? renderList() : renderEditor()}
            <ConfirmationModal 
                isOpen={deleteConfirm.isOpen}
                title="Delete Dimension"
                message="Are you sure you want to delete this custom dimension?"
                onConfirm={executeDelete}
                onCancel={() => setDeleteConfirm({isOpen: false, id: null})}
                isDeleting={isDeleting}
            />
        </div>
    );
};
