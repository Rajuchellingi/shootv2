
import React, { useState, useEffect } from 'react';
import { UploadIcon, CheckCircleIcon, LogoIcon, PlusIcon, ArrowLeftIcon, EditIcon, TrashIcon } from './Icons';
import { saveLogo, fetchLogos, deleteLogo, updateLogoInDB } from '../services/logoService';
import { LogoConfiguration } from '../types';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';

interface LogoSetupViewProps {
    user?: any;
    onActiveLogoUpdate?: () => void;
}

export const LogoSetupView: React.FC<LogoSetupViewProps> = ({ user, onActiveLogoUpdate }) => {
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    
    // Data State
    const [savedLogos, setSavedLogos] = useState<LogoConfiguration[]>([]);
    
    // Editor State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [logoName, setLogoName] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [position, setPosition] = useState<LogoConfiguration['position']>('Bottom Right');
    const [opacity, setOpacity] = useState<number>(100);
    const [scale, setScale] = useState<number>(20);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null, imageUrl: string | null}>({isOpen: false, id: null, imageUrl: null});
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadLogos = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const logos = await fetchLogos(user.id);
                setSavedLogos(logos);
            } catch (e) {
                console.error("Failed to load logos", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadLogos();
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setLogoName('');
        setLogoFile(null);
        setLogoPreview(null);
        setPosition('Bottom Right');
        setOpacity(100);
        setScale(20);
        setViewMode('create');
    };

    const handleEditLogo = (logo: LogoConfiguration) => {
        setEditingId(logo.id);
        setLogoName(logo.name);
        setLogoPreview(logo.imageUrl);
        setPosition(logo.position);
        setOpacity(logo.opacity);
        setScale(logo.scale);
        setLogoFile(null);
        setViewMode('create');
    };

    const executeDelete = async () => {
        const { id } = deleteConfirm;
        if (!id) return;
        
        setIsDeleting(true);
        try {
            await deleteLogo(id);
            setSavedLogos(prev => prev.filter(l => l.id !== id));
            if (onActiveLogoUpdate) onActiveLogoUpdate();
            setDeleteConfirm({ isOpen: false, id: null, imageUrl: null });
        } catch (e) {
            console.error("Failed to delete", e);
            setStatusMessage({ type: 'error', text: 'Failed to delete logo.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSetActive = async (id: string) => {
        const logoToToggle = savedLogos.find(l => l.id === id);
        if (!logoToToggle) return;

        const newState = !logoToToggle.isActive;
        const prevLogos = [...savedLogos];

        setSavedLogos(prev => prev.map(l => ({
            ...l,
            isActive: l.id === id ? newState : false
        })));

        try {
            if (newState) {
                const activeLogos = prevLogos.filter(l => l.isActive && l.id !== id);
                await Promise.all(activeLogos.map(l => updateLogoInDB({ id: l.id, isActive: false })));
            }
            await updateLogoInDB({ id, isActive: newState });
            
            if (onActiveLogoUpdate) onActiveLogoUpdate();
        } catch (e) {
            console.error("Failed to set active logo", e);
            setSavedLogos(prevLogos);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!logoPreview) return;
        if (!logoName.trim()) {
            setStatusMessage({ type: 'error', text: 'Please enter a name for your logo.' });
            return;
        }

        setIsSaving(true);
        setStatusMessage(null);

        try {
            const configData: LogoConfiguration = {
                id: editingId || '',
                name: logoName,
                imageUrl: logoPreview,
                position,
                opacity,
                scale,
                isActive: editingId ? (savedLogos.find(l => l.id === editingId)?.isActive || false) : false
            };

            const saved = await saveLogo(user.id, configData, logoFile || undefined);
            
            setSavedLogos(prev => {
                if (editingId) {
                    return prev.map(l => l.id === editingId ? saved : l);
                } else {
                    return [saved, ...prev];
                }
            });

            setStatusMessage({ type: 'success', text: 'Logo saved successfully!' });
            if (onActiveLogoUpdate) onActiveLogoUpdate();
            
            setTimeout(() => {
                setStatusMessage(null);
                setViewMode('list'); 
            }, 1000);

        } catch (error: any) {
            console.error(error);
            setStatusMessage({ type: 'error', text: error.message || 'Failed to save logo.' });
        } finally {
            setIsSaving(false);
        }
    };

    const getPositionStyles = () => {
        const base = "absolute object-contain transition-all duration-300";
        const padding = "10%";
        switch (position) {
            case 'Top Left': return `${base} top-[${padding}] left-[${padding}]`;
            case 'Top Right': return `${base} top-[${padding}] right-[${padding}]`;
            case 'Bottom Left': return `${base} bottom-[${padding}] left-[${padding}]`;
            case 'Bottom Right': return `${base} bottom-[${padding}] right-[${padding}]`;
            case 'Center': return `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`;
            default: return `${base} bottom-[${padding}] right-[${padding}]`;
        }
    };

    const renderList = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Logo Branding</h2>
                <p className="text-gray-400 text-sm">Manage your saved brand logos and watermarks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                    onClick={handleCreateNew}
                    className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-black/20"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-purple-400 transition-all group-hover:scale-110">
                        <PlusIcon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold group-hover:text-purple-300 transition-colors">Create New Logo</h3>
                    </div>
                </button>

                {savedLogos.map((logo) => (
                    <div 
                        key={logo.id}
                        onClick={() => handleSetActive(logo.id)}
                        className={`group relative aspect-[4/3] rounded-2xl bg-[#111] overflow-hidden transition-all duration-300 cursor-pointer ${logo.isActive ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-white/10 hover:border-white/20 border'}`}
                    >
                        <div className="absolute inset-0 bg-white/[0.02] flex items-center justify-center p-8 z-0">
                             <img src={logo.imageUrl} alt={logo.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                        </div>
                        
                        {logo.isActive && (
                            <div className="absolute top-3 right-3 bg-purple-500 rounded-full p-1 shadow-lg animate-in zoom-in duration-200 z-10">
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-5 pt-12 z-20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-bold truncate max-w-[120px]">{logo.name}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{logo.position}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditLogo(logo); }}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative z-30"
                                    >
                                        <EditIcon className="w-4 h-4 text-white" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: logo.id, imageUrl: logo.imageUrl }); }}
                                        className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors relative z-30"
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderEditor = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('list')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{editingId ? 'Edit Logo Configuration' : 'New Logo Configuration'}</h2>
                    <p className="text-gray-500 text-sm">Upload your brand logo and configure how it appears on generated images.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    {/* Logo Name Input */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Logo Name</label>
                        <input 
                            type="text" 
                            value={logoName} 
                            onChange={(e) => setLogoName(e.target.value)} 
                            placeholder="e.g. White Watermark, Dark Theme Logo"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-purple-500 outline-none transition-all" 
                        />
                    </div>

                    {/* Upload Box */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Upload Logo</label>
                        <div className="relative group rounded-2xl border-2 border-dashed border-white/5 bg-black/20 hover:bg-black/30 hover:border-purple-500/30 transition-all h-40 flex flex-col items-center justify-center text-center">
                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept="image/png,image/jpeg,image/svg+xml" />
                            <div className="p-3 rounded-xl bg-white/5 text-gray-500 group-hover:text-purple-400 transition-colors mb-3">
                                <UploadIcon className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-gray-300">Drop logo here</p>
                            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-tight">PNG, JPG, SVG (MAX 2MB)</p>
                            {logoFile && <p className="text-[9px] text-purple-400 mt-2 font-mono">{logoFile.name}</p>}
                        </div>
                    </div>

                    {/* Position Selector */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Position</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Top Left', 'Top Right', 'Center', 'Bottom Left', 'Bottom Right'].map((pos) => (
                                <button
                                    key={pos}
                                    onClick={() => setPosition(pos as any)}
                                    className={`py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                                        position === pos 
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                                        : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                                    }`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>

                        {/* Opacity & Scale Sliders */}
                        <div className="mt-8 space-y-8">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Opacity</label>
                                    <span className="text-xs font-bold text-purple-400">{opacity}%</span>
                                </div>
                                <input 
                                    type="range" min="10" max="100" step="1" 
                                    value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))}
                                    className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-full cursor-pointer appearance-none"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scale</label>
                                    <span className="text-xs font-bold text-purple-400">{scale}%</span>
                                </div>
                                <input 
                                    type="range" min="5" max="50" step="1" 
                                    value={scale} onChange={(e) => setScale(parseInt(e.target.value))}
                                    className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-full cursor-pointer appearance-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={!logoPreview || isSaving} className="w-full bg-[#1e2329] hover:bg-[#2c333c] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl mt-4">
                        {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5 text-purple-400" />}
                        {isSaving ? 'Saving...' : 'Save Logo'}
                    </button>
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-2xl text-center text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 ${statusMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {statusMessage.text}
                        </div>
                    )}
                </div>

                {/* Right: Live Preview Panel */}
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col h-[700px] lg:sticky lg:top-8">
                    <div className="flex items-center gap-2 mb-6 px-2">
                        <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Live Preview</h3>
                    </div>
                    <div className="flex-1 rounded-3xl relative overflow-hidden flex items-center justify-center bg-[#050505] border border-white/5 shadow-2xl">
                        {/* Grid Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        
                        {logoPreview ? (
                            <img 
                                src={logoPreview} 
                                alt="Logo" 
                                className={getPositionStyles()} 
                                style={{ 
                                    opacity: opacity / 100, 
                                    width: `${scale}%`,
                                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                                }} 
                            />
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                                    <LogoIcon className="w-8 h-8 text-gray-700" />
                                </div>
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest block">Preview area</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLoading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>;

    return (
        <div className="min-h-full">
            {viewMode === 'list' ? renderList() : renderEditor()}
            <ConfirmationModal isOpen={deleteConfirm.isOpen} title="Delete Logo" message="Are you sure you want to delete this logo?" onConfirm={executeDelete} onCancel={() => setDeleteConfirm({isOpen: false, id: null, imageUrl: null})} isDeleting={isDeleting} />
        </div>
    );
};
