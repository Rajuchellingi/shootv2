
import React from 'react';
import { TrashIcon } from './Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, title, message, onConfirm, onCancel, isDeleting = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        <TrashIcon className="w-8 h-8" />
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-[260px] mx-auto">
                            {message}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full mt-4">
                        <button 
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 text-sm"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
