import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Award, Mail, X, Gift, AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import api from "../../services/api";
import useEscapeClose from '../../hooks/useEscapeClose';

export default function LoyaltyRedeemModal({ isOpen, onClose, customer, onRedeemSuccess, onNotify }) {
    useEscapeClose(onClose, isOpen);
    const [step, setStep] = useState(1); // 1: Input Points, 2: Verification, 3: Success
    const [pointsToRedeem, setPointsToRedeem] = useState("");
    const [otp, setOtp] = useState("");
    const [discountValue, setDiscountValue] = useState(0);
    const [loading, setLoading] = useState(false);

    const otpRef = useRef(null);
    const pointsRef = useRef(null);

    // Auto-focus inputs
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPointsToRedeem("");
            setOtp("");
            setDiscountValue(0);
            setTimeout(() => pointsRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    if (!customer) {
        return createPortal(
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
                    <div className="mx-auto bg-amber-100 text-amber-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No Customer Selected</h2>
                    <p className="text-slate-500 mb-6">You must select or attach a customer to the bill before redeeming loyalty points.</p>
                    <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition text-slate-700">Close</button>
                </div>
            </div>,
            document.body
        );
    }

    const availablePoints = customer?.loyaltyPoints || customer?.loyalty_points || 0;

    const handleSendCode = async () => {
        const points = parseInt(pointsToRedeem, 10);
        if (isNaN(points) || points < 100) {
            onNotify('error', 'Invalid Amount', 'Minimum 100 points required to redeem.');
            return;
        }
        if (points > availablePoints) {
            onNotify('error', 'Insufficient Points', `Customer only has ${availablePoints} points available.`);
            return;
        }

        setLoading(true);
        try {
            await api.post("/v1/pos/customers/loyalty/request-redeem", {
                customerId: customer.id || customer.customerId,
                pointsToRedeem: points
            });
            onNotify('success', 'Code Sent', 'Verification code sent to customer email.');
            setStep(2);
            setTimeout(() => otpRef.current?.focus(), 100);
        } catch (error) {
            console.error("Redeem Request Error:", error);
            const msg = error.response?.data?.message || "Failed to send code.";
            onNotify('error', 'Request Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!otp || otp.length < 4) {
            onNotify('error', 'Validation', 'Please enter a valid 4-digit code.');
            return;
        }

        const points = parseInt(pointsToRedeem, 10);
        setLoading(true);
        try {
            const res = await api.post("/v1/pos/customers/loyalty/verify-redeem", {
                customerId: customer.id || customer.customerId,
                pointsToRedeem: points,
                otpCode: otp
            });

            const value = res.data?.data?.discountValue || points;
            setDiscountValue(value);
            setStep(3); // Success step
        } catch (error) {
            console.error("Redeem Verify Error:", error);
            const msg = error.response?.data?.message || "Verification failed.";
            onNotify('error', 'Verification Failed', msg);
            setOtp("");
            setTimeout(() => otpRef.current?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    const finishRedemption = () => {
        onRedeemSuccess(discountValue); // Apply the discount to the POS
        onClose();
    };

    const handlePresetPick = (amount) => {
        setPointsToRedeem(amount.toString());
        pointsRef.current?.focus();
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             style={{ animation: 'modalFadeIn 0.2s ease-out' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden relative" 
                 style={{ animation: 'modalSlideUp 0.25s ease-out' }}>

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold tracking-wide text-lg leading-tight">Redeem Points</h3>
                            <p className="text-purple-100 text-xs font-medium">{customer.name || customer.customerName}</p>
                        </div>
                    </div>
                    {(step !== 3 && !loading) && (
                        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition" title="Close (Esc)">
                            <X className="w-5 h-5 text-white/90" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 bg-slate-50">
                    {/* Step 1: Request */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-slate-500 text-xs uppercase tracking-wider block mb-1">Available Points</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-purple-700">{availablePoints.toLocaleString()}</span>
                                        <span className="text-sm font-bold text-purple-400">PTS</span>
                                    </div>
                                </div>
                            </div>

                            {availablePoints < 100 && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    Customer needs a minimum of 100 points to redeem.
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Points to Redeem</label>
                                <div className="relative">
                                    <input
                                        ref={pointsRef}
                                        type="number"
                                        value={pointsToRedeem}
                                        onChange={(e) => setPointsToRedeem(e.target.value)}
                                        placeholder="Min 100"
                                        min="100"
                                        max={availablePoints}
                                        disabled={availablePoints < 100 || loading}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && availablePoints >= 100) handleSendCode();
                                        }}
                                        className="w-full pl-5 pr-16 py-4 font-mono text-3xl font-black text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all disabled:opacity-50"
                                    />
                                    <button 
                                        onClick={() => handlePresetPick(availablePoints)}
                                        disabled={availablePoints < 100 || loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                    >
                                        ALL
                                    </button>
                                </div>
                            </div>

                            {/* Preset Buttons */}
                            {availablePoints >= 100 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {[100, 500, 1000, 2000].map(amt => (
                                        <button 
                                            key={amt}
                                            onClick={() => handlePresetPick(amt)}
                                            disabled={availablePoints < amt || loading}
                                            className="py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:border-purple-400 hover:text-purple-700 disabled:opacity-30 disabled:hover:border-slate-200 transition"
                                        >
                                            {amt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleSendCode}
                                disabled={loading || availablePoints < 100 || !pointsToRedeem || parseInt(pointsToRedeem, 10) < 100 || parseInt(pointsToRedeem, 10) > availablePoints}
                                className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-lg tracking-wide rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 transition-all"
                            >
                                {loading ? "Sending..." : "Send Verification Code"}
                                {!loading && <Mail className="w-5 h-5 ml-1" />}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Verify */}
                    {step === 2 && (
                        <div className="space-y-4 text-center">
                            <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-200 text-sm font-medium mb-4 flex items-center justify-center gap-2">
                                <Mail className="w-5 h-5" /> Code sent to customer's email.
                            </div>

                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Enter 4-Digit Code</label>
                            <input
                                ref={otpRef}
                                type="text"
                                maxLength={4}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only allow numbers
                                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                                placeholder="----"
                                disabled={loading}
                                className="w-3/4 mx-auto p-4 text-center text-3xl font-mono font-black tracking-[0.5em] bg-white border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none disabled:opacity-50 transition-all"
                            />

                            <button
                                onClick={handleVerifyCode}
                                disabled={loading || otp.length < 4}
                                className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-lg tracking-wide rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 transition-all"
                            >
                                {loading ? "Verifying..." : "Verify & Redeem"}
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                disabled={loading}
                                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition underline decoration-dotted mt-4 block mx-auto"
                            >
                                ← Go Back
                            </button>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-6 px-4">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 relative shadow-inner">
                                <CheckCircle className="w-10 h-10 animate-scale-in" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Success!</h2>
                            <p className="text-slate-500 font-medium mb-6">
                                Points successfully verified and deducted.
                            </p>

                            <div className="bg-white rounded-xl p-5 border-2 border-emerald-100 mb-8 shadow-sm">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-500 mb-2">
                                    <span>Points Deducted:</span>
                                    <span className="text-slate-800">{pointsToRedeem} PTS</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-slate-500 pt-2 border-t border-slate-100">
                                    <span>Discount Value:</span>
                                    <span className="text-2xl font-black text-emerald-600">LKR {discountValue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <button
                                onClick={finishRedemption}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                            >
                                Apply Discount to Cart <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes scaleIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>,
        document.body
    );
}
