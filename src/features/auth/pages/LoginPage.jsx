import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, User, Lock, Loader2, Shield, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import bgImage from "@/assets/images/registration-bg.png";
import { authService } from '@/features/auth/services/authService';
import { getMySecondaryRole } from '@/features/manager/services/managerService';
import { useSystemName } from '@/context/SystemNameContext';

const BackgroundWrapper = ({ children }) => (
  <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
    {/* 1. Background Image Layer */}
    <div className="absolute inset-0 z-0">
      <img src={bgImage} alt="Background" className="w-full h-full object-cover blur-sm scale-110" />
      <div className="absolute inset-0 bg-brand-deep/80 mix-blend-multiply"></div>
    </div>

    {/* 2. Content Layer */}
    <div className="relative z-10 w-full flex justify-center">
      {children}
    </div>
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { systemName } = useSystemName();
  const [showSuccessModal, setShowSuccessModal] = useState(location.state?.registrationSuccess || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const { username, password } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user types
    if (error) setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authService.login(formData);

      // The backend returns a flat object: { token, role, username, ... }
      if (data.token) {
        localStorage.setItem('token', data.token);

        // Store the full user object for easy access later
        localStorage.setItem('user', JSON.stringify(data));

        // Store branches and set default branch if available
        if (data.branches && data.branches.length > 0) {
          localStorage.setItem('branches', JSON.stringify(data.branches));
          // If no branch is currently selected, default to the first one
          if (!localStorage.getItem('selectedBranchId')) {
            localStorage.setItem('selectedBranchId', data.branches[0].id || data.branches[0].branchId);
          }
        } else if (data.branchId) {
          // Fallback if only legacy branchId is provided
          localStorage.setItem('selectedBranchId', data.branchId);
        }
        try {
          const secondaryRoleData = await getMySecondaryRole();
          if (secondaryRoleData && secondaryRoleData.secondaryRole) {
            const expires = new Date(secondaryRoleData.expiresAt);
            if (expires > new Date()) {
              // Merge secondary role info into user object
              const enrichedUser = {
                ...data,
                secondaryRole: secondaryRoleData.secondaryRole,
                secondaryRoleExpiresAt: secondaryRoleData.expiresAt,
                secondaryRoleReason: secondaryRoleData.reason,
              };
              localStorage.setItem('user', JSON.stringify(enrichedUser));
            }
          }
        } catch {
          // Non-critical — continue login even if secondary role check fails
        }

        // --- ROLE BASED REDIRECT LOGIC ---
        const role = (data.role || data.userRole || '').toUpperCase();
        console.log('Login successful. Role:', role);

        switch (role) {
          case 'SUPER_ADMIN':
            // Super Admin goes to Admin Dashboard
            navigate('/admin');
            break;
          case 'MANAGER':
            // Branch Manager goes to Manager Dashboard
            navigate('/manager');
            break;
          case 'CASHIER':
          case 'SUPERVISOR':
          default:
            // Cashier and Supervisor go to POS
            navigate('/pos');
            break;
        }
      } else {
        setError("Login failed: No token received.");
      }
    } catch (err) {
      console.error(err);
      // Display specific error message if available (e.g. "Account status not active")
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessModal) {
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

          <h2 className="text-3xl font-bold text-slate-800 mb-3">Registration Successful!</h2>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8">
            <p className="text-slate-600 leading-relaxed">
              Your account has been created and is currently
              <span className="inline-block px-2 py-0.5 mx-1.5 bg-orange-100 text-orange-600 font-bold rounded text-sm border border-orange-200">
                Pending Approval
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Please contact your branch manager or system administrator to activate your access.
            </p>
          </div>

          <button
            onClick={() => {
              setShowSuccessModal(false);
              navigate(location.pathname, { replace: true, state: {} });
            }}
            className="w-full group bg-slate-900 hover:bg-brand text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 hover:shadow-brand/25 transition-all duration-300 flex items-center justify-center gap-3"
          >
            Continue to Login
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </BackgroundWrapper>
    );
  }

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
            <h2 className="text-3xl font-bold mb-4">Welcome Back.</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sign in securely to access store operations and reporting.
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="bg-white/10 p-2.5 rounded-full ring-1 ring-white/20">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Secure Access</p>
                <p className="text-xs text-slate-400 mt-1">
                  System activity is monitored and logged for security.
                </p>
              </div>
            </div>
          </div>

          {/* CIRCLES SIDES BAR*/}
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-brand/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-brand/20 rounded-full blur-xl"></div>
        </div>

        {/* FORM AREA */}
        <div className="w-full md:w-7/12 p-8 md:p-10 bg-pos-bg">
          <h3 className="text-2xl font-bold text-pos-text mb-6">Login to Account</h3>

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
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-brand group-focus-within:scale-110" />
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand transition-all text-sm font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-xl shadow-lg mt-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Login to ${systemName}`}
            </button>

            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-brand transition-colors">
                Forgot Password?
              </Link>
            </div>

            <div className="h-px bg-slate-200 my-6"></div>

            <div className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-brand hover:underline">
                Register New ID
              </Link>
            </div>

          </form>
        </div>
      </div>
    </BackgroundWrapper>
  );
}
