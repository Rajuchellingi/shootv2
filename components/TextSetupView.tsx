
import React, { useState, useEffect } from 'react';
import { TypeIcon, PlusIcon, ArrowLeftIcon, EditIcon, TrashIcon, CheckCircleIcon } from './Icons';
import { saveText, fetchTexts, deleteText, updateTextInDB } from '../services/textService';
import { TextConfiguration } from '../types';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';

interface TextSetupViewProps {
    user?: any;
    onActiveTextUpdate?: () => void;
}

export const TextSetupView: React.FC<TextSetupViewProps> = ({ user, onActiveTextUpdate }) => {
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    
    // Data State
    const [savedTexts, setSavedTexts] = useState<TextConfiguration[]>([]);
    
    // Editor State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [configName, setConfigName] = useState('');
    const [textContent, setTextContent] = useState('');
    const [position, setPosition] = useState<TextConfiguration['position']>('Bottom Right');
    const [color, setColor] = useState('#FFFFFF');
    const [fontSize, setFontSize] = useState<number>(5);
    const [opacity, setOpacity] = useState<number>(100);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadTexts = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const texts = await fetchTexts(user.id);
                setSavedTexts(texts);
            } catch (e) {
                console.error("Failed to load text configs", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadTexts();
    }, [user]);

    const handleCreateNew = () => {
        setEditingId(null);
        setConfigName('');
        setTextContent('');
        setPosition('Bottom Right');
        setColor('#FFFFFF');
        setFontSize(5);
        setOpacity(100);
        setViewMode('create');
    };

    const handleEdit = (config: TextConfiguration) => {
        setEditingId(config.id);
        setConfigName(config.name);
        setTextContent(config.textContent);
        setPosition(config.position);
        setColor(config.color);
        setFontSize(config.fontSize);
        setOpacity(config.opacity);
        setViewMode('create');
    };

    const executeDelete = async () => {
        const { id } = deleteConfirm;
        if (!id) return;
        
        setIsDeleting(true);
        try {
            await deleteText(id);
            setSavedTexts(prev => prev.filter(t => t.id !== id));
            if (onActiveTextUpdate) onActiveTextUpdate();
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (e) {
            console.error("Failed to delete", e);
            setStatusMessage({ type: 'error', text: 'Failed to delete text config.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSetActive = async (id: string) => {
        const textToToggle = savedTexts.find(t => t.id === id);
        if (!textToToggle) return;

        const newState = !textToToggle.isActive;
        const prevTexts = [...savedTexts];

        setSavedTexts(prev => prev.map(t => ({
            ...t,
            isActive: t.id === id ? newState : false
        })));

        try {
            if (newState) {
                const activeTexts = prevTexts.filter(t => t.isActive && t.id !== id);
                await Promise.all(activeTexts.map(t => updateTextInDB({ id: t.id, isActive: false })));
            }
            await updateTextInDB({ id, isActive: newState });
            
            if (onActiveTextUpdate) onActiveTextUpdate();
        } catch (e) {
            console.error("Failed to set active text", e);
            setSavedTexts(prevTexts);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!configName.trim() || !textContent.trim()) {
            setStatusMessage({ type: 'error', text: 'Please enter a name and text content.' });
            return;
        }

        setIsSaving(true);
        setStatusMessage(null);

        try {
            const configData: TextConfiguration = {
                id: editingId || '',
                name: configName,
                textContent,
                position,
                color,
                fontSize,
                opacity,
                isActive: editingId ? (savedTexts.find(t => t.id === editingId)?.isActive || false) : false
            };

            const saved = await saveText(user.id, configData);
            
            setSavedTexts(prev => {
                if (editingId) {
                    return prev.map(t => t.id === editingId ? saved : t);
                } else {
                    return [saved, ...prev];
                }
            });

            setStatusMessage({ type: 'success', text: 'Text configuration saved!' });
            if (onActiveTextUpdate) onActiveTextUpdate();
            
            setTimeout(() => {
                setStatusMessage(null);
                setViewMode('list'); 
            }, 1000);

        } catch (error: any) {
            console.error(error);
            setStatusMessage({ type: 'error', text: error.message || 'Failed to save.' });
        } finally {
            setIsSaving(false);
        }
    };

    const getPreviewStyles = () => {
        const base = "absolute whitespace-nowrap font-bold transition-all duration-300 pointer-events-none";
        // Calculate px based on preview box size (assume 700px height for preview)
        const pxSize = `${(fontSize / 100) * 700}px`; 
        
        const style: React.CSSProperties = {
            color: color,
            opacity: opacity / 100,
            fontSize: pxSize,
        };

        let posClasses = "";
        const padding = "10%";
        switch (position) {
            case 'Top Left': posClasses = `top-[${padding}] left-[${padding}] text-left`; break;
            case 'Top Right': posClasses = `top-[${padding}] right-[${padding}] text-right`; break;
            case 'Top Center': posClasses = `top-[${padding}] left-1/2 -translate-x-1/2 text-center`; break;
            case 'Bottom Left': posClasses = `bottom-[${padding}] left-[${padding}] text-left`; break;
            case 'Bottom Right': posClasses = `bottom-[${padding}] right-[${padding}] text-right`; break;
            case 'Bottom Center': posClasses = `bottom-[${padding}] left-1/2 -translate-x-1/2 text-center`; break;
            case 'Center': posClasses = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"; break;
            default: posClasses = `bottom-[${padding}] right-[${padding}] text-right`;
        }

        return { className: `${base} ${posClasses}`, style };
    };

    const renderList = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Text Overlay Setup</h2>
                <p className="text-gray-400 text-sm">Configure text overlays like sizes or slogans.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={handleCreateNew} className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-black/20">
                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-purple-400 transition-all group-hover:scale-110">
                        <PlusIcon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold group-hover:text-purple-300 transition-colors">Create New Text</h3>
                    </div>
                </button>

                {savedTexts.map((text) => (
                    <div key={text.id} onClick={() => handleSetActive(text.id)} className={`group relative aspect-[4/3] rounded-2xl bg-[#111] overflow-hidden cursor-pointer flex flex-col border-2 transition-all ${text.isActive ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}>
                         {text.isActive && (
                            <div className="absolute top-3 right-3 bg-purple-500 rounded-full p-1 shadow-lg animate-in zoom-in duration-200 z-10">
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                            </div>
                         )}
                        <div className="flex-1 flex items-center justify-center p-8 bg-white/[0.02]">
                            <h3 className="font-bold text-2xl drop-shadow-lg truncate max-w-full" style={{ color: text.color, opacity: text.opacity / 100 }}>{text.textContent}</h3>
                        </div>
                        <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between z-20">
                            <div>
                                <span className="text-white font-bold text-sm truncate block max-w-[120px]">{text.name}</span>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{text.position}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(text); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><EditIcon className="w-4 h-4 text-white" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: text.id }); }} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"><TrashIcon className="w-4 h-4 text-red-400" /></button>
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
                    <h2 className="text-2xl font-bold text-white tracking-tight">{editingId ? 'Edit Text Configuration' : 'New Text Configuration'}</h2>
                    <p className="text-gray-500 text-sm">Define what text to overlay and how it looks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    {/* Config Name Input */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Configuration Name</label>
                        <input 
                            type="text" 
                            value={configName} 
                            onChange={(e) => setConfigName(e.target.value)} 
                            placeholder="e.g. Size Label, Promo Price"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-purple-500 outline-none transition-all" 
                        />
                    </div>

                    {/* Text Content Input */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Text Content</label>
                        <input 
                            type="text" 
                            value={textContent} 
                            onChange={(e) => setTextContent(e.target.value)} 
                            placeholder="e.g. S, M, L, XL"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-purple-500 outline-none transition-all font-bold" 
                        />
                    </div>

                    {/* Position Selector */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Position</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Top Left', 'Top Center', 'Top Right', 'Center', 'Bottom Left', 'Bottom Center', 'Bottom Right'].map((pos) => (
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

                        {/* Styles & Sliders */}
                        <div className="mt-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Color</label>
                                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-2">
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                            <input 
                                                type="color" value={color} onChange={(e) => setColor(e.target.value)}
                                                className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">{color}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Font Size Scale</label>
                                    </div>
                                    <input 
                                        type="range" min="1" max="20" step="0.5" 
                                        value={fontSize} onChange={(e) => setFontSize(parseFloat(e.target.value))}
                                        className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-full cursor-pointer appearance-none"
                                    />
                                </div>
                            </div>

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
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={!textContent || isSaving} className="w-full bg-[#1e2329] hover:bg-[#2c333c] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl mt-4">
                        {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5 text-purple-400" />}
                        {isSaving ? 'Saving...' : 'Save Text'}
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
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Live Preview</h3>
                    </div>
                    <div className="flex-1 rounded-3xl relative overflow-hidden flex items-center justify-center bg-[#050505] border border-white/5 shadow-2xl">
                        {/* Grid Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        
                        {textContent ? (
                            <div 
                                {...getPreviewStyles()}
                                className={`${getPreviewStyles().className} transition-all duration-300`}
                            >
                                {textContent}
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                                    <TypeIcon className="w-8 h-8 text-gray-700" />
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
            <ConfirmationModal isOpen={deleteConfirm.isOpen} title="Delete Configuration" message="Are you sure you want to delete this text configuration?" onConfirm={executeDelete} onCancel={() => setDeleteConfirm({isOpen: false, id: null})} isDeleting={isDeleting} />
        </div>
    );
};
