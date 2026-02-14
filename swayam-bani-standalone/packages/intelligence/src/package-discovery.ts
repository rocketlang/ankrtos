/**
 * SWAYAM Package Discovery
 * Indexes and searches @ankr packages from Verdaccio
 */

import type { PackageInfo, IntentDomain } from './types';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE METADATA - Pre-defined capabilities for known packages
// ═══════════════════════════════════════════════════════════════════════════════

const PACKAGE_CAPABILITIES: Record<string, { domain: IntentDomain; capabilities: string[]; tools?: string[] }> = {
  // Compliance packages
  '@ankr/compliance-gst': {
    domain: 'compliance',
    capabilities: ['gst verification', 'gst calculation', 'hsn lookup', 'gstr filing', 'eway bill', 'einvoice'],
    tools: ['gst_verify', 'gst_calc', 'hsn_lookup', 'gstr1_prepare', 'eway_generate', 'einvoice_generate']
  },
  '@ankr/compliance-tds': {
    domain: 'compliance',
    capabilities: ['tds calculation', 'tds filing', 'form 16', 'form 24q', 'form 26q', 'challan'],
    tools: ['tds_calc', 'tds_24q_prepare', 'tds_26q_prepare', 'form16_generate']
  },
  '@ankr/compliance-itr': {
    domain: 'compliance',
    capabilities: ['income tax calculation', 'itr filing', '80c deduction', '80d deduction', 'tax regime'],
    tools: ['income_tax_calc', 'itr_80c_check', 'itr_regime_compare']
  },
  '@ankr/compliance-mca': {
    domain: 'compliance',
    capabilities: ['company search', 'din verification', 'cin lookup', 'director search', 'mca filing'],
    tools: ['mca_company_search', 'mca_din_verify', 'mca_cin_lookup']
  },
  '@ankr/complymitra': {
    domain: 'compliance',
    capabilities: ['all compliance', 'gst', 'tds', 'itr', 'mca', 'pan verification'],
    tools: ['gst_verify', 'pan_verify', 'tds_calc', 'income_tax_calc']
  },

  // ERP packages
  '@ankr/erp-accounting': {
    domain: 'erp',
    capabilities: ['journal entry', 'ledger', 'trial balance', 'balance sheet', 'profit loss', 'cash flow'],
    tools: ['journal_entry', 'ledger_balance', 'trial_balance', 'balance_sheet', 'profit_loss']
  },
  '@ankr/erp-inventory': {
    domain: 'erp',
    capabilities: ['stock check', 'inventory management', 'stock transfer', 'batch tracking'],
    tools: ['stock_check', 'stock_adjust', 'stock_transfer', 'batch_track']
  },
  '@ankr/erp-sales': {
    domain: 'erp',
    capabilities: ['sales order', 'quotation', 'delivery', 'sales invoice'],
    tools: ['so_create', 'quotation_create', 'delivery_create', 'sales_invoice']
  },
  '@ankr/erp-procurement': {
    domain: 'erp',
    capabilities: ['purchase order', 'purchase requisition', 'grn', 'vendor management'],
    tools: ['po_create', 'pr_create', 'grn_create', 'vendor_list']
  },

  // CRM packages
  '@ankr/crm-core': {
    domain: 'crm',
    capabilities: ['lead management', 'contact management', 'opportunity tracking', 'pipeline'],
    tools: ['lead_create', 'contact_create', 'opportunity_create', 'opportunity_pipeline']
  },

  // Banking packages
  '@ankr/banking-upi': {
    domain: 'banking',
    capabilities: ['upi payment', 'upi transfer', 'upi mandate', 'autopay'],
    tools: ['upi_send', 'upi_request', 'upi_status']
  },
  '@ankr/banking-bbps': {
    domain: 'banking',
    capabilities: ['bill payment', 'electricity bill', 'water bill', 'gas bill', 'recharge'],
    tools: ['bbps_electricity', 'bbps_water', 'bbps_gas', 'bbps_mobile']
  },
  '@ankr/banking-calculators': {
    domain: 'banking',
    capabilities: ['emi calculator', 'sip calculator', 'fd calculator', 'rd calculator'],
    tools: ['emi_calc', 'sip_calc', 'fd_calc', 'rd_calc']
  },

  // Government packages
  '@ankr/gov-aadhaar': {
    domain: 'government',
    capabilities: ['aadhaar verification', 'ekyc', 'aadhaar otp'],
    tools: ['aadhaar_verify', 'aadhaar_ekyc', 'aadhaar_otp']
  },
  '@ankr/gov-digilocker': {
    domain: 'government',
    capabilities: ['digilocker', 'document fetch', 'document verification'],
    tools: ['digilocker_auth', 'digilocker_fetch', 'digilocker_verify']
  },
  '@ankr/ulip-wizard': {
    domain: 'government',
    capabilities: ['vahan', 'sarathi', 'fastag', 'gps tracking', 'eway verification'],
    tools: ['ulip_vahan_rc', 'ulip_sarathi_dl', 'ulip_fastag_balance', 'ulip_gps_track']
  },
  '@ankr/gov-schemes': {
    domain: 'government',
    capabilities: ['pm kisan', 'pm awas', 'ujjwala', 'mudra loan', 'government schemes'],
    tools: ['pm_kisan', 'pm_awas', 'ujjwala', 'mudra_loan']
  },

  // AI & Agent packages
  '@ankr/ai-router': {
    domain: 'general',
    capabilities: ['llm routing', 'ai provider selection', 'model fallback'],
    tools: []
  },
  '@ankr/brain': {
    domain: 'general',
    capabilities: ['nlp', 'text processing', 'language understanding'],
    tools: []
  },
  '@ankr/intent': {
    domain: 'general',
    capabilities: ['intent classification', 'intent detection'],
    tools: []
  },
  '@ankr/codegen': {
    domain: 'general',
    capabilities: ['code generation', 'tool generation', 'auto coding'],
    tools: []
  },
  '@ankr/swarm': {
    domain: 'general',
    capabilities: ['multi-agent', 'agent coordination', 'swarm intelligence'],
    tools: []
  },
  '@ankr/orchestrator': {
    domain: 'general',
    capabilities: ['task orchestration', 'workflow execution', 'dependency resolution'],
    tools: []
  },
  '@ankr/executor': {
    domain: 'general',
    capabilities: ['code execution', 'script running', 'task execution'],
    tools: []
  },
  '@ankr/sandbox': {
    domain: 'general',
    capabilities: ['safe execution', 'sandboxed code', 'isolated environment'],
    tools: []
  },

  // Memory & Knowledge
  '@ankr/eon': {
    domain: 'general',
    capabilities: ['memory', 'knowledge storage', 'context management', 'vector search'],
    tools: []
  },
  '@ankr/eon-rag': {
    domain: 'general',
    capabilities: ['rag', 'retrieval', 'document search', 'semantic search'],
    tools: []
  },

  // Logistics
  '@ankr/saathi-core': {
    domain: 'logistics',
    capabilities: ['fleet management', 'vehicle tracking', 'driver management', 'trip management'],
    tools: ['vehicle_position', 'live_positions', 'drivers', 'trips']
  },

  // Voice
  '@ankr/voice-ai': {
    domain: 'general',
    capabilities: ['speech to text', 'text to speech', 'voice recognition', 'voice synthesis'],
    tools: []
  },
  '@ankr/bani': {
    domain: 'general',
    capabilities: ['voice assistant', 'multilingual voice', 'indian languages'],
    tools: []
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE DISCOVERY CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class PackageDiscovery {
  private verdaccioUrl: string;
  private storagePath: string;
  private packageCache: Map<string, PackageInfo> = new Map();
  private indexed: boolean = false;

  constructor(config?: { verdaccioUrl?: string; storagePath?: string }) {
    this.verdaccioUrl = config?.verdaccioUrl || 'http://localhost:4873';
    this.storagePath = config?.storagePath || '/root/verdaccio-storage/@ankr';
  }

  /**
   * Index all @ankr packages from Verdaccio storage
   */
  async indexAllPackages(): Promise<void> {
    console.log('📦 Indexing @ankr packages from Verdaccio...');

    try {
      // Read from local storage (faster than API)
      const packages = await this.listPackagesFromStorage();

      for (const pkgName of packages) {
        const info = await this.analyzePackage(pkgName);
        this.packageCache.set(pkgName, info);
      }

      this.indexed = true;
      console.log(`✅ Indexed ${this.packageCache.size} packages`);
    } catch (error) {
      console.error('Package indexing error:', error);
    }
  }

  /**
   * List packages from local Verdaccio storage
   */
  private async listPackagesFromStorage(): Promise<string[]> {
    const packages: string[] = [];

    try {
      if (fs.existsSync(this.storagePath)) {
        const dirs = fs.readdirSync(this.storagePath);
        for (const dir of dirs) {
          const pkgPath = path.join(this.storagePath, dir);
          const stat = fs.statSync(pkgPath);
          if (stat.isDirectory()) {
            packages.push(`@ankr/${dir}`);
          }
        }
      }
    } catch (error) {
      console.error('Error reading storage:', error);
    }

    // Also check @powerpbox
    const powerpboxPath = '/root/verdaccio-storage/@powerpbox';
    try {
      if (fs.existsSync(powerpboxPath)) {
        const dirs = fs.readdirSync(powerpboxPath);
        for (const dir of dirs) {
          packages.push(`@powerpbox/${dir}`);
        }
      }
    } catch (error) {
      // Ignore
    }

    return packages;
  }

  /**
   * Analyze a package to extract metadata
   */
  private async analyzePackage(name: string): Promise<PackageInfo> {
    // Check pre-defined capabilities first
    const predefined = PACKAGE_CAPABILITIES[name];

    // Try to read package.json from storage
    let pkgJson: any = {};
    try {
      const shortName = name.replace('@ankr/', '').replace('@powerpbox/', '');
      const scope = name.startsWith('@powerpbox') ? '@powerpbox' : '@ankr';
      const pkgJsonPath = path.join('/root/verdaccio-storage', scope, shortName, 'package.json');

      if (fs.existsSync(pkgJsonPath)) {
        pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      }
    } catch (error) {
      // Ignore
    }

    return {
      name,
      version: pkgJson.version || '1.0.0',
      description: pkgJson.description || predefined?.capabilities.join(', ') || name,
      exports: pkgJson.exports ? Object.keys(pkgJson.exports) : [],
      dependencies: pkgJson.dependencies ? Object.keys(pkgJson.dependencies) : [],
      capabilities: predefined?.capabilities || this.inferCapabilities(name, pkgJson),
      tools: predefined?.tools,
      domain: predefined?.domain
    };
  }

  /**
   * Infer capabilities from package name and metadata
   */
  private inferCapabilities(name: string, pkgJson: any): string[] {
    const capabilities: string[] = [];
    const lower = name.toLowerCase();

    // Infer from name
    if (lower.includes('gst')) capabilities.push('gst', 'tax');
    if (lower.includes('tds')) capabilities.push('tds', 'tax deduction');
    if (lower.includes('itr')) capabilities.push('income tax', 'itr');
    if (lower.includes('erp')) capabilities.push('erp', 'enterprise');
    if (lower.includes('crm')) capabilities.push('crm', 'customer');
    if (lower.includes('banking') || lower.includes('upi')) capabilities.push('banking', 'payment');
    if (lower.includes('voice') || lower.includes('bani')) capabilities.push('voice', 'speech');
    if (lower.includes('ai') || lower.includes('brain')) capabilities.push('ai', 'intelligence');

    // Infer from description
    if (pkgJson.description) {
      const desc = pkgJson.description.toLowerCase();
      if (desc.includes('invoice')) capabilities.push('invoice');
      if (desc.includes('payment')) capabilities.push('payment');
      if (desc.includes('tracking')) capabilities.push('tracking');
    }

    return [...new Set(capabilities)];
  }

  /**
   * Search packages by capability
   */
  searchByCapability(query: string): PackageInfo[] {
    if (!this.indexed) {
      console.warn('Packages not indexed yet. Call indexAllPackages() first.');
    }

    const q = query.toLowerCase();
    const results: PackageInfo[] = [];

    for (const pkg of this.packageCache.values()) {
      const score = this.calculateRelevance(pkg, q);
      if (score > 0) {
        results.push({ ...pkg, metadata: { score } } as any);
      }
    }

    return results.sort((a, b) => ((b as any).metadata?.score || 0) - ((a as any).metadata?.score || 0));
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(pkg: PackageInfo, query: string): number {
    let score = 0;

    // Check name
    if (pkg.name.toLowerCase().includes(query)) score += 3;

    // Check capabilities
    for (const cap of pkg.capabilities) {
      if (cap.toLowerCase().includes(query) || query.includes(cap.toLowerCase())) {
        score += 2;
      }
    }

    // Check description
    if (pkg.description.toLowerCase().includes(query)) score += 1;

    return score;
  }

  /**
   * Find packages for a specific domain
   */
  getPackagesByDomain(domain: IntentDomain): PackageInfo[] {
    return Array.from(this.packageCache.values()).filter(pkg => pkg.domain === domain);
  }

  /**
   * Get package by name
   */
  getPackage(name: string): PackageInfo | undefined {
    return this.packageCache.get(name);
  }

  /**
   * Get all indexed packages
   */
  getAllPackages(): PackageInfo[] {
    return Array.from(this.packageCache.values());
  }

  /**
   * Get package count
   */
  getPackageCount(): number {
    return this.packageCache.size;
  }

  /**
   * Get packages that provide specific tools
   */
  getPackagesForTools(tools: string[]): PackageInfo[] {
    const results: PackageInfo[] = [];

    for (const pkg of this.packageCache.values()) {
      if (pkg.tools && pkg.tools.some(t => tools.includes(t))) {
        results.push(pkg);
      }
    }

    return results;
  }

  /**
   * Find best package for a requirement
   */
  findBestPackage(requirement: string): PackageInfo | undefined {
    const results = this.searchByCapability(requirement);
    return results[0];
  }

  /**
   * Get summary of indexed packages
   */
  getSummary(): {
    total: number;
    byDomain: Record<string, number>;
    withTools: number;
  } {
    const byDomain: Record<string, number> = {};
    let withTools = 0;

    for (const pkg of this.packageCache.values()) {
      if (pkg.domain) {
        byDomain[pkg.domain] = (byDomain[pkg.domain] || 0) + 1;
      }
      if (pkg.tools && pkg.tools.length > 0) {
        withTools++;
      }
    }

    return {
      total: this.packageCache.size,
      byDomain,
      withTools
    };
  }
}

// Export singleton instance
export const packageDiscovery = new PackageDiscovery();
