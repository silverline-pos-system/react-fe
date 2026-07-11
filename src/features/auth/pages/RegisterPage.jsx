import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    UserPlus, User, Mail, Lock, Phone,
    Loader2, AlertCircle, ShieldCheck
} from 'lucide-react';
import bgImage from "@/assets/images/registration-bg.png";
import { authService } from '@/features/auth/services/authService';
import { useSystemName } from '@/context/SystemNameContext';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/** Validation rules for each field */
const VALIDATION_RULES = {
    fullName: {
        required: true,
        minLength: 3,
        requiredMsg: "Full Name is required",
        minLengthMsg: "Must be at least 3 chars"
    },
    username: {
        required: true,
        minLength: 3,
        maxLength: 20,
        requiredMsg: "Username is required",
        minLengthMsg: "3-20 characters required",
        maxLengthMsg: "3-20 characters required"
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        requiredMsg: "Email is required",
        patternMsg: "Invalid email format"
    },
    password: {
        required: true,
        minLength: 6,
        requiredMsg: "Password is required",
        minLengthMsg: "Min 6 characters required"
    },
    confirmPassword: {
        required: true,
        requiredMsg: "Please confirm your password"
    },
    phone: {
        required: true,
        pattern: /^\+?[0-9]{10,15}$/,
        requiredMsg: "Phone is required",
        patternMsg: "Invalid phone format (10-15 digits)"
    }
};

/** Maps backend error field names to form field keys */
const BACKEND_FIELD_MAP = {
    EMAIL: "email",
    USERNAME: "username",
    PHONE: "phone",
    FULLNAME: "fullName",
    PASSWORD: "password"
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Background Wrapper
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate a single field against its rules
 * @param {string} name - Field name
 * @param {string} value - Field value
 * @returns {string} Error message (empty string if valid)
 */
const validateField = (name, value) => {
    const rules = VALIDATION_RULES[name];
    if (!rules) return "";

    // Check required
    if (rules.required && !value.trim()) {
        return rules.requiredMsg;
    }

    // Check minimum length
    if (rules.minLength && value.length < rules.minLength) {
        return rules.minLengthMsg;
    }

    // Check maximum length
    if (rules.maxLength && value.length > rules.maxLength) {
        return rules.maxLengthMsg;
    }

    // Check pattern (regex)
    if (rules.pattern && !rules.pattern.test(value)) {
        return rules.patternMsg;
    }

    return "";
};

/**
 * Parse backend error response and extract field-specific errors
 * Supports format: "FIELDNAME: error message"
 * @param {Object} error - Error object from axios
 * @returns {Object} { fieldName: errorMsg, isFieldError: boolean }
 */
const parseBackendError = (error) => {
    const backendMsg = error.response?.data?.message || error.message || "";

    // Try to parse "FIELD: message" format
    if (backendMsg.includes(": ")) {
        const [fieldKeyRaw, ...rest] = backendMsg.split(": ");
        const fieldKey = fieldKeyRaw.trim().toUpperCase();
        const msg = rest.join(": ").trim();

        const targetField = BACKEND_FIELD_MAP[fieldKey];

        if (targetField && msg) {
            return {
                fieldName: targetField,
                errorMsg: msg,
                isFieldError: true
            };
        }
    }

    // Fallback: return as general error
    return {
        errorMsg: backendMsg || "Registration failed. Please try again.",
        isFieldError: false
    };
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const { systemName } = useSystemName();
    const [loading, setLoading] = useState(false);

    // ————————— Form State —————————
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });

    // ————————— Error & Validation State —————————
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [generalError, setGeneralError] = useState("");

    // ————————— Event Handlers —————————

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field if it exists
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }

        // Clear confirm password mismatch when either password field changes
        if (name === 'password' && errors.confirmPassword === 'Passwords do not match') {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleBlur = async (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        } else if (name === 'confirmPassword' && value && value !== formData.password) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else if (name === "username" && value.trim().length >= 3) {
            try {
                const exists = await authService.checkUsername(value.trim());
                if (exists) {
                    setErrors(prev => ({ ...prev, username: "Username already exists" }));
                } else {
                    setErrors(prev => ({ ...prev, username: "" }));
                }
            } catch (err) {
                console.error("Error checking username availability:", err);
            }
        }
    };

    /**
     * Validate all fields and return combined errors
     * @returns {Object} { fieldName: errorMsg, ... }
     */
    const validateAllFields = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });
        // Cross-field: confirm password must match
        if (!newErrors.confirmPassword && formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError("");

        // Validate client-side first
        const validationErrors = validateAllFields();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
            return;
        }

        setLoading(true);

        try {
            // Check username duplication before submitting
            const exists = await authService.checkUsername(formData.username.trim());
            if (exists) {
                setErrors(prev => ({ ...prev, username: "Username already exists" }));
                setTouched(prev => ({ ...prev, username: true }));
                setLoading(false);
                return;
            }

            // Exclude confirmPassword from the API payload
            const { confirmPassword: _, ...registrationData } = formData;
            await authService.registerUser(registrationData);
            navigate('/login', { state: { registrationSuccess: true } });

        } catch (err) {
            // 🔍 DEV-only logging (only in development)
            if (import.meta.env.DEV) {
                console.error("[Registration Error]", err);
            }

            // Parse backend error response
            const parsedError = parseBackendError(err);

            if (parsedError.isFieldError) {
                // Set field-specific error and mark as touched
                setErrors(prev => ({ ...prev, [parsedError.fieldName]: parsedError.errorMsg }));
                setTouched(prev => ({ ...prev, [parsedError.fieldName]: true }));
            } else {
                // Set general error
                setGeneralError(parsedError.errorMsg);
            }

        } finally {
            setLoading(false);
        }
    };

    // ————————— UI Renderers —————————

    /**
     * Render a form input field with error state
     */
    const renderField = (fieldConfig) => {
        const { name, label, icon: Icon, type = "text", placeholder } = fieldConfig;
        const hasError = touched[name] && errors[name];

        return (
            <div key={name} className="relative mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    {label}
                </label>

                <div className="relative group">
                    <Icon className={`absolute left-3 top-3 w-5 h-5 ${
                        hasError 
                            ? 'text-red-400' 
                            : 'text-slate-400 group-focus-within:text-brand'
                    }`} />

                    <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={`w-full pl-10 pr-10 py-3 bg-white border rounded-lg text-sm focus:outline-none
                        ${hasError
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-slate-300 focus:border-brand'
                            }`}
                    />

                    {hasError && (
                        <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
                    )}
                </div>

                {hasError && (
                    <div className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500">
                        {errors[name]}
                    </div>
                )}
            </div>
        );
    };

    return (
        <BackgroundWrapper>
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex">

                {/* LEFT PANEL */}
                <div className="hidden md:flex w-4/12 bg-brand-deep p-8 flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck className="w-8 h-8" />
                            <span className="font-bold text-xl">{systemName}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Join the Team</h2>
                        <p className="text-slate-300 text-sm">
                            Create your account to access the system.
                        </p>
                    </div>
                    <div className="mt-auto text-xs text-slate-400">
                        Manager approval required
                    </div>
                </div>

                {/* FORM PANEL */}
                <div className="w-full md:w-8/12 p-8">
                    <div className="flex justify-between mb-6">
                        <h3 className="text-2xl font-bold">Register</h3>
                        <Link to="/login" className="text-sm text-brand font-bold">Login</Link>
                    </div>

                    {/* General Error Alert */}
                    {generalError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex gap-2 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{generalError}</span>
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6">

                        {/* Full Name (spans 2 cols) */}
                        <div className="col-span-2">
                            {renderField({
                                name: 'fullName',
                                label: 'Full Name',
                                icon: User,
                                type: 'text',
                                placeholder: 'John Doe'
                            })}
                        </div>

                        {/* Username */}
                        {renderField({
                            name: 'username',
                            label: 'Username',
                            icon: User,
                            type: 'text',
                            placeholder: 'johndoe'
                        })}

                        {/* Email */}
                        {renderField({
                            name: 'email',
                            label: 'Email',
                            icon: Mail,
                            type: 'email',
                            placeholder: 'john@email.com'
                        })}

                        {/* Password */}
                        {renderField({
                            name: 'password',
                            label: 'Password',
                            icon: Lock,
                            type: 'password',
                            placeholder: '•••••••'
                        })}

                        {/* Confirm Password */}
                        {renderField({
                            name: 'confirmPassword',
                            label: 'Confirm Password',
                            icon: Lock,
                            type: 'password',
                            placeholder: '•••••••'
                        })}

                        {/* Phone */}
                        {renderField({
                            name: 'phone',
                            label: 'Phone',
                            icon: Phone,
                            type: 'tel',
                            placeholder: '+947XXXXXXXX'
                        })}

                        {/* Submit Button */}
                        <div className="col-span-2 mt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-brand-dark transition-colors disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span>Registering...</span>
                                    </>
                                ) : (
                                    <span>Register</span>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </BackgroundWrapper>
    );
}
