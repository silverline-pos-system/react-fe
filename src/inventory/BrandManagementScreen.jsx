import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Archive, Tag, Box, Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart, X, Info } from 'lucide-react';
import Pagination from '../components/Pagination';

const BrandManagementScreen = ({
    brands,
    setIsAddBrandOpen,
    handleDeleteBrand,
    handleEditBrand
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedBrand, setSelectedBrand] = useState(null);

    // Close brand detail modal on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && selectedBrand) setSelectedBrand(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedBrand]);

    const filteredBrands = useMemo(() => {
        return brands.filter(b =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [brands, searchQuery]);

    const paginatedBrands = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBrands.slice(start, start + itemsPerPage);
    }, [filteredBrands, currentPage, itemsPerPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const ICON_MAP = {
        Archive, Tag, Box, Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart
    };

    const COLOR_MAP = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600',
        pink: 'bg-pink-100 text-pink-600',
        orange: 'bg-orange-100 text-orange-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        teal: 'bg-teal-100 text-teal-600',
        cyan: 'bg-cyan-100 text-cyan-600',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Brand Management</h2>
                    <p className="text-gray-600 mt-1">Manage brand list, suppliers and units</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
                        />
                    </div>
                    <button onClick={() => setIsAddBrandOpen(true)} className="px-4 py-2 bg-brand-primary text-white rounded-lg flex items-center gap-2 hover:bg-brand-secondary transition-colors">
                        <Plus size={20} /> Add Brand
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-16">No.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Brand Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedBrands.length > 0 ? (
                            paginatedBrands.map((b, index) => {
                                const IconComponent = ICON_MAP[b.icon] || Archive;
                                const colorClass = COLOR_MAP[b.color] || 'bg-gray-100 text-gray-500';

                                return (
                                    <tr
                                        key={b.brand_id}
                                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedBrand(b)}
                                    >
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                                    <IconComponent size={18} />
                                                </div>
                                                <span className="font-medium text-gray-900">{b.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{b.description || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {b.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Archive size={48} className="mb-4 text-gray-300" />
                                        <p className="text-lg font-medium text-gray-900">No Brands Found</p>
                                        <p className="text-sm mt-1">Get started by creating a new brand.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredBrands.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredBrands.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>

            {/* View Brand Detail Modal */}
            {selectedBrand && (() => {
                const IconComponent = ICON_MAP[selectedBrand.icon] || Archive;
                const colorClass = COLOR_MAP[selectedBrand.color] || 'bg-gray-100 text-gray-500';

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBrand(null)}></div>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 sm:mx-6 z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${colorClass}`}>
                                        <IconComponent size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedBrand.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedBrand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {selectedBrand.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedBrand(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                                {/* Description */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                                        <Info size={16} className="text-gray-400" />
                                        Description
                                    </h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {selectedBrand.description || <span className="text-gray-400 italic">No description provided for this brand.</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 shrink-0">
                                <button
                                    onClick={() => {
                                        setSelectedBrand(null);
                                        handleEditBrand(selectedBrand.brand_id);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} /> Edit Brand
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedBrand(null);
                                        handleDeleteBrand(selectedBrand.brand_id);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete Brand
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default BrandManagementScreen;
