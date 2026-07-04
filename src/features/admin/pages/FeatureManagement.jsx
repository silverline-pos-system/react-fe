import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Shield, ShieldCheck, ShieldX, Zap, Crown, Lock,
    Loader2, X, Mail, CheckCircle2, AlertTriangle,
    ShoppingCart, Package, BarChart3, Heart, Wrench,
    Calendar, PieChart, Calculator, Settings, Sparkles
} from "lucide-react";
import {
    getAllFeatures,
    requestFeatureToggle,
    requestBulkFeatureToggle,
    verifyFeatureToggle,
    verifyBulkFeatureToggle,
} from "../services/adminApi";
import { useFeatures } from "@/context/FeatureContext";

// Feature icon mapping
const FEATURE_ICONS = {
    SIMPLE_POS: ShoppingCart,
    SIMPLE_INVENTORY: Package,
    SIMPLE_MANAGER: BarChart3,
    POS_LOYALTY: Heart,
    POS_SERVICE_REPAIRS: Wrench,
    INVENTORY_EXPIRE_CALENDAR: Calendar,
    MANAGER_LOYALTY: Crown,
    SALES_REPORTS: PieChart,
    MANAGER_ACCOUNTING: Calculator,
    ALLOW_OUT_OF_STOCK: Package,
};

// Feature descriptions
const FEATURE_DESCRIPTIONS = {
    SIMPLE_POS: "Basic point-of-sale flow without stock quantity validation",
    SIMPLE_INVENTORY: "Core inventory management with stock tracking and Dispatch",
    SIMPLE_MANAGER: "Basic manager dashboard with approvals and branch overview",
    POS_LOYALTY: "Customer loyalty program integration at POS checkout",
    POS_SERVICE_REPAIRS: "Mobile repair and DTV service management at POS",
    INVENTORY_EXPIRE_CALENDAR: "Calendar view for tracking product expiry dates",
    MANAGER_LOYALTY: "Loyalty program management and configuration panel",
    SALES_REPORTS: "Comprehensive sales analytics, trends, and reporting",
    MANAGER_ACCOUNTING: "Chart of accounts, journal entries, and profit/loss",
    ALLOW_OUT_OF_STOCK: "Allow cashiers to process and finalize sales even when product stock is empty or negative",
};

export default function FeatureManagement() {
    const { refetchFeatures } = useFeatures();

    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // OTP Modal State
    const [otpModal, setOtpModal] = useState({
        open: false,
        featureCode: "",
        featureCodes: [],
        featureName: "",
        targetCount: 0,
        isBulk: false,
        action: "",
        step: "confirm",
        message: "",
        error: "",
    });
    const [verificationKey, setVerificationKey] = useState("");
    const verifyInputRef = useRef(null);

    useEffect(() => {
        fetchFeatures();
    }, []);

    async function fetchFeatures() {
        try {
            setLoading(true);
            const data = await getAllFeatures();
            setFeatures(data || []);
        } catch (err) {
            console.error("Failed to load features:", err);
            setError("Failed to load feature configuration");
        } finally {
            setLoading(false);
        }
    }

    function handleToggleClick(feature) {
        const action = feature.isActive ? "DEACTIVATE" : "ACTIVATE";
        setVerificationKey("");
        setOtpModal({
            open: true,
            featureCode: feature.featureCode,
            featureCodes: [feature.featureCode],
            featureName: feature.featureName,
            targetCount: 1,
            isBulk: false,
            action,
            step: "confirm",
            message: "",
            error: "",
        });
    }

    function handleBulkToggleClick() {
        const allActive = premiumFeatures.length > 0 && premiumFeatures.every((f) => f.isActive);
        const action = allActive ? "DEACTIVATE" : "ACTIVATE";
        const targets = premiumFeatures.filter((f) => (action === "ACTIVATE" ? !f.isActive : f.isActive));

        if (targets.length === 0) {
            return;
        }

        setVerificationKey("");
        setOtpModal({
            open: true,
            featureCode: "",
            featureCodes: targets.map((f) => f.featureCode),
            featureName: "all premium features",
            targetCount: targets.length,
            isBulk: true,
            action,
            step: "confirm",
            message: "",
            error: "",
        });
    }

    async function handleSendOtp() {
        setOtpModal((prev) => ({ ...prev, step: "sending", error: "" }));
        try {
            const result = otpModal.isBulk
                ? await requestBulkFeatureToggle(otpModal.featureCodes, otpModal.action)
                : await requestFeatureToggle(otpModal.featureCode, otpModal.action);
            setOtpModal((prev) => ({
                ...prev,
                step: "otpInput",
                message: result.message || "Verification code sent to your email",
            }));
            setTimeout(() => verifyInputRef.current?.focus(), 100);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to send verification code";
            setOtpModal((prev) => ({ ...prev, step: "confirm", error: msg }));
        }
    }

    async function handleVerifyOtp() {
        if (!verificationKey || verificationKey.length < 5) {
            setOtpModal((prev) => ({
                ...prev,
                error: "Please enter the verification code",
            }));
            return;
        }

        setOtpModal((prev) => ({ ...prev, step: "verifying", error: "" }));
        try {
            if (otpModal.isBulk) {
                await verifyBulkFeatureToggle(otpModal.featureCodes, otpModal.action, verificationKey);
            } else {
                await verifyFeatureToggle(otpModal.featureCode, otpModal.action, verificationKey);
            }
            setOtpModal((prev) => ({
                ...prev,
                step: "success",
                message: prev.isBulk
                    ? `${prev.targetCount} premium feature${prev.targetCount > 1 ? "s" : ""} ${prev.action.toLowerCase()}d successfully!`
                    : `Feature "${prev.featureName}" has been ${prev.action.toLowerCase()}d successfully!`,
            }));
            fetchFeatures();
            refetchFeatures();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Verification failed";
            setOtpModal((prev) => ({ ...prev, step: "otpInput", error: msg }));
            setVerificationKey("");
            setTimeout(() => verifyInputRef.current?.focus(), 100);
        }
    }

    function closeOtpModal() {
        setOtpModal({
            open: false,
            featureCode: "",
            featureCodes: [],
            featureName: "",
            targetCount: 0,
            isBulk: false,
            action: "",
            step: "confirm",
            message: "",
            error: "",
        });
        setVerificationKey("");
    }

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Escape' && otpModal.open) {
                closeOtpModal();
            }
        };
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [otpModal.open]);

    useEffect(() => {
        if (!otpModal.open) return;

        const handleEnterKey = (e) => {
            if (e.key !== "Enter") return;
            const tag = document.activeElement?.tagName;
            if (tag === "TEXTAREA") return;

            if (otpModal.step === "confirm") {
                e.preventDefault();
                handleSendOtp();
                return;
            }

            if (otpModal.step === "otpInput") {
                e.preventDefault();
                handleVerifyOtp();
                return;
            }

            if (otpModal.step === "success") {
                e.preventDefault();
                closeOtpModal();
            }
        };

        document.addEventListener("keydown", handleEnterKey);
        return () => document.removeEventListener("keydown", handleEnterKey);
    }, [otpModal.open, otpModal.step, verificationKey]);

    const premiumFeatures = features.filter(
        (f) => f.featureCategory === "PREMIUM"
    );
    const allPremiumActive = premiumFeatures.length > 0 && premiumFeatures.every((f) => f.isActive);
    const bulkTargetCount = allPremiumActive
        ? premiumFeatures.filter((f) => f.isActive).length
        : premiumFeatures.filter((f) => !f.isActive).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-red-500">
                <AlertTriangle className="mr-2" size={20} />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Settings className="text-blue-600" size={28} />
                        Feature Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Activate or deactivate system modules. Premium features require email
                        verification.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                    <Shield size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                        {premiumFeatures.filter((f) => f.isActive).length} / {premiumFeatures.length} Active
                    </span>
                </div>
            </div>

            {/* Premium Features */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Crown size={20} className="text-amber-500" />
                    <h2 className="text-lg font-bold text-gray-800">Premium Features</h2>
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Additional Payment
                    </span>
                    <button
                        type="button"
                        onClick={handleBulkToggleClick}
                        disabled={bulkTargetCount === 0}
                        className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${allPremiumActive
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                    >
                        {allPremiumActive ? "Disable All" : "Activate All"}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {premiumFeatures.map((feature) => (
                        <FeatureCard
                            key={feature.featureCode}
                            feature={feature}
                            onToggle={handleToggleClick}
                        />
                    ))}
                </div>
            </div>

            {/* ========== OTP Verification Modal ========== */}
            {otpModal.open &&
                createPortal(
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                        onClick={closeOtpModal}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            style={{ animation: "modalSlideIn 0.3s ease" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className={`px-6 py-4 flex items-center justify-between ${otpModal.action === "ACTIVATE"
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                                    : "bg-gradient-to-r from-red-500 to-rose-600"
                                    }`}
                            >
                                <div className="flex items-center gap-2 text-white">
                                    {otpModal.action === "ACTIVATE" ? (
                                        <Zap size={22} />
                                    ) : (
                                        <ShieldX size={22} />
                                    )}
                                    <h2 className="text-lg font-bold">
                                        {otpModal.action === "ACTIVATE" ? "Activate" : "Deactivate"}{" "}
                                        Feature
                                    </h2>
                                </div>
                                <button
                                    onClick={closeOtpModal}
                                    className="text-white/80 hover:text-white transition"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6">
                                {otpModal.step === "confirm" && (
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div
                                                className={`inline-flex p-4 rounded-2xl mb-3 ${otpModal.action === "ACTIVATE"
                                                    ? "bg-emerald-100"
                                                    : "bg-red-100"
                                                    }`}
                                            >
                                                {otpModal.action === "ACTIVATE" ? (
                                                    <ShieldCheck size={36} className="text-emerald-600" />
                                                ) : (
                                                    <ShieldX size={36} className="text-red-600" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {otpModal.action === "ACTIVATE"
                                                    ? "Activate"
                                                    : "Deactivate"}{" "}
                                                {otpModal.isBulk
                                                    ? `${otpModal.targetCount} premium feature${otpModal.targetCount > 1 ? "s" : ""}?`
                                                    : `"${otpModal.featureName}"?`}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-2">
                                                A verification code will be sent to your admin email
                                                address for security confirmation.
                                            </p>
                                        </div>

                                        {otpModal.error && (
                                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                                <span className="text-sm text-red-700">
                                                    {otpModal.error}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={closeOtpModal}
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSendOtp}
                                                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition ${otpModal.action === "ACTIVATE"
                                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                                    : "bg-red-600 hover:bg-red-700"
                                                    }`}
                                            >
                                                <Mail size={16} />
                                                Send Verification Code
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {otpModal.step === "sending" && (
                                    <div className="text-center py-8">
                                        <Loader2
                                            size={40}
                                            className="animate-spin text-blue-600 mx-auto mb-4"
                                        />
                                        <p className="font-medium text-gray-700">
                                            Sending verification code...
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Please wait while we send the code to your email
                                        </p>
                                    </div>
                                )}

                                {otpModal.step === "otpInput" && (
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className="inline-flex p-3 rounded-2xl bg-blue-100 mb-3">
                                                <Lock size={32} className="text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">Enter Verification Code</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {otpModal.message}
                                            </p>
                                        </div>

                                        <div className="my-4">
                                            <input
                                                ref={verifyInputRef}
                                                type="number"
                                                value={verificationKey}
                                                onChange={(e) => setVerificationKey(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleVerifyOtp();
                                                    if (e.key === "Escape") closeOtpModal();
                                                }}
                                                placeholder="Enter verification code..."
                                                className="w-full px-4 py-4 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                autoFocus
                                            />
                                        </div>

                                        {otpModal.error && (
                                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                                <span className="text-sm text-red-700">
                                                    {otpModal.error}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSendOtp}
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                                            >
                                                Resend Code
                                            </button>
                                            <button
                                                onClick={handleVerifyOtp}
                                                disabled={!verificationKey || verificationKey.length < 5}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Lock size={16} />
                                                Verify & {otpModal.action === "ACTIVATE" ? "Activate" : "Deactivate"}{otpModal.isBulk ? " All" : ""}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {otpModal.step === "verifying" && (
                                    <div className="text-center py-8">
                                        <Loader2
                                            size={40}
                                            className="animate-spin text-blue-600 mx-auto mb-4"
                                        />
                                        <p className="font-medium text-gray-700">
                                            Verifying code...
                                        </p>
                                    </div>
                                )}

                                {otpModal.step === "success" && (
                                    <div className="text-center py-4 space-y-4">
                                        <div className="inline-flex p-4 rounded-full bg-green-100 mb-2">
                                            <CheckCircle2 size={40} className="text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Success!
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {otpModal.message}
                                        </p>
                                        <button
                                            onClick={closeOtpModal}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold transition"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </div>
    );
}

function FeatureCard({ feature, onToggle }) {
    const Icon = FEATURE_ICONS[feature.featureCode] || Sparkles;
    const desc = FEATURE_DESCRIPTIONS[feature.featureCode] || "";
    const isPremium = feature.featureCategory === "PREMIUM";
    const isActive = feature.isActive;

    return (
        <div
            className={`relative bg-white rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-lg ${isActive
                ? "border-green-200 shadow-sm"
                : "border-gray-100 shadow-sm opacity-80"
                }`}
        >
            {isPremium && (
                <div className="absolute -top-2 -right-2">
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow ${isActive
                            ? "bg-amber-500 text-white"
                            : "bg-gray-200 text-gray-600"
                            }`}
                    >
                        <Crown size={10} />
                        Premium
                    </span>
                </div>
            )}

            <div className="flex items-start gap-4">
                <div
                    className={`p-3 rounded-xl shrink-0 transition-colors ${isActive
                        ? isPremium
                            ? "bg-amber-100 text-amber-600"
                            : "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                        }`}
                >
                    <Icon size={24} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">
                        {feature.featureName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{desc}</p>

                    {isActive && feature.activatedAt && (
                        <p className="text-[10px] text-green-600 mt-2">
                            Active since {feature.activatedAt.split(" ")[0]}
                            {feature.activatedByName && ` • by ${feature.activatedByName}`}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => onToggle(feature)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${isActive
                        ? "bg-green-500 shadow-inner"
                        : "bg-gray-300 shadow-inner"
                        }`}
                    title={isActive ? "Click to deactivate" : "Click to activate"}
                >
                    <span
                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isActive ? "left-[22px]" : "left-0.5"
                            }`}
                    />
                </button>
            </div>
        </div>
    );
}
