import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ShieldCheck,
    User,
    Lock,
    Loader2,
    Shield,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    KeyRound,
    Eye,
    EyeOff,
    MessageSquare,
} from "lucide-react";
import bgImage from "@/assets/images/registration-bg.png";
import { authService } from "@/features/auth/services/authService";
import { useSystemName } from '@/context/SystemNameContext';

const BackgroundWrapper = ({ children }) => (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img src={bgImage} alt="Background" className="w-full h-full object-cover blur-sm scale-110" />
            <div className="absolute inset-0 bg-brand-deep/80 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 w-full flex justify-center">
            {children}
        </div>
    </div>
);

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { systemName } = useSystemName();
    const [step, setStep] = useState(1); // 1 = form, 2 = success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        newPassword: "",
        confirmPassword: "",
        reason: "",
    });

    const { username, newPassword, confirmPassword, reason } = formData;

    const onChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        if (error) setError("");
    };

    // Password strength checker
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: "", color: "" };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
        if (score <= 3) return { score, label: "Fair", color: "bg-orange-500" };
        if (score <= 4) return { score, label: "Good", color: "bg-yellow-500" };
        return { score, label: "Strong", color: "bg-emerald-500" };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            setError("Username is required.");
            return;
        }
        if (!newPassword) {
            setError("New password is required.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await authService.forgotPassword({
                username: username.trim(),
                newPassword,
                reason: reason.trim() || "Password reset requested",
            });
            setStep(2);
        } catch (err) {
            setError(err.message || "Failed to submit request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Success Screen
    if (step === 2) {
        return (
            <BackgroundWrapper>
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-10 text-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand to-emerald-400"></div>

                    <div className="mb-8 relative">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto relative z-10">
                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 mb-3">Request Submitted!</h2>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                        <p className="text-slate-600 leading-relaxed">
                            Your password reset request has been sent to the
                            <span className="inline-block px-2 py-0.5 mx-1.5 bg-blue-100 text-blue-600 font-bold rounded text-sm border border-blue-200">
                                System Administrator
                            </span>
                            for approval.
                        </p>
                        <p className="text-xs text-slate-400 mt-3">
                            You will receive an email notification once your request has been reviewed.
                            Once approved, you can log in with your new password.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 text-left">
                                <strong>Important:</strong> Do not share your new password with anyone. If you did not make this request, contact your administrator immediately.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/login")}
                        className="w-full group bg-slate-900 hover:bg-brand text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 hover:shadow-brand/25 transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </button>
                </div>
            </BackgroundWrapper>
        );
    }

    // Main Form
    return (
        <BackgroundWrapper>
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* SIDE BAR */}
                <div className="hidden md:flex w-5/12 bg-brand-deep p-8 flex-col justify-between text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck className="w-8 h-8" />
                            <span className="font-bold text-xl tracking-tight">{systemName}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Reset Password</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Submit a password reset request. Your new password will take effect once the system administrator approves it.
                        </p>
                    </div>

                    <div className="relative z-10 mt-auto">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                <div className="bg-blue-500/20 p-2 rounded-full">
                                    <KeyRound className="h-4 w-4 text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">Secure Process</p>
                                    <p className="text-xs text-slate-400">Password is encrypted before storage.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                <div className="bg-emerald-500/20 p-2 rounded-full">
                                    <Shield className="h-4 w-4 text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">Admin Approved</p>
                                    <p className="text-xs text-slate-400">Requires administrator verification.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-brand/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-brand/20 rounded-full blur-xl"></div>
                </div>

                {/* FORM AREA */}
                <div className="w-full md:w-7/12 p-8 md:p-10 bg-pos-bg">
                    <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="w-6 h-6 text-brand" />
                        <h3 className="text-2xl font-bold text-pos-text">Forgot Password</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-6">
                        Enter your username and choose a new password. The request will be sent to admin for approval.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">

                        {/* Username */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-brand group-focus-within:scale-110" />
                                <input
                                    type="text"
                                    name="username"
                                    value={username}
                                    onChange={onChange}
                                    required
                                    placeholder="Enter your username"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-brand group-focus-within:scale-110" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={onChange}
                                    required
                                    placeholder="Choose a new password"
                                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand transition-all text-sm font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Password Strength */}
                            {newPassword && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-semibold ${passwordStrength.score <= 2 ? "text-red-500" :
                                            passwordStrength.score <= 3 ? "text-orange-500" :
                                                passwordStrength.score <= 4 ? "text-yellow-600" : "text-emerald-600"
                                        }`}>
                                        {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-brand group-focus-within:scale-110" />
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={onChange}
                                    required
                                    placeholder="Re-enter new password"
                                    className={`w-full pl-10 pr-12 py-3 bg-white border rounded-lg focus:outline-none transition-all text-sm font-mono ${confirmPassword && confirmPassword !== newPassword
                                            ? "border-red-400 focus:border-red-500"
                                            : confirmPassword && confirmPassword === newPassword
                                                ? "border-emerald-400 focus:border-emerald-500"
                                                : "border-slate-300 focus:border-brand"
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-xs text-red-500 mt-1 font-medium">Passwords don't match</p>
                            )}
                            {confirmPassword && confirmPassword === newPassword && (
                                <p className="text-xs text-emerald-500 mt-1 font-medium flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        {/* Reason (Optional) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Reason <span className="text-slate-300 normal-case">(Optional)</span>
                            </label>
                            <div className="relative group">
                                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-brand group-focus-within:scale-110" />
                                <input
                                    type="text"
                                    name="reason"
                                    value={reason}
                                    onChange={onChange}
                                    placeholder="e.g., Forgot my password"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || (confirmPassword && confirmPassword !== newPassword)}
                            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl shadow-lg mt-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Reset Request"}
                        </button>

                        <div className="h-px bg-slate-200 my-4"></div>

                        <div className="text-center">
                            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-brand transition-colors flex items-center justify-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </BackgroundWrapper>
    );
}
