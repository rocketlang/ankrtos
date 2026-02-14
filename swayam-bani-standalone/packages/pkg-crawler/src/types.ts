/**
 * @ankr/pkg-crawler - Type Definitions
 */

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  main: string;
  types?: string;
  keywords: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  exports: string[];
  functions: FunctionInfo[];
  usageExamples: string[];
  sourcePath: string;
  category: string;
}

export interface FunctionInfo {
  name: string;
  signature: string;
  description: string;
  params: { name: string; type: string }[];
  returnType: string;
}

export interface TrainingExample {
  prompt: string;
  packages: string[];
  code: string;
  category: string;
}

export interface CrawlerConfig {
  repos: string[];
  outputDir?: string;
  packagePrefix?: string;
  maxDepth?: number;
  eonUrl?: string;
  verdaccioUrl?: string;
  categories?: Record<string, RegExp>;
  prompts?: Record<string, string[]>;
}

export interface CrawlerResult {
  packages: PackageInfo[];
  trainingExamples: TrainingExample[];
  byCategory: Record<string, number>;
  totalPackages: number;
  totalExamples: number;
}
