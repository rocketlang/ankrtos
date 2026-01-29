/**
 * Eon HTTP Client for ANKR Viewer
 * Wraps ankr-eon REST API (port 4005) with timeouts and graceful fallback.
 */

const EON_BASE = process.env.EON_URL || 'http://localhost:4005';
const EON_TIMEOUT = 5000; // 5s for reads
const EON_WRITE_TIMEOUT = 120000; // 120s for writes (ingest involves embedding)

let _healthCache = { healthy: false, ts: 0 };
const HEALTH_CACHE_TTL = 30000; // 30s

async function fetchEon(path, options = {}) {
  const isWrite = options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE';
  const timeout = isWrite ? EON_WRITE_TIMEOUT : EON_TIMEOUT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(`${EON_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Eon ${resp.status}: ${text.slice(0, 200)}`);
    }

    return await resp.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Eon timeout after ${timeout}ms`);
    }
    throw err;
  }
}

module.exports = {
  EON_BASE,

  /**
   * Check if eon is healthy. Cached for 30s.
   */
  async isHealthy() {
    const now = Date.now();
    if (now - _healthCache.ts < HEALTH_CACHE_TTL) {
      return _healthCache.healthy;
    }
    try {
      const data = await fetchEon('/health');
      _healthCache = { healthy: data.status === 'ok', ts: now };
      return _healthCache.healthy;
    } catch {
      _healthCache = { healthy: false, ts: now };
      return false;
    }
  },

  /**
   * Hybrid search via eon (BM25 + vector + RRF).
   * @param {string} query
   * @param {object} options - { limit, carrierId, docTypes, tags, rerank, threshold }
   * @returns {Array|null} results or null on failure
   */
  async search(query, options = {}) {
    try {
      const body = {
        query,
        limit: options.limit || 20,
        rerank: options.rerank !== undefined ? options.rerank : false,
        threshold: options.threshold || 0.2,
      };
      if (options.carrierId) body.carrierId = options.carrierId;
      if (options.docTypes) body.docTypes = options.docTypes;
      if (options.tags) body.tags = options.tags;

      const data = await fetchEon('/api/logistics/search', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return data.results || data || [];
    } catch (err) {
      console.warn('[EonClient] search failed:', err.message);
      return null;
    }
  },

  /**
   * RAG retrieve — returns chunks + formatted context.
   */
  async retrieve(query, options = {}) {
    try {
      const body = {
        query,
        limit: options.limit || 5,
      };
      if (options.carrierId) body.carrierId = options.carrierId;
      if (options.docTypes) body.docTypes = options.docTypes;

      const data = await fetchEon('/api/logistics/retrieve', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return data;
    } catch (err) {
      console.warn('[EonClient] retrieve failed:', err.message);
      return null;
    }
  },

  /**
   * Ingest a document into eon.
   * @param {object} doc - { title, content, docType, tags, carrierId, id }
   */
  async ingest(doc) {
    try {
      const data = await fetchEon('/api/logistics/ingest', {
        method: 'POST',
        body: JSON.stringify(doc),
      });
      return data;
    } catch (err) {
      console.warn('[EonClient] ingest failed:', err.message);
      return null;
    }
  },

  /**
   * Delete a document and its chunks from eon.
   */
  async deleteDocument(documentId) {
    try {
      const data = await fetchEon(`/api/logistics/document/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      });
      return data;
    } catch (err) {
      console.warn('[EonClient] delete failed:', err.message);
      return null;
    }
  },

  /**
   * Get eon knowledge base stats.
   */
  async getStats() {
    try {
      return await fetchEon('/api/logistics/stats');
    } catch (err) {
      console.warn('[EonClient] stats failed:', err.message);
      return null;
    }
  },
};
