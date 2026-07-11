import React, { useEffect, useRef, useState } from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import { UserPlus, X } from 'lucide-react';
import { posService } from '@/features/pos/services/posService';

export default function RegisterModal({ onClose }) {
    useEscapeClose(onClose);
    const nameRef = useRef(null);
    const phoneRef = useRef(null);
    const emailRef = useRef(null);
    const cityRef = useRef(null);
    const dateRef = useRef(null);
    const addressRef = useRef(null);
    const submitRef = useRef(null);

    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextRef?.current?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await posService.createCustomer(formData);
            alert("New Customer Registered Successfully!");
            onClose();
        } catch {
            alert("Failed to register customer.");
        }
        setLoading(false);
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
            <div className="bg-white w-96 rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-blue-900 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5" /> New Customer</h3>
                    <button onClick={onClose} className="text-blue-300 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                        <input
                            ref={nameRef}
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                        <input
                            ref={phoneRef}
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                            placeholder="07XXXXXXXX"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, emailRef)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                        <input
                            ref={emailRef}
                            type="email"
                            required
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, cityRef)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                            <input
                                ref={cityRef}
                                type="text"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Colombo"
                                value={formData.city || ''}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, dateRef)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                            <input
                                ref={dateRef}
                                type="date"
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                value={formData.dateOfBirth || ''}
                                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, addressRef)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                        <textarea
                            ref={addressRef}
                            rows="2"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                            placeholder="123, Main Street..."
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    submitRef.current?.focus();
                                }
                            }}
                        ></textarea>
                    </div>
                    <button
                        ref={submitRef}
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded font-bold text-sm hover:bg-blue-700 shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 outline-none"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
