import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Archive, Search, X, Building2, Phone, Mail, MapPin, Activity } from 'lucide-react';
import Pagination from '../components/Pagination';

const SupplierManagementScreen = ({
    suppliers,
    setIsAddSupplierOpen,
    setSupplierForm,
    handleDeleteSupplier,
    handleEditSupplier,
    setIsEditMode,
    setEditingType
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Close supplier detail modal on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && selectedSupplier) setSelectedSupplier(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedSupplier]);

    // Reset page on search
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredSuppliers = useMemo(() => {
        return (suppliers || []).filter(s => {
            const name = String(s?.name || '').toLowerCase();
            const code = String(s?.code || '').toLowerCase();
            const company = String(s?.company_name || s?.companyName || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return name.includes(query) || code.includes(query) || company.includes(query);
        });
    }, [suppliers, searchQuery]);

    const paginatedSuppliers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSuppliers.slice(start, start + itemsPerPage);
    }, [filteredSuppliers, currentPage, itemsPerPage]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Supplier Management</h2>
                    <p className="text-gray-600 mt-1">Manage your suppliers</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
                        />
                    </div>
                    <button onClick={() => {
                        let nextCode = 'SUP001';
                        if (suppliers && suppliers.length > 0) {
                            let maxNum = 0;
                            suppliers.forEach(s => {
                                const match = String(s.code || '').match(/sup(\d+)/i);
                                if (match) {
                                    const num = parseInt(match[1]);
                                    if (num > maxNum) maxNum = num;
                                }
                            });
                            nextCode = `SUP${String(maxNum + 1).padStart(3, '0')}`;
                        }
                        setSupplierForm({
                            supplier_id: '',
                            code: nextCode,
                            name: '',
                            company_name: '',
                            contact_person: '',
                            phone: '',
                            mobile: '',
                            email: '',
                            address_line1: '',
                            address_line2: '',
                            city: '',
                            state: '',
                            postal_code: '',
                            country: 'Sri Lanka',
                            supplier_type: 'LOCAL',
                            supplier_category: 'PRIMARY',
                            is_active: true,
                            is_verified: false
                        });
                        if (setIsEditMode) setIsEditMode(false);
                        if (setEditingType) setEditingType(null);
                        setIsAddSupplierOpen(true);
                    }} className="px-4 py-2 bg-brand-primary text-white rounded-lg flex items-center gap-2 hover:bg-brand-secondary transition-colors btn-hover-scale btn-interactive">
                        <Plus size={20} />
                        Add Supplier
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-16">No.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Supplier Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company & Code</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedSuppliers.length > 0 ? (
                            paginatedSuppliers.map((s, index) => (
                                <tr
                                    key={s.supplier_id}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedSupplier(s)}
                                >
                                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50">
                                                <Archive size={16} className="text-brand-primary" />
                                            </div>
                                            {s.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-gray-900 font-medium">{s.company_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{s.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[120px]">{s.supplier_type}</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-600">{s.phone}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No suppliers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredSuppliers.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredSuppliers.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>

            {/* View Supplier Detail Modal */}
            {selectedSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedSupplier(null)}></div>
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 sm:mx-6 z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedSupplier.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-mono text-gray-500">{selectedSupplier.code}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedSupplier.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {selectedSupplier.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSupplier(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Company & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedSupplier.company_name || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                                        <Activity size={12} className="mr-1 py-0.5" />
                                        {selectedSupplier.supplier_type || 'LOCAL'}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                    <Phone size={16} className="text-gray-400" />
                                    Contact Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                                        <p className="text-sm text-gray-900">{selectedSupplier.contact_person || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Email</label>
                                        <div className="flex items-center gap-1.5">
                                            {selectedSupplier.email && <Mail size={14} className="text-gray-400" />}
                                            <p className="text-sm text-gray-900">{selectedSupplier.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                        <p className="text-sm text-gray-900">{selectedSupplier.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Mobile</label>
                                        <p className="text-sm text-gray-900">{selectedSupplier.mobile || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                    <MapPin size={16} className="text-gray-400" />
                                    Address
                                </h4>
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                    {selectedSupplier.address_line1 ? (
                                        <>
                                            <p>{selectedSupplier.address_line1}</p>
                                            {selectedSupplier.address_line2 && <p>{selectedSupplier.address_line2}</p>}
                                            <p>{selectedSupplier.city}{selectedSupplier.state ? `, ${selectedSupplier.state}` : ''} {selectedSupplier.postal_code}</p>
                                            <p>{selectedSupplier.country || 'Sri Lanka'}</p>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 italic">No address provided.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setSelectedSupplier(null);
                                    handleEditSupplier(selectedSupplier.supplier_id);
                                }}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit size={16} /> Edit Supplier
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedSupplier(null);
                                    handleDeleteSupplier(selectedSupplier.supplier_id);
                                }}
                                className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Delete Supplier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierManagementScreen;
