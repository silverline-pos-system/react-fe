import React, { useState } from 'react';
import {
    Plus, Tag, Edit, Trash2, X, Search, ChevronDown, ChevronRight, MoreVertical, FolderPlus,
    Box, Archive, Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart
} from 'lucide-react';
import Pagination from '@/components/common/Pagination';

const CategoryManagementScreen = ({
    categories,
    subCategories,
    setIsAddCategoryOpen,
    handleDeleteCategory,
    handleEditCategory,
    setIsAddSubCategoryOpen,
    setSelectedParentCategory,
    handleDeleteSubCategory,
    handleEditSubCategory
}) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setActiveDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredCategories = React.useMemo(() => {
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const paginatedCategories = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCategories.slice(start, start + itemsPerPage);
    }, [filteredCategories, currentPage, itemsPerPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getSubCategoriesForCategory = (categoryId) => {
        return subCategories ? subCategories.filter(sc => sc.category_id === categoryId) : [];
    };

    const ICON_MAP = {
        Tag, Box, Archive, Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart
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
        <div className="flex h-full gap-6" onClick={() => setActiveDropdown(null)}>
            <div className={`flex-1 flex flex-col space-y-6 transition-all duration-300 min-h-0 ${selectedCategory ? 'w-2/3' : 'w-full'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Category Management</h2>
                        <p className="text-gray-600 mt-1">Organize your inventory categories</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
                            />
                        </div>
                        <button
                            onClick={() => setIsAddCategoryOpen(true)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg flex items-center gap-2 hover:bg-brand-secondary transition-colors btn-hover-scale btn-interactive"
                        >
                            <Plus size={20} />
                            Add Category
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">No.</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">Category Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">Description</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedCategories.length > 0 ? (
                                    paginatedCategories.map((cat, index) => {
                                        const categorySubCats = getSubCategoriesForCategory(cat.category_id);
                                        const isSelected = selectedCategory?.category_id === cat.category_id;
                                        const IconComponent = ICON_MAP[cat.icon] || Tag;
                                        const colorClass = COLOR_MAP[cat.color] || 'bg-gray-100 text-gray-500';

                                        return (
                                            <tr
                                                key={cat.category_id}
                                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-500/20' : ''}`}
                                                onClick={() => setSelectedCategory(isSelected ? null : cat)}
                                            >
                                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : colorClass}`}>
                                                            <IconComponent size={18} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{cat.name}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {categorySubCats.length} subcategories
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{cat.description || '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {cat.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Tag size={48} className="mb-4 text-gray-300" />
                                                <p className="text-lg font-medium text-gray-900">No Categories Found</p>
                                                <p className="text-sm mt-1">Get started by creating a new category.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredCategories.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                            totalItems={filteredCategories.length}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                        />
                    </div>
                </div>
            </div>

            {selectedCategory && (
                <div className="w-1/3 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col animate-in slide-in-from-right-10 duration-300">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                        <div>
                            <h3 className="font-bold text-gray-900">{selectedCategory.name}</h3>
                            <p className="text-xs text-gray-500">Subcategories & Actions</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleEditCategory(selectedCategory.category_id)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit Category"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteCategory(selectedCategory.category_id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Category"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="w-px h-6 bg-gray-300 mx-1"></div>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <button
                            onClick={() => {
                                setIsAddSubCategoryOpen(true);
                                setSelectedParentCategory(selectedCategory.category_id);
                            }}
                            className="w-full mb-4 py-2 px-4 border border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} /> Add New Subcategory
                        </button>

                        <div className="space-y-3">
                            {getSubCategoriesForCategory(selectedCategory.category_id).length > 0 ? (
                                getSubCategoriesForCategory(selectedCategory.category_id).map(sub => (
                                    <div key={sub.subcategory_id} className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm">{sub.name}</div>
                                            {sub.description && <div className="text-xs text-gray-500 mt-0.5">{sub.description}</div>}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditSubCategory(sub.subcategory_id)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSubCategory(sub.subcategory_id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FolderPlus size={24} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm">No subcategories yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagementScreen;
