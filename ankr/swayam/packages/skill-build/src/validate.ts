#!/usr/bin/env tsx
/**
 * ANKR Skill Validator
 * Validates skill structure and metadata
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SKILLS_DIR = join(ROOT, 'skills');

interface ValidationError {
  skill: string;
  error: string;
  severity: 'error' | 'warning';
}

const errors: ValidationError[] = [];

function addError(skill: string, error: string, severity: 'error' | 'warning' = 'error') {
  errors.push({ skill, error, severity });
}

function validateFrontmatter(skill: string, content: string): boolean {
  if (!content.startsWith('---')) {
    addError(skill, 'Missing YAML frontmatter');
    return false;
  }

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    addError(skill, 'Invalid YAML frontmatter format');
    return false;
  }

  const yaml = match[1];

  if (!yaml.includes('name:')) {
    addError(skill, 'Missing required field: name');
    return false;
  }

  if (!yaml.includes('description:')) {
    addError(skill, 'Missing required field: description');
    return false;
  }

  return true;
}

function validateScripts(skill: string, skillPath: string): void {
  const scriptsDir = join(skillPath, 'scripts');

  if (!existsSync(scriptsDir)) {
    addError(skill, 'Missing scripts directory', 'warning');
    return;
  }

  const scripts = readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));

  if (scripts.length === 0) {
    addError(skill, 'No shell scripts found in scripts directory', 'warning');
    return;
  }

  for (const script of scripts) {
    const scriptPath = join(scriptsDir, script);
    const stats = statSync(scriptPath);

    // Check executable bit
    if (!(stats.mode & 0o111)) {
      addError(skill, `Script not executable: ${script}`, 'warning');
    }

    // Check shebang
    const content = readFileSync(scriptPath, 'utf-8');
    if (!content.startsWith('#!/')) {
      addError(skill, `Missing shebang in: ${script}`, 'warning');
    }
  }
}

function validateSkill(skillDir: string): void {
  const skillPath = join(SKILLS_DIR, skillDir);
  const skillMdPath = join(skillPath, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    addError(skillDir, 'Missing SKILL.md file');
    return;
  }

  const content = readFileSync(skillMdPath, 'utf-8');

  // Validate frontmatter
  validateFrontmatter(skillDir, content);

  // Validate scripts
  validateScripts(skillDir, skillPath);

  // Check file size (should be under 500 lines for context efficiency)
  const lineCount = content.split('\n').length;
  if (lineCount > 500) {
    addError(skillDir, `SKILL.md exceeds 500 lines (${lineCount} lines)`, 'warning');
  }
}

function getSkillDirs(): string[] {
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  const dirs: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = join(SKILLS_DIR, entry.name, 'SKILL.md');
      if (existsSync(skillPath)) {
        dirs.push(entry.name);
      }

      // Check for nested skills
      const nestedPath = join(SKILLS_DIR, entry.name);
      try {
        const nestedEntries = readdirSync(nestedPath, { withFileTypes: true });
        for (const nested of nestedEntries) {
          if (nested.isDirectory()) {
            const nestedSkillPath = join(nestedPath, nested.name, 'SKILL.md');
            if (existsSync(nestedSkillPath)) {
              dirs.push(`${entry.name}/${nested.name}`);
            }
          }
        }
      } catch (e) {
        // Ignore read errors for non-directories
      }
    }
  }

  return dirs.sort();
}

// Main
console.log('Validating skills...\n');

const skills = getSkillDirs();
for (const skill of skills) {
  validateSkill(skill);
}

// Print results
const errorCount = errors.filter(e => e.severity === 'error').length;
const warningCount = errors.filter(e => e.severity === 'warning').length;

if (errors.length > 0) {
  console.log('Issues found:\n');

  for (const { skill, error, severity } of errors) {
    const icon = severity === 'error' ? '✗' : '⚠';
    console.log(`  ${icon} [${skill}] ${error}`);
  }

  console.log('');
}

console.log(`Validated ${skills.length} skills`);
console.log(`  Errors: ${errorCount}`);
console.log(`  Warnings: ${warningCount}`);

if (errorCount > 0) {
  process.exit(1);
}

console.log('\n✓ Validation passed');
