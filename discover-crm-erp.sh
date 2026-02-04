#!/bin/bash

echo "🔍 Discovering ANKR CRM & Power ERP packages..."

# ANKR CRM Discovery
echo ""
echo "📦 ANKR CRM Discovery..."
node << 'NODEJS'
const fs = require('fs');
const path = require('path');

const ROOT = '/root/ankr-labs-nx/apps/ankr-crm/backend/src';
const packages = [];

function extractExports(content) {
  const exports = new Set();
  const patterns = [
    /export\s+{([^}]+)}/g,
    /export\s+(const|function|class|interface|type|enum)\s+(\w+)/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !match[2]) {
        match[1].split(',').forEach(n => exports.add(n.trim().split(' as ')[0].trim()));
      } else if (match[2]) {
        exports.add(match[2]);
      }
    }
  });
  
  if (content.includes('export default')) exports.add('default');
  return Array.from(exports);
}

['ai', 'channels', 'integrations', 'resolvers', 'utils', 'voice'].forEach(dir => {
  const dirPath = path.join(ROOT, dir);
  if (!fs.existsSync(dirPath)) return;
  
  fs.readdirSync(dirPath).forEach(file => {
    if (file.endsWith('.ts') && !file.includes('.test.')) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const exports = extractExports(content);
      
      if (exports.length > 0) {
        const baseName = file.replace('.ts', '');
        packages.push({
          name: `@ankrcrm/${dir}-${baseName}`,
          description: `ANKR CRM ${dir} - ${baseName}`,
          path: filePath,
          files: [file],
          dependencies: [],
          category: 'backend',
          exports,
          size: content.length,
          reusability: 'medium',
          reason: 'CRM utility'
        });
      }
    }
  });
});

fs.writeFileSync('/root/ANKR-CRM-PACKAGE-DISCOVERY.json', JSON.stringify(packages, null, 2));
console.log(`✅ ANKR CRM: ${packages.length} packages discovered`);
NODEJS

# Power ERP Discovery
echo ""
echo "📦 Power ERP Discovery..."
node << 'NODEJS2'
const fs = require('fs');
const path = require('path');

const ROOT = '/root/power-erp/apps/api/src/modules';
const packages = [];

function extractExports(content) {
  const exports = new Set();
  const patterns = [
    /export\s+{([^}]+)}/g,
    /export\s+(const|function|class|interface|type|enum)\s+(\w+)/g
  ];
  
  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !match[2]) {
        match[1].split(',').forEach(n => exports.add(n.trim().split(' as ')[0].trim()));
      } else if (match[2]) {
        exports.add(match[2]);
      }
    }
  });
  
  if (content.includes('export default')) exports.add('default');
  return Array.from(exports);
}

if (fs.existsSync(ROOT)) {
  fs.readdirSync(ROOT).forEach(module => {
    const modulePath = path.join(ROOT, module);
    if (fs.statSync(modulePath).isDirectory()) {
      fs.readdirSync(modulePath).forEach(file => {
        if (file.endsWith('.ts') && !file.includes('.test.')) {
          const filePath = path.join(modulePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const exports = extractExports(content);
          
          if (exports.length > 0) {
            const baseName = file.replace('.ts', '').replace('.schema', '').replace('.service', '');
            packages.push({
              name: `@powererp/${module}-${baseName}`,
              description: `Power ERP ${module} - ${baseName}`,
              path: filePath,
              files: [file],
              dependencies: [],
              category: 'backend',
              exports,
              size: content.length,
              reusability: 'medium',
              reason: 'ERP module'
            });
          }
        }
      });
    }
  });
}

fs.writeFileSync('/root/POWER-ERP-PACKAGE-DISCOVERY.json', JSON.stringify(packages, null, 2));
console.log(`✅ Power ERP: ${packages.length} packages discovered`);
NODEJS2

echo ""
echo "✅ Discovery complete!"
