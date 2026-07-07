import { useState, useEffect, useMemo, useCallback } from "react";
import { useBranch } from "@/context/BranchContext";
import {
    Activity, Search, Calendar, User, Clock,
    Filter, RefreshCw, FileText, Download, ChevronDown,
    ShoppingCart, DollarSign, Package, Users, LogIn,
    LogOut, AlertTriangle, CheckCircle, XCircle, Eye,
    BarChart2, ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react";
import { getBranchActivityLog, getBranchActivityLogPdf } from "../services/managerService";
import Pagination from "@/components/common/Pagination";

const activityConfig = {
    SALE: { icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Sale' },
    RETURN: { icon: ArrowDownRight, color: 'bg-red-100 text-red-700 border-red-200', label: 'Return' },
    VOID_SALE: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Void Sale' },
    DISCOUNT: { icon: DollarSign, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Discount' },

    SHIFT_OPEN: { icon: LogIn, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Shift Open' },
    SHIFT_CLOSE: { icon: LogOut, color: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Shift Close' },
    CASH_IN: { icon: ArrowUpRight, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Cash In' },
    CASH_OUT: { icon: ArrowDownRight, color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Cash Out' },
    CASH_FLOW_REQUEST: { icon: DollarSign, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Cash Flow' },

    Dispatch: { icon: Package, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'Dispatch' },
    Dispatch_APPROVED: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Dispatch Approved' },
    STOCK_ADJUSTMENT: { icon: Package, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Stock Adjust' },
    STOCK_TRANSFER: { icon: Package, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Transfer' },

    LOGIN: { icon: LogIn, color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Login' },
    LOGOUT: { icon: LogOut, color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Logout' },
    USER_CREATE: { icon: Users, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'User Created' },

    APPROVAL_REQUEST: { icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Approval Requested' },
    APPROVAL_GRANTED: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
    APPROVAL_REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' },

    ALERT: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Alert' },
    DEFAULT: { icon: Activity, color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Activity' }
};

function StatCard({ title, value, icon: Icon, color, trend, trendValue }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100'
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{title}</div>
                    <div className="text-2xl font-bold text-slate-800">{value}</div>
                </div>
                {trend && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {trend === 'up' ? '+' : ''}{trendValue}%
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityRow({ activity }) {
    const config = activityConfig[activity.actionType] || activityConfig.DEFAULT;
    const Icon = config.icon;

    let displayUser = activity.username || `User ${activity.userId || '?'}`;
    let displayRole = 'System';
    let additionalData = {};

    try {
        if (activity.metadata) {
            const meta = typeof activity.metadata === 'string'
                ? JSON.parse(activity.metadata)
                : activity.metadata;
            const nestedUserInfo = meta?.user_info || {};
            const metaUser = nestedUserInfo.user || meta.user;
            const metaRole = nestedUserInfo.role || meta.role;

            if (metaUser) displayUser = metaUser;
            if (metaRole) displayRole = metaRole;
            if (meta.amount) additionalData.amount = meta.amount;
            if (meta.invoice) additionalData.invoice = meta.invoice;
        }
    } catch {
        // Ignore parse errors
    }

    if (activity.userRole) {
        displayRole = activity.userRole;
    }

    const severityColors = {
        INFO: 'bg-blue-50',
        WARNING: 'bg-amber-50',
        CRITICAL: 'bg-red-50',
        SUCCESS: 'bg-emerald-50'
    };

    return (
        <tr className={`hover:bg-slate-50 transition-colors border-t border-slate-100 ${severityColors[activity.severity] || ''
            }`}>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                        <div className="font-medium text-slate-700">
                            {activity.parsedDate ? activity.parsedDate.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'Invalid Time'}
                        </div>
                        <div className="text-xs text-slate-400">
                            {activity.parsedDate ? activity.parsedDate.toLocaleDateString() : 'Invalid Date'}
                        </div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                        {displayUser.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-slate-800">{displayUser}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">{displayRole}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                    <Icon size={12} />
                    {config.label || activity.actionType?.replace(/_/g, ' ')}
                </span>
            </td>
            <td className="p-4">
                <div className="max-w-md">
                    <div className="text-slate-700">{activity.description || activity.details}</div>
                    {activity.entityType && activity.entityId && (
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                            Ref: {activity.entityType} #{activity.entityId}
                        </div>
                    )}
                    {additionalData.amount && (
                        <div className="text-xs text-emerald-600 font-bold mt-1">
                            LKR {additionalData.amount.toLocaleString()}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-4">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${activity.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                    activity.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {activity.status || 'OK'}
                </span>
            </td>
        </tr>
    );
}

function FilterChips({ selected, onChange, options }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selected === opt.value
                        ? 'bg-slate-800 text-white shadow-lg'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {opt.label}
                    {opt.count !== undefined && (
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${selected === opt.value ? 'bg-white/20' : 'bg-slate-100'
                            }`}>
                            {opt.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

function LiveIndicator({ isLive }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-xs font-medium text-emerald-700">
                {isLive ? 'Live Updates' : 'Paused'}
            </span>
        </div>
    );
}

export default function BranchActivityLog() {
    const { selectedBranchId } = useBranch();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLive] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    const fetchActivities = useCallback(async () => {
        try {
            setRefreshing(true);
            const data = await getBranchActivityLog(selectedBranchId || 1, { date: dateFilter });

            if (Array.isArray(data)) {
                const formattedData = data
                    .map(item => {
                        let dateObj;
                        const ts = item.timestamp || item.createdAt;
                        if (Array.isArray(ts)) {
                            dateObj = new Date(ts[0], ts[1] - 1, ts[2], ts[3] || 0, ts[4] || 0, ts[5] || 0);
                        } else {
                            dateObj = new Date(ts);
                        }
                        return { ...item, parsedDate: dateObj };
                    })
                    .filter(item => {
                        let role = item.userRole || 'System';
                        try {
                            if (item.metadata) {
                                const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                                const nestedUserInfo = meta?.user_info || {};
                                const metaRole = nestedUserInfo.role || meta.role;
                                if (metaRole) role = metaRole;
                            }
                        } catch (err) {}
                        return role !== 'SUPER_ADMIN' && role !== 'Admin';
                    });
                setActivities(formattedData);
            } else {
                setActivities([]);
            }
        } catch (err) {
            console.error("Failed to load activities", err);
            setActivities([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [dateFilter, selectedBranchId]);

    useEffect(() => {
        fetchActivities();

        let interval;
        if (isLive) {
            interval = setInterval(fetchActivities, 30000);
        }
        return () => clearInterval(interval);
    }, [fetchActivities, isLive]);

    const stats = useMemo(() => {
        const shiftOpens = activities.filter(a => a.actionType === 'SHIFT_OPEN').length;
        const shiftCloses = activities.filter(a => a.actionType === 'SHIFT_CLOSE').length;
        const logins = activities.filter(a => a.actionType === 'LOGIN').length;
        const logouts = activities.filter(a => a.actionType === 'LOGOUT').length;

        return { shiftOpens, shiftCloses, logins, logouts };
    }, [activities]);

    const filteredActivities = useMemo(() => {
        const q = searchTerm.toLowerCase();
        const allowedTypes = ['SHIFT_OPEN', 'SHIFT_CLOSE', 'LOGIN', 'LOGOUT', 'USER_CREATE'];

        return activities.filter(a => {
            if (!allowedTypes.includes(a.actionType)) return false;

            const matchesSearch = !q ||
                a.username?.toLowerCase().includes(q) ||
                a.actionType?.toLowerCase().includes(q) ||
                a.description?.toLowerCase().includes(q) ||
                a.details?.toLowerCase().includes(q);

            const matchesType = typeFilter === 'ALL' || a.actionType === typeFilter;
            const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;

            let matchesDate = true;
            if (dateFilter) {
                const actDate = new Date(a.timestamp || a.createdAt);
                if (!isNaN(actDate.getTime())) {
                    const yyyy = actDate.getFullYear();
                    const mm = String(actDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(actDate.getDate()).padStart(2, '0');
                    const formattedDate = `${yyyy}-${mm}-${dd}`;
                    matchesDate = formattedDate === dateFilter;
                }
            }

            return matchesSearch && matchesType && matchesSeverity && matchesDate;
        });
    }, [activities, searchTerm, typeFilter, severityFilter, dateFilter]);

    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredActivities.slice(start, start + itemsPerPage);
    }, [filteredActivities, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, severityFilter, dateFilter]);

    const typeOptions = useMemo(() => {
        const counts = {};
        activities.forEach(a => {
            if (['SHIFT_OPEN', 'SHIFT_CLOSE', 'LOGIN'].includes(a.actionType)) {
                counts[a.actionType] = (counts[a.actionType] || 0) + 1;
            }
        });

        return [
            { value: 'ALL', label: 'All Activities', count: (counts.SHIFT_OPEN || 0) + (counts.SHIFT_CLOSE || 0) + (counts.LOGIN || 0) + (counts.LOGOUT || 0) },
            { value: 'SHIFT_OPEN', label: 'Shift Open', count: counts.SHIFT_OPEN || 0 },
            { value: 'SHIFT_CLOSE', label: 'Shift Close', count: counts.SHIFT_CLOSE || 0 },
            { value: 'LOGIN', label: 'Logins', count: counts.LOGIN || 0 },
            { value: 'LOGOUT', label: 'Logouts', count: counts.LOGOUT || 0 }
        ];
    }, [activities]);

    const exportLog = async () => {
        try {
            const blob = await getBranchActivityLogPdf(100);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-log-${new Date().toISOString().split("T")[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to export PDF", err);
            alert("Failed to export report. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Loading activity log...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" />
                        Branch Activity Log
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Monitor shift operations, closures, and staff access in real-time
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <LiveIndicator isLive={isLive} />
                    <button
                        onClick={fetchActivities}
                        disabled={refreshing}
                        className={`p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all ${refreshing ? 'animate-spin' : ''
                            }`}
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={exportLog}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Shift Opens" 
                    value={stats.shiftOpens} 
                    icon={LogIn} 
                    color="blue" 
                />
                <StatCard 
                    title="Shift Closes" 
                    value={stats.shiftCloses} 
                    icon={LogOut} 
                    color="purple" 
                />
                <StatCard 
                    title="Staff Logins" 
                    value={stats.logins} 
                    icon={Users} 
                    color="emerald" 
                />
                <StatCard 
                    title="Staff Logouts" 
                    value={stats.logouts} 
                    icon={LogOut} 
                    color="red" 
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by user, action, or description..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            <option value="ALL">All Severity</option>
                            <option value="INFO">Info</option>
                            <option value="SUCCESS">Success</option>
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>
                </div>

                <FilterChips
                    selected={typeFilter}
                    onChange={setTypeFilter}
                    options={typeOptions}
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="font-semibold text-slate-800">Activity Feed</span>
                        <span className="ml-2 text-sm text-slate-400">
                            {filteredActivities.length} activities
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-slate-600 sticky top-0">
                            <tr>
                                <th className="text-left p-4 font-semibold">Time</th>
                                <th className="text-left p-4 font-semibold">User</th>
                                <th className="text-left p-4 font-semibold">Action</th>
                                <th className="text-left p-4 font-semibold">Details</th>
                                <th className="text-left p-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActivities.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No activities found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                paginatedActivities.map(activity => (
                                    <ActivityRow
                                        key={activity.id || activity.activityId}
                                        activity={activity}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredActivities.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredActivities.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                            totalItems={filteredActivities.length}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
