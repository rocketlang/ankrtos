#!/usr/bin/env node
/**
 * @ankr/pkg-crawler CLI
 *
 * Usage:
 *   npx @ankr/pkg-crawler --repos /path/to/repo1 /path/to/repo2
 *   npx @ankr/pkg-crawler --config crawler.json
 *   ankr-crawl /path/to/monorepo
 */

import { PackageCrawler } from './crawler';
import * as fs from 'fs';
import * as path from 'path';

function printHelp() {
  console.log(`
🔍 @ankr/pkg-crawler - Monorepo Package Discovery & AI Training Data Generator

USAGE:
  npx @ankr/pkg-crawler [options] [repos...]
  ankr-crawl [options] [repos...]

OPTIONS:
  --help, -h        Show this help message
  --config, -c      Load config from JSON file
  --output, -o      Output directory (default: ./data)
  --prefix, -p      Package prefix to match (default: @ankr/)
  --no-eon          Skip EON memory storage
  --json            Output results as JSON

EXAMPLES:
  # Scan specific repos
  ankr-crawl /root/my-monorepo /root/another-repo

  # Use config file
  ankr-crawl --config crawler.json

  # Custom prefix and output
  ankr-crawl --prefix @myorg/ --output ./training-data /root/repos

CONFIG FILE FORMAT (crawler.json):
  {
    "repos": ["/path/to/repo1", "/path/to/repo2"],
    "outputDir": "./data",
    "packagePrefix": "@ankr/",
    "maxDepth": 5,
    "eonUrl": "http://localhost:4005"
  }
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  let configFile: string | null = null;
  let outputDir = './data';
  let prefix = '@ankr/';
  let skipEon = false;
  let jsonOutput = false;
  const repos: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--config' || arg === '-c') {
      configFile = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      outputDir = args[++i];
    } else if (arg === '--prefix' || arg === '-p') {
      prefix = args[++i];
    } else if (arg === '--no-eon') {
      skipEon = true;
    } else if (arg === '--json') {
      jsonOutput = true;
    } else if (!arg.startsWith('-')) {
      repos.push(path.resolve(arg));
    }
  }

  // Load config file if specified
  let config: any = {};
  if (configFile && fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  }

  // Merge CLI args with config
  const finalConfig = {
    repos: repos.length > 0 ? repos : config.repos || [],
    outputDir: outputDir || config.outputDir,
    packagePrefix: prefix || config.packagePrefix,
    maxDepth: config.maxDepth,
    eonUrl: config.eonUrl,
  };

  if (finalConfig.repos.length === 0) {
    console.error('❌ No repos specified. Use --help for usage.\n');
    printHelp();
    process.exit(1);
  }

  // Run crawler
  console.log('🚀 ANKR Package Crawler\n');

  const crawler = new PackageCrawler(finalConfig);
  const result = await crawler.scan();

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Save results
    crawler.save(finalConfig.outputDir);

    // Store in EON
    if (!skipEon) {
      await crawler.storeInEON();
    }

    // Print summary
    crawler.printSummary();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
