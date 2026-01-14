
import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, ArchiveIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, 
    SparklesIcon, UserCircleIcon, LayersIcon, DimensionIcon, LogoIcon, TypeIcon, EditIcon
} from './Icons';
import { ProjectTemplate, SavedModel, Sequence, LogoConfiguration, TextConfiguration, AspectRatio, Background, Lighting } from '../types';
import { fetchTemplates, saveTemplate, deleteTemplate, updateTemplate } from '../services/templateService';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';
import { OptionSelector } from './OptionSelector';
import { BACKGROUND_OPTIONS, LIGHTING_OPTIONS } from './constants';

interface TemplatesViewProps {
    user: any;
    models: SavedModel[];
    sequences: Sequence[];
    logos: LogoConfiguration[];
    texts: TextConfiguration[];
    onApplyTemplate: (template: ProjectTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ 
    user, models, sequences, logos, texts, onApplyTemplate 
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [modelId, setModelId] = useState('');
    const [sequenceId, setSequenceId] = useState('');
    const [dimensionId, setDimensionId] = useState('1:1');
    const [logoId, setLogoId] = useState('None');
    const [textId, setTextId] = useState('None');
    const [background, setBackground] = useState<Background>(Background.Studio);
    const [backgroundColorHex, setBackgroundColorHex] = useState('#FFFFFF');
    const [lighting, setLighting] = useState<Lighting>(Lighting.Dramatic);

    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

    useEffect(() => {
        if (user) loadTemplates();
    }, [user]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await fetchTemplates(user.id);
            setTemplates(data);
        } catch (err: any) {
            console.error("Failed to load templates:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name || !modelId || !sequenceId) return;
        setIsSaving(true);
        setErrorMessage(null);
        try {
            const templateData: any = {
                name,
                userId: user.id,
                modelId,
                sequenceId,
                dimensionId,
                background,
                lighting,
                backgroundColorHex: background === Background.Studio ? backgroundColorHex : null,
                logoId: logoId === 'None' ? null : logoId,
                textId: textId === 'None' ? null : textId,
                createdAt: editingId ? (templates.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now()
            };

            if (editingId) {
                const updated = await updateTemplate({ ...templateData, id: editingId });
                setTemplates(templates.map(t => t.id === editingId ? updated : t));
            } else {
                const saved = await saveTemplate(templateData);
                setTemplates([saved, ...templates]);
            }
            
            setViewMode('list');
            resetForm();
        } catch (error: any) {
            console.error("Template operation failed:", error);
            const errorMsg = error.message || JSON.stringify(error);
            setErrorMessage(`Database Error: ${errorMsg}. Ensure "background", "lighting" and "backgroundColorHex" columns exist in your Supabase 'templates' table.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (template: ProjectTemplate) => {
        setEditingId(template.id);
        setName(template.name);
        setModelId(template.modelId);
        setSequenceId(template.sequenceId);
        setDimensionId(template.dimensionId);
        setLogoId(template.logoId || 'None');
        setTextId(template.textId || 'None');
        if (template.background) setBackground(template.background);
        if (template.backgroundColorHex) setBackgroundColorHex(template.backgroundColorHex);
        if (template.lighting) setLighting(template.lighting);
        setViewMode('create');
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setModelId('');
        setSequenceId('');
        setDimensionId('1:1');
        setLogoId('None');
        setTextId('None');
        setBackground(Background.Studio);
        setBackgroundColorHex('#FFFFFF');
        setLighting(Lighting.Dramatic);
        setErrorMessage(null);
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            await deleteTemplate(deleteConfirm.id);
            setTemplates(templates.filter(t => t.id !== deleteConfirm.id));
            setDeleteConfirm({ isOpen: false, id: null });
        } catch (e) {
            console.error(e);
        }
    };

    const renderList = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Shoot Templates</h2>
                    <p className="text-gray-400 text-sm">Bundle your favorite settings for instant reuse.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setViewMode('create'); }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" /> Create Template
                </button>
            </div>

            {templates.length === 0 && !isLoading ? (
                <div className="h-64 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-500 gap-4">
                    <ArchiveIcon className="w-12 h-12 opacity-20" />
                    <p>No templates saved yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <div key={t.id} className="group bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all shadow-xl">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                        <ArchiveIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEdit(t)}
                                            className="p-2 text-gray-600 hover:text-white transition-colors"
                                            title="Edit Template"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm({isOpen: true, id: t.id})}
                                            className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                            title="Delete Template"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-4">{t.name}</h3>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <UserCircleIcon className="w-3.5 h-3.5 text-gray-600" />
                                        <span>Model: {models.find(m => m.id === t.modelId)?.name || 'Deleted'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <LayersIcon className="w-3.5 h-3.5 text-gray-600" />
                                        <span>Sequence: {sequences.find(s => s.id === t.sequenceId)?.name || 'Deleted'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <DimensionIcon className="w-3.5 h-3.5 text-gray-600" />
                                        <span>Ratio: {t.dimensionId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <SparklesIcon className="w-3.5 h-3.5 text-gray-600" />
                                        <span className="truncate">Scene: {t.background}{t.background === Background.Studio && t.backgroundColorHex ? ` (${t.backgroundColorHex})` : ''} • {t.lighting}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => onApplyTemplate(t)}
                                className="w-full bg-white/5 hover:bg-purple-600 hover:text-white text-gray-300 font-bold py-3 rounded-xl transition-all border border-white/5 hover:border-purple-500 flex items-center justify-center gap-2"
                            >
                                <SparklesIcon className="w-4 h-4" /> Apply Template
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCreate = () => (
        <div className="max-w-2xl space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
                <button onClick={() => { setViewMode('list'); resetForm(); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit Template' : 'New Shoot Template'}</h2>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Template Name</label>
                    <input 
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="e.g. Amazon Summer Collection"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <OptionSelector 
                        label="Select Model" 
                        options={models.map(m => m.name)} 
                        selected={models.find(m => m.id === modelId)?.name || 'Select Model'} 
                        onSelect={val => setModelId(models.find(m => m.name === val)?.id || '')} 
                    />
                    <OptionSelector 
                        label="Select Sequence" 
                        options={sequences.map(s => s.name)} 
                        selected={sequences.find(s => s.id === sequenceId)?.name || 'Select Sequence'} 
                        onSelect={val => setSequenceId(sequences.find(s => s.name === val)?.id || '')} 
                    />
                    <OptionSelector 
                        label="Dimensions" 
                        options={['1:1', '9:16', '16:9', '4:3', '3:4']} 
                        selected={dimensionId} 
                        onSelect={setDimensionId} 
                    />
                    <OptionSelector 
                        label="Logo Branding" 
                        options={['None', ...logos.map(l => l.name)]} 
                        selected={logos.find(l => l.id === logoId)?.name || 'None'} 
                        onSelect={val => setLogoId(logos.find(l => l.name === val)?.id || 'None')} 
                    />
                    <OptionSelector 
                        label="Background" 
                        options={BACKGROUND_OPTIONS} 
                        selected={background} 
                        onSelect={val => setBackground(val as Background)} 
                    />
                    <OptionSelector 
                        label="Lighting" 
                        options={LIGHTING_OPTIONS} 
                        selected={lighting} 
                        onSelect={val => setLighting(val as Lighting)} 
                    />
                    
                    {background === Background.Studio && (
                        <div className="sm:col-span-2 p-4 bg-black/20 border border-white/5 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <input 
                                type="color" 
                                value={backgroundColorHex} 
                                onChange={(e) => setBackgroundColorHex(e.target.value)} 
                                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                            />
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Studio Color (Hex)</label>
                                <input 
                                    type="text" 
                                    value={backgroundColorHex} 
                                    onChange={(e) => setBackgroundColorHex(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="sm:col-span-2">
                        <OptionSelector 
                            label="Text Overlay" 
                            options={['None', ...texts.map(t => t.name)]} 
                            selected={texts.find(t => t.id === textId)?.name || 'None'} 
                            onSelect={val => setTextId(texts.find(t => t.name === val)?.id || 'None')} 
                        />
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm break-words">
                        <p className="font-bold mb-1">Configuration Error</p>
                        <p className="opacity-80 font-mono text-[10px]">{errorMessage}</p>
                    </div>
                )}

                <button 
                    onClick={handleCreate}
                    disabled={!name || !modelId || !sequenceId || isSaving}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                    <span>{isSaving ? 'Saving Template...' : (editingId ? 'Update Template' : 'Save Template')}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-full">
            {isLoading ? (
                <div className="flex items-center justify-center h-64"><Spinner /></div>
            ) : viewMode === 'list' ? renderList() : renderCreate()}
            
            <ConfirmationModal 
                isOpen={deleteConfirm.isOpen}
                title="Delete Template"
                message="Are you sure you want to delete this shoot template?"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({isOpen: false, id: null})}
            />
        </div>
    );
};
