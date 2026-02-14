/**
 * @ankr/pkg-crawler - Core Crawler Engine
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  PackageInfo,
  FunctionInfo,
  TrainingExample,
  CrawlerConfig,
  CrawlerResult
} from './types';

const DEFAULT_CONFIG: Required<CrawlerConfig> = {
  repos: [],
  outputDir: './data',
  packagePrefix: '@ankr/',
  maxDepth: 5,
  eonUrl: 'http://localhost:4005',
  verdaccioUrl: 'http://localhost:4873',
  categories: {
    compliance: /compliance|gst|tds|itr|tax/,
    crm: /crm|lead|contact|deal|sales/,
    erp: /erp|inventory|warehouse|purchase/,
    logistics: /tms|transport|fleet|logistics|truck|gps/,
    voice: /voice|speech|stt|tts|bani/,
    ai: /ai|llm|intelligence|eon|embedding/,
    auth: /auth|oauth|iam|security/,
    banking: /banking|upi|payment/,
    gov: /gov|aadhaar|digilocker|ulip/,
    ui: /ui|widget|component/,
    i18n: /i18n|translate|localization|multilingual|lang/,
  },
  prompts: {
    compliance: ['Create a GST invoice system', 'Build a TDS calculator', 'Validate GSTIN numbers'],
    crm: ['Build a sales CRM', 'Create contact management', 'Build a deal pipeline'],
    logistics: ['Create fleet tracking', 'Build trip planning', 'Track vehicles on map'],
    voice: ['Add voice input', 'Create Hindi voice assistant', 'Build text-to-speech'],
    ai: ['Add AI chat', 'Create chatbot with memory', 'Build RAG system'],
    auth: ['Add Google login', 'Implement RBAC', 'Create OTP verification'],
    i18n: ['Translate website to Hindi', 'Add multilingual support', 'Create language switcher'],
    banking: ['Add UPI payments', 'Create payment gateway', 'Build wallet system'],
    erp: ['Build inventory system', 'Create purchase orders', 'Manage warehouse'],
    ui: ['Create dashboard widgets', 'Build data tables', 'Create charts'],
    gov: ['Verify Aadhaar', 'Fetch DigiLocker docs', 'Check vehicle details'],
  },
};

export class PackageCrawler {
  private config: Required<CrawlerConfig>;
  private packages: PackageInfo[] = [];
  private trainingExamples: TrainingExample[] = [];

  constructor(config: CrawlerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scan all configured repos
   */
  async scan(): Promise<CrawlerResult> {
    console.log('🔍 Scanning repos for packages...\n');

    for (const repoPath of this.config.repos) {
      if (!fs.existsSync(repoPath)) {
        console.log(`  ⚠️  Repo not found: ${repoPath}`);
        continue;
      }

      console.log(`📁 Scanning: ${repoPath}`);
      await this.scanDirectory(repoPath);
    }

    console.log(`\n✅ Found ${this.packages.length} packages`);

    // Generate training data
    this.generateTrainingData();

    return this.getResult();
  }

  /**
   * Recursively scan directory
   */
  private async scanDirectory(dir: string, depth = 0): Promise<void> {
    if (depth > this.config.maxDepth) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        const pkgJsonPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          const pkg = await this.extractPackageInfo(fullPath, pkgJsonPath);
          if (pkg && pkg.name.startsWith(this.config.packagePrefix)) {
            this.packages.push(pkg);
            console.log(`  📦 ${pkg.name} (${pkg.version})`);
          }
        }
        await this.scanDirectory(fullPath, depth + 1);
      }
    }
  }

  /**
   * Extract package metadata
   */
  private async extractPackageInfo(pkgDir: string, pkgJsonPath: string): Promise<PackageInfo | null> {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (!pkgJson.name) return null;

      return {
        name: pkgJson.name,
        version: pkgJson.version || '0.0.0',
        description: pkgJson.description || '',
        main: pkgJson.main || 'dist/index.js',
        types: pkgJson.types,
        keywords: pkgJson.keywords || [],
        dependencies: pkgJson.dependencies || {},
        devDependencies: pkgJson.devDependencies || {},
        peerDependencies: pkgJson.peerDependencies || {},
        exports: this.extractExports(pkgDir),
        functions: this.extractFunctions(pkgDir),
        usageExamples: this.findUsageExamples(pkgDir),
        sourcePath: pkgDir,
        category: this.categorize(pkgJson.name, pkgJson.keywords || []),
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract exports from index file
   */
  private extractExports(pkgDir: string): string[] {
    const exports: string[] = [];
    const indexFiles = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];

    for (const indexFile of indexFiles) {
      const filePath = path.join(pkgDir, indexFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        const exportMatches = content.matchAll(/export\s+(?:const|function|class|type|interface|enum)\s+(\w+)/g);
        for (const match of exportMatches) exports.push(match[1]);

        const reExportMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
        for (const match of reExportMatches) {
          const names = match[1].split(',').map(n => n.trim().split(' as ')[0].trim());
          exports.push(...names);
        }
        break;
      }
    }
    return [...new Set(exports)];
  }

  /**
   * Extract function signatures
   */
  private extractFunctions(pkgDir: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const srcDir = path.join(pkgDir, 'src');
    if (!fs.existsSync(srcDir)) return functions;

    const tsFiles = this.findFiles(srcDir, '.ts').slice(0, 10);

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const funcMatches = content.matchAll(
        /\/\*\*\s*([\s\S]*?)\*\/\s*export\s+(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)\s*:\s*([^\{]+)/g
      );

      for (const match of funcMatches) {
        const [, jsdoc, name, generics, params, returnType] = match;
        functions.push({
          name,
          signature: `${name}${generics || ''}(${params}): ${returnType.trim()}`,
          description: this.parseJSDoc(jsdoc),
          params: this.parseParams(params),
          returnType: returnType.trim(),
        });
      }
    }
    return functions.slice(0, 20);
  }

  /**
   * Find usage examples
   */
  private findUsageExamples(pkgDir: string): string[] {
    const examples: string[] = [];

    const readmePath = path.join(pkgDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      const codeBlocks = content.matchAll(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/g);
      for (const match of codeBlocks) {
        if (match[1].length < 500) examples.push(match[1].trim());
      }
    }

    return examples.slice(0, 5);
  }

  /**
   * Categorize package
   */
  private categorize(name: string, keywords: string[]): string {
    const allText = `${name} ${keywords.join(' ')}`.toLowerCase();

    for (const [category, pattern] of Object.entries(this.config.categories)) {
      if (pattern.test(allText)) return category;
    }
    return 'core';
  }

  /**
   * Generate training data
   */
  private generateTrainingData(): void {
    console.log('\n📚 Generating training data...\n');

    for (const pkg of this.packages) {
      const prompts = this.config.prompts[pkg.category] || [];

      for (const prompt of prompts) {
        this.trainingExamples.push({
          prompt,
          packages: [pkg.name, ...Object.keys(pkg.dependencies).filter(d => d.startsWith(this.config.packagePrefix))],
          code: this.generateExampleCode(pkg),
          category: pkg.category,
        });
      }

      // Function-based prompts
      for (const func of pkg.functions.slice(0, 3)) {
        this.trainingExamples.push({
          prompt: `How do I use ${func.name} from ${pkg.name}?`,
          packages: [pkg.name],
          code: `import { ${func.name} } from '${pkg.name}';\n\n// ${func.description}\n// ${func.signature}`,
          category: pkg.category,
        });
      }
    }

    console.log(`✅ Generated ${this.trainingExamples.length} training examples`);
  }

  /**
   * Generate example code
   */
  private generateExampleCode(pkg: PackageInfo): string {
    const imports = pkg.exports.length > 0
      ? `import { ${pkg.exports.slice(0, 5).join(', ')} } from '${pkg.name}';`
      : `import ${pkg.name.split('/')[1]} from '${pkg.name}';`;
    const example = pkg.usageExamples[0] || `// Use ${pkg.name} for ${pkg.description}`;
    return `${imports}\n\n${example}`;
  }

  // Helper methods
  private findFiles(dir: string, ext: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          files.push(...this.findFiles(fullPath, ext));
        } else if (entry.name.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    } catch { /* ignore */ }
    return files;
  }

  private parseJSDoc(jsdoc: string): string {
    const lines = jsdoc.split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim());
    return lines.filter(l => l && !l.startsWith('@')).join(' ').trim();
  }

  private parseParams(params: string): { name: string; type: string }[] {
    return params.split(',').map(p => {
      const [name, type] = p.split(':').map(s => s.trim());
      return { name: name || '', type: type || 'any' };
    }).filter(p => p.name);
  }

  /**
   * Get crawl result
   */
  getResult(): CrawlerResult {
    const byCategory: Record<string, number> = {};
    for (const pkg of this.packages) {
      byCategory[pkg.category] = (byCategory[pkg.category] || 0) + 1;
    }

    return {
      packages: this.packages,
      trainingExamples: this.trainingExamples,
      byCategory,
      totalPackages: this.packages.length,
      totalExamples: this.trainingExamples.length,
    };
  }

  /**
   * Save results to files
   */
  save(outputDir?: string): void {
    const dir = outputDir || this.config.outputDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dir, 'package-catalog.json'),
      JSON.stringify(this.packages, null, 2)
    );
    console.log(`📄 Package catalog saved to: ${dir}/package-catalog.json`);

    fs.writeFileSync(
      path.join(dir, 'vibecoder-training.json'),
      JSON.stringify(this.trainingExamples, null, 2)
    );
    console.log(`📄 Training data saved to: ${dir}/vibecoder-training.json`);
  }

  /**
   * Store in EON memory
   */
  async storeInEON(): Promise<boolean> {
    console.log('\n🧠 Storing in EON memory...');

    try {
      const response = await fetch(`${this.config.eonUrl}/api/memory/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'package_catalog',
          content: JSON.stringify({
            packages: this.packages.map(p => ({
              name: p.name,
              description: p.description,
              category: p.category,
              exports: p.exports,
            })),
            lastUpdated: new Date().toISOString(),
          }),
          tags: ['vibecoder', 'packages', 'training'],
        }),
      });

      if (response.ok) {
        console.log('✅ Stored in EON memory');
        return true;
      }
    } catch {
      console.log('⚠️  Could not store in EON (service may be down)');
    }
    return false;
  }

  /**
   * Print summary
   */
  printSummary(): void {
    const result = this.getResult();

    console.log('\n' + '═'.repeat(60));
    console.log('📊 PACKAGE CRAWLER SUMMARY');
    console.log('═'.repeat(60));

    console.log('\nPackages by category:');
    for (const [cat, count] of Object.entries(result.byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat.padEnd(15)} ${count}`);
    }

    console.log(`\nTotal packages: ${result.totalPackages}`);
    console.log(`Training examples: ${result.totalExamples}`);
    console.log('═'.repeat(60));
  }
}

export default PackageCrawler;
