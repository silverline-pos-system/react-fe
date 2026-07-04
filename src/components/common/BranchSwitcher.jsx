import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, Building2 } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';

export default function BranchSwitcher() {
  const { selectedBranchId, branches, currentBranchName, switchBranch } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!branches || branches.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
        <Store size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">{currentBranchName || 'Main Branch'}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 border ${
          isOpen 
            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}
      >
        <div className={`p-1 rounded-md ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
          <Store size={14} />
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Selected Branch</span>
          <span className="text-sm font-bold">{currentBranchName}</span>
        </div>
        <ChevronDown size={16} className={`ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 border-b border-slate-50 mb-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Switch Branch</h3>
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {branches.map((branch) => {
              const bId = branch.id || branch.branchId;
              const isSelected = String(bId) === String(selectedBranchId);
              
              return (
                <button
                  key={bId}
                  onClick={() => {
                    switchBranch(bId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Building2 size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {branch.name || branch.branchName}
                      </span>
                      <span className="text-[10px] text-slate-400">{branch.location || branch.code}</span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
