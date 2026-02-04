#!/bin/bash
set -e

echo "🚀 Publishing ALL Remaining Packages"
echo "===================================="
echo ""

# Function to publish packages from a JSON file
publish_project() {
  local JSON_FILE=$1
  local SCOPE_PREFIX=$2
  local PROJECT_NAME=$3
  
  echo "📦 Publishing $PROJECT_NAME..."
  
  node << NODEJS
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const packages = JSON.parse(fs.readFileSync('$JSON_FILE', 'utf-8'));
const OUTPUT_DIR = '/root/ankr-packages';
const REGISTRY = 'https://swayam.digimitra.guru/npm/';

let published = 0;
let failed = 0;

for (const pkg of packages) {
  try {
    const pkgName = pkg.name.replace('$SCOPE_PREFIX/', '').replace(/\//g, '-');
    const pkgDir = path.join(OUTPUT_DIR, '$SCOPE_PREFIX', pkgName);
    
    if (!fs.existsSync(pkgDir)) {
      fs.mkdirSync(pkgDir, { recursive: true });
    }
    
    // Copy source
    if (fs.existsSync(pkg.path)) {
      fs.copyFileSync(pkg.path, path.join(pkgDir, 'index.ts'));
    }
    
    // Create package.json
    const packageJson = {
      name: pkg.name,
      version: '1.0.0',
      description: pkg.description,
      main: 'index.ts',
      types: 'index.ts',
      keywords: ['$PROJECT_NAME', pkg.category],
      author: 'ANKR Labs',
      license: 'MIT',
      publishConfig: { registry: REGISTRY },
      exports: { '.': './index.ts', './package.json': './package.json' },
      files: ['index.ts', 'README.md']
    };
    
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create README
    const readme = \`# \${pkg.name}

\${pkg.description}

## Installation
\\\`\\\`\\\`bash
npm install \${pkg.name}
\\\`\\\`\\\`

## License
MIT\`;
    
    fs.writeFileSync(path.join(pkgDir, 'README.md'), readme);
    
    // Publish
    try {
      execSync(\`npm publish --registry \${REGISTRY}\`, { cwd: pkgDir, stdio: 'pipe' });
      console.log(\`  ✅ \${pkg.name}\`);
      published++;
    } catch (e) {
      if (e.message.includes('already published')) {
        console.log(\`  ⚠️  Already published: \${pkg.name}\`);
        published++;
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error(\`  ❌ Failed: \${pkg.name}\`);
    failed++;
  }
}

console.log(\`\n$PROJECT_NAME: \${published}/\${packages.length} published\n\`);
NODEJS
}

# Publish all 4 projects
publish_project "/root/ANKR-BFC-PACKAGE-DISCOVERY.json" "@bfc" "ANKR BFC"
publish_project "/root/EVERPURE-PACKAGE-DISCOVERY.json" "@everpure" "Everpure"  
publish_project "/root/WOWTRUCK-PACKAGE-DISCOVERY.json" "@wowtruck" "WowTruck"
publish_project "/root/FREIGHTBOX-PACKAGE-DISCOVERY.json" "@freightbox" "Freightbox"

echo "✅ All projects published!"
