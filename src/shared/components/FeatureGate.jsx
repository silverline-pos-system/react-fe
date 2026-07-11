import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock, ShieldX, Crown, X, ArrowRight } from "lucide-react";
import { useFeatures } from "@/context/FeatureContext";

export default function FeatureGate({ featureCode, featureName, children, className = "" }) {
    const { isFeatureActive } = useFeatures();
    const [showPopup, setShowPopup] = useState(false);

    const active = isFeatureActive(featureCode);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && showPopup) {
                setShowPopup(false);
            }
        };
        if (showPopup) {
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showPopup]);

    if (active) {
        return <>{children}</>;
    }

    return (
        <>
            <div
                className={`relative cursor-not-allowed ${className}`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPopup(true);
                }}
                title={`${featureName || featureCode} — Premium Feature (Locked)`}
            >
                <div className="pointer-events-none opacity-40 grayscale select-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <Lock size={14} className="text-gray-400" />
                </div>
            </div>

            {/* Purchase Required Popup */}
            {showPopup &&
                createPortal(
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
                        onClick={() => setShowPopup(false)}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                            style={{ animation: "featurePopIn 0.3s ease" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-white">
                                    <Crown size={22} />
                                    <h2 className="text-lg font-bold">Premium Feature</h2>
                                </div>
                                <button
                                    onClick={() => setShowPopup(false)}
                                    className="text-white/80 hover:text-white transition"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6 text-center">
                                <div className="inline-flex p-4 rounded-2xl bg-amber-100 mb-4">
                                    <ShieldX size={40} className="text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {featureName || featureCode}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    This feature is not included in your current plan.
                                    Please contact your system administrator to activate this premium module.
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowPopup(false)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                                    >
                                        <Crown size={16} />
                                        Contact Admin to Upgrade
                                        <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowPopup(false)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            <style>{`
        @keyframes featurePopIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </>
    );
}
