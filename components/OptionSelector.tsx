
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

interface OptionSelectorProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({ label, options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="relative group" ref={ref}>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full cursor-pointer flex items-center justify-between bg-black/30 border rounded-xl py-3 px-3 text-left transition-all duration-200 ${isOpen ? 'border-purple-500/50 ring-1 ring-purple-500/20 bg-black/50' : 'border-white/10 hover:border-white/20 hover:bg-black/40'}`}
      >
        <span className="block truncate text-sm text-gray-200 font-medium">{selected}</span>
        <span className="pointer-events-none flex items-center">
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
        </span>
      </button>

      {/* Changed back to absolute positioning for "full over" overlay behavior */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-[#111] border border-white/10 shadow-2xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Increased max-height to 64 (16rem) to show more items without scrolling */}
          <ul className="max-h-64 overflow-auto custom-scrollbar py-1">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className={`relative cursor-pointer select-none py-2.5 pl-3 pr-9 text-sm transition-colors ${option === selected ? 'bg-purple-500/20 text-purple-300 font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
              >
                <span className="block truncate">{option}</span>
                {option === selected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-purple-400">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
