import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldAlert, Loader2, X, Lock, Eye, EyeOff } from "lucide-react";
import useEscapeClose from "@/hooks/useEscapeClose";

export default function AdminPasswordModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    description = "This action requires admin password verification.",
    actionLabel = "Confirm",
    loading = false,
}) {
    useEscapeClose(onClose, isOpen);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError("Password is required");
            return;
        }
        setError("");
        onConfirm(password);
    };

    const handleClose = () => {
        setPassword("");
        setError("");
        setShowPassword(false);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[400] p-4" onClick={handleClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: "modalSlideIn 0.25s ease-out" }}
            >
                <div className="bg-gradient-to-r from-red-500 via-red-600 to-rose-600 p-5 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
                        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <ShieldAlert size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{title}</h3>
                                <p className="text-red-200 text-xs">Security Verification Required</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <ShieldAlert size={16} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-red-800 font-medium">⚠️ Destructive Action</p>
                                <p className="text-xs text-red-600 mt-1 leading-relaxed">{description}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                            <Lock size={14} className="text-slate-500" />
                            Enter Admin Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                placeholder="Enter your admin password..."
                                className={`w-full px-4 py-3 pr-12 rounded-xl border-2 outline-none transition-all duration-200 text-sm font-medium ${error
                                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                        : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white"
                                    }`}
                                autoFocus
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {error && (
                            <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium">
                                <span className="w-1 h-1 bg-red-500 rounded-full" />
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password.trim()}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <ShieldAlert size={16} />
                                    {actionLabel}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </div>,
        document.body
    );
}
