/**
 * @ankr/pkg-crawler
 *
 * Monorepo package discovery and AI training data generator.
 *
 * @example
 * ```typescript
 * import { PackageCrawler } from '@ankr/pkg-crawler';
 *
 * const crawler = new PackageCrawler({
 *   repos: ['/path/to/monorepo'],
 *   packagePrefix: '@myorg/',
 * });
 *
 * const result = await crawler.scan();
 * console.log(`Found ${result.totalPackages} packages`);
 *
 * // Save to files
 * crawler.save('./output');
 *
 * // Store in EON memory
 * await crawler.storeInEON();
 * ```
 */

export { PackageCrawler, default } from './crawler';
export type {
  PackageInfo,
  FunctionInfo,
  TrainingExample,
  CrawlerConfig,
  CrawlerResult,
} from './types';
