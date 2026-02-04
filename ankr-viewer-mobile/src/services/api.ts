import axios, { AxiosInstance } from 'axios';
import {
  FileItem,
  KnowledgeGraph,
  SearchResult,
  DocumentSource,
  Bookmark,
  RecentFile,
  Topic,
} from '../types';

const DEFAULT_API_URL = 'https://ankr.in';

class AnkrViewerAPI {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_API_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: `${baseUrl}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    this.client.defaults.baseURL = `${url}/api`;
  }

  // File Operations
  async listFiles(path: string = ''): Promise<FileItem[]> {
    const response = await this.client.get('/files', {
      params: { path },
    });
    return response.data;
  }

  async getFileContent(path: string): Promise<{
    content: string;
    frontmatter?: Record<string, unknown>;
    type: string;
  }> {
    const response = await this.client.get('/file', {
      params: { path },
    });
    return response.data;
  }

  async getRawFile(path: string): Promise<string> {
    const response = await this.client.get('/file/raw', {
      params: { path },
      responseType: 'blob',
    });
    return response.data;
  }

  // Search
  async search(query: string, topic?: string): Promise<SearchResult[]> {
    const response = await this.client.get('/search', {
      params: { q: query, topic },
    });
    return response.data;
  }

  // Knowledge Graph
  async getKnowledgeGraph(): Promise<KnowledgeGraph> {
    const response = await this.client.get('/knowledge/graph');
    return response.data;
  }

  async getTopics(): Promise<Topic[]> {
    const response = await this.client.get('/knowledge/topics');
    return response.data;
  }

  async getTags(): Promise<string[]> {
    const response = await this.client.get('/knowledge/tags');
    return response.data;
  }

  // Sources
  async getSources(): Promise<DocumentSource[]> {
    const response = await this.client.get('/sources');
    return response.data;
  }

  async addSource(source: Omit<DocumentSource, 'id' | 'documentCount'>): Promise<DocumentSource> {
    const response = await this.client.post('/sources', source);
    return response.data;
  }

  async setActiveSource(sourceId: string): Promise<void> {
    await this.client.post('/sources/active', { sourceId });
  }

  // Bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    const response = await this.client.get('/bookmarks');
    return response.data;
  }

  async addBookmark(path: string, name: string): Promise<Bookmark> {
    const response = await this.client.post('/bookmarks', { path, name });
    return response.data;
  }

  async removeBookmark(path: string): Promise<void> {
    await this.client.delete('/bookmarks', { params: { path } });
  }

  // Recent Files
  async getRecentFiles(): Promise<RecentFile[]> {
    const response = await this.client.get('/recent');
    return response.data;
  }

  async addRecentFile(path: string, name: string): Promise<void> {
    await this.client.post('/recent', { path, name });
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const api = new AnkrViewerAPI();
export default api;
