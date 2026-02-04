export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  extension?: string;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  type: 'document' | 'topic' | 'tag';
  count?: number;
  connections: string[];
}

export interface KnowledgeLink {
  source: string;
  target: string;
  strength: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export interface SearchResult {
  path: string;
  name: string;
  snippet: string;
  score: number;
  type: string;
}

export interface DocumentSource {
  id: string;
  name: string;
  path: string;
  type: 'local' | 'web' | 'network';
  documentCount?: number;
  active: boolean;
}

export interface Bookmark {
  path: string;
  name: string;
  addedAt: string;
}

export interface RecentFile {
  path: string;
  name: string;
  accessedAt: string;
}

export interface Topic {
  name: string;
  count: number;
  files: string[];
}

export interface Capability {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
}

export interface InvestorMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'development' | 'planned';
  tech: string[];
  metrics: InvestorMetric[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  apiUrl: string;
  offlineMode: boolean;
  cacheSize: number;
  notifications: boolean;
}
