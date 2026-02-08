import Anthropic from '@anthropic-ai/sdk';

// AI Proxy Configuration
const AI_PROXY_MODE = process.env.AI_PROXY_MODE || 'anthropic'; // 'anthropic', 'openai', 'custom', 'local'
const AI_PROXY_URL = process.env.AI_PROXY_URL || 'https://api.anthropic.com/v1/messages';
const AI_PROXY_KEY = process.env.AI_PROXY_KEY || process.env.ANTHROPIC_API_KEY || '';
const AI_PROXY_MODEL = process.env.AI_PROXY_MODEL || 'claude-3-5-sonnet-20241022';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AISearchRequest {
  query: string;
}

export interface AISearchResponse {
  page: string;
  filters?: Record<string, any>;
  message: string;
}

// List of all 137 pages with descriptions (simplified for MVP)
const MARI8X_PAGES = `
Available pages in Mari8X platform:

FLEET & VESSELS:
- /vessels - View all vessels in fleet
- /vessels/:id - View specific vessel details
- /vessel-tracker - Real-time vessel tracking with AIS
- /vessel-portal - Vessel management portal
- /fleet-portal - Fleet overview and analytics

PORTS & ROUTES:
- /ports - Browse all 12,714 ports worldwide
- /ports/:unlocode - View specific port details (e.g., /ports/INMUM for Mumbai)
- /port-intelligence - Pre-arrival intelligence and DA forecasting
- /port-tracker - Real-time port congestion and arrivals
- /route-planner - Plan voyages and routes

OPERATIONS:
- /chartering - Charter management and fixtures
- /voyages - Voyage planning and tracking
- /voyage-timeline/:id - Voyage timeline and milestones
- /da-desk - Despatch/Demurrage calculations
- /laytime - Laytime calculations
- /bills-of-lading - B/L management

COMMERCIAL:
- /cargo-enquiries - Cargo enquiry management
- /freight-estimates - Freight rate estimates
- /bunker-planning - Bunker planning and fuel management
- /invoices - Invoice management

STAKEHOLDERS:
- /contacts - Contact directory
- /agent-portal - Port agent portal
- /owners - Vessel owners directory

ALERTS & MONITORING:
- /alerts - Critical alerts dashboard
- /delay-alerts - Voyage delay tracking
- /expiry-tracker - Certificate expiry tracking

DOCUMENTS:
- /documents - Document management system
- /advanced-search - Search across all documents

ANALYTICS:
- /analytics - Platform analytics dashboard
- /reports - Generate custom reports

SETTINGS:
- /settings - User settings
- /permissions - Access control and permissions
`;

/**
 * Call AI Proxy (flexible - works with Anthropic, OpenAI, custom endpoint, or local LLM)
 */
export async function interpretMaritimeQuery(
  query: string
): Promise<AISearchResponse> {
  try {
    const prompt = `You are Mari8X AI Search Assistant. Your job is to understand what the user wants and route them to the correct page.

User Query: "${query}"

${MARI8X_PAGES}

IMPORTANT RULES:
1. Always respond with valid JSON only
2. Choose the MOST relevant page from the list above
3. Extract entity names (vessel names, port names, UN/LOCODEs, people names)
4. Use filters to narrow results when specific entities are mentioned
5. Keep the message friendly and helpful
6. If the query mentions a port by name (e.g., "Mumbai"), convert to UN/LOCODE if possible (e.g., INMUM)
7. For "create" or "new" commands, use action=create in filters

Respond ONLY with JSON in this exact format (no additional text):
{
  "page": "/vessels",
  "filters": { "search": "Ocean Harmony" },
  "message": "Showing vessel: MV Ocean Harmony"
}

Examples:
Query: "vessels" → {"page": "/vessels", "message": "Showing all vessels"}
Query: "mumbai port" → {"page": "/ports/INMUM", "message": "Showing Mumbai Port (INMUM)"}
Query: "create invoice" → {"page": "/invoices", "filters": {"action": "create"}, "message": "Opening invoice creation form"}
Query: "MV Ocean Harmony" → {"page": "/vessels", "filters": {"search": "Ocean Harmony"}, "message": "Searching for vessel: MV Ocean Harmony"}
Query: "vessels near mumbai" → {"page": "/vessels", "filters": {"near": "INMUM"}, "message": "Showing vessels near Mumbai"}

Now respond for the user's query:`;

    let responseText = '';

    // Route to different AI providers based on configuration
    switch (AI_PROXY_MODE) {
      case 'anthropic':
        responseText = await callAnthropicAPI(prompt);
        break;

      case 'openai':
        responseText = await callOpenAIAPI(prompt);
        break;

      case 'custom':
        responseText = await callCustomProxy(prompt);
        break;

      case 'local':
        responseText = await callLocalLLM(prompt);
        break;

      default:
        // Default to Anthropic
        responseText = await callAnthropicAPI(prompt);
    }

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result: AISearchResponse = JSON.parse(jsonMatch[0]);

    // Validate response
    if (!result.page || !result.message) {
      throw new Error('Invalid response format from AI');
    }

    return result;
  } catch (error) {
    console.error('[AI Proxy Error]', error);

    // Fallback: basic keyword matching
    return fallbackSearch(query);
  }
}

/**
 * Call Anthropic API (Claude)
 */
async function callAnthropicAPI(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: AI_PROXY_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

/**
 * Call OpenAI API (GPT-4, etc.)
 */
async function callOpenAIAPI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_PROXY_KEY}`,
    },
    body: JSON.stringify({
      model: AI_PROXY_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Call Custom AI Proxy (your own endpoint)
 */
async function callCustomProxy(prompt: string): Promise<string> {
  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_PROXY_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`Custom proxy error: ${response.statusText}`);
  }

  const data = await response.json();
  // Assumes custom proxy returns { response: "..." } or { text: "..." }
  return data.response || data.text || data.content || '';
}

/**
 * Call Local LLM (Ollama, LM Studio, etc.)
 */
async function callLocalLLM(prompt: string): Promise<string> {
  const localUrl = AI_PROXY_URL || 'http://localhost:11434/api/generate'; // Ollama default

  const response = await fetch(localUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_PROXY_MODEL || 'llama2',
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Local LLM error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response || '';
}

/**
 * Fallback search using simple keyword matching
 */
function fallbackSearch(query: string): AISearchResponse {
  const lower = query.toLowerCase();

  // Vessels
  if (lower.includes('vessel') || lower.includes('ship') || lower.includes('fleet')) {
    return {
      page: '/vessels',
      filters: lower.length > 10 ? { search: query } : undefined,
      message: 'Showing vessels',
    };
  }

  // Ports
  if (lower.includes('port') || lower.includes('mumbai') || lower.includes('singapore')) {
    if (lower.includes('mumbai')) {
      return { page: '/ports/INMUM', message: 'Showing Mumbai Port' };
    }
    return { page: '/ports', message: 'Showing all ports' };
  }

  // Create/New commands
  if (lower.includes('create') || lower.includes('new')) {
    if (lower.includes('invoice')) {
      return {
        page: '/invoices',
        filters: { action: 'create' },
        message: 'Creating new invoice',
      };
    }
    if (lower.includes('charter') || lower.includes('fixture')) {
      return {
        page: '/chartering',
        filters: { action: 'create' },
        message: 'Creating new charter',
      };
    }
  }

  // Alerts
  if (lower.includes('alert') || lower.includes('delay')) {
    return { page: '/alerts', message: 'Showing alerts' };
  }

  // Contacts
  if (lower.includes('contact') || lower.includes('agent')) {
    return {
      page: '/contacts',
      filters: { search: query },
      message: 'Searching contacts',
    };
  }

  // Default: search vessels
  return {
    page: '/vessels',
    filters: { search: query },
    message: `Searching for: ${query}`,
  };
}
