/**
 * Universal Email Intelligence Framework
 * Industry-agnostic email parsing with plugin system
 *
 * @package @ankr/email-intelligence
 * @author ANKR Labs
 * @version 1.0.0
 */

// Core exports
export { BaseEmailParser } from './core/BaseEmailParser.js';
export { pluginRegistry, PluginRegistry } from './plugins/PluginRegistry.js';

// Type exports
export type {
  // Entity types
  UniversalEntity,
  EntityExtractor,

  // Classification types
  CategoryConfig,
  UrgencyLevel,
  ActionableType,

  // Bucket types
  BucketCondition,
  BucketConfig,

  // Parser types
  CustomParser,
  EmailParserConfig,
  EmailParseResult,
  EmailInput,

  // Plugin types
  IndustryPlugin,

  // Stats types
  ParserStats,
} from './core/types.js';

// Re-export plugins (when available)
// export { maritimePlugin } from './plugins/maritime/index.js';
// export { logisticsPlugin } from './plugins/logistics/index.js';
