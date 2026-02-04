#!/bin/bash
LIBS_DIR="$HOME/ankr-labs-nx/libs"

for dir in $LIBS_DIR/*/; do
  name=$(basename "$dir")
  
  # Skip if package.json exists
  [ -f "$dir/package.json" ] && continue
  
  # Skip certain folders
  [[ "$name" == "src" || "$name" == "generated-code" || "$name" == "pipeline-output" ]] && continue
  
  echo "📦 Creating package.json for $name..."
  
  cat > "$dir/package.json" << EOF
{
  "name": "@ankr/lib-$name",
  "version": "1.0.0",
  "description": "ANKR $name library",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "keywords": ["ankr", "$name"],
  "author": "ANKR Labs",
  "license": "MIT"
}
EOF

  # Create index.ts if not exists
  [ ! -f "$dir/src/index.ts" ] && mkdir -p "$dir/src" && echo "// $name library\nexport {};" > "$dir/src/index.ts"
  
  echo "  ✅ $name ready"
done

echo ""
echo "Done! Run: cd ~/ankr-labs-nx && pnpm install"
