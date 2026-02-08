import { NavigateFunction } from 'react-router-dom';

export interface AISearchResult {
  page: string;
  filters?: Record<string, any>;
  message: string;
}

/**
 * Navigate to the page specified by AI with optional filters
 */
export function navigateWithAI(
  result: AISearchResult,
  navigate: NavigateFunction,
  showToast?: (message: string, type: 'success' | 'info') => void
) {
  const { page, filters, message } = result;

  // Build URL with filters as query params
  let url = page;
  if (filters && Object.keys(filters).length > 0) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });
    url = `${page}?${params.toString()}`;
  }

  // Navigate
  navigate(url);

  // Show helpful message
  if (showToast && message) {
    showToast(message, 'info');
  }
}

/**
 * Call the AI search API
 */
export async function searchWithAI(query: string): Promise<AISearchResult> {
  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('AI search failed');
  }

  return response.json();
}
