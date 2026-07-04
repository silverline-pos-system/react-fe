const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src", "admin");
const destDir = path.join(__dirname, "src", "features", "admin");

// Helper to copy directory recursively
function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, path.join(target, file));
      } else {
        // Copy file
        fs.copyFileSync(curSource, path.join(target, file));
      }
    });
  }
}

console.log("Starting admin migration...");
// 1. Copy src/admin to src/features/admin
copyFolderRecursiveSync(srcDir, destDir);
console.log("Copied src/admin to src/features/admin");

// 2. Move src/features/admin/AdminDashboard.jsx to src/features/admin/pages/AdminDashboard.jsx
const oldDashboardPath = path.join(destDir, "AdminDashboard.jsx");
const newDashboardPath = path.join(destDir, "pages", "AdminDashboard.jsx");
if (fs.existsSync(oldDashboardPath)) {
  fs.renameSync(oldDashboardPath, newDashboardPath);
  console.log("Moved AdminDashboard.jsx to pages/AdminDashboard.jsx");
}

// 3. Copy src/services/printHeaderFooterService.js to src/features/admin/services/printHeaderFooterService.js
const origPrintService = path.join(__dirname, "src", "services", "printHeaderFooterService.js");
const destPrintService = path.join(destDir, "services", "printHeaderFooterService.js");
fs.copyFileSync(origPrintService, destPrintService);
console.log("Copied printHeaderFooterService.js");

// Helper to recursively process files and replace strings
function processFiles(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processFiles(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
      let content = fs.readFileSync(filePath, "utf8");
      
      // Perform general replacements
      content = content.replace(/\"\.\.\/\.\.\/pos\//g, '"@/features/pos/');
      content = content.replace(/\'\.\.\/\.\.\/pos\//g, "'@/features/pos/");
      
      content = content.replace(/\"\.\.\/\.\.\/context\//g, '"@/context/');
      content = content.replace(/\'\.\.\/\.\.\/context\//g, "'@/context/");
      content = content.replace(/\"\.\.\/\.\.\/hooks\//g, '"@/hooks/');
      content = content.replace(/\'\.\.\/\.\.\/hooks\//g, "'@/hooks/");
      content = content.replace(/\"\.\.\/\.\.\/services\//g, '"@/services/');
      content = content.replace(/\'\.\.\/\.\.\/services\//g, "'@/services/");

      content = content.replace(/\"\.\.\/\.\.\/\.\.\/context\//g, '"@/context/');
      content = content.replace(/\'\.\.\/\.\.\/\.\.\/context\//g, "'@/context/");
      content = content.replace(/\"\.\.\/\.\.\/\.\.\/hooks\//g, '"@/hooks/');
      content = content.replace(/\'\.\.\/\.\.\/\.\.\/hooks\//g, "'@/hooks/");
      content = content.replace(/\"\.\.\/\.\.\/\.\.\/services\//g, '"@/services/');
      content = content.replace(/\'\.\.\/\.\.\/\.\.\/services\//g, "'@/services/");

      // In adminApi.js
      if (file === "adminApi.js") {
        content = content.replace(/import api from \"\.\.\/\.\.\/services\/api\"/g, 'import api from "@/services/api"');
        content = content.replace(/import api from \'\.\.\/\.\.\/services\/api\'/g, 'import api from "@/services/api"');
      }

      // In printHeaderFooterService.js
      if (file === "printHeaderFooterService.js") {
        content = content.replace(/import api from \"\.\/api\"/g, 'import api from "@/services/api"');
        content = content.replace(/import api from \'\.\/api\'/g, 'import api from "@/services/api"');
      }

      // In AdminDashboard.jsx (moved to pages/)
      if (filePath.endsWith("pages" + path.sep + "AdminDashboard.jsx")) {
        content = content.replace(/import Layout from \"\.\/layout\/Layout\"/g, 'import Layout from "../layout/Layout"');
        content = content.replace(/import Layout from \'\.\/layout\/Layout\'/g, 'import Layout from "../layout/Layout"');
        
        // pages relative imports inside AdminDashboard.jsx
        content = content.replace(/\"\.\/pages\//g, '"./');
        content = content.replace(/\'\.\/pages\//g, "'./");
      }

      fs.writeFileSync(filePath, content, "utf8");
    }
  });
}

processFiles(destDir);
console.log("Completed import replacements in features/admin");
