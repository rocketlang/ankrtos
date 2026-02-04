#!/bin/bash

publish_project() {
  local JSON_FILE=$1
  local SCOPE=$2
  local PROJECT=$3
  
  echo "📦 Publishing $PROJECT..."
  
  node << NODEJS
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const packages = JSON.parse(fs.readFileSync('$JSON_FILE', 'utf-8'));
const OUTPUT_DIR = '/root/ankr-packages';
const REGISTRY = 'https://swayam.digimitra.guru/npm/';

let published = 0;

for (const pkg of packages) {
  try {
    const pkgName = pkg.name.replace('$SCOPE/', '');
    const pkgDir = path.join(OUTPUT_DIR, '$SCOPE', pkgName);
    
    if (!fs.existsSync(pkgDir)) {
      fs.mkdirSync(pkgDir, { recursive: true });
    }
    
    if (fs.existsSync(pkg.path)) {
      fs.copyFileSync(pkg.path, path.join(pkgDir, 'index.ts'));
    }
    
    const packageJson = {
      name: pkg.name,
      version: '1.0.0',
      description: pkg.description,
      main: 'index.ts',
      types: 'index.ts',
      keywords: ['$PROJECT', pkg.category],
      author: 'ANKR Labs',
      license: 'MIT',
      publishConfig: { registry: REGISTRY },
      exports: { '.': './index.ts', './package.json': './package.json' },
      files: ['index.ts', 'README.md']
    };
    
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(pkgDir, 'README.md'), \`# \${pkg.name}\n\n\${pkg.description}\n\nMIT\`);
    
    try {
      execSync(\`npm publish --registry \${REGISTRY}\`, { cwd: pkgDir, stdio: 'pipe' });
      console.log(\`  ✅ \${pkg.name}\`);
      published++;
    } catch (e) {
      if (e.message.includes('already published')) {
        console.log(\`  ⚠️  \${pkg.name}\`);
        published++;
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error(\`  ❌ \${pkg.name}\`);
  }
}

console.log(\`\n$PROJECT: \${published}/\${packages.length} published\n\`);
NODEJS
}

publish_project "/root/ANKR-CRM-PACKAGE-DISCOVERY.json" "@ankrcrm" "ANKR CRM"
publish_project "/root/POWER-ERP-PACKAGE-DISCOVERY.json" "@powererp" "Power ERP"

echo "✅ Complete!"
