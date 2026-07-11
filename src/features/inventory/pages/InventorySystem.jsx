import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemName } from '@/context/SystemNameContext';
import {
    Package, Plus, Search, Filter, Edit, Trash2, Printer,
    BarChart3, Tag, Box, Calendar, AlertTriangle, ArrowRightLeft,
    CheckCircle, FileText, TrendingUp, Clock, ChevronRight,
    Download, Upload, RefreshCw, Archive, X, Monitor,
    Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart, Cloud, Umbrella, Droplet, Flame, Smile, History, Bell
} from 'lucide-react';

import ItemListScreen from './ItemListScreen';
import AddItemScreen from './AddItemScreen';
import ItemDetailScreen from './ItemDetailScreen';
import CategoryManagementScreen from './CategoryManagementScreen';
import BrandManagementScreen from './BrandManagementScreen';
import IMEISearchScreen from './IMEISearchScreen';

import { POManagementScreen, SupplierManagementScreen, ItemDispatcherScreen } from '@/features/procurement';

import StockOverviewScreen from './StockOverviewScreen';

import ExpiryCalendarScreen from './ExpiryCalendarScreen';
import StockAdjustmentScreen from './StockAdjustmentScreen';
import DamageEntryScreen from './DamageEntryScreen';
import StockTransferCreateScreen from './StockTransferCreateScreen';
import TransferApprovalScreen from './TransferApprovalScreen';

import StockValuationScreen from './StockValuationScreen';
import StockAgingScreen from './StockAgingScreen';

import inventoryService from '@/features/inventory/services/inventoryService';
import storeService from '@/features/inventory/services/storeService';

import { InventoryNotificationProvider, useInventoryNotification } from '@/features/inventory/context/InventoryNotificationContext';
import InventoryToastNotification from '@/features/inventory/components/InventoryToastNotification';
import { useEnterKeyNavigation } from '@/shared/hooks/useEnterKeyNavigation';
import InventoryHeader from '@/features/inventory/components/InventoryHeader';
import FeatureGate from '@/shared/components/FeatureGate';


const InventorySystemContent = () => {
    const navigate = useNavigate();
    const { systemName } = useSystemName();
    const INVENTORY_ACTIVE_SCREEN_KEY = 'inventory.activeScreen';
    const ALLOWED_INVENTORY_SCREENS = [
        'item-list',
        'item-detail',
        'po-mgmt',
        'stock-overview',
        'expiry-calendar',
        'stock-adjustment',
        'damage-entry',
        'category-mgmt',
        'brand-mgmt',
        'supplier-mgmt',
        'dispatch-mgmt',
        'transfer-create',
        'approve-transfer',
        'stock-valuation',
        'stock-aging',
        'barcode-print',
        'imei-search',
    ];

    const getInitialInventoryScreen = () => {
        try {
            const saved = localStorage.getItem(INVENTORY_ACTIVE_SCREEN_KEY);
            if (saved && ALLOWED_INVENTORY_SCREENS.includes(saved)) return saved;
        } catch (e) {
            console.warn('Failed to restore inventory screen from localStorage:', e);
        }
        return 'item-list';
    };

    const [activeScreen, setActiveScreen] = useState(getInitialInventoryScreen);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { success, error, warning, confirm } = useInventoryNotification();

    // Keyboard navigation hooks for forms
    const handleCategoryKeyDown = useEnterKeyNavigation();
    const handleSubCategoryKeyDown = useEnterKeyNavigation();
    const handleBrandKeyDown = useEnterKeyNavigation();
    const handleSupplierKeyDown = useEnterKeyNavigation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [imeiFinderInitialFilters, setImeiFinderInitialFilters] = useState(null);

    // Edit states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingType, setEditingType] = useState(null); // 'category', 'brand', 'supplier', 'item'

    const [suppliers, setSuppliers] = useState([]);
    const [supplierForm, setSupplierForm] = useState({ supplier_id: '', code: '', name: '', company_name: '', contact_person: '', phone: '', mobile: '', email: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Sri Lanka', supplier_type: 'LOCAL', supplier_category: 'PRIMARY', is_active: true, is_verified: false });

    const [brands, setBrands] = useState([]);
    const [brandForm, setBrandForm] = useState({ brand_id: '', name: '', description: '', is_active: true, icon: 'Archive', color: 'blue' });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [categoryForm, setCategoryForm] = useState({ category_id: '', name: '', description: '', is_active: true, icon: 'Tag', color: 'blue' });
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

    const [subCategoryForm, setSubCategoryForm] = useState({ subcategory_id: '', category_id: '', name: '', description: '', is_active: true });
    const [isAddSubCategoryOpen, setIsAddSubCategoryOpen] = useState(false);
    const [selectedParentCategory, setSelectedParentCategory] = useState(null);

    const [stockFilterCategory, setStockFilterCategory] = useState('');
    const [stockFilterWarehouse, setStockFilterWarehouse] = useState('');
    const [stockFilterDate, setStockFilterDate] = useState('');

    const [branches, setBranches] = useState([]);
    const [items, setItems] = useState([]);
    const [batches, setBatches] = useState([]);

    // State for Stock Adjustment
    const [adjustmentForm, setAdjustmentForm] = useState({ itemId: '', batchId: '', currentQty: '', physicalQty: '', adjustmentType: 'Increase', reason: 'Audit', approvedBy: '' });
    const [adjustments, setAdjustments] = useState([]);

    // State for Damage Entry
    const [damageForm, setDamageForm] = useState({ itemId: '', batchId: '', quantity: '', reason: '', date: '', note: '' });
    const [damageEntries, setDamageEntries] = useState([]);

    // State for Stock Transfer Create
    const [transferForm, setTransferForm] = useState({ fromBranch: '', toBranch: '', product_id: '', quantity: '', batch_id: '', transferDate: '', remarks: '', status: 'Draft' });
    const [transfers, setTransfers] = useState([]);

    // State for Item Detail
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedItemTab, setSelectedItemTab] = useState('summary');
    const [editingItem, setEditingItem] = useState(null);

    // Get user info
    const userStr = localStorage.getItem('user');
    let userName = 'User';
    let userRole = 'Staff';
    let branchName = 'Main Branch';

    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userName = user.username || user.name || 'User';
            userRole = user.role || user.userRole || 'Staff';
            branchName = user.branchName || 'Main Branch';
        } catch (parseError) {
            console.warn('Failed to parse inventory user session data:', parseError);
        }
    }

    const handleLogout = async () => {
        const isConfirmed = await confirm(
            'Sign Out',
            'Are you sure you want to sign out?',
            'danger'
        );

        if (isConfirmed) {
            try {
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                const selectedBranchId = localStorage.getItem('selectedBranchId');
                const token = localStorage.getItem('token');
                await fetch(`http://localhost:8080/api/v1/manager/activity/log`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        branchId: selectedBranchId || 1,
                        userId: userObj.userId || userObj.id,
                        username: userObj.username || userName,
                        role: userObj.role || userObj.userRole || userRole,
                        actionType: 'LOGOUT',
                        details: `User logged out: ${userObj.username || userName}`,
                        metadata: "{}"
                    })
                });
            } catch (e) {
                console.error("Failed to log LOGOUT", e);
            }

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const goToAdmin = () => navigate('/admin');
    const goToManager = () => navigate('/manager');

    // Load inventory data from backend on mount
    useEffect(() => {
        const loadInventoryData = async () => {
            console.log('=== Inventory API called ===');
            console.log('[InventorySystem] Starting to load inventory data...');
            try {
                console.log('[InventorySystem] Calling Promise.all for products, categories, brands, suppliers, subcategories, branches');
                const [productsData, categoriesData, brandsData, suppliersData, subCategoriesData, branchesData, batchesData] = await Promise.all([
                    inventoryService.getProducts(),
                    inventoryService.getCategories(),
                    inventoryService.getBrands(),
                    inventoryService.getSuppliers(),
                    inventoryService.getSubCategories(),
                    inventoryService.getBranches().catch(err => {
                        console.warn('Failed to fetch branches, using empty list:', err);
                        return [];
                    }),
                    storeService.getBatches().catch(err => {
                        console.warn('Failed to fetch batches, using empty list:', err);
                        return [];
                    })
                ]);

                console.log('[InventorySystem] Data received:', {
                    products: productsData?.length || 0,
                    categories: categoriesData?.length || 0,
                    brands: brandsData?.length || 0,
                    suppliers: suppliersData?.length || 0,
                    branches: branchesData?.length || 0,
                    batches: batchesData?.length || 0
                });

                // MERGE CATEGORIES WITH LOCAL METADATA
                const categoryMetadata = JSON.parse(localStorage.getItem('category_metadata') || '{}');
                const enhancedCategories = categoriesData.map(cat => ({
                    ...cat,
                    icon: categoryMetadata[cat.category_id]?.icon || cat.icon || 'Tag',
                    color: categoryMetadata[cat.category_id]?.color || cat.color || 'blue'
                }));

                // MERGE BRANDS WITH LOCAL METADATA
                const brandMetadata = JSON.parse(localStorage.getItem('brand_metadata') || '{}');
                const enhancedBrands = brandsData.map(brand => ({
                    ...brand,
                    icon: brandMetadata[brand.brand_id]?.icon || brand.icon || 'Archive',
                    color: brandMetadata[brand.brand_id]?.color || brand.color || 'blue'
                }));

                setItems(productsData);
                setCategories(enhancedCategories);
                setBrands(enhancedBrands);
                setSuppliers(suppliersData);
                setSubCategories(subCategoriesData);
                setBranches(branchesData);
                setBatches(batchesData);

                console.log('[InventorySystem] State updated successfully');
            } catch (err) {
                console.error('[InventorySystem] Inventory API error:', err);
                error('Failed to load inventory data. Please refresh the page.');
            }
        };

        loadInventoryData();
    }, []);

    useEffect(() => {
        if (!ALLOWED_INVENTORY_SCREENS.includes(activeScreen)) {
            setActiveScreen('item-list');
            return;
        }
        try {
            localStorage.setItem(INVENTORY_ACTIVE_SCREEN_KEY, activeScreen);
        } catch (e) {
            console.warn('Failed to persist inventory screen in localStorage:', e);
        }
    }, [activeScreen]);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [activeScreen]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const refreshItems = async () => {
        try {
            console.log('[InventorySystem] Refreshing products and batches...');
            const [productsData, batchesData] = await Promise.all([
                inventoryService.getProducts(),
                storeService.getBatches()
            ]);
            setItems(productsData);
            setBatches(batchesData);
            console.log('[InventorySystem] Refresh complete');
        } catch (err) {
            console.error('[InventorySystem] Failed to refresh items/batches:', err);
        }
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (isAddModalOpen) setIsAddModalOpen(false);
                else if (isAddSupplierOpen) setIsAddSupplierOpen(false);
                else if (isAddBrandOpen) setIsAddBrandOpen(false);
                else if (isAddCategoryOpen) setIsAddCategoryOpen(false);
                else if (isAddSubCategoryOpen) { setIsAddSubCategoryOpen(false); setSelectedParentCategory(null); }
                if (isEditMode) { setIsEditMode(false); setEditingId(null); setEditingType(null); }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isAddModalOpen, isAddSupplierOpen, isAddBrandOpen, isAddCategoryOpen, isAddSubCategoryOpen, isEditMode]);

    const handleAddCategory = async () => {
        if (categoryForm.name.trim()) {
            try {
                const createdCategory = await inventoryService.createCategory(categoryForm);

                const metadata = JSON.parse(localStorage.getItem('category_metadata') || '{}');
                metadata[createdCategory.category_id] = {
                    icon: categoryForm.icon,
                    color: categoryForm.color
                };
                localStorage.setItem('category_metadata', JSON.stringify(metadata));

                const categoryWithMeta = {
                    ...createdCategory,
                    icon: categoryForm.icon,
                    color: categoryForm.color
                };

                setCategories([...categories, categoryWithMeta]);
                setCategoryForm({ category_id: '', name: '', description: '', is_active: true, icon: 'Tag', color: 'blue' });
                setIsAddCategoryOpen(false);
            } catch (err) {
                console.error('Error creating category:', err);
                error('Failed to create category. Please try again.');
            }
        }
    };

    const handleAddSubCategory = async () => {
        if (subCategoryForm.name.trim() && selectedParentCategory) {
            try {
                const payload = { ...subCategoryForm, category_id: selectedParentCategory };
                const createdSubCategory = await inventoryService.createSubCategory(payload);
                setSubCategories([...subCategories, createdSubCategory]);
                setSubCategoryForm({ subcategory_id: '', category_id: '', name: '', description: '', is_active: true });
                setIsAddSubCategoryOpen(false);
                setSelectedParentCategory(null);
            } catch (err) {
                console.error('Error creating subcategory:', err);
                error('Failed to create subcategory. Please try again.');
            }
        }
    };

    const handleDeleteSubCategory = async (subCategoryId) => {
        const confirmed = await confirm(
            'Delete Subcategory',
            'Are you sure you want to delete this subcategory? This action cannot be undone.',
            'danger'
        );

        if (confirmed) {
            try {
                await inventoryService.deleteSubCategory(subCategoryId);
                setSubCategories(subCategories.filter(s => s.subcategory_id !== subCategoryId));
                success('Subcategory deleted successfully!');
            } catch (err) {
                console.error('Error deleting subcategory:', err);
                error('Failed to delete subcategory. Please try again.');
            }
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        const confirmed = await confirm(
            'Delete Category',
            'Are you sure you want to delete this category? This action cannot be undone.',
            'danger'
        );

        if (confirmed) {
            try {
                await inventoryService.deleteCategory(categoryId);

                const metadata = JSON.parse(localStorage.getItem('category_metadata') || '{}');
                if (metadata[categoryId]) {
                    delete metadata[categoryId];
                    localStorage.setItem('category_metadata', JSON.stringify(metadata));
                }

                setCategories(categories.filter(c => c.category_id !== categoryId));
                success('Category deleted successfully!');
            } catch (err) {
                console.error('Error deleting category:', err);
                error('Failed to delete category. Please try again.');
            }
        }
    };

    const handleDeleteBrand = async (brandId) => {
        const confirmed = await confirm(
            'Delete Brand',
            'Are you sure you want to delete this brand? This action cannot be undone.',
            'danger'
        );

        if (confirmed) {
            try {
                await inventoryService.deleteBrand(brandId);

                const metadata = JSON.parse(localStorage.getItem('brand_metadata') || '{}');
                if (metadata[brandId]) {
                    delete metadata[brandId];
                    localStorage.setItem('brand_metadata', JSON.stringify(metadata));
                }

                setBrands(brands.filter(b => b.brand_id !== brandId));
                success('Brand deleted successfully!');
            } catch (err) {
                console.error('Error deleting brand:', err);
                error('Failed to delete brand. Please try again.');
            }
        }
    };

    const handleDeleteSupplier = async (supplierId) => {
        const confirmed = await confirm(
            'Delete Supplier',
            'Are you sure you want to delete this supplier? This action cannot be undone.',
            'danger'
        );

        if (confirmed) {
            try {
                await inventoryService.deleteSupplier(supplierId);
                setSuppliers(suppliers.filter(s => s.supplier_id !== supplierId));
                success('Supplier deleted successfully!');
            } catch (err) {
                console.error('Error deleting supplier:', err);
                error('Failed to delete supplier. Please try again.');
            }
        }
    };

    const handleDeleteItem = async (productId) => {
        const confirmed = await confirm(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            'danger'
        );

        if (confirmed) {
            try {
                await inventoryService.deleteProduct(productId);
                setItems(items.filter(i => i.product_id !== productId));
                success('Product deleted successfully!');
            } catch (err) {
                console.error('Error deleting product:', err);
                error('Failed to delete product. Please try again.');
            }
        }
    };

    const handleEditCategory = (categoryId) => {
        const category = categories.find(c => c.category_id === categoryId);
        if (category) {
            setCategoryForm({
                ...category,
                icon: category.icon || 'Tag',
                color: category.color || 'blue'
            });
            setEditingId(categoryId);
            setEditingType('category');
            setIsEditMode(true);
            setIsAddCategoryOpen(true);
        }
    };

    const handleEditBrand = (brandId) => {
        const brand = brands.find(b => b.brand_id === brandId);
        if (brand) {
            setBrandForm({
                ...brand,
                icon: brand.icon || 'Archive',
                color: brand.color || 'blue'
            });
            setEditingId(brandId);
            setEditingType('brand');
            setIsEditMode(true);
            setIsAddBrandOpen(true);
        }
    };

    const handleEditSupplier = (supplierId) => {
        const supplier = suppliers.find(s => s.supplier_id === supplierId);
        if (supplier) {
            setSupplierForm({ ...supplier });
            setEditingId(supplierId);
            setEditingType('supplier');
            setIsEditMode(true);
            setIsAddSupplierOpen(true);
        }
    };

    const handleEditSubCategory = (subCategoryId) => {
        const subCategory = subCategories.find(s => s.subcategory_id === subCategoryId);
        if (subCategory) {
            setSubCategoryForm({ ...subCategory });
            setEditingId(subCategoryId);
            setEditingType('subcategory');
            setIsEditMode(true);
            setIsAddSubCategoryOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        try {
            if (editingType === 'category' && categoryForm.name.trim()) {
                const updatedCategory = await inventoryService.updateCategory(editingId, categoryForm);

                const metadata = JSON.parse(localStorage.getItem('category_metadata') || '{}');
                metadata[editingId] = {
                    icon: categoryForm.icon,
                    color: categoryForm.color
                };
                localStorage.setItem('category_metadata', JSON.stringify(metadata));

                const categoryWithMeta = {
                    ...updatedCategory,
                    icon: categoryForm.icon,
                    color: categoryForm.color
                };

                setCategories(categories.map(c => c.category_id === editingId ? categoryWithMeta : c));
                setIsEditMode(false);
                setEditingId(null);
                setEditingType(null);
                setIsAddCategoryOpen(false);
            } else if (editingType === 'brand' && brandForm.name.trim()) {
                const updatedBrand = await inventoryService.updateBrand(editingId, brandForm);

                const metadata = JSON.parse(localStorage.getItem('brand_metadata') || '{}');
                metadata[editingId] = {
                    icon: brandForm.icon,
                    color: brandForm.color
                };
                localStorage.setItem('brand_metadata', JSON.stringify(metadata));

                const brandWithMeta = {
                    ...updatedBrand,
                    icon: brandForm.icon,
                    color: brandForm.color
                };

                setBrands(brands.map(b => b.brand_id === editingId ? brandWithMeta : b));
                setIsEditMode(false);
                setEditingId(null);
                setEditingType(null);
                setIsAddBrandOpen(false);
            } else if (editingType === 'supplier' && supplierForm.name.trim()) {
                const updatedSupplier = await inventoryService.updateSupplier(editingId, supplierForm);
                setSuppliers(suppliers.map(s => s.supplier_id === editingId ? updatedSupplier : s));
                setIsEditMode(false);
                setEditingId(null);
                setEditingType(null);
                setIsAddSupplierOpen(false);
            } else if (editingType === 'subcategory' && subCategoryForm.name.trim()) {
                const updatedSubCategory = await inventoryService.updateSubCategory(editingId, subCategoryForm);
                setSubCategories(subCategories.map(s => s.subcategory_id === editingId ? updatedSubCategory : s));
                setIsEditMode(false);
                setEditingId(null);
                setEditingType(null);
                setIsAddSubCategoryOpen(false);
            }
        } catch (err) {
            console.error('Error updating:', err);
            error('Failed to update. Please try again.');
        }
    };

    const handleEditItem = (itemId) => {
        const item = items.find(i => i.product_id === itemId);
        if (item) {
            setEditingItem(item);
            setIsAddModalOpen(true);
        }
    };

    const itemDetails = {};
    const stockTransfers = [];

    const navigation = [
        {
            id: 'procurement', label: 'Procurement', icon: FileText, screens: [
                { id: 'po-mgmt', label: 'Purchase Orders', icon: FileText },
                { id: 'dispatch-mgmt', label: 'Item Dispatcher', icon: CheckCircle },
            ]
        },
        {
            id: 'item-management', label: 'Item Management', icon: Package, screens: [
                { id: 'item-list', label: 'Products & Items', icon: Package },
                { id: 'item-detail', label: 'Item Details', icon: FileText },
                { id: 'imei-search', label: 'IMEI/Serial Finder', icon: Smartphone },
                { id: 'barcode-print', label: 'Barcode Print', icon: Printer },
            ]
        },
        {
            id: 'category-master', label: 'Category & Master', icon: Tag, screens: [
                { id: 'category-mgmt', label: 'Category Management', icon: Tag },
                { id: 'brand-mgmt', label: 'Brand Management', icon: Archive },
                { id: 'supplier-mgmt', label: 'Supplier Management', icon: Archive },
            ]
        },
        {
            id: 'stock-ops', label: 'Stock Operations', icon: Box, screens: [
                { id: 'expiry-calendar', label: 'Expiry Calendar', icon: Calendar, featureCode: 'INVENTORY_EXPIRE_CALENDAR' },
                { id: 'stock-adjustment', label: 'Stock Adjustment', icon: RefreshCw },
                { id: 'damage-entry', label: 'Damage Entry', icon: AlertTriangle },
            ]
        },
        {
            id: 'transfers', label: 'Transfers & Valuation', icon: ArrowRightLeft, screens: [
                { id: 'transfer-create', label: 'Create Transfer', icon: ArrowRightLeft },
                { id: 'stock-valuation', label: 'Stock Valuation', icon: TrendingUp },
                { id: 'stock-aging', label: 'Stock Aging Report', icon: Clock },
            ]
        }
    ];

    const renderScreen = () => {
        switch (activeScreen) {
            case 'item-list':
                return <ItemListScreen
                    items={items}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setSelectedItemId={setSelectedItemId}
                    setActiveScreen={setActiveScreen}
                    handleDeleteItem={handleDeleteItem}
                    handleEditItem={handleEditItem}
                    categories={categories}
                    setIsAddModalOpen={(isOpen) => {
                        if (isOpen) setEditingItem(null);
                        setIsAddModalOpen(isOpen);
                    }}
                />;
            case 'item-detail':
                return <ItemDetailScreen
                    items={items}
                    itemDetails={itemDetails}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                    setActiveScreen={setActiveScreen}
                    selectedItemTab={selectedItemTab}
                    setSelectedItemTab={setSelectedItemTab}
                    batches={batches}
                    categories={categories}
                    brands={brands}
                    subCategories={subCategories}
                    suppliers={suppliers}
                    branches={branches}
                    refreshItems={refreshItems}
                />;
            case 'po-mgmt':
                return <POManagementScreen suppliers={suppliers} categories={categories} brands={brands} items={items} subCategories={subCategories} setActiveScreen={setActiveScreen} branches={branches} />;
            case 'stock-overview':
                return <StockOverviewScreen
                    items={items}
                    categories={categories}
                    branches={branches}
                    stockFilterCategory={stockFilterCategory}
                    setStockFilterCategory={setStockFilterCategory}
                    stockFilterBranch={stockFilterWarehouse}
                    setStockFilterBranch={setStockFilterWarehouse}
                    stockFilterDate={stockFilterDate}
                    setStockFilterDate={setStockFilterDate}
                />;
            case 'expiry-calendar':
                return <ExpiryCalendarScreen batches={batches} />;
            case 'stock-adjustment':
                return <StockAdjustmentScreen
                    adjustmentForm={adjustmentForm}
                    setAdjustmentForm={setAdjustmentForm}
                    adjustments={adjustments}
                    setAdjustments={setAdjustments}
                    items={items}
                    batches={batches}
                />;
            case 'damage-entry':
                return <DamageEntryScreen
                    damageForm={damageForm}
                    setDamageForm={setDamageForm}
                    damageEntries={damageEntries}
                    setDamageEntries={setDamageEntries}
                    items={items}
                    batches={batches}
                />;
            case 'imei-search':
                return <IMEISearchScreen branches={branches} items={items} initialFilters={imeiFinderInitialFilters} />;
            case 'category-mgmt':
                return <CategoryManagementScreen
                    categories={categories}
                    subCategories={subCategories}
                    categoryForm={categoryForm}
                    setCategoryForm={setCategoryForm}
                    isAddCategoryOpen={isAddCategoryOpen}
                    setIsAddCategoryOpen={setIsAddCategoryOpen}
                    handleAddCategory={handleAddCategory}

                    subCategoryForm={subCategoryForm}
                    setSubCategoryForm={setSubCategoryForm}
                    isAddSubCategoryOpen={isAddSubCategoryOpen}
                    setIsAddSubCategoryOpen={setIsAddSubCategoryOpen}
                    handleAddSubCategory={handleAddSubCategory}
                    selectedParentCategory={selectedParentCategory}
                    setSelectedParentCategory={setSelectedParentCategory}
                    handleDeleteCategory={handleDeleteCategory}
                    handleEditCategory={handleEditCategory}
                    isEditMode={isEditMode && editingType === 'category'}
                    handleSaveEdit={handleSaveEdit}
                    handleEditSubCategory={handleEditSubCategory}
                    handleDeleteSubCategory={handleDeleteSubCategory}
                />;
            case 'brand-mgmt':
                return <BrandManagementScreen
                    brands={brands}
                    setBrands={setBrands}
                    isAddBrandOpen={isAddBrandOpen}
                    setIsAddBrandOpen={setIsAddBrandOpen}
                    brandForm={brandForm}
                    setBrandForm={setBrandForm}
                    suppliers={suppliers}
                    handleDeleteBrand={handleDeleteBrand}
                    handleEditBrand={handleEditBrand}
                    isEditMode={isEditMode && editingType === 'brand'}
                    handleSaveEdit={handleSaveEdit}
                />;
            case 'supplier-mgmt':
                return <SupplierManagementScreen
                    suppliers={suppliers}
                    setSuppliers={setSuppliers}
                    isAddSupplierOpen={isAddSupplierOpen}
                    setIsAddSupplierOpen={setIsAddSupplierOpen}
                    supplierForm={supplierForm}
                    setSupplierForm={setSupplierForm}
                    categories={categories}
                    handleDeleteSupplier={handleDeleteSupplier}
                    handleEditSupplier={handleEditSupplier}
                    isEditMode={isEditMode && editingType === 'supplier'}
                    setIsEditMode={setIsEditMode}
                    setEditingType={setEditingType}
                    handleSaveEdit={handleSaveEdit}
                />;
            case 'dispatch-mgmt':
                return <ItemDispatcherScreen
                    items={items}
                    suppliers={suppliers}
                    branches={branches}
                    categories={categories}
                    subCategories={subCategories}
                    onApproveSuccess={refreshItems}
                    onOpenIMEIFinder={(filters) => {
                        setImeiFinderInitialFilters(filters || null);
                        setActiveScreen('imei-search');
                    }}
                />;
            case 'transfer-create':
                return <StockTransferCreateScreen
                    transferForm={transferForm}
                    setTransferForm={setTransferForm}
                    transfers={transfers}
                    setTransfers={setTransfers}
                    branches={branches}
                    items={items}
                    batches={batches}
                />;
            case 'approve-transfer':
                return <TransferApprovalScreen stockTransfers={stockTransfers} branches={branches} />;
            case 'stock-valuation':
                return <StockValuationScreen batches={batches} items={items} />;
            case 'stock-aging':
                return <StockAgingScreen batches={batches} />;
            case 'barcode-print':
                return (
                    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden bg-slate-50/50">
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                            <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                        </div>

                        <div className="relative z-10 text-center p-12 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white max-w-xl mx-auto transform transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                            <div className="relative mb-8 inline-block group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                <div className="relative z-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group-hover:border-blue-100 transition-colors">
                                    <Printer size={48} className="text-blue-600" strokeWidth={1.5} />
                                </div>
                                <div className="absolute -top-3 -right-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white">DEV</div>
                            </div>

                            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                                Barcode Studio
                            </h2>
                            <h3 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
                                Coming Soon
                            </h3>

                            <p className="text-slate-500 text-[15px] mb-8 leading-relaxed max-w-sm mx-auto">
                                We are building a powerful barcode generation tool. Create custom labels, support multiple formats, and print directly from your browser.
                            </p>

                            <div className="max-w-sm mx-auto mb-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                                    <span>Development Status</span>
                                    <span className="text-blue-600">In Progress</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-[65%] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-full border border-slate-200/50">
                                <Clock size={14} className="text-slate-400" />
                                <span className="text-xs font-medium text-slate-500">Expected Update: Next Release</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Package size={64} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900">Screen Coming Soon</h3>
                            <p className="text-gray-600 mt-2">This feature is under development</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 relative overflow-hidden">
            {isMobileSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar overlay"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
                />
            )}

            <aside className={`w-72 bg-gray-900 text-white h-screen flex flex-col min-h-0 fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:z-auto ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold">{systemName}</h1>
                    <p className="text-sm text-gray-400 mt-1">Inventory Management</p>
                </div>

                <nav className="sidebar-scroll p-4 flex-1 min-h-0 overflow-y-auto">
                    {navigation.map((section) => (
                        <div key={section.id} className="mb-6">
                            <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {section.label}
                            </div>
                            <div className="mt-2 space-y-1">
                                {section.screens.map((screen) => {
                                    const btn = (
                                        <button
                                            key={screen.id}
                                            onClick={() => setActiveScreen(screen.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeScreen === screen.id
                                                ? 'bg-brand-primary text-white shadow-lg translate-x-1'
                                                : 'text-gray-300 hover:bg-gray-800 hover:translate-x-1 hover:text-white'
                                                }`}
                                        >
                                            <screen.icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                            <span className="text-sm truncate">{screen.label}</span>
                                        </button>
                                    );
                                    if (screen.featureCode) {
                                        return (
                                            <FeatureGate key={screen.id} featureCode={screen.featureCode} featureName={screen.label}>
                                                {btn}
                                            </FeatureGate>
                                        );
                                    }
                                    return btn;
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <InventoryHeader
                    branchName={branchName}
                    userRole={userRole}
                    userName={userName}
                    goToAdmin={goToAdmin}
                    goToManager={goToManager}
                    handleLogout={handleLogout}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />

                <div key={activeScreen} className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 animate-screen-transition">
                    {renderScreen()}
                </div>
            </div>

            {/* Add Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-2xl md:max-w-3xl mx-4 sm:mx-6 z-10 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <AddItemScreen
                                onClose={() => setIsAddModalOpen(false)}
                                setActiveScreen={setActiveScreen}
                                categories={categories}
                                subCategories={subCategories}
                                brands={brands}
                                existingItems={items}
                                itemToEdit={editingItem}
                                onSaved={(savedItem) => {
                                    if (editingItem) {
                                        setItems(items.map(i => i.product_id === savedItem.product_id ? savedItem : i));
                                    } else {
                                        setItems([...items, savedItem]);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subcategory Modal */}
            {isAddSubCategoryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddSubCategoryOpen(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 sm:mx-6 z-10 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Edit Subcategory' : 'Add New Subcategory'}</h3>
                                <button onClick={() => setIsAddSubCategoryOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={20} />
                                </button>
                            </div>

                            <form className="space-y-4" onKeyDown={handleSubCategoryKeyDown}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Name</label>
                                    <input
                                        type="text"
                                        value={subCategoryForm.name}
                                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                                        placeholder="e.g., Soft Drinks"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={subCategoryForm.description}
                                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                                        placeholder="Description..."
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={subCategoryForm.is_active}
                                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, is_active: e.target.checked })}
                                        id="isSubActive"
                                        className="rounded"
                                    />
                                    <label htmlFor="isSubActive" className="text-sm font-medium text-gray-700">Active</label>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddSubCategoryOpen(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={isEditMode ? handleSaveEdit : handleAddSubCategory}
                                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"
                                    >
                                        {isEditMode ? 'Save Changes' : 'Add Subcategory'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Category Modal */}
            {isAddCategoryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddCategoryOpen(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 sm:mx-6 z-10 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Edit Category' : 'Add New Category'}</h3>
                                <button onClick={() => setIsAddCategoryOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={20} />
                                </button>
                            </div>

                            <form className="space-y-4" onKeyDown={handleCategoryKeyDown}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                    <input
                                        type="text"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        placeholder="e.g., Beverages"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        placeholder="e.g., Drinks and beverages"
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.is_active}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                        id="isActive"
                                        className="rounded"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {['Tag', 'Box', 'Archive', 'Layers', 'ShoppingBag', 'Coffee', 'Smartphone', 'Headphones', 'Shirt', 'Watch', 'Utensils', 'Zap', 'Gift', 'Briefcase', 'Camera', 'Music', 'Anchor', 'Globe', 'Key', 'Map', 'Sun', 'Moon', 'Star', 'Heart'].map((iconName) => {
                                            const IconComponent = { Tag, Box, Archive, Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart }[iconName] || Tag;
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => setCategoryForm({ ...categoryForm, icon: iconName })}
                                                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${categoryForm.icon === iconName ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                    title={iconName}
                                                >
                                                    <IconComponent size={20} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'blue', bg: 'bg-blue-500' },
                                            { id: 'green', bg: 'bg-green-500' },
                                            { id: 'red', bg: 'bg-red-500' },
                                            { id: 'yellow', bg: 'bg-yellow-500' },
                                            { id: 'purple', bg: 'bg-purple-500' },
                                            { id: 'pink', bg: 'bg-pink-500' },
                                            { id: 'orange', bg: 'bg-orange-500' },
                                            { id: 'indigo', bg: 'bg-indigo-500' },
                                            { id: 'teal', bg: 'bg-teal-500' },
                                            { id: 'cyan', bg: 'bg-cyan-500' },
                                        ].map((color) => (
                                            <button
                                                key={color.id}
                                                type="button"
                                                onClick={() => setCategoryForm({ ...categoryForm, color: color.id })}
                                                className={`w-8 h-8 rounded-full ${color.bg} transition-transform hover:scale-110 flex items-center justify-center ${categoryForm.color === color.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                            >
                                                {categoryForm.color === color.id && <CheckCircle size={14} className="text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddCategoryOpen(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={isEditMode ? handleSaveEdit : handleAddCategory}
                                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"
                                    >
                                        {isEditMode ? 'Save Changes' : 'Add Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Brand Modal */}
            {isAddBrandOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddBrandOpen(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 sm:mx-6 z-10 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Brand' : 'Add Brand'}</h2>
                                        <p className="text-gray-600 mt-1">{isEditMode ? 'Update brand details' : 'Create a new brand'}</p>
                                    </div>
                                    <button onClick={() => setIsAddBrandOpen(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6" onKeyDown={handleBrandKeyDown}>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                                            <input value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Brand name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Short description" rows="2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select value={brandForm.is_active} onChange={(e) => setBrandForm({ ...brandForm, is_active: e.target.value === 'true' })} className="w-full">
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Icon</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {['Archive', 'Box', 'Tag', 'Layers', 'ShoppingBag', 'Coffee', 'Smartphone', 'Headphones', 'Shirt', 'Watch', 'Utensils', 'Zap', 'Gift', 'Briefcase', 'Camera', 'Music', 'Anchor', 'Globe', 'Key', 'Map', 'Sun', 'Moon', 'Star', 'Heart'].map((iconName) => {
                                                    const IconComponent = { Archive, Tag, Box, Layers, ShoppingBag, Coffee, Smartphone, Headphones, Shirt, Watch, Utensils, Zap, Gift, Briefcase, Camera, Music, Anchor, Globe, Key, Map, Sun, Moon, Star, Heart }[iconName] || Archive;
                                                    return (
                                                        <button
                                                            key={iconName}
                                                            type="button"
                                                            onClick={() => setBrandForm({ ...brandForm, icon: iconName })}
                                                            className={`p-2 rounded-lg flex items-center justify-center transition-all ${brandForm.icon === iconName ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                            title={iconName}
                                                        >
                                                            <IconComponent size={20} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    { id: 'blue', bg: 'bg-blue-500' },
                                                    { id: 'green', bg: 'bg-green-500' },
                                                    { id: 'red', bg: 'bg-red-500' },
                                                    { id: 'yellow', bg: 'bg-yellow-500' },
                                                    { id: 'purple', bg: 'bg-purple-500' },
                                                    { id: 'pink', bg: 'bg-pink-500' },
                                                    { id: 'orange', bg: 'bg-orange-500' },
                                                    { id: 'indigo', bg: 'bg-indigo-500' },
                                                    { id: 'teal', bg: 'bg-teal-500' },
                                                    { id: 'cyan', bg: 'bg-cyan-500' },
                                                ].map((color) => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => setBrandForm({ ...brandForm, color: color.id })}
                                                        className={`w-8 h-8 rounded-full ${color.bg} transition-transform hover:scale-110 flex items-center justify-center ${brandForm.color === color.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                                    >
                                                        {brandForm.color === color.id && <CheckCircle size={14} className="text-white" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                        <button type="button" onClick={() => { setIsAddBrandOpen(false); setBrandForm({ brand_id: '', name: '', description: '', is_active: true, icon: 'Archive', color: 'blue' }); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                                        <button type="button" onClick={async () => {
                                            if (!brandForm.name) {
                                                warning('Please fill in the brand name');
                                                return;
                                            }
                                            if (isEditMode) {
                                                await handleSaveEdit();
                                            } else {
                                                try {
                                                    const createdBrand = await inventoryService.createBrand(brandForm);

                                                    const metadata = JSON.parse(localStorage.getItem('brand_metadata') || '{}');
                                                    metadata[createdBrand.brand_id] = {
                                                        icon: brandForm.icon,
                                                        color: brandForm.color
                                                    };
                                                    localStorage.setItem('brand_metadata', JSON.stringify(metadata));

                                                    const brandWithMeta = {
                                                        ...createdBrand,
                                                        icon: brandForm.icon,
                                                        color: brandForm.color
                                                    };

                                                    setBrands([...brands, brandWithMeta]);
                                                    setIsAddBrandOpen(false);
                                                    setBrandForm({ brand_id: '', name: '', description: '', is_active: true, icon: 'Archive', color: 'blue' });
                                                } catch (err) {
                                                    console.error('Error creating brand:', err);
                                                    error('Failed to create brand. Please try again.');
                                                }
                                            }
                                        }} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">{isEditMode ? 'Save Changes' : 'Save Brand'}</button>
                                    </div>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Supplier Modal */}
            {isAddSupplierOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-blur">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddSupplierOpen(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 sm:mx-6 z-10 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Add Supplier</h2>
                                        <p className="text-gray-600 mt-1">Create a new supplier</p>
                                    </div>
                                    <button onClick={() => setIsAddSupplierOpen(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6" onKeyDown={handleSupplierKeyDown}>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Code *</label>
                                            <input value={supplierForm.code} readOnly disabled type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" placeholder="Auto generated" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                                            <input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Supplier name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                            <input value={supplierForm.company_name} onChange={(e) => setSupplierForm({ ...supplierForm, company_name: e.target.value })} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Company name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                                            <input value={supplierForm.contact_person} onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Contact person" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="011-1234567" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <input value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="email@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                            <input value={supplierForm.city} onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Colombo" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Type</label>
                                            <select value={supplierForm.supplier_type} onChange={(e) => setSupplierForm({ ...supplierForm, supplier_type: e.target.value })} className="w-full">
                                                <option value="LOCAL">Local</option>
                                                <option value="INTERNATIONAL">International</option>
                                                <option value="DISTRIBUTOR">Distributor</option>
                                                <option value="MANUFACTURER">Manufacturer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Category</label>
                                            <select value={supplierForm.supplier_category} onChange={(e) => setSupplierForm({ ...supplierForm, supplier_category: e.target.value })} className="w-full">
                                                <option value="PRIMARY">Primary</option>
                                                <option value="SECONDARY">Secondary</option>
                                                <option value="OCCASIONAL">Occasional</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                        <button type="button" onClick={() => { setIsAddSupplierOpen(false); setSupplierForm({ supplier_id: '', code: '', name: '', company_name: '', contact_person: '', phone: '', mobile: '', email: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Sri Lanka', supplier_type: 'LOCAL', supplier_category: 'PRIMARY', is_active: true, is_verified: false }); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button type="button" onClick={async () => {
                                            if (!supplierForm.code || !supplierForm.name) {
                                                warning('Please fill in the required fields (Code and Name)');
                                                return;
                                            }
                                            if (isEditMode) {
                                                await handleSaveEdit();
                                            } else {
                                                try {
                                                    const createdSupplier = await inventoryService.createSupplier(supplierForm);
                                                    setSuppliers([...suppliers, createdSupplier]);
                                                    setIsAddSupplierOpen(false);
                                                    setSupplierForm({ supplier_id: '', code: '', name: '', company_name: '', contact_person: '', phone: '', mobile: '', email: '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'Sri Lanka', supplier_type: 'LOCAL', supplier_category: 'PRIMARY', is_active: true, is_verified: false });
                                                } catch (err) {
                                                    console.error('Error creating supplier:', err);
                                                    error('Failed to create supplier. Please try again.');
                                                }
                                            }
                                        }} className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                                            {isEditMode ? 'Save Changes' : 'Save Supplier'}
                                        </button>
                                    </div>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InventorySystem = () => {
    return (
        <InventoryNotificationProvider>
            <InventorySystemContent />
            <InventoryToastNotification />
        </InventoryNotificationProvider>
    );
};

export default InventorySystem;
