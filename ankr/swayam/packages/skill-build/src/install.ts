#!/usr/bin/env tsx
/**
 * ANKR Skill Installer
 * Installs skills to Claude Code (~/.claude/skills/)
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SKILLS_DIR = join(ROOT, 'skills');
const CLAUDE_SKILLS_DIR = join(homedir(), '.claude', 'skills');

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
console.log('Installing skills to Claude Code...\n');

// Ensure target directory exists
if (!existsSync(CLAUDE_SKILLS_DIR)) {
  mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
  console.log(`Created ${CLAUDE_SKILLS_DIR}`);
}

const skills = getSkillDirs();
let installed = 0;

for (const skill of skills) {
  const srcPath = join(SKILLS_DIR, skill);
  const destPath = join(CLAUDE_SKILLS_DIR, skill);

  try {
    cpSync(srcPath, destPath, { recursive: true });
    console.log(`  ✓ ${skill}`);
    installed++;
  } catch (error) {
    console.log(`  ✗ ${skill}: ${(error as Error).message}`);
  }
}

console.log(`\n✓ Installed ${installed}/${skills.length} skills to ${CLAUDE_SKILLS_DIR}`);
