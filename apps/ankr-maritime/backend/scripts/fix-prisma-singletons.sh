#!/bin/bash
# Fix Prisma Client Instantiation - Use Singleton Pattern
# This script replaces individual PrismaClient instances with the shared singleton

echo "🔍 Finding files with new PrismaClient()..."

# Find all TypeScript files that create new PrismaClient
files=$(grep -rl "new PrismaClient" src --include="*.ts" | grep -v "lib/prisma.ts" | grep -v "schema/context.ts")

count=0
for file in $files; do
  # Check if file already imports from lib/prisma
  if ! grep -q "from.*['\"].*lib/prisma" "$file" && ! grep -q "from.*['\"]\\.\\.*/lib/prisma" "$file"; then
    echo "📝 Processing: $file"

    # Add import at the top (after existing imports)
    # This is a simple approach - manually review complex cases
    sed -i "/^import.*from/a import { prisma } from '../lib/prisma.js';" "$file" 2>/dev/null || \
    sed -i "/^import.*from/a import { prisma } from '../../lib/prisma.js';" "$file" 2>/dev/null || \
    sed -i "/^import.*from/a import { prisma } from '../../../lib/prisma.js';" "$file" 2>/dev/null

    # Comment out new PrismaClient() declarations
    sed -i 's/^\(\s*\)const prisma = new PrismaClient/\1\/\/ const prisma = new PrismaClient/' "$file"
    sed -i 's/^\(\s*\)const db = new PrismaClient/\1\/\/ const db = new PrismaClient/' "$file"
    sed -i 's/^\(\s*\)private prisma = new PrismaClient/\1\/\/ private prisma = new PrismaClient/' "$file"

    ((count++))
  fi
done

echo "✅ Processed $count files"
echo "⚠️  Please review changes manually - some files may need custom adjustments"
