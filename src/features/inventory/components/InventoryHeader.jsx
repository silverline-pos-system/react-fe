import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, Menu } from 'lucide-react';
import SecondaryRoleBanner from '@/components/common/SecondaryRoleBanner';

const InventoryHeader = ({ branchName, userRole, userName, goToAdmin, goToManager, handleLogout, onMenuClick }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 shadow-sm">
            <button
                type="button"
                onClick={onMenuClick}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                aria-label="Open sidebar menu"
            >
                <Menu size={18} />
            </button>

            <div className="flex flex-col flex-1">
                <h1 className="font-bold text-lg text-slate-800">Inventory Management</h1>
                <span className="text-xs text-slate-500">{branchName}</span>
            </div>

            <div className="flex items-center gap-3">
                {userRole === 'SUPER_ADMIN' && (
                    <button
                        onClick={goToAdmin}
                        className="group flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:border hover:border-blue-200"
                    >
                        <LayoutDashboard size={16} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                        <span className="hidden sm:inline text-slate-700 group-hover:text-blue-700 transition-colors">Admin Dashboard</span>
                    </button>
                )}
                {(userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') && (
                    <button
                        onClick={goToManager}
                        className="group flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:border hover:border-blue-200"
                    >
                        <LayoutDashboard size={16} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                        <span className="hidden sm:inline text-slate-700 group-hover:text-blue-700 transition-colors">Enterprise Console</span>
                    </button>
                )}

                <SecondaryRoleBanner />

                <div className="text-right leading-tight">
                    <div className="font-mono text-lg font-bold tracking-wider text-slate-700">
                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all duration-300 group cursor-default">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md transform group-hover:scale-110 transition-transform duration-300 ring-2 ring-blue-100">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{userName}</span>
                </div>

                <button
                    onClick={handleLogout}
                    className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-red-100 text-slate-700 hover:text-red-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                    <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
                    <span className="relative z-10 hidden sm:inline text-sm font-semibold">Sign Out</span>
                </button>
            </div>
        </header>
    );
};

export default React.memo(InventoryHeader);
