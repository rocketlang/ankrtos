#!/usr/bin/env tsx
/**
 * Migration Script: Convert all services to use production-grade DB manager
 *
 * This script:
 * 1. Finds all files creating new PrismaClient()
 * 2. Replaces them with getPrisma() imports
 * 3. Removes redundant PrismaClient instantiations
 * 4. Generates a migration report
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface MigrationResult {
  file: string;
  status: 'success' | 'skip' | 'manual' | 'error';
  changes: string[];
  error?: string;
}

const results: MigrationResult[] = [];

// Files to skip (already migrated or special cases)
const SKIP_FILES = [
  'src/lib/prisma.ts',
  'src/lib/db.ts',
  'src/schema/context.ts', // GraphQL context - needs special handling
];

async function findFilesWithPrismaClient(): Promise<string[]> {
  const files = await glob('src/**/*.ts', { cwd: '/root/apps/ankr-maritime/backend' });
  const matches: string[] = [];

  for (const file of files) {
    if (SKIP_FILES.some(skip => file.includes(skip))) continue;

    const content = fs.readFileSync(
      path.join('/root/apps/ankr-maritime/backend', file),
      'utf-8'
    );

    if (content.includes('new PrismaClient')) {
      matches.push(file);
    }
  }

  return matches;
}

function calculateRelativePath(fromFile: string): string {
  const depth = fromFile.split('/').length - 2; // Subtract 'src' and filename
  return '../'.repeat(depth) + 'lib/db.js';
}

async function migrateFile(filePath: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    file: filePath,
    status: 'success',
    changes: [],
  };

  try {
    const fullPath = path.join('/root/apps/ankr-maritime/backend', filePath);
    let content = fs.readFileSync(fullPath, 'utf-8');
    let modified = false;

    // Check if file already imports from db.ts
    if (content.includes("from './lib/db") || content.includes("from '../lib/db")) {
      result.status = 'skip';
      result.changes.push('Already uses db manager');
      return result;
    }

    // Add import if not present
    if (!content.includes('getPrisma')) {
      const relativePath = calculateRelativePath(filePath);
      const importStatement = `import { getPrisma } from '${relativePath}';\n`;

      // Find best place to insert import (after other imports)
      const importRegex = /^import .* from .*['"'];$/gm;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        content =
          content.slice(0, lastImportIndex + lastImport.length) +
          '\n' +
          importStatement +
          content.slice(lastImportIndex + lastImport.length);
      } else {
        // No imports found, add at top after shebang/comments
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (
            !lines[i].startsWith('/*') &&
            !lines[i].startsWith('*') &&
            !lines[i].startsWith('//') &&
            !lines[i].startsWith('#!') &&
            lines[i].trim() !== ''
          ) {
            insertIndex = i;
            break;
          }
        }
        lines.splice(insertIndex, 0, importStatement);
        content = lines.join('\n');
      }

      modified = true;
      result.changes.push('Added getPrisma import');
    }

    // Pattern 1: const prisma = new PrismaClient(...)
    if (/const\s+prisma\s*=\s*new\s+PrismaClient\(/g.test(content)) {
      content = content.replace(
        /const\s+prisma\s*=\s*new\s+PrismaClient\([^)]*\);?/g,
        '// Migrated to shared DB manager - use getPrisma()\nconst prisma = await getPrisma();'
      );
      modified = true;
      result.changes.push('Replaced const prisma = new PrismaClient()');
    }

    // Pattern 2: private prisma = new PrismaClient()
    if (/private\s+prisma\s*=\s*new\s+PrismaClient\(/g.test(content)) {
      content = content.replace(
        /private\s+prisma\s*=\s*new\s+PrismaClient\([^)]*\);?/g,
        '// TODO: Migrate to use getPrisma() in constructor\n  // private prisma = new PrismaClient();'
      );
      result.status = 'manual';
      result.changes.push('Class property - needs manual migration');
    }

    // Pattern 3: this.prisma = new PrismaClient()
    if (/this\.prisma\s*=\s*new\s+PrismaClient\(/g.test(content)) {
      result.status = 'manual';
      result.changes.push('Instance assignment - needs manual migration');
    }

    if (modified && result.status !== 'manual') {
      fs.writeFileSync(fullPath, content);
    }
  } catch (error: any) {
    result.status = 'error';
    result.error = error.message;
  }

  return result;
}

async function main() {
  console.log('🔍 Finding files with PrismaClient instantiations...\n');

  const files = await findFilesWithPrismaClient();

  console.log(`📁 Found ${files.length} files to migrate\n`);

  for (const file of files) {
    const result = await migrateFile(file);
    results.push(result);

    const statusIcon =
      result.status === 'success'
        ? '✅'
        : result.status === 'skip'
        ? '⏭️ '
        : result.status === 'manual'
        ? '⚠️ '
        : '❌';

    console.log(`${statusIcon} ${file}`);
    if (result.changes.length > 0) {
      result.changes.forEach(change => console.log(`   ${change}`));
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  }

  // Summary
  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    skip: results.filter(r => r.status === 'skip').length,
    manual: results.filter(r => r.status === 'manual').length,
    error: results.filter(r => r.status === 'error').length,
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total files:        ${summary.total}`);
  console.log(`✅ Migrated:        ${summary.success}`);
  console.log(`⏭️  Skipped:         ${summary.skip}`);
  console.log(`⚠️  Needs manual:    ${summary.manual}`);
  console.log(`❌ Errors:          ${summary.error}`);
  console.log('='.repeat(60));

  if (summary.manual > 0) {
    console.log('\n⚠️  Files requiring manual migration:');
    results
      .filter(r => r.status === 'manual')
      .forEach(r => {
        console.log(`   - ${r.file}`);
        r.changes.forEach(change => console.log(`     ${change}`));
      });
  }

  if (summary.error > 0) {
    console.log('\n❌ Files with errors:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   - ${r.file}: ${r.error}`);
      });
  }

  console.log('\n✅ Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review files marked as "manual"');
  console.log('   2. Run tests: npm test');
  console.log('   3. Restart services: pm2 restart all');
  console.log('   4. Monitor connections: npm run db:monitor\n');
}

main().catch(console.error);
