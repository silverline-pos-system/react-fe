import React from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import { Keyboard, X } from 'lucide-react';
import { SHORTCUT_GROUPS } from '@/features/pos/constants/shortcuts';

/**
 * Read-only keyboard shortcut reference. Content is driven entirely by
 * SHORTCUT_GROUPS so it can never drift from the documented behaviour.
 * Opened with `?` and closed with Escape or the close button.
 */
export default function ShortcutHelpModal({ onClose }) {
    useEscapeClose(onClose);

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold">Keyboard Shortcuts</h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close shortcut help"
                        className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SHORTCUT_GROUPS.map((group) => (
                        <div key={group.title}>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                {group.title}
                            </h4>
                            <ul className="space-y-1.5">
                                {group.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start justify-between gap-3 text-sm">
                                        <span className="text-slate-600 leading-tight flex-1">{item.label}</span>
                                        <span className="flex items-center gap-1 shrink-0">
                                            {item.keys.map((k, i) => (
                                                <kbd
                                                    key={i}
                                                    className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-700 text-[11px] font-mono font-bold shadow-sm"
                                                >
                                                    {k}
                                                </kbd>
                                            ))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
                    Press <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono">Esc</kbd> to close
                </div>
            </div>
        </div>
    );
}
