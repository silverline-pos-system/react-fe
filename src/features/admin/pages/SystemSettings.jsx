import { useState, useEffect } from "react";
import {
    Loader2, Save, Edit3, CheckCircle2, Type,
    AlertTriangle, Sparkles, RotateCcw
} from "lucide-react";
import { getSystemName, updateSystemName } from "../services/adminApi";
import { useSystemName } from "@/context/SystemNameContext";

export default function SystemSettings() {
    const { refreshSystemName } = useSystemName();

    const [currentName, setCurrentName] = useState("");
    const [editName, setEditName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchName();
    }, []);

    async function fetchName() {
        try {
            setLoading(true);
            const data = await getSystemName();
            const name = data.data?.systemName || "SmartRetail Pro";
            setCurrentName(name);
            setEditName(name);
        } catch {
            setError("Failed to load system name");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!editName.trim()) {
            setError("System name cannot be empty");
            return;
        }
        if (editName.trim() === currentName) {
            setIsEditing(false);
            return;
        }

        try {
            setSaving(true);
            setError("");
            await updateSystemName(editName.trim());
            setCurrentName(editName.trim());
            setIsEditing(false);
            setSuccess("System name updated successfully! Changes will reflect across all modules.");
            refreshSystemName(); // Update global context
            setTimeout(() => setSuccess(""), 5000);
        } catch (err) {
            const msg = err?.response?.data?.message || "Failed to update system name";
            setError(msg);
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setEditName(currentName);
        setIsEditing(false);
        setError("");
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={28} />
                    System Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Customize the system identity. Changes apply across all modules, headers, and reports.
                </p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl border border-green-200"
                    style={{ animation: "fadeIn 0.3s ease" }}>
                    <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                    <span className="text-sm font-medium text-green-800">{success}</span>
                </div>
            )}

            {/* System Name Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center gap-3">
                    <Type size={20} className="text-white" />
                    <h2 className="text-white font-bold">System Name / Company Name</h2>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                        This name appears in all sidebars, login screens, receipts, reports, and email notifications.
                        Changing this will update the branding throughout the entire application.
                    </p>

                    {/* Current Name Display */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">
                            Current System Name
                        </div>
                        <div className="text-2xl font-extrabold text-gray-900">
                            {currentName}
                        </div>
                    </div>

                    {/* Edit Section */}
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                        >
                            <Edit3 size={16} />
                            Change System Name
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">
                                    New System Name
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter new system name..."
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-semibold transition"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                />
                            </div>

                            {/* Preview */}
                            {editName.trim() && editName.trim() !== currentName && (
                                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">
                                        Preview
                                    </div>
                                    <div className="text-xl font-extrabold text-blue-900">
                                        {editName.trim()}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                                >
                                    <RotateCcw size={14} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !editName.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
