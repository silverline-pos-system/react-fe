import React, { useEffect } from 'react';
import { X, Construction, Rocket, Bell, Clock } from 'lucide-react';
import useEscapeClose from '@/hooks/useEscapeClose';

export default function CampaignConfigModal({ onClose }) {
    useEscapeClose(onClose);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">

                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-deep to-brand"></div>
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative pt-10 px-8 pb-8 text-center">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 rounded-full p-2"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon */}
                    <div className="w-24 h-24 bg-white rounded-full mx-auto shadow-xl flex items-center justify-center mb-6 relative z-10 border-4 border-white">
                        <Rocket size={40} className="text-brand animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Campaign Manager</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                        <Construction size={12} /> Under Development
                    </div>

                    <p className="text-slate-500 mb-8 leading-relaxed">
                        We're currently building a powerful engine to manage loyalty campaigns, automated rewards, and targeted offers.
                        <br />Get ready to boost customer engagement like never before!
                    </p>

                    {/* Feature Sneak Peek */}
                    <div className="grid grid-cols-2 gap-4 text-left mb-8">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                                <Bell size={16} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1">Automated Alerts</h4>
                            <p className="text-xs text-slate-400">Trigger notifications based on spending habits.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                <Clock size={16} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1">Seasonal Offers</h4>
                            <p className="text-xs text-slate-400">Schedule doubling point events in advance.</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/30 hover:bg-brand-hover hover:shadow-brand/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Got it, I'll wait!
                    </button>

                </div>
            </div>
        </div>
    );
}
