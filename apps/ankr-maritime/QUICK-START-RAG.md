# Mari8X RAG Knowledge Engine - Quick Start Guide

**Last Updated:** January 31, 2026

---

## 🚀 What is This?

A complete Retrieval-Augmented Generation (RAG) system for Mari8X that enables:
- **Semantic search** across maritime documents
- **AI-powered Q&A** with source citations
- **Hybrid search** combining text + vector similarity
- **$0 cost in development**, $21/month in production (vs $1,043 cloud)

---

## ⚡ Quick Start (5 Minutes)

### 1. Start Services
```bash
cd /root/apps/ankr-maritime
docker compose -f docker-compose.dms.yml up -d
```

### 2. Verify Services
```bash
# Check containers
docker ps | grep mari8x

# Should see:
# mari8x-minio   (ports 9000-9001)
# mari8x-ollama  (port 11434)
# mari8x-redis   (port 6382)
```

### 3. Test Semantic Search
```bash
cd backend
npx tsx scripts/test-semantic-search.ts
```

### 4. Test RAG Q&A
```bash
npx tsx scripts/test-rag-qa.ts
```

**Note:** First LLM query is slow (~2-3 min) due to CPU-only inference.

---

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| MinIO | ✅ Running | Object storage on 9000-9001 |
| Ollama | ✅ Running | LLM server on 11434 |
| Redis | ✅ Running | Cache on 6382 |
| Embeddings | ✅ Generated | 1 document with 768-dim vectors |
| Semantic Search | ✅ Working | 55.97% relevance on test queries |
| Full-Text Search | ✅ Working | <50ms latency |
| Hybrid Search | ✅ Working | RRF fusion implemented |
| RAG Q&A | ✅ Working | LLM generates answers with citations |

---

## 🔧 Common Operations

### Add New Documents

1. Upload document to `documents` table (via GraphQL or SQL)
2. Generate embeddings:
```bash
cd backend
npx tsx scripts/generate-embeddings.ts
```

### Search Documents

**Semantic Search:**
```typescript
// In your code
const queryEmbedding = await generateEmbedding(userQuery);
const results = await prisma.$queryRaw`
  SELECT title, content,
    1 - (embedding <=> ${queryEmbedding}::vector) as similarity
  FROM maritime_documents
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

**Full-Text Search:**
```sql
SELECT title, ts_rank(contentTsv, to_tsquery('english', 'demurrage')) as rank
FROM maritime_documents
WHERE contentTsv @@ to_tsquery('english', 'demurrage')
ORDER BY rank DESC;
```

### Ask Questions (RAG)

```bash
# Via script
npx tsx scripts/test-rag-qa.ts

# Or in your code (after GraphQL API is built)
const result = await askMari8xRAG({
  question: "What is the demurrage rate?",
  limit: 3
});

console.log(result.answer);
console.log(result.sources);
console.log(result.confidence);
```

---

## 🔍 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker logs mari8x-ollama
docker logs mari8x-minio
docker logs mari8x-redis

# Restart services
docker compose -f docker-compose.dms.yml restart
```

### Embeddings Not Generating

```bash
# Check Ollama is responding
curl http://localhost:11434/api/tags

# Should return list of models including:
# - nomic-embed-text (embeddings)
# - qwen2.5:1.5b (LLM)
```

### Search Returns No Results

```bash
# Check if documents have embeddings
psql -U postgres -d ankr_maritime -c "
  SELECT COUNT(*) as total,
         COUNT(embedding) as with_embeddings
  FROM maritime_documents;
"

# If with_embeddings = 0, run:
cd backend
npx tsx scripts/generate-embeddings.ts
```

### LLM Responses Timeout

**Problem:** CPU inference is slow (2-3 minutes)

**Solutions:**
1. **Use Groq API** (recommended for production):
   ```env
   # Add to backend/.env
   USE_GROQ=true
   GROQ_API_KEY=your_key_here
   ```
   Result: <1 second responses, ~$15/month

2. **Add GPU** to server (one-time cost)

3. **Accept slow responses** for non-interactive use ($0 cost)

---

## 📚 Available Test Scripts

| Script | Purpose | Runtime |
|--------|---------|---------|
| `test-search.ts` | Full-text search test | ~5 sec |
| `test-semantic-search.ts` | Vector similarity tests | ~10 sec |
| `test-rag-qa.ts` | RAG Q&A with LLM | ~2-3 min (CPU) |
| `generate-embeddings.ts` | Embed new documents | ~500ms/doc |

---

## 🎯 Next Steps

### This Week
1. ✅ Services running
2. ✅ Embeddings generated
3. ✅ Search working
4. 🔨 Build GraphQL API
5. 🎨 Create frontend UI

### Next Week
1. 🤖 Upgrade SwayamBot
2. 📊 Advanced Search page
3. 📈 Usage analytics
4. 🚀 Production deployment

---

## 💰 Cost Optimization

### Current (Dev Mode)
- **Total:** $0/month
- Using local Ollama for everything
- Acceptable for testing and development

### Recommended (Production)
- **Embeddings:** Voyage AI (~$6/month)
- **LLM:** Groq llama-3.1-70b (~$15/month)
- **Storage/Cache:** Self-hosted ($0)
- **Total:** ~$21/month

### Cloud Alternative
- **AWS S3 + OpenAI GPT-4**
- **Total:** ~$1,043/month
- **Savings:** 98% by using hybrid approach

---

## 🔗 Resources

### Documentation
- `PHASE32-SEMANTIC-SEARCH-COMPLETE.md` - Detailed technical docs
- `PHASE32-FINAL-SESSION-SUMMARY-JAN31.md` - Complete session summary
- `SESSION-COMPLETE-JAN31-2026.md` - Quick reference
- `MARI8X-MASTER-TODO.md` - 12-week implementation plan

### Code
- `backend/scripts/` - Test and utility scripts
- `backend/src/schema/types/knowledge-engine.ts` - GraphQL API (to be implemented)
- `docker-compose.dms.yml` - Service definitions

### Database
- Database: `ankr_maritime`
- Table: `maritime_documents`
- User: `ankr` (or `postgres` for admin)

---

## 📞 Support

**Check service health:**
```bash
# MinIO
curl http://localhost:9000/minio/health/live

# Ollama
curl http://localhost:11434/api/tags

# Redis
docker exec mari8x-redis redis-cli ping
```

**Database queries:**
```bash
# Connect
psql -U postgres -d ankr_maritime

# Check indexed docs
SELECT title, docType,
       CASE WHEN embedding IS NOT NULL THEN 'Yes' ELSE 'No' END as has_embedding
FROM maritime_documents;
```

---

## ✅ Success Checklist

- [ ] Services running (`docker ps | grep mari8x`)
- [ ] Models loaded (`docker exec mari8x-ollama ollama list`)
- [ ] Documents indexed (`SELECT COUNT(*) FROM maritime_documents`)
- [ ] Embeddings generated (`WHERE embedding IS NOT NULL`)
- [ ] Semantic search working (`npx tsx scripts/test-semantic-search.ts`)
- [ ] RAG Q&A working (`npx tsx scripts/test-rag-qa.ts`)

If all checked, you're ready to build frontend UI! 🎉

---

**Quick Start Complete!** For detailed information, see the comprehensive documentation files.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
