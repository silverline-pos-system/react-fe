import { useEffect, useState } from "react";
import { Users, Star, Activity, Percent, Filter, Search, Download, Award, Shield, UserCheck, AlertTriangle } from "lucide-react";
import { getLoyaltyCustomers, getLoyaltyStats, getTierRules, getLoyaltyCustomersPdf } from "../services/managerService";
import CustomerDetailsModal from "../modals/CustomerDetailsModal";
import TierEditModal from "../modals/TierEditModal";
import CampaignConfigModal from "../modals/CampaignConfigModal";

const StatCard = ({ title, value, desc, icon: Icon, trend }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow cursor-pointer">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
            <p className={`text-xs mt-1 font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                {desc}
            </p>
        </div>
        <div className="p-3 bg-brand-light/10 rounded-xl text-brand">
            <Icon size={22} />
        </div>
    </div>
);

const Badge = ({ children }) => {
    const styles = {
        Bronze: "bg-orange-50 text-orange-700 border-orange-200",
        Silver: "bg-slate-100 text-slate-600 border-slate-200",
        Gold: "bg-yellow-50 text-yellow-700 border-yellow-200",
        Platinum: "bg-purple-50 text-purple-700 border-purple-200",
        Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Inactive: "bg-red-50 text-red-700 border-red-200",
        Blocked: "bg-red-50 text-red-700 border-red-200",
    };
    const styleClass = styles[children] || "bg-gray-100 text-gray-600 border-gray-200";
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styleClass}`}>
            {children}
        </span>
    );
};

export default function Loyalty() {
    const [stats, setStats] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTier, setFilterTier] = useState("All");

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showTierEdit, setShowTierEdit] = useState(false);
    const [showCampaignConfig, setShowCampaignConfig] = useState(false);
    const [tierRules, setTierRules] = useState({ Silver: 10000, Gold: 50000, Platinum: 100000 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsData, custData, rulesData] = await Promise.all([
                getLoyaltyStats(),
                getLoyaltyCustomers(),
                getTierRules().catch(() => null)
            ]);

            setStats(statsData || []);

            const currentRules = rulesData || { Silver: 10000, Gold: 50000, Platinum: 100000 };
            if (rulesData) setTierRules(rulesData);

            const processedCustomers = (custData || []).map(customer => {
                let calculatedTier = 'Bronze';
                const points = parseFloat(customer.availablePoints || customer.points || 0);

                if (points >= (currentRules.Platinum || 100000)) {
                    calculatedTier = 'Platinum';
                } else if (points >= (currentRules.Gold || 50000)) {
                    calculatedTier = 'Gold';
                } else if (points >= (currentRules.Silver || 10000)) {
                    calculatedTier = 'Silver';
                }

                return {
                    ...customer,
                    tier: calculatedTier
                };
            });

            const sorted = processedCustomers.sort((a, b) => b.availablePoints - a.availablePoints);
            setCustomers(sorted);

        } catch (err) {
            console.error("Failed to load loyalty data", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTier = filterTier === "All" || c.tier === filterTier;

        return matchesSearch && matchesTier;
    });

    const handleExport = async () => {
        try {
            const blob = await getLoyaltyCustomersPdf();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "loyalty_customers.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to export PDF", err);
            alert("Failed to export report. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Loyalty & Customers</h1>
                    <p className="text-slate-500 text-sm">Manage customer relationships, tiers, and rewards.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                    <button
                        onClick={() => setShowCampaignConfig(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-hover"
                    >
                        <Award size={16} /> Campaign Config
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.length > 0 ? stats.map((stat, i) => (
                    <StatCard
                        key={i}
                        title={stat.title}
                        value={stat.value}
                        desc={stat.description}
                        trend={stat.trend}
                        icon={
                            stat.icon === 'users' ? Users :
                                stat.icon === 'star' ? Star :
                                    stat.icon === 'percent' ? Percent : Activity
                        }
                    />
                )) : (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse" />
                    ))
                )}
            </div>

            {selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onUpdate={() => {
                        fetchData();
                        setSelectedCustomer(null);
                    }}
                />
            )}

            {showTierEdit && (
                <TierEditModal
                    onClose={() => setShowTierEdit(false)}
                    onUpdate={() => {
                        fetchData();
                    }}
                />
            )}

            {showCampaignConfig && (
                <CampaignConfigModal onClose={() => setShowCampaignConfig(false)} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex gap-4 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                        </div>
                        <div className="flex items-center gap-2 relative">
                            <Filter size={16} className="text-slate-400 absolute left-3 pointer-events-none" />
                            <select
                                value={filterTier}
                                onChange={(e) => setFilterTier(e.target.value)}
                                className="pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-brand appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                <option value="All">All Tiers</option>
                                <option value="Bronze">Bronze</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input type="checkbox" className="rounded border-slate-300 cursor-pointer" />
                                    </th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Tier</th>
                                    <th className="p-4 text-right">Points</th>
                                    <th className="p-4 text-right">Total Spend</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="p-4">
                                                <div className="h-8 bg-slate-100 rounded"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400">
                                            {customers.length === 0 ? "No customers enrolled yet." : "No customers found matching filters."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((c) => (
                                        <tr
                                            key={c.id}
                                            onClick={() => setSelectedCustomer(c)}
                                            className={`group transition-colors cursor-pointer border-l-4 ${c.status === 'Inactive' || c.status === 'Blocked'
                                                ? 'bg-red-50 hover:bg-red-100 border-l-red-500'
                                                : 'hover:bg-slate-50 border-l-transparent'
                                                }`}
                                        >
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="rounded border-slate-300 cursor-pointer" />
                                            </td>
                                            <td className="p-4">
                                                <div className={`font-bold ${c.status === 'Inactive' ? 'text-red-700' : 'text-slate-700'}`}>{c.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge>{c.tier}</Badge>
                                            </td>
                                            <td className="p-4 text-right font-mono font-medium text-brand-secondary">
                                                {c.availablePoints}
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-600">
                                                {c.totalSpend}
                                            </td>
                                            <td className="p-4">
                                                <Badge>{c.status}</Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Showing {filteredCustomers.length} customers</span>
                        <div className="flex gap-2">
                            <button disabled className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                            <button className="px-3 py-1 border rounded hover:bg-slate-50">Next</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Tier Rules</h3>
                            <button
                                onClick={() => setShowTierEdit(true)}
                                className="text-xs font-bold text-brand hover:text-brand-hover hover:underline"
                            >
                                Edit
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                                <span className="font-bold text-slate-600">Silver</span>
                                <span className="text-slate-400 text-xs text-right">&gt; {tierRules.Silver?.toLocaleString()} LKR</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-yellow-50 border border-yellow-100">
                                <span className="font-bold text-yellow-700">Gold</span>
                                <span className="text-yellow-600 text-xs text-right">&gt; {tierRules.Gold?.toLocaleString()} LKR</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-purple-50 border border-purple-100">
                                <span className="font-bold text-purple-700">Platinum</span>
                                <span className="text-purple-600 text-xs text-right">&gt; {tierRules.Platinum?.toLocaleString()} LKR</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
