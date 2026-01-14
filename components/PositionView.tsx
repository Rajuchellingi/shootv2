import React, { useState } from 'react';
import { 
    PlusIcon, LayersIcon, EditIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon,
    ViewFrontIcon, ViewSideIcon, ViewTopIcon, View3QIcon, ViewBackIcon, ViewFullBodyIcon, ViewWaistUpIcon, ViewDetailIcon, CameraIcon,
    ChevronDownIcon, UserCircleIcon
} from './Icons';
import { Position, Sequence, Pose, PoseCategory, PoseVariation } from '../types';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';

export const POSE_CATEGORIES: PoseCategory[] = [
  {
    id: 'front',
    name: 'Front View',
    icon: '👤',
    poses: [
      { code: Pose.FrontViewFull, name: 'Standard Front', description: 'Basic frontal standing pose' },
      { code: Pose.FrontRelaxed, name: 'Relaxed Front', description: 'Casual relaxed stance' },
      { code: Pose.FrontConfident, name: 'Confident Front', description: 'Strong confident posture' },
      { code: Pose.FrontHandsPockets, name: 'Hands in Pockets', description: 'Both hands in pockets' },
      { code: Pose.FrontOneHandPocket, name: 'One Hand Pocket', description: 'One hand in pocket' },
      { code: Pose.FrontHandsHips, name: 'Hands on Hips', description: 'Assertive hands on hips' },
      { code: Pose.FrontOneHandHip, name: 'One Hand on Hip', description: 'One hand on hip' },
      { code: Pose.FrontArmsCrossed, name: 'Arms Crossed', description: 'Arms crossed over chest' },
      { code: Pose.FrontArmsRelaxed, name: 'Arms Relaxed', description: 'Arms hanging naturally' },
      { code: Pose.FrontHandsBehind, name: 'Hands Behind Back', description: 'Hands clasped behind' },
      { code: Pose.FrontLookingDown, name: 'Looking Down', description: 'Gazing downward' },
      { code: Pose.FrontHeadTilt, name: 'Head Tilt', description: 'Head tilted gently' },
      { code: Pose.FrontThreeQuarter, name: 'Three-Quarter Angle', description: 'Body at 45° angle' },
      { code: Pose.FrontWalking, name: 'Walking Forward', description: 'Walking toward camera' },
      { code: Pose.FrontDynamic, name: 'Dynamic Pose', description: 'S-curve hip pop stance' }
    ]
  },
  {
    id: 'back',
    name: 'Back View',
    icon: '🔄',
    poses: [
      { code: Pose.BackViewFull, name: 'Standard Back', description: 'Basic rear view' },
      { code: Pose.BackRelaxed, name: 'Relaxed Back', description: 'Casual rear stance' },
      { code: Pose.BackConfident, name: 'Confident Back', description: 'Upright back pose' },
      { code: Pose.BackHandsPockets, name: 'Hands in Back Pockets', description: 'Hands in pockets' },
      { code: Pose.BackOneHandPocket, name: 'One Hand Pocket', description: 'One hand in pocket' },
      { code: Pose.BackArmsCrossed, name: 'Arms Behind', description: 'Arms crossed behind' },
      { code: Pose.BackHandsHips, name: 'Hands on Hips', description: 'Hands on hips from rear' },
      { code: Pose.BackLookingOver, name: 'Looking Over Shoulder', description: 'Face visible over shoulder' },
      { code: Pose.BackLookingOverLeft, name: 'Looking Over Left', description: 'Left shoulder glance' },
      { code: Pose.BackLookingOverRight, name: 'Looking Over Right', description: 'Right shoulder glance' },
      { code: Pose.BackThreeQuarter, name: 'Three-Quarter Back', description: 'Angled back view' },
      { code: Pose.BackWalking, name: 'Walking Away', description: 'Walking away from camera' }
    ]
  },
  {
    id: 'side',
    name: 'Side Profile',
    icon: '↔️',
    poses: [
      { code: Pose.SideProfile, name: 'Standard Side', description: 'Perfect 90° profile' },
      { code: Pose.SideRelaxed, name: 'Relaxed Side', description: 'Casual side stance' },
      { code: Pose.SideConfident, name: 'Confident Side', description: 'Strong side posture' },
      { code: Pose.SideHandsPockets, name: 'Hands in Pockets', description: 'Hands in pockets' },
      { code: Pose.SideOneHandPocket, name: 'One Hand Pocket', description: 'One hand in pocket' },
      { code: Pose.SideArmsCrossed, name: 'Arms Crossed', description: 'Arms crossed from side' },
      { code: Pose.SideOneHandHip, name: 'Hand on Hip', description: 'Near hand on hip' },
      { code: Pose.SideLookingCamera, name: 'Looking at Camera', description: 'Head turned to camera' },
      { code: Pose.SideLookingForward, name: 'Looking Forward', description: 'Head facing forward' },
      { code: Pose.SideWalking, name: 'Walking Side', description: 'Walking across frame' },
      { code: Pose.SideThreeQuarterAngle, name: 'Three-Quarter Angle (45°)', description: 'Side angle showing profile and front' }
    ]
  },
  {
    id: 'waist-up',
    name: 'Waist Up',
    icon: '👔',
    poses: [
      { code: Pose.WaistUp, name: 'Standard Waist Up', description: 'Basic waist-up shot' },
      { code: Pose.WaistUpRelaxed, name: 'Relaxed Waist Up', description: 'Casual waist-up' },
      { code: Pose.WaistUpConfident, name: 'Confident Waist Up', description: 'Strong upper body' },
      { code: Pose.WaistUpHandsPockets, name: 'Hands in Pockets', description: 'Hands in pockets' },
      { code: Pose.WaistUpOneHandPocket, name: 'One Hand Pocket', description: 'One hand in pocket' },
      { code: Pose.WaistUpArmsCrossed, name: 'Arms Crossed', description: 'Arms crossed' },
      { code: Pose.WaistUpHandsHips, name: 'Hands on Hips', description: 'Hands on hips' },
      { code: Pose.WaistUpOneHandNeck, name: 'Hand at Neck', description: 'Hand near neck/collar' },
      { code: Pose.WaistUpAdjustingCollar, name: 'Adjusting Garment', description: 'Natural hand gesture' },
      { code: Pose.WaistUpLookingDown, name: 'Looking Down', description: 'Gazing downward' },
      { code: Pose.WaistUpThreeQuarter, name: 'Three-Quarter', description: 'Angled waist-up' },
      { code: Pose.WaistUpBack, name: 'Waist Up Back', description: 'Rear waist-up view' }
    ]
  },
  {
    id: 'closeup',
    name: 'Close Up Details',
    icon: '🔍',
    poses: [
      { code: Pose.CloseUp, name: 'Standard Close Up', description: 'Chest to head detail' },
      { code: Pose.ChestDetailOnModel, name: 'Chest Detail (Worn)', description: 'Extreme close-up of chest design' },
      { code: Pose.SleeveDetailOnModel, name: 'Sleeve Detail (Worn)', description: 'Macro shot of sleeve patch' },
      { code: Pose.CollarDetailOnModel, name: 'Collar Detail (Worn)', description: 'Focus on collar construction' },
      { code: Pose.PocketDetailOnModel, name: 'Pocket Detail (Worn)', description: 'Macro shot of pocket detail' },
      { code: Pose.HemDetailOnModel, name: 'Hem Detail (Worn)', description: 'Focus on bottom split/seam' },
      { code: Pose.BackDetailOnModel, name: 'Back Detail (Worn)', description: 'Extreme focus on back logo' },
      { code: Pose.ButtonPlacketDetail, name: 'Button Placket (Worn)', description: 'Focus on closure/buttons' },
      { code: Pose.CloseUpStraight, name: 'Centered Close Up', description: 'Perfectly centered' }
    ]
  },
  {
    id: 'action',
    name: 'Action & Lifestyle',
    icon: '🚶',
    poses: [
      { code: Pose.WalkingFront, name: 'Walking Toward', description: 'Walking to camera' },
      { code: Pose.WalkingAway, name: 'Walking Away', description: 'Walking from camera' },
      { code: Pose.WalkingSide, name: 'Walking Side', description: 'Walking across frame' },
      { code: Pose.TurningAround, name: 'Turning', description: 'Mid-turn motion' },
      { code: Pose.StridingForward, name: 'Striding', description: 'Confident stride' },
      { code: Pose.CasualStanding, name: 'Casual Standing', description: 'Natural standing' },
      { code: Pose.CasualLeaning, name: 'Casual Leaning', description: 'Leaning pole' },
      { code: Pose.OutdoorCasual, name: 'Outdoor Casual', description: 'Natural outdoor casual' },
      { code: Pose.OutdoorWalking, name: 'Outdoor Walking', description: 'Outdoor walking' },
      { code: Pose.OutdoorStanding, name: 'Outdoor Standing', description: 'Outdoor stance' }
    ]
  },
  {
    id: 'special',
    name: 'Special Angles',
    icon: '📐',
    poses: [
      { code: Pose.HighAngleFront, name: 'High Angle', description: 'Camera from above' },
      { code: Pose.LowAngleFront, name: 'Low Angle', description: 'Camera from below' },
      { code: Pose.DiagonalRight, name: 'Diagonal Right', description: 'Right shoulder forward' },
      { code: Pose.DiagonalLeft, name: 'Diagonal Left', description: 'Left shoulder forward' },
      { code: Pose.CasualSitting, name: 'Casual Sitting', description: 'Seated pose' },
      { code: Pose.EdgeSitting, name: 'Edge Sitting', description: 'Sitting on edge' },
      { code: Pose.SittingOnStool, name: 'Stool - Elbows on Thighs', description: 'Sitting with elbows resting on thighs' },
      { code: Pose.DramaticPose, name: 'Dramatic', description: 'High fashion editorial' },
      { code: Pose.PowerPose, name: 'Power Pose', description: 'Commanding presence' }
    ]
  }
];

export const STANDARD_POSITIONS: Position[] = [
  {
    id: 'front-full',
    code: 'FRONT_FULL',
    name: 'Front Full Body',
    description: 'Perfect 0° degree direct frontal view',
    prompt: 'STRICT CAMERA DIRECTIVE: 0-degree direct frontal facing camera. Lens height: Mid-torso. Alignment: Perfect horizontal symmetry. Subject orientation: 100% forward.',
    icon: UserCircleIcon
  },
  {
    id: 'back-full',
    code: 'BACK_FULL',
    name: 'Back Full Body',
    description: 'Perfect 180° degree direct rear view',
    prompt: 'STRICT CAMERA DIRECTIVE: 180-degree direct rear view. Lens height: Mid-back. Subject orientation: 100% away from camera. Face completely hidden.',
    icon: UserCircleIcon
  },
  {
    id: 'side-profile',
    code: 'SIDE_PROFILE',
    name: 'Side Profile',
    description: 'Perfect 90° lateral profile view',
    prompt: 'STRICT CAMERA DIRECTIVE: 90-degree lateral profile view. Lens height: Chest level. Framing: Full body silhouette. Only one arm/leg fully visible to camera.',
    icon: CameraIcon
  },
  {
    id: 'waist-up',
    code: 'WAIST_UP',
    name: 'Waist Up Portrait',
    description: 'Framing from natural waist line to head',
    prompt: 'STRICT CAMERA DIRECTIVE: Medium shot, framing from waist to top of head. Lens: 50mm focal length. Perspective: Head-on.',
    icon: ViewWaistUpIcon
  },
  {
    id: 'chest-detail-on-model',
    code: 'CHEST_DETAIL_ON_MODEL',
    name: 'Chest Detail (Macro)',
    description: 'Extreme close-up of garment chest area',
    prompt: 'STRICT CAMERA DIRECTIVE: Macro detail. Framing: Chest pocket/logo area only. Model body visible but blurred. Focus lock on fabric weave.',
    icon: ViewDetailIcon
  }
];

interface PositionViewProps {
    sequences?: Sequence[];
    onSaveSequence?: (seq: Sequence) => Promise<void>;
    onUpdateSequence?: (seq: Sequence) => Promise<void>;
    onDeleteSequence?: (id: string) => void;
    onSetActiveSequence?: (id: string) => void;
}

export const PositionView: React.FC<PositionViewProps> = ({ 
    sequences = [], 
    onSaveSequence,
    onUpdateSequence,
    onDeleteSequence,
    onSetActiveSequence
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['front', 'closeup']));
    
    const [editingSequenceId, setEditingSequenceId] = useState<string | null>(null);
    const [sequenceName, setSequenceName] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
        else newExpanded.add(categoryId);
        setExpandedCategories(newExpanded);
    };

    const handleTogglePosition = (variation: PoseVariation) => {
        const pos: Position = {
            id: `${variation.code}-${Date.now()}`,
            code: variation.code,
            name: variation.name,
            description: variation.description,
            prompt: `STRICT CAMERA DIRECTIVE: ${variation.name}. ${variation.description}. Orientation Lock: ${variation.code}.`,
            icon: null
        };
        setSelectedPositions([...selectedPositions, pos]);
    };

    const handleToggleStandardPosition = (pos: Position) => {
        setSelectedPositions([...selectedPositions, { ...pos, id: `${pos.code}-${Date.now()}` }]);
    };

    const handleRemovePosition = (index: number) => {
        const newPositions = [...selectedPositions];
        newPositions.splice(index, 1);
        setSelectedPositions(newPositions);
    };

    const handleMovePosition = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === selectedPositions.length - 1)) return;
        const newPositions = [...selectedPositions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newPositions[index], newPositions[targetIndex]] = [newPositions[targetIndex], newPositions[index]];
        setSelectedPositions(newPositions);
    };

    const handleSaveSequence = async () => {
        if (!sequenceName.trim() || selectedPositions.length === 0) return;
        setIsSaving(true);
        try {
            if (editingSequenceId && onUpdateSequence) {
                const original = sequences.find(s => s.id === editingSequenceId);
                const updatedSequence: Sequence = {
                    id: editingSequenceId,
                    name: sequenceName,
                    shots: selectedPositions,
                    isActive: original ? original.isActive : false
                };
                await onUpdateSequence(updatedSequence);
            } else if (onSaveSequence) {
                const newSequence: Sequence = {
                    id: `seq-${Date.now()}`,
                    name: sequenceName,
                    shots: selectedPositions,
                    isActive: false
                };
                await onSaveSequence(newSequence);
            }
            setSequenceName('');
            setSelectedPositions([]);
            setEditingSequenceId(null);
            setViewMode('list');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditSequence = (seq: Sequence) => {
        setEditingSequenceId(seq.id);
        setSequenceName(seq.name);
        setSelectedPositions(seq.shots);
        setViewMode('create');
    };

    const renderListView = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Position Sequences</h2>
                <p className="text-gray-400 text-sm">Organize your accurate camera angle sequences.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button 
                    onClick={() => { setEditingSequenceId(null); setSequenceName(''); setSelectedPositions([]); setViewMode('create'); }}
                    className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-black/40"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-purple-400 transition-all group-hover:scale-110">
                        <PlusIcon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-white font-bold group-hover:text-purple-300 transition-colors">Create New Sequence</h3>
                    </div>
                </button>
                {sequences.map((seq) => (
                    <div 
                        key={seq.id} 
                        onClick={() => onSetActiveSequence && onSetActiveSequence(seq.id)}
                        className={`group relative aspect-[4/3] rounded-2xl bg-[#111] p-6 flex flex-col justify-between border-2 transition-all duration-300 cursor-pointer ${seq.isActive ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-lg' : 'border-white/10 hover:border-white/20 border'}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <LayersIcon className="w-6 h-6" />
                            </div>
                            {seq.isActive && <div className="text-purple-500 bg-white rounded-full p-0.5 shadow-lg scale-110 animate-in zoom-in"><CheckCircleIcon className="w-5 h-5" /></div>}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1 truncate">{seq.name}</h3>
                            <p className="text-sm text-gray-500">{seq.shots.length} Accuracy Shots</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${seq.isActive ? 'text-purple-400' : 'text-gray-600'}`}>{seq.isActive ? 'Active' : 'Inactive'}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleEditSequence(seq); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><EditIcon className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: seq.id }); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCreateView = () => (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewMode('list')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"><ArrowLeftIcon className="w-5 h-5" /></button>
                <div>
                    <h2 className="text-2xl font-bold text-white">{editingSequenceId ? 'Edit Sequence' : 'Create Accurate Sequence'}</h2>
                    <p className="text-gray-400 text-sm">Select anatomy-specific variations for high-fidelity shoots.</p>
                </div>
            </div>
            <div className="flex flex-col xl:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    {/* Catalog-Ready Presets */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mb-8">
                        <div className="p-4 border-b border-white/5 flex items-center gap-2">
                             <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-purple-400 text-xs">★</div>
                             <span className="font-bold text-white text-sm uppercase tracking-wider">Catalog Essentials</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {STANDARD_POSITIONS.map(pos => (
                                <div key={pos.id} onClick={() => handleToggleStandardPosition(pos)} className="p-3 rounded-xl border border-white/5 bg-black/40 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-bold text-sm text-gray-200 group-hover:text-white">{pos.name}</h4>
                                        <PlusIcon className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-tight">{pos.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mb-8"></div>

                    {/* Detailed Anatomy Poses */}
                    <div className="px-2 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Anatomical Variations</div>
                    {POSE_CATEGORIES.map(category => {
                        const isExpanded = expandedCategories.has(category.id);
                        return (
                            <div key={category.id} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                                <button onClick={() => toggleCategory(category.id)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-xl">{category.icon}</div>
                                        <span className="font-bold text-white">{category.name}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {category.poses.map(v => (
                                            <div key={v.code} onClick={() => handleTogglePosition(v)} className="p-3 rounded-xl border border-white/5 bg-black/40 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-bold text-sm text-gray-200 group-hover:text-white">{v.name}</h4>
                                                    <PlusIcon className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
                                                </div>
                                                <p className="text-[10px] text-gray-500 leading-tight">{v.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="w-full xl:w-96 space-y-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 h-full flex flex-col shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400"><LayersIcon className="w-5 h-5" /></div>
                             <h3 className="font-bold text-white">Shoot Sequence</h3>
                        </div>
                        <div className="flex-1 bg-black/20 rounded-xl border border-white/5 border-dashed p-4 mb-6 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
                             {selectedPositions.length === 0 ? (
                                 <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center p-4">
                                     <CameraIcon className="w-8 h-8 mb-3 opacity-20" />
                                     <p className="text-sm">Click variations to build sequence</p>
                                 </div>
                             ) : (
                                 <div className="space-y-2">
                                     {selectedPositions.map((pos, idx) => (
                                         <div key={pos.id} className="bg-[#1a1a1a] border border-white/10 p-3 rounded-lg flex items-center justify-between group">
                                             <div className="flex items-center gap-3 min-w-0">
                                                 <span className="text-[10px] font-mono text-gray-500">{idx + 1}</span>
                                                 <p className="text-sm font-bold text-gray-300 truncate">{pos.name}</p>
                                             </div>
                                             <div className="flex items-center gap-1">
                                                 <button onClick={() => handleMovePosition(idx, 'up')} disabled={idx === 0} className="p-0.5 hover:text-purple-400 text-gray-500 disabled:opacity-30"><ArrowUpIcon className="w-3 h-3" /></button>
                                                 <button onClick={() => handleMovePosition(idx, 'down')} disabled={idx === selectedPositions.length - 1} className="p-0.5 hover:text-purple-400 text-gray-500 disabled:opacity-30"><ArrowDownIcon className="w-3 h-3" /></button>
                                                 <button onClick={() => handleRemovePosition(idx)} className="text-gray-600 hover:text-red-400 p-1.5"><TrashIcon className="w-4 h-4" /></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sequence Name</label>
                            <input value={sequenceName} onChange={(e) => setSequenceName(e.target.value)} placeholder="e.g., Summer Full Catalog" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none mb-4" />
                            <button onClick={handleSaveSequence} disabled={!sequenceName || selectedPositions.length === 0 || isSaving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                {isSaving ? <Spinner /> : <CheckCircleIcon className="w-5 h-5" />}
                                <span>{isSaving ? 'Saving...' : (editingSequenceId ? 'Update Sequence' : 'Save Sequence')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-full">
            {viewMode === 'list' ? renderListView() : renderCreateView()}
            <ConfirmationModal 
                isOpen={deleteConfirm.isOpen}
                title="Delete Sequence"
                message="Are you sure?"
                onConfirm={() => { if(deleteConfirm.id) onDeleteSequence?.(deleteConfirm.id); setDeleteConfirm({isOpen: false, id: null}); }}
                onCancel={() => setDeleteConfirm({isOpen: false, id: null})}
            />
        </div>
    );
};