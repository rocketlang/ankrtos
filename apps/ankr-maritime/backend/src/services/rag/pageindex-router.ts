/**
 * PageIndex Router Integration for Maritime RAG
 *
 * This module provides RAGRouter integration for Mari8X charter parties
 * and other long-form maritime documents.
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

import { QueryClassifier, RAGRouter, RouterCache } from '@ankr/rag-router';
import { HybridSearchService, PageIndexSearchService } from '@ankr/pageindex';
import type { RAGAnswer, SourceDocument, SearchOptions } from './maritime-rag.js';

export interface RouterOptions {
  enableRouter: boolean;
  enableCache: boolean;
  defaultMethod: 'auto' | 'hybrid' | 'pageindex';
}

/**
 * Maritime PageIndex Router
 *
 * Wraps RAGRouter with Maritime-specific configuration
 */
export class MaritimePageIndexRouter {
  private router: RAGRouter;
  private classifier: QueryClassifier;
  private cache: RouterCache;
  private hybridSearch?: HybridSearchService;
  private pageIndexSearch?: PageIndexSearchService;
  private config: RouterOptions;

  constructor(config: Partial<RouterOptions> = {}) {
    this.config = {
      enableRouter: config.enableRouter ?? true,
      enableCache: config.enableCache ?? true,
      defaultMethod: config.defaultMethod ?? 'auto',
    };

    // Initialize classifier
    this.classifier = new QueryClassifier({
      llm: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: 'claude-haiku-4-20250514',
        baseUrl: process.env.AI_PROXY_URL,
      },
      thresholds: {
        pageLengthForPageIndex: 10, // Charter parties are typically 50-200 pages
        confidenceMinimum: 0.7,
      },
    });

    // Initialize cache
    this.cache = new RouterCache({
      enabled: this.config.enableCache,
      ttl: {
        classification: 3600, // 1 hour
        navigationPath: 7200, // 2 hours
        answer: 1800, // 30 minutes
      },
    });

    // Initialize router
    this.router = new RAGRouter(this.classifier, {
      routing: {
        defaultMethod: this.config.defaultMethod,
        enableFallback: true,
        timeoutMs: 30000,
      },
      logging: {
        enabled: true,
        logToDatabase: true,
        logToConsole: process.env.NODE_ENV === 'development',
      },
    });
  }

  /**
   * Initialize search services
   */
  async initialize() {
    // TODO: Initialize HybridSearchService
    // this.hybridSearch = new HybridSearchService(...);
    // this.router.setHybridSearch(this.hybridSearch);

    // TODO: Initialize PageIndexSearchService
    // this.pageIndexSearch = new PageIndexSearchService(...);
    // this.router.setPageIndexSearch(this.pageIndexSearch);

    console.log('Maritime PageIndex Router initialized');
  }

  /**
   * Ask a question using router-based RAG
   */
  async ask(
    question: string,
    options: SearchOptions,
    organizationId: string
  ): Promise<RAGAnswer> {
    const startTime = Date.now();

    if (!this.config.enableRouter) {
      throw new Error('Router is disabled. Use standard maritime-rag.ask() instead.');
    }

    try {
      // Step 1: Check cache
      if (this.config.enableCache) {
        const cached = await this.cache.getAnswer(question, {
          organizationId,
          docTypes: options.docTypes,
        });

        if (cached) {
          return {
            ...cached,
            fromCache: true,
            latency: Date.now() - startTime,
          };
        }
      }

      // Step 2: Route query
      const result = await this.router.route(
        question,
        {
          documentMetadata: {
            docType: options.docTypes?.[0],
          },
        },
        {
          forceMethod: this.getForceMethod(options.method),
          documentType: options.docTypes?.[0],
        }
      );

      // Step 3: Transform router result to RAGAnswer format
      const answer: RAGAnswer = {
        answer: result.answer,
        sources: result.sources.map((source) => ({
          documentId: '', // TODO: Extract from source
          title: source.section || 'Unknown Section',
          excerpt: source.excerpt,
          page: source.page,
          relevanceScore: source.relevanceScore || 0.8,
        })),
        confidence: result.metadata?.confidence || 0.8,
        timestamp: new Date(),
        followUpSuggestions: this.generateFollowUpSuggestions(question, result),
        // Router metadata
        method: result.method.toUpperCase() as 'HYBRID' | 'PAGEINDEX',
        complexity: result.classification.complexity,
        latency: result.latency,
        fromCache: result.fromCache,
      };

      // Step 4: Cache result
      if (this.config.enableCache && !result.fromCache) {
        await this.cache.cacheAnswer(
          question,
          {
            answer: answer.answer,
            sources: answer.sources,
            method: answer.method,
            confidence: answer.confidence,
          },
          {
            organizationId,
            docTypes: options.docTypes,
          }
        );
      }

      return answer;
    } catch (error) {
      console.error('Router failed:', error);

      // Return error response
      return {
        answer:
          "I encountered an error processing your question. Please try again or contact support.",
        sources: [],
        confidence: 0,
        timestamp: new Date(),
        followUpSuggestions: [],
        method: 'HYBRID',
        complexity: 'SIMPLE',
        latency: Date.now() - startTime,
        fromCache: false,
      };
    }
  }

  /**
   * Get force method from options
   */
  private getForceMethod(
    method?: 'auto' | 'hybrid' | 'pageindex'
  ): 'hybrid' | 'pageindex' | undefined {
    if (!method || method === 'auto') {
      return undefined; // Let router decide
    }

    return method;
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(question: string, result: any): string[] {
    const suggestions: string[] = [];

    // Based on classification
    if (result.classification.complexity === 'SIMPLE') {
      suggestions.push('Would you like more details about this?');
      suggestions.push('Are you looking for related charter parties?');
    } else {
      suggestions.push('Would you like me to explain any specific clause?');
      suggestions.push('Do you need information about exceptions or special provisions?');
    }

    // Based on method used
    if (result.method === 'pageindex' && result.metadata?.navigationPath) {
      suggestions.push(
        `I navigated through ${result.metadata.navigationPath.length} sections. Would you like to see the navigation path?`
      );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get router statistics
   */
  async getStats() {
    const routerStats = await this.router.getStats();
    const cacheStats = this.cache.getStats();

    return {
      router: routerStats,
      cache: cacheStats,
    };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    return await this.cache.clearAll();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const cacheHealthy = await this.cache.healthCheck();

    return {
      router: true,
      cache: cacheHealthy,
    };
  }
}

// Export singleton instance
export const maritimeRouter = new MaritimePageIndexRouter({
  enableRouter: process.env.ENABLE_PAGEINDEX_ROUTER === 'true',
  enableCache: process.env.ENABLE_ROUTER_CACHE !== 'false',
  defaultMethod: (process.env.DEFAULT_ROUTER_METHOD as any) || 'auto',
});
