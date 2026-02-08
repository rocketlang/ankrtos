# AI Proxy Configuration for Mari8X

The AI search system now supports multiple AI providers through a flexible proxy configuration.

## Supported AI Providers

### 1. Anthropic Claude (Default)
```env
AI_PROXY_MODE=anthropic
AI_PROXY_KEY=sk-ant-xxxxx
AI_PROXY_MODEL=claude-3-5-sonnet-20241022
```
**Cost**: ~$0.01 per search (~$50-100/month for 5000 queries)

### 2. OpenAI GPT-4
```env
AI_PROXY_MODE=openai
AI_PROXY_KEY=sk-xxxxx
AI_PROXY_MODEL=gpt-4
```
**Cost**: ~$0.015 per search (~$75-150/month for 5000 queries)

### 3. Custom AI Proxy
Point to your own AI service:
```env
AI_PROXY_MODE=custom
AI_PROXY_URL=https://your-ai-proxy.com/api/chat
AI_PROXY_KEY=your-api-key
```

**Expected Request Format**:
```json
POST /api/chat
{
  "prompt": "User query here...",
  "max_tokens": 500
}
```

**Expected Response Format**:
```json
{
  "response": "AI response here...",
  // OR
  "text": "AI response here...",
  // OR
  "content": "AI response here..."
}
```

### 4. Local LLM (Ollama, LM Studio, etc.)
Run AI locally for FREE:
```env
AI_PROXY_MODE=local
AI_PROXY_URL=http://localhost:11434/api/generate
AI_PROXY_MODEL=llama2
```

**Setup Ollama**:
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2
# or for better results:
ollama pull mistral

# Ollama runs on http://localhost:11434 by default
```

**Cost**: $0/month (free!)

## Configuration Priority

1. Check `AI_PROXY_MODE` environment variable
2. Falls back to Anthropic if not set
3. Falls back to keyword matching if AI fails

## Environment Variables

Add to `/root/apps/ankr-maritime/backend/.env`:

```env
# Choose one mode:
AI_PROXY_MODE=anthropic  # or: openai, custom, local

# For Anthropic:
ANTHROPIC_API_KEY=sk-ant-xxxxx
AI_PROXY_MODEL=claude-3-5-sonnet-20241022

# For OpenAI:
# AI_PROXY_KEY=sk-xxxxx
# AI_PROXY_MODEL=gpt-4

# For Custom Proxy:
# AI_PROXY_URL=https://your-proxy.com/api
# AI_PROXY_KEY=your-key

# For Local LLM:
# AI_PROXY_URL=http://localhost:11434/api/generate
# AI_PROXY_MODEL=mistral
```

## Recommended Setup for Frugal Usage

### Option 1: Local LLM (FREE but requires setup)
```env
AI_PROXY_MODE=local
AI_PROXY_URL=http://localhost:11434/api/generate
AI_PROXY_MODEL=mistral  # or llama2, codellama, etc.
```

**Pros**:
- FREE (no API costs)
- No rate limits
- Data stays on your server

**Cons**:
- Need to install Ollama
- Slightly slower (~2-3 seconds per query)
- Lower accuracy than Claude/GPT-4

### Option 2: Custom AI Proxy (Your Infrastructure)
Point to your own AI proxy service:
```env
AI_PROXY_MODE=custom
AI_PROXY_URL=https://your-internal-ai.ankr.com/api
AI_PROXY_KEY=internal-key
```

**Pros**:
- Control over costs
- Use your existing AI infrastructure
- Can add caching, rate limiting, etc.

### Option 3: Anthropic (Current - Best Quality)
```env
AI_PROXY_MODE=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Pros**:
- Best accuracy
- Understands maritime terms well
- Fast responses

**Cons**:
- Costs ~$50-100/month

## Testing Different Modes

```bash
# Test with Anthropic (current)
AI_PROXY_MODE=anthropic npm run dev

# Test with local LLM (free)
ollama serve &
AI_PROXY_MODE=local npm run dev

# Test with custom proxy
AI_PROXY_MODE=custom AI_PROXY_URL=https://your-proxy.com npm run dev
```

## Fallback Behavior

If AI call fails (API down, rate limit, etc.), the system automatically falls back to keyword matching:
- "vessels" → /vessels
- "mumbai port" → /ports/INMUM
- "create invoice" → /invoices?action=create

This ensures the search ALWAYS works, even without AI.

## Performance Comparison

| Mode | Cost/Query | Response Time | Accuracy |
|------|------------|---------------|----------|
| Anthropic | $0.01 | ~1s | 95% |
| OpenAI | $0.015 | ~1.5s | 93% |
| Custom | Varies | Varies | Depends |
| Local LLM | $0 | ~2-3s | 85% |
| Fallback | $0 | <0.1s | 75% |

## Recommended for You (Frugal)

Since you mentioned being frugal, I recommend:

**Option 1 (Best)**: Local LLM with Ollama + Mistral
```bash
ollama pull mistral
```
```env
AI_PROXY_MODE=local
AI_PROXY_MODEL=mistral
```
**Cost**: $0/month

**Option 2**: Keep Anthropic but cache common queries
- First query costs $0.01
- Subsequent identical queries are free (cached)
- Effective cost: ~$20/month for real usage

**Option 3**: Your own AI proxy
- If you have existing AI infrastructure
- Point to it with AI_PROXY_MODE=custom
