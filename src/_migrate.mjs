/**
 * ROCS Frontend Architecture Migration Script
 * 
 * Copies files from legacy directories to features/ structure
 * and rewrites import paths to match the new locations.
 * 
 * Run via: npm run migrate
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const SRC = './src';
let copyCount = 0;
let rewriteCount = 0;

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  copyCount++;
}

function copyDir(srcDir, destDir) {
  if (!existsSync(srcDir)) return;
  ensureDir(destDir);
  const entries = readdirSync(srcDir);
  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      copyCount++;
    }
  }
}

// ============================================================
// PHASE 1: Copy all files to features/
// ============================================================
console.log('Phase 1: Copying files to features/ ...');

// --- AUTH ---
ensureDir(`${SRC}/features/auth/services`);
ensureDir(`${SRC}/features/auth/components`);
ensureDir(`${SRC}/features/auth/hooks`);
ensureDir(`${SRC}/features/auth/utils`);
ensureDir(`${SRC}/features/auth/validations`);
ensureDir(`${SRC}/features/auth/__tests__`);
copyDir(`${SRC}/modules/auth/pages`, `${SRC}/features/auth/pages`);
copyFile(`${SRC}/services/authService.js`, `${SRC}/features/auth/services/authService.js`);

// --- POS ---
ensureDir(`${SRC}/features/pos/pages`);
ensureDir(`${SRC}/features/pos/hooks`);
ensureDir(`${SRC}/features/pos/validations`);
ensureDir(`${SRC}/features/pos/__tests__`);
copyFile(`${SRC}/pos/POSScreen.jsx`, `${SRC}/features/pos/pages/POSScreen.jsx`);
copyDir(`${SRC}/pos/components`, `${SRC}/features/pos/components`);
copyDir(`${SRC}/pos/modals`, `${SRC}/features/pos/modals`);
copyDir(`${SRC}/pos/context`, `${SRC}/features/pos/context`);
ensureDir(`${SRC}/features/pos/services`);
copyFile(`${SRC}/services/posService.js`, `${SRC}/features/pos/services/posService.js`);
copyFile(`${SRC}/services/dispatchPaymentService.js`, `${SRC}/features/pos/services/dispatchPaymentService.js`);
ensureDir(`${SRC}/features/pos/utils`);
copyFile(`${SRC}/utils/receiptPrinter.js`, `${SRC}/features/pos/utils/receiptPrinter.js`);

// --- INVENTORY ---
ensureDir(`${SRC}/features/inventory/pages`);
ensureDir(`${SRC}/features/inventory/hooks`);
ensureDir(`${SRC}/features/inventory/validations`);
ensureDir(`${SRC}/features/inventory/__tests__`);
ensureDir(`${SRC}/features/inventory/services`);
const invPages = ['InventorySystem.jsx','ItemListScreen.jsx','ItemDetailScreen.jsx','AddItemScreen.jsx','CategoryManagementScreen.jsx','BrandManagementScreen.jsx','IMEISearchScreen.jsx'];
for (const f of invPages) {
  if (existsSync(`${SRC}/inventory/${f}`)) copyFile(`${SRC}/inventory/${f}`, `${SRC}/features/inventory/pages/${f}`);
}
copyDir(`${SRC}/inventory/components`, `${SRC}/features/inventory/components`);
copyDir(`${SRC}/inventory/context`, `${SRC}/features/inventory/context`);
// Stock screens from store/
const storePages = ['BatchWiseStockScreen.jsx','DamageEntryScreen.jsx','ExpiryCalendarScreen.jsx','StockAdjustmentScreen.jsx','StockAgingScreen.jsx','StockTransferCreateScreen.jsx','StockValuationScreen.jsx','TransferApprovalScreen.jsx'];
for (const f of storePages) {
  if (existsSync(`${SRC}/store/${f}`)) copyFile(`${SRC}/store/${f}`, `${SRC}/features/inventory/pages/${f}`);
}
// Dashboard stock overview
if (existsSync(`${SRC}/dashboard/StockOverviewScreen.jsx`)) {
  copyFile(`${SRC}/dashboard/StockOverviewScreen.jsx`, `${SRC}/features/inventory/pages/StockOverviewScreen.jsx`);
}
copyFile(`${SRC}/services/inventoryService.js`, `${SRC}/features/inventory/services/inventoryService.js`);
copyFile(`${SRC}/services/inventoryApi.js`, `${SRC}/features/inventory/services/inventoryApi.js`);
copyFile(`${SRC}/services/inventoryMapper.js`, `${SRC}/features/inventory/services/inventoryMapper.js`);
copyFile(`${SRC}/services/storeService.js`, `${SRC}/features/inventory/services/storeService.js`);

// --- PROCUREMENT ---
ensureDir(`${SRC}/features/procurement/pages`);
ensureDir(`${SRC}/features/procurement/components`);
ensureDir(`${SRC}/features/procurement/services`);
ensureDir(`${SRC}/features/procurement/hooks`);
ensureDir(`${SRC}/features/procurement/utils`);
ensureDir(`${SRC}/features/procurement/validations`);
ensureDir(`${SRC}/features/procurement/__tests__`);
if (existsSync(`${SRC}/inventory/POManagementScreen.jsx`)) copyFile(`${SRC}/inventory/POManagementScreen.jsx`, `${SRC}/features/procurement/pages/POManagementScreen.jsx`);
if (existsSync(`${SRC}/inventory/SupplierManagementScreen.jsx`)) copyFile(`${SRC}/inventory/SupplierManagementScreen.jsx`, `${SRC}/features/procurement/pages/SupplierManagementScreen.jsx`);
if (existsSync(`${SRC}/inventory/ItemDispatcherScreen.jsx`)) copyFile(`${SRC}/inventory/ItemDispatcherScreen.jsx`, `${SRC}/features/procurement/pages/ItemDispatcherScreen.jsx`);
copyFile(`${SRC}/services/poService.js`, `${SRC}/features/procurement/services/poService.js`);

// --- MANAGER ---
ensureDir(`${SRC}/features/manager/pages`);
ensureDir(`${SRC}/features/manager/hooks`);
ensureDir(`${SRC}/features/manager/utils`);
ensureDir(`${SRC}/features/manager/validations`);
ensureDir(`${SRC}/features/manager/__tests__`);
ensureDir(`${SRC}/features/manager/services`);
copyDir(`${SRC}/manager/pages`, `${SRC}/features/manager/pages`);
copyFile(`${SRC}/manager/ManagerDashboard.jsx`, `${SRC}/features/manager/pages/ManagerDashboard.jsx`);
copyDir(`${SRC}/manager/components`, `${SRC}/features/manager/components`);
copyDir(`${SRC}/manager/modals`, `${SRC}/features/manager/modals`);
copyDir(`${SRC}/manager/layout`, `${SRC}/features/manager/layout`);
copyFile(`${SRC}/services/managerService.js`, `${SRC}/features/manager/services/managerService.js`);
copyFile(`${SRC}/services/expenseService.js`, `${SRC}/features/manager/services/expenseService.js`);
copyFile(`${SRC}/services/servicesService.js`, `${SRC}/features/manager/services/servicesService.js`);

// --- ADMIN ---
ensureDir(`${SRC}/features/admin/pages`);
ensureDir(`${SRC}/features/admin/hooks`);
ensureDir(`${SRC}/features/admin/utils`);
ensureDir(`${SRC}/features/admin/validations`);
ensureDir(`${SRC}/features/admin/__tests__`);
copyFile(`${SRC}/admin/AdminDashboard.jsx`, `${SRC}/features/admin/pages/AdminDashboard.jsx`);
copyDir(`${SRC}/admin/pages`, `${SRC}/features/admin/pages`);
copyDir(`${SRC}/admin/components`, `${SRC}/features/admin/components`);
copyDir(`${SRC}/admin/layout`, `${SRC}/features/admin/layout`);
copyDir(`${SRC}/admin/services`, `${SRC}/features/admin/services`);
copyFile(`${SRC}/services/printHeaderFooterService.js`, `${SRC}/features/admin/services/printHeaderFooterService.js`);

// --- TECHNICIAN ---
ensureDir(`${SRC}/features/technician/pages`);
ensureDir(`${SRC}/features/technician/components`);
ensureDir(`${SRC}/features/technician/services`);
ensureDir(`${SRC}/features/technician/hooks`);
ensureDir(`${SRC}/features/technician/utils`);
ensureDir(`${SRC}/features/technician/validations`);
ensureDir(`${SRC}/features/technician/__tests__`);
copyDir(`${SRC}/modules/technician/pages`, `${SRC}/features/technician/pages`);

// --- NOTIFICATIONS ---
ensureDir(`${SRC}/features/notifications/components`);
ensureDir(`${SRC}/features/notifications/services`);

console.log(`  Copied ${copyCount} files.`);

// ============================================================
// PHASE 2: Rewrite imports in ALL features/ files
// ============================================================
console.log('Phase 2: Rewriting imports ...');

// Import path rewrite rules for files inside features/
// These map old import paths to new ones
const IMPORT_REWRITES = [
  // Services → feature-colocated
  [/@\/services\/authService/g, '@/features/auth/services/authService'],
  [/@\/services\/posService/g, '@/features/pos/services/posService'],
  [/@\/services\/dispatchPaymentService/g, '@/features/pos/services/dispatchPaymentService'],
  [/@\/services\/inventoryService/g, '@/features/inventory/services/inventoryService'],
  [/@\/services\/inventoryApi/g, '@/features/inventory/services/inventoryApi'],
  [/@\/services\/inventoryMapper/g, '@/features/inventory/services/inventoryMapper'],
  [/@\/services\/storeService/g, '@/features/inventory/services/storeService'],
  [/@\/services\/poService/g, '@/features/procurement/services/poService'],
  [/@\/services\/managerService/g, '@/features/manager/services/managerService'],
  [/@\/services\/expenseService/g, '@/features/manager/services/expenseService'],
  [/@\/services\/servicesService/g, '@/features/manager/services/servicesService'],
  [/@\/services\/printHeaderFooterService/g, '@/features/admin/services/printHeaderFooterService'],
  [/@\/services\/api/g, '@/lib/api'],

  // Legacy top-level → features/
  [/@\/admin\//g, '@/features/admin/'],
  [/@\/manager\//g, '@/features/manager/'],
  [/@\/pos\//g, '@/features/pos/'],
  [/@\/inventory\//g, '@/features/inventory/'],
  [/@\/store\//g, '@/features/inventory/pages/'],
  [/@\/dashboard\//g, '@/features/inventory/pages/'],
  [/@\/technician\//g, '@/features/technician/'],

  // Modules proxy → features/
  [/@\/modules\/auth\//g, '@/features/auth/'],
  [/@\/modules\/pos\//g, '@/features/pos/'],
  [/@\/modules\/inventory\//g, '@/features/inventory/'],
  [/@\/modules\/manager\//g, '@/features/manager/'],
  [/@\/modules\/admin\//g, '@/features/admin/'],
  [/@\/modules\/technician\//g, '@/features/technician/'],

  // Shared → lib/config
  [/@\/shared\/storage/g, '@/lib/storage'],
  [/@\/shared\/constants/g, '@/config/routes'],
  [/@\/shared\/services/g, '@/lib'],
  [/@\/shared\/components/g, '@/components/common'],

  // Components to common
  [/@\/components\/GlobalToastNotification/g, '@/components/common/GlobalToastNotification'],
  [/@\/components\/FeatureRouteGuard/g, '@/components/common/FeatureRouteGuard'],
  [/@\/components\/FeatureGate/g, '@/components/common/FeatureGate'],
  [/@\/components\/Pagination/g, '@/components/common/Pagination'],
];

// Relative import rewrites for files moved from legacy dirs
// These are relative paths that need to become absolute @/ paths
const RELATIVE_REWRITES_POS = [
  // POS internal relative → absolute (for POSScreen.jsx moved from pos/ to features/pos/pages/)
  [/from\s+['"]\.\/components\//g, "from '@/features/pos/components/"],
  [/from\s+['"]\.\/modals\//g, "from '@/features/pos/modals/"],
  [/from\s+['"]\.\/context\//g, "from '@/features/pos/context/"],
  [/from\s+['"]\.\.\/services\//g, "from '@/features/"],
  [/from\s+['"]\.\.\/utils\//g, "from '@/features/pos/utils/"],
  [/from\s+['"]\.\.\/context\//g, "from '@/context/"],
  [/from\s+['"]\.\.\/components\/common\//g, "from '@/components/common/"],
  [/from\s+['"]\.\.\/components\//g, "from '@/components/common/"],
];

const RELATIVE_REWRITES_INVENTORY = [
  // Inventory internal relative → absolute
  [/from\s+['"]\.\/([A-Z])/g, "from '@/features/inventory/pages/$1"],
  [/from\s+['"]\.\/components\//g, "from '@/features/inventory/components/"],
  [/from\s+['"]\.\/context\//g, "from '@/features/inventory/context/"],
  [/from\s+['"]\.\.\/services\//g, "from '@/features/"],
  [/from\s+['"]\.\.\/store\//g, "from '@/features/inventory/pages/"],
  [/from\s+['"]\.\.\/dashboard\//g, "from '@/features/inventory/pages/"],
  [/from\s+['"]\.\.\/context\//g, "from '@/context/"],
  [/from\s+['"]\.\.\/hooks\//g, "from '@/hooks/"],
  [/from\s+['"]\.\.\/components\//g, "from '@/components/common/"],
];

const RELATIVE_REWRITES_ADMIN = [
  [/from\s+['"]\.\//g, "from '@/features/admin/"],
  [/from\s+['"]\.\.\/services\//g, "from '@/features/admin/services/"],
];

const RELATIVE_REWRITES_MANAGER = [
  [/from\s+['"]\.\//g, "from '@/features/manager/"],
  [/from\s+['"]\.\.\/services\//g, "from '@/features/manager/services/"],
];

// Process all .js and .jsx files in features/
function processDir(dir, extraRewrites) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      processDir(fullPath, extraRewrites);
    } else if (entry.endsWith('.js') || entry.endsWith('.jsx')) {
      let content = readFileSync(fullPath, 'utf-8');
      let changed = false;
      
      // Apply global @/ rewrites
      for (const [pattern, replacement] of IMPORT_REWRITES) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }

      // Apply feature-specific relative rewrites
      if (extraRewrites) {
        for (const [pattern, replacement] of extraRewrites) {
          const newContent = content.replace(pattern, replacement);
          if (newContent !== content) {
            content = newContent;
            changed = true;
          }
        }
      }
      
      if (changed) {
        writeFileSync(fullPath, content, 'utf-8');
        rewriteCount++;
      }
    }
  }
}

// Fix POS files — they use relative imports from src/pos/
processDir(`${SRC}/features/pos/pages`, RELATIVE_REWRITES_POS);
// POS components/modals/context use relative imports to services
processDir(`${SRC}/features/pos/components`, IMPORT_REWRITES.map(x => x));
processDir(`${SRC}/features/pos/modals`, IMPORT_REWRITES.map(x => x));
processDir(`${SRC}/features/pos/context`, IMPORT_REWRITES.map(x => x));
processDir(`${SRC}/features/pos/services`, IMPORT_REWRITES.map(x => x));
processDir(`${SRC}/features/pos/utils`, IMPORT_REWRITES.map(x => x));

// Fix Inventory files
processDir(`${SRC}/features/inventory/pages`, RELATIVE_REWRITES_INVENTORY);
processDir(`${SRC}/features/inventory/components`, IMPORT_REWRITES.map(x => x));
processDir(`${SRC}/features/inventory/context`, IMPORT_REWRITES.map(x => x));
processDir(`${SRC}/features/inventory/services`, IMPORT_REWRITES.map(x => x));

// Fix Procurement files — same relative structure as inventory
processDir(`${SRC}/features/procurement`, RELATIVE_REWRITES_INVENTORY);

// Fix Admin files
processDir(`${SRC}/features/admin/pages/AdminDashboard.jsx` ? `${SRC}/features/admin/pages` : '', RELATIVE_REWRITES_ADMIN);
processDir(`${SRC}/features/admin/layout`, null);
processDir(`${SRC}/features/admin/components`, null);
processDir(`${SRC}/features/admin/services`, null);

// Fix Manager files
processDir(`${SRC}/features/manager/pages`, RELATIVE_REWRITES_MANAGER);
processDir(`${SRC}/features/manager/layout`, null);
processDir(`${SRC}/features/manager/components`, null);
processDir(`${SRC}/features/manager/modals`, null);
processDir(`${SRC}/features/manager/services`, null);

// Fix Auth files
processDir(`${SRC}/features/auth`, null);

// Fix Technician files
processDir(`${SRC}/features/technician`, null);

console.log(`  Rewrote imports in ${rewriteCount} files.`);

// ============================================================
// PHASE 3: Update App-level files
// ============================================================
console.log('Phase 3: App-level files need manual update.');
console.log('  - src/App.jsx');
console.log('  - src/app/routing/AppRoutes.jsx');
console.log('  - src/app/providers/AppProviders.jsx');
console.log('');
console.log('=== Migration script complete! ===');
console.log(`Total: ${copyCount} files copied, ${rewriteCount} files had imports rewritten.`);
