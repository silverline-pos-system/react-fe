import React, { useState } from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import { X, Tv, MapPin, Phone, User, CheckCircle2 } from 'lucide-react';
import { servicesService } from '@/shared/services/servicesService';

export default function DtvRequestModal({ onClose, branchId, onNotify, onAddToCart }) {
    useEscapeClose(onClose);
    const [formData, setFormData] = useState({
        customerName: '',
        contactNo: '',
        altContactNo: '',
        address: '',
        serviceType: 'DTV_INSTALLATION',
        installationRequired: true,
        serviceCharge: '',
        paymentOk: false,
        advancePayment: '',
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate Contact Number (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.contactNo)) {
            onNotify('error', 'Validation Error', 'Contact number must be exactly 10 digits (e.g., 0712345678).');
            return;
        }

        if (formData.altContactNo && !phoneRegex.test(formData.altContactNo)) {
            onNotify('error', 'Validation Error', 'Alternative contact number must be exactly 10 digits (e.g., 0712345678).');
            return;
        }

        setIsSubmitting(true);

        try {
            // Get user id from localStorage
            let userId = null;
            try {
                const userObj = JSON.parse(localStorage.getItem('user'));
                userId = userObj?.id || userObj?.userId;
            } catch {
                userId = null;
            }

            // Determine the amount to be collected RIGHT NOW at POS
            let amountToCollect = 0;
            
            if (formData.paymentOk) {
                // If Full Payment checked, we collect the Service Charge
                amountToCollect = parseFloat(formData.serviceCharge); 
            } else {
                // If NOT Full Payment, we collect the Advance Payment
                amountToCollect = parseFloat(formData.advancePayment);
            }

            // Treat NaN as 0
            if (isNaN(amountToCollect) || amountToCollect <= 0) {
                 amountToCollect = 0;
            }

            const shouldAddToCart = amountToCollect > 0;
            const isNoPayment = !shouldAddToCart;

            let paymentStatus = 'UNPAID';
            if (shouldAddToCart) {
                paymentStatus = formData.paymentOk ? 'FULLY_PAID' : 'PARTIAL_ADVANCE';
            }

            const customNotes = {
                specialInstructions: formData.notes,
                altContactNo: formData.altContactNo,
                paymentStatus: paymentStatus,
                paidAmount: amountToCollect
            };

            const dtvPayload = {
                ...formData,
                notes: JSON.stringify(customNotes),
                altContactNo: '', // Intentionally nullified so backend doesn't double-append
                paymentOk: null, // Intentionally nullified so backend doesn't double-append
                advancePayment: null, // Intentionally nullified so backend doesn't double-append
                serviceCharge: formData.serviceCharge ? parseFloat(formData.serviceCharge) : null,
                branchId: branchId || 1,
                createdBy: userId
            };

            if (typeof onAddToCart === 'function' && shouldAddToCart) {
                // POS Mode: Add service to cart for deferred submission after payment
                // Use a dynamic ID to prevent inventory lookup collision
                onAddToCart({
                    id: `DTV-${Date.now()}`,
                    name: `DTV Service - ${formData.serviceType.replace(/_/g, ' ')} (${formData.customerName})`,
                    price: amountToCollect,
                    qty: 1,
                    isService: true,
                    dtvData: dtvPayload
                });
                onNotify('success', 'DTV Request Queued', `Service request for ${formData.customerName} added to cart. It will be sent after payment is completed.`);
            } else {
                // Manager Mode OR POS Mode (Request w/ no payment): Submit directly to backend
                await servicesService.createDtvService(dtvPayload);
                const msg = isNoPayment
                    ? `Request for ${formData.customerName} submitted directly to technician pool without payment.`
                    : `Service request for ${formData.customerName} has been submitted to technician pool.`;
                onNotify('success', 'DTV Request Created', msg);
            }

            setTimeout(() => {
                onClose();
            }, 300);
        } catch (error) {
            console.error('Failed to submit DTV request:', error);
            onNotify('error', 'Request Failed', 'Failed to create the DTV service request.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Tv className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">DTV Service Request</h2>
                            <p className="text-blue-100 text-xs mt-0.5">Log new installation or repair</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 overflow-y-auto bg-slate-50 flex-1">
                    <form id="dtvForm" onSubmit={handleSubmit} className="space-y-6">

                        {/* Service Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Service Details</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Service Type</label>
                                    <select
                                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={formData.serviceType}
                                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    >
                                        <option value="DTV_INSTALLATION">New Connection / Installation</option>
                                        <option value="DTV_SECOND_CONNECTION">Secondary Connection</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Customer Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mt-2">Customer Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Customer Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="John Doe"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                            value={formData.customerName}
                                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Contact Number <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            required
                                            type="tel"
                                            placeholder="07XXXXXXXX"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                            value={formData.contactNo}
                                            onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.getElementById('dtv-alt-contact')?.focus();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Alternative Contact No</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            id="dtv-alt-contact"
                                            type="tel"
                                            placeholder="07XXXXXXXX (Optional)"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                            value={formData.altContactNo}
                                            onChange={(e) => setFormData({ ...formData, altContactNo: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Installation / Service Address <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                        <textarea
                                            required
                                            rows="2"
                                            placeholder="123 Main St, City"
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Special Instructions (Optional)</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Call before coming, Beware of dog..."
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Details Section */}
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Payment Details</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Standard Service Charge (LKR)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 3500"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                        value={formData.serviceCharge}
                                        onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col justify-end gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            checked={formData.paymentOk}
                                            onChange={(e) => setFormData({ ...formData, paymentOk: e.target.checked, advancePayment: '' })}
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Fully Paid Upfront?</span>
                                    </label>
                                </div>
                                {!formData.paymentOk && (
                                    <div className="col-span-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-4 items-center">
                                        <label className="text-sm font-semibold text-slate-700 shrink-0">Advance Payment Collected:</label>
                                        <input
                                            type="number"
                                            placeholder="Enter Advance (LKR)"
                                            className="w-full px-4 py-2 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                                            value={formData.advancePayment}
                                            onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        form="dtvForm"
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2 group text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Request
                                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div >
        </div >
    );
}
