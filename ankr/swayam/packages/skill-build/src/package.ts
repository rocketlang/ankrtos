#!/usr/bin/env tsx
/**
 * ANKR Skill Packager
 * Creates distributable zip packages for each skill
 */

import { existsSync, readdirSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SKILLS_DIR = join(ROOT, 'skills');
const DIST_DIR = join(ROOT, 'dist');

function getSkillDirs(): string[] {
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  const dirs: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = join(SKILLS_DIR, entry.name, 'SKILL.md');
      if (existsSync(skillPath)) {
        dirs.push(entry.name);
      }
    }
  }

  return dirs.sort();
}

// Main
console.log('Packaging skills...\n');

// Ensure dist directory exists
if (!existsSync(DIST_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
}

const skills = getSkillDirs();
let packaged = 0;

for (const skill of skills) {
  const srcPath = join(SKILLS_DIR, skill);
  const zipPath = join(DIST_DIR, `${skill}.zip`);

  try {
    // Create zip using system command
    execSync(`cd "${srcPath}" && zip -r "${zipPath}" . -x "*.git*"`, { stdio: 'pipe' });
    console.log(`  ✓ ${skill}.zip`);
    packaged++;
  } catch (error) {
    console.log(`  ✗ ${skill}: ${(error as Error).message}`);
  }
}

console.log(`\n✓ Packaged ${packaged}/${skills.length} skills to ${DIST_DIR}`);
