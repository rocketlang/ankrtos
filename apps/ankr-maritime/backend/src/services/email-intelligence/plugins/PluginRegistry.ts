/**
 * Plugin Registry for Industry-Specific Email Parsers
 * Manages registration and loading of industry plugins
 *
 * @package @ankr/email-intelligence
 * @author ANKR Labs
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import type { IndustryPlugin } from '../core/types.js';
import { getPrisma } from '../../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

/**
 * PluginRegistry
 * Manages industry-specific email parser plugins
 */
export class PluginRegistry {
  private plugins: Map<string, IndustryPlugin> = new Map();
  private initialized: boolean = false;

  /**
   * Register an industry plugin
   */
  register(plugin: IndustryPlugin): void {
    // Validate plugin
    this.validatePlugin(plugin);

    // Register
    this.plugins.set(plugin.industry, plugin);

    console.log(`[PluginRegistry] Registered plugin: ${plugin.displayName} (${plugin.industry})`);
  }

  /**
   * Get plugin by industry
   */
  get(industry: string): IndustryPlugin | undefined {
    return this.plugins.get(industry);
  }

  /**
   * Check if plugin exists
   */
  has(industry: string): boolean {
    return this.plugins.has(industry);
  }

  /**
   * List all registered plugins
   */
  list(): IndustryPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * List plugin industries
   */
  listIndustries(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Unregister a plugin
   */
  unregister(industry: string): boolean {
    return this.plugins.delete(industry);
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.initialized = false;
  }

  /**
   * Load plugin from JSON object
   */
  loadFromJSON(pluginJSON: IndustryPlugin): void {
    this.register(pluginJSON);
  }

  /**
   * Load plugin from JSON file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const plugin: IndustryPlugin = JSON.parse(content);
      this.register(plugin);
    } catch (error) {
      console.error(`[PluginRegistry] Failed to load plugin from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load plugin from database
   */
  async loadFromDB(industry: string): Promise<void> {
    try {
      // TODO: Create IndustryPluginConfig table in Prisma schema
      // const config = await prisma.industryPluginConfig?.findUnique({
      //   where: { industry },
      // });

      // if (config) {
      //   const plugin: IndustryPlugin = JSON.parse(config.configJson);
      //   this.register(plugin);
      // }

      console.log(`[PluginRegistry] Database loading not yet implemented for ${industry}`);
    } catch (error) {
      console.error(`[PluginRegistry] Failed to load plugin from DB (${industry}):`, error);
      throw error;
    }
  }

  /**
   * Save plugin to database
   */
  async saveToDB(industry: string): Promise<void> {
    const plugin = this.get(industry);

    if (!plugin) {
      throw new Error(`Plugin not found: ${industry}`);
    }

    try {
      // TODO: Create IndustryPluginConfig table in Prisma schema
      // await prisma.industryPluginConfig?.upsert({
      //   where: { industry },
      //   create: {
      //     industry: plugin.industry,
      //     displayName: plugin.displayName,
      //     version: plugin.version,
      //     configJson: JSON.stringify(plugin),
      //   },
      //   update: {
      //     displayName: plugin.displayName,
      //     version: plugin.version,
      //     configJson: JSON.stringify(plugin),
      //   },
      // });

      console.log(`[PluginRegistry] Saved plugin to database: ${industry}`);
    } catch (error) {
      console.error(`[PluginRegistry] Failed to save plugin to DB (${industry}):`, error);
      throw error;
    }
  }

  /**
   * Export plugin to JSON file
   */
  async exportToFile(industry: string, filePath: string): Promise<void> {
    const plugin = this.get(industry);

    if (!plugin) {
      throw new Error(`Plugin not found: ${industry}`);
    }

    try {
      const fs = await import('fs/promises');
      const json = JSON.stringify(plugin, null, 2);
      await fs.writeFile(filePath, json, 'utf-8');

      console.log(`[PluginRegistry] Exported plugin to ${filePath}`);
    } catch (error) {
      console.error(`[PluginRegistry] Failed to export plugin to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Initialize with default plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[PluginRegistry] Already initialized');
      return;
    }

    console.log('[PluginRegistry] Initializing with default plugins...');

    // Load maritime plugin (if available)
    try {
      const { maritimePlugin } = await import('./maritime/index.js');
      this.register(maritimePlugin);
    } catch (error) {
      console.log('[PluginRegistry] Maritime plugin not found');
    }

    // Load logistics plugin (if available)
    try {
      const { logisticsPlugin } = await import('./logistics/index.js');
      this.register(logisticsPlugin);
    } catch (error) {
      console.log('[PluginRegistry] Logistics plugin not found');
    }

    // Load other plugins...

    this.initialized = true;
    console.log(`[PluginRegistry] Initialized with ${this.plugins.size} plugin(s)`);
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const stats: Record<
      string,
      {
        displayName: string;
        version: string;
        entityExtractors: number;
        categories: number;
        buckets: number;
        customParsers: number;
      }
    > = {};

    for (const [industry, plugin] of this.plugins) {
      stats[industry] = {
        displayName: plugin.displayName,
        version: plugin.version,
        entityExtractors: Object.keys(plugin.config.entityExtractors).length,
        categories: plugin.config.categories.length,
        buckets: plugin.config.buckets.length,
        customParsers: plugin.config.customParsers
          ? Object.keys(plugin.config.customParsers).length
          : 0,
      };
    }

    return {
      totalPlugins: this.plugins.size,
      plugins: stats,
    };
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: IndustryPlugin): void {
    // Required fields
    if (!plugin.industry) {
      throw new Error('Plugin must have an industry identifier');
    }

    if (!plugin.displayName) {
      throw new Error('Plugin must have a display name');
    }

    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }

    if (!plugin.config) {
      throw new Error('Plugin must have a config object');
    }

    // Config validation
    if (!plugin.config.entityExtractors) {
      throw new Error('Plugin config must have entityExtractors');
    }

    if (!plugin.config.categories || plugin.config.categories.length === 0) {
      throw new Error('Plugin config must have at least one category');
    }

    if (!plugin.config.buckets || plugin.config.buckets.length === 0) {
      throw new Error('Plugin config must have at least one bucket');
    }

    // Entity extractors validation
    for (const [type, extractor] of Object.entries(plugin.config.entityExtractors)) {
      if (!extractor.name) {
        throw new Error(`Entity extractor '${type}' must have a name`);
      }

      // Must have at least one extraction method
      if (!extractor.pattern && !extractor.patterns && !extractor.ragQuery) {
        throw new Error(
          `Entity extractor '${type}' must have at least one extraction method (pattern, patterns, or ragQuery)`
        );
      }
    }

    // Category validation
    for (const category of plugin.config.categories) {
      if (!category.name) {
        throw new Error('Category must have a name');
      }

      if (!category.keywords || category.keywords.length === 0) {
        throw new Error(`Category '${category.name}' must have keywords`);
      }

      if (typeof category.weight !== 'number' || category.weight <= 0) {
        throw new Error(`Category '${category.name}' must have a positive weight`);
      }
    }

    // Bucket validation
    for (const bucket of plugin.config.buckets) {
      if (!bucket.id) {
        throw new Error('Bucket must have an id');
      }

      if (!bucket.name) {
        throw new Error('Bucket must have a name');
      }

      if (!bucket.conditions || bucket.conditions.length === 0) {
        throw new Error(`Bucket '${bucket.name}' must have at least one condition`);
      }

      // Condition validation
      for (const condition of bucket.conditions) {
        if (!condition.field) {
          throw new Error(`Bucket '${bucket.name}' condition must have a field`);
        }

        if (!condition.operator) {
          throw new Error(`Bucket '${bucket.name}' condition must have an operator`);
        }

        const validOperators = ['equals', 'contains', 'matches', 'gt', 'lt', 'in', 'not_in'];
        if (!validOperators.includes(condition.operator)) {
          throw new Error(
            `Bucket '${bucket.name}' condition has invalid operator: ${condition.operator}`
          );
        }
      }
    }

    console.log(`[PluginRegistry] Plugin validation passed: ${plugin.displayName}`);
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

// Auto-initialize on import
pluginRegistry.initialize().catch((error) => {
  console.error('[PluginRegistry] Failed to auto-initialize:', error);
});
