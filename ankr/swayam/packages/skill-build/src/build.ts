#!/usr/bin/env tsx
/**
 * ANKR Skill Builder
 * Compiles all skills into a unified AGENTS.md document
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SKILLS_DIR = join(ROOT, 'skills');
const OUTPUT_FILE = join(ROOT, 'AGENTS.md');

interface SkillMetadata {
  name: string;
  description: string;
  metadata?: {
    author?: string;
    version?: string;
  };
}

function parseYamlFrontmatter(content: string): { metadata: SkillMetadata; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { metadata: { name: 'unknown', description: '' }, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];

  // Simple YAML parsing (for basic frontmatter)
  const metadata: Record<string, any> = {};
  let currentKey = '';
  let inMetadata = false;

  for (const line of yamlStr.split('\n')) {
    if (line.startsWith('metadata:')) {
      inMetadata = true;
      metadata.metadata = {};
      continue;
    }

    if (inMetadata && line.match(/^\s{2}\w/)) {
      const [key, ...valueParts] = line.trim().split(':');
      metadata.metadata[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
    } else if (line.includes(':') && !line.startsWith(' ')) {
      const [key, ...valueParts] = line.split(':');
      metadata[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      inMetadata = false;
    }
  }

  return { metadata: metadata as SkillMetadata, body };
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

      // Check for nested skills (like claude.ai/vercel-deploy-claimable)
      const nestedPath = join(SKILLS_DIR, entry.name);
      const nestedEntries = readdirSync(nestedPath, { withFileTypes: true });
      for (const nested of nestedEntries) {
        if (nested.isDirectory()) {
          const nestedSkillPath = join(nestedPath, nested.name, 'SKILL.md');
          if (existsSync(nestedSkillPath)) {
            dirs.push(`${entry.name}/${nested.name}`);
          }
        }
      }
    }
  }

  return dirs.sort();
}

function buildSkillSection(skillDir: string): string {
  const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
  const content = readFileSync(skillPath, 'utf-8');
  const { metadata, body } = parseYamlFrontmatter(content);

  const version = metadata.metadata?.version || '1.0.0';
  const author = metadata.metadata?.author || 'ankr';

  return `
## ${metadata.name}

**Version:** ${version} | **Author:** ${author}

**Triggers:** ${metadata.description}

${body.trim()}

---
`;
}

function buildAgentsMd(): string {
  const skills = getSkillDirs();

  // Separate ANKR skills from Vercel skills
  const ankrSkills = skills.filter(s => s.startsWith('ankr-'));
  const vercelSkills = skills.filter(s => !s.startsWith('ankr-'));

  let output = `# ANKR Agent Skills

> Auto-generated from skill definitions. Do not edit directly.
> Last updated: ${new Date().toISOString()}

## Overview

This document contains ${skills.length} skills for the ANKR ecosystem:
- ${ankrSkills.length} ANKR-specific skills
- ${vercelSkills.length} Vercel skills

## Skill Index

| Skill | Description |
|-------|-------------|
`;

  for (const skillDir of skills) {
    const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');
    const { metadata } = parseYamlFrontmatter(content);
    const shortDesc = metadata.description.split('.')[0];
    output += `| \`${metadata.name}\` | ${shortDesc} |\n`;
  }

  output += `
---

# ANKR Skills

`;

  for (const skillDir of ankrSkills) {
    output += buildSkillSection(skillDir);
  }

  output += `
# Vercel Skills

`;

  for (const skillDir of vercelSkills) {
    output += buildSkillSection(skillDir);
  }

  return output;
}

// Main
console.log('Building AGENTS.md...');
const content = buildAgentsMd();
writeFileSync(OUTPUT_FILE, content);
console.log(`✓ Generated ${OUTPUT_FILE}`);

const skills = getSkillDirs();
console.log(`✓ Compiled ${skills.length} skills`);
