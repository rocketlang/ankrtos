# Email Organizer - Quick Start Guide

**Version:** 1.0.0
**Status:** Production Ready ✅
**Last Updated:** February 4, 2026

---

## 🚀 Quick Start (3 Minutes)

### 1. Start Services

```bash
# Terminal 1: Start Backend
cd apps/ankr-maritime/backend
npm run dev

# Terminal 2: Start Frontend
cd apps/ankr-maritime/frontend
npm run dev

# Terminal 3: Start PageIndex RAG (Optional)
cd pageindex-rag
uvicorn main:app --port 8001 --reload
```

### 2. Access Email Organizer

Open browser: `http://localhost:5173/email-organizer`

### 3. Test Core Features

**A. Email Organization**
- Click on folders (Inbox, Sent, Drafts, etc.)
- Create custom folder: Right-click folder tree → "New Folder"
- Move email: Drag thread to folder

**B. Smart Threading**
- Click on any thread to view conversation
- See all messages in thread with expand/collapse
- Thread automatically groups by subject + participants

**C. AI Summaries**
- Open any email
- See AI-generated summary at top (purple card)
- View extracted entities (vessel, port, date, amount)
- See key points and action items

**D. AI Response Generation** ⭐ NEW
- Open any email
- Click **"AI Reply"** button (gradient purple-blue)
- Select response style (Acknowledge, Query Reply, Formal, etc.)
- Click **"Generate Response"**
- Review generated response with context used
- Edit if needed → Click "Save Changes"
- Click **"Send"** to send response

---

## 📚 GraphQL API Examples

### Generate AI Response

```graphql
mutation GenerateResponse {
  generateEmailResponse(
    context: {
      originalEmail: {
        subject: "Vessel Inquiry - MV OCEAN SPIRIT"
        body: "We need availability for May 15-20, 2026. Singapore to Dubai route."
        from: "john.doe@example.com"
        to: ["agent@mari8x.com"]
        category: "vessel_inquiry"
        urgency: "high"
        entities: {
          vessel: [{ value: "MV OCEAN SPIRIT", confidence: 0.95 }]
          port: [{ value: "Singapore", confidence: 0.92 }, { value: "Dubai", confidence: 0.90 }]
          date: [{ value: "May 15-20, 2026", confidence: 0.88 }]
        }
      }
    }
    style: query_reply
  ) {
    id
    subject
    body
    style
    confidence
    contextUsed
    suggestedEdits
    generatedAt
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "generateEmailResponse": {
      "id": "clx1a2b3c4d5e6f7g8h9",
      "subject": "Re: Vessel Inquiry - MV OCEAN SPIRIT",
      "body": "Dear John,\n\nThank you for your inquiry regarding MV OCEAN SPIRIT...",
      "style": "query_reply",
      "confidence": 0.92,
      "contextUsed": {
        "documentsCount": 3,
        "knowledgeCount": 5,
        "threadMessagesCount": 0
      },
      "suggestedEdits": [
        "Consider adding specific vessel specifications",
        "Include approximate quote range if available"
      ],
      "generatedAt": "2026-02-04T14:30:00Z"
    }
  }
}
```

### Get Email Threads

```graphql
query GetThreads {
  emailThreads(
    folderId: "inbox"
    filters: {
      category: "vessel_inquiry"
      urgency: "high"
      isRead: false
    }
    limit: 20
    offset: 0
  ) {
    id
    subject
    participants
    messageCount
    lastMessageAt
    isRead
    isStarred
    labels
    category
    urgency
  }
}
```

### Get Folder Tree

```graphql
query GetFolders {
  emailFolderTree {
    id
    name
    type
    icon
    color
    unreadCount
    totalCount
    children {
      id
      name
      type
      unreadCount
    }
  }
}
```

### Generate Email Summary

```graphql
mutation GenerateSummary {
  generateEmailSummary(
    input: {
      emailId: "clx1a2b3c4d5e6f7g8h9"
      subject: "Urgent: Port Documentation Required"
      body: "Please provide all port clearance documents for MV ATLANTIC by tomorrow 5 PM..."
      category: "documentation"
      urgency: "critical"
    }
  ) {
    summary
    keyPoints
    action
    confidence
    sentiment
  }
}
```

---

## 🎯 Testing AI Response Generation

### Test Case 1: Vessel Inquiry (Query Reply)

**Email Content:**
```
Subject: Vessel Inquiry - MV PACIFIC STAR
From: customer@shipping.com
Body: We are looking for vessel availability for MV PACIFIC STAR
      from Rotterdam to New York on June 10-15, 2026.
      Cargo: 50,000 MT bulk grain. Please provide quote.
```

**Steps:**
1. Open email in detail view
2. Click "AI Reply"
3. Select "Query Reply" style
4. Click "Generate Response"

**Expected Result:**
- Comprehensive response with vessel availability check
- Includes request for additional details (cargo specs, loading/discharge rates)
- Professional tone with maritime terminology
- Company knowledge injected (response time, quote validity)
- User signature included at bottom

### Test Case 2: Documentation Request (Acknowledge)

**Email Content:**
```
Subject: Port Documents - MV ATLANTIC
From: master@vessel.com
Body: Please send all port clearance documents for arrival tomorrow.
```

**Steps:**
1. Open email
2. Click "AI Reply"
3. Select "Acknowledge" style
4. Generate

**Expected Result:**
- Brief confirmation (2-3 sentences)
- Timeline mentioned (will send within X hours)
- Professional but concise

### Test Case 3: Follow-up (Follow Up)

**Email Content:**
```
Subject: Re: Pending Quote - MV SUNRISE
From: broker@maritime.com
Body: [Previous conversation about quote request]
```

**Steps:**
1. Open thread with history
2. Click "AI Reply"
3. Select "Follow Up" style
4. Generate

**Expected Result:**
- References previous conversation
- Polite reminder of pending action
- Provides next steps
- Sets soft deadline
- Thread history context visible in generation

---

## 🔍 Context Retrieval Testing

### Verify PageIndex RAG Integration

**1. Check RAG Endpoint:**
```bash
curl -X POST http://localhost:8001/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vessel availability policy",
    "filters": {
      "organizationId": "org123",
      "documentTypes": ["policy", "procedure"]
    },
    "limit": 5
  }'
```

**Expected:** Returns relevant documents with scores

**2. Test Fallback Mechanism:**
```bash
# Stop RAG service
# Generate response - should still work using DB fallback
```

**Expected:** Response generated using DocumentChunk table

### Verify Context Used Display

**In Frontend:**
1. Generate any response
2. Check context card shows:
   - Documents count (e.g., "Documents: 3")
   - Knowledge count (e.g., "Knowledge: 5")
   - Thread messages count (e.g., "Thread: 2")

**In GraphQL Response:**
```json
"contextUsed": {
  "documentsCount": 3,
  "knowledgeCount": 5,
  "threadMessagesCount": 2
}
```

---

## 🎨 Response Styles Comparison

### Style: **Acknowledge** (Brief, 2-3 sentences)
```
Dear John,

Thank you for reaching out. We have received your vessel inquiry
for MV OCEAN SPIRIT and will review our fleet schedule.
You can expect a detailed response within 4 hours.

Best regards,
Mari8X Port Agency Team
```

### Style: **Query Reply** (Detailed, with bullet points)
```
Dear John,

Thank you for your inquiry regarding MV OCEAN SPIRIT availability
for May 15-20, 2026 on the Singapore to Dubai route.

To provide you with an accurate quote, we need the following details:
• Cargo type and quantity
• Required loading/discharge rates
• Any special cargo handling requirements
• Preferred laycan window

We typically respond to vessel inquiries within 4 hours. Our quotes
are valid for 7 days and are subject to bunker adjustment.

Please let me know if you need any additional information.

Best regards,
Mari8X Port Agency Team
```

### Style: **Formal** (Professional business letter)
```
Dear Mr. Doe,

We acknowledge receipt of your inquiry dated February 4, 2026,
regarding the availability of MV OCEAN SPIRIT for the period of
May 15-20, 2026, for the Singapore to Dubai route.

Our operations team is currently reviewing our fleet schedule to
determine vessel availability for the requested dates. We will
conduct a comprehensive analysis of your requirements and prepare
a detailed quotation for your consideration.

We anticipate providing you with our response within four business
hours. Should you require any clarification or have additional
requirements, please do not hesitate to contact us.

We appreciate your interest in our services and look forward to
the opportunity to serve you.

Yours sincerely,
Mari8X Port Agency Team
```

### Style: **Concise** (Short, direct)
```
Hi John,

MV OCEAN SPIRIT inquiry received for May 15-20 (Singapore-Dubai).
Checking availability and will send quote within 4 hours.

Best,
Mari8X Team
```

### Style: **Friendly** (Warm, conversational)
```
Hi John!

Thanks so much for reaching out about MV OCEAN SPIRIT!

We'd be happy to help you with the Singapore to Dubai route for
May 15-20. Let me check our fleet schedule and put together a
quote for you. I'll get back to you within a few hours with all
the details.

Feel free to reach out if you have any questions in the meantime!

Cheers,
Mari8X Port Agency Team
```

---

## 🐛 Troubleshooting

### Issue: "AI Proxy error: 500"

**Solution:**
```bash
# Check AI Proxy is running
curl http://localhost:8000/health

# Restart AI Proxy
cd ai-gateway
npm run dev
```

### Issue: "RAG endpoint unavailable"

**Solution:**
- System automatically falls back to direct DB query
- Check logs: "RAG endpoint unavailable, using fallback"
- Verify PageIndex service: `curl http://localhost:8001/health`

### Issue: No context retrieved

**Solution:**
1. Check DocumentChunk table has data:
```sql
SELECT COUNT(*) FROM "DocumentChunk" WHERE "organizationId" = 'org123';
```

2. Verify organization knowledge:
```sql
SELECT * FROM "Organization" WHERE id = 'org123';
```

3. Check user preferences:
```sql
SELECT "emailSignature", "preferredTone" FROM "User" WHERE id = 'user123';
```

### Issue: Response generation slow (>10 seconds)

**Possible Causes:**
- AI Proxy overloaded
- Large context (many documents)
- Network latency

**Solutions:**
- Reduce context limit (default: 5 docs)
- Use faster model (gpt-4o-mini instead of gpt-4o)
- Enable caching for repeated contexts

---

## 📊 Performance Benchmarks

### Expected Response Times

| Operation | Target | Typical | Max |
|-----------|--------|---------|-----|
| Context Retrieval (RAG) | 300ms | 200-500ms | 1s |
| Context Retrieval (Fallback) | 100ms | 50-100ms | 200ms |
| AI Response Generation | 3s | 2-4s | 6s |
| Total (end-to-end) | 4s | 3-5s | 7s |
| Email List Load | 100ms | 50-100ms | 200ms |
| Email Detail Load | 50ms | 20-50ms | 100ms |

### Context Size Limits

- **Documents:** Max 5, 1000 chars each = 5KB
- **Knowledge:** Max 10 snippets, 200 chars each = 2KB
- **Thread History:** Max 5 messages, 500 chars each = 2.5KB
- **Total Context:** ~10KB per response

---

## 🔐 Security Considerations

### Authentication
- ✅ All GraphQL queries require `userId` in context
- ✅ Organization-scoped data access
- ✅ JWT token validation

### Data Privacy
- ✅ User-scoped drafts (can only see own drafts)
- ✅ Organization-scoped documents
- ✅ No PII in context retrieval logs

### AI Safety
- ✅ Prompt injection prevention (sanitized inputs)
- ✅ Context size limits (prevent token overflow)
- ✅ Response validation (JSON parsing with fallback)

---

## 📈 Monitoring & Metrics

### Key Metrics to Track

**Usage Metrics:**
- AI responses generated per day
- Response style distribution
- Average confidence score
- User edit rate (% of responses edited)

**Performance Metrics:**
- Context retrieval latency (p50, p95, p99)
- AI generation latency
- RAG hit rate (RAG vs. fallback)
- Document relevance scores

**Quality Metrics:**
- Response acceptance rate (sent vs. discarded)
- User satisfaction (optional feedback)
- Error rate (failed generations)

### GraphQL Queries for Analytics

```graphql
query ResponseAnalytics {
  responseDraftStats {
    totalGenerated
    byStyle {
      style
      count
      avgConfidence
      editRate
    }
    avgGenerationTime
    successRate
  }
}
```

---

## 🎓 Best Practices

### For Port Agents

1. **Choose the Right Style:**
   - First contact: "Query Reply" or "Formal"
   - Quick update: "Concise" or "Acknowledge"
   - Building relationship: "Friendly"
   - Reminder: "Follow Up"

2. **Review Before Sending:**
   - Always read AI-generated response
   - Check for accuracy (dates, amounts, names)
   - Add personal touches if needed
   - Verify attachments referenced

3. **Provide Feedback:**
   - Edit responses to improve future generations
   - System learns from your edits (ML feedback loop)
   - Report any inappropriate responses

### For Administrators

1. **Maintain Knowledge Base:**
   - Keep DocumentChunk table updated
   - Add category-specific knowledge snippets
   - Update company policies regularly

2. **Monitor Quality:**
   - Track response acceptance rate
   - Review low-confidence responses
   - Analyze user edit patterns

3. **Optimize Performance:**
   - Regularly check RAG endpoint health
   - Monitor context retrieval latency
   - Archive old threads to improve performance

---

## 🚀 What's Next?

### Immediate (Ready to Use)
✅ Email organization with folders and threading
✅ AI-powered email summaries
✅ AI response generation with 9 styles
✅ Context-aware responses using RAG
✅ User preference integration

### Short-term Enhancements (1-2 weeks)
🔄 Email sending integration (SMTP/OAuth)
🔄 Response templates library
🔄 Multi-language support
🔄 Batch response generation

### Medium-term Features (1-2 months)
🔄 Advanced analytics dashboard
🔄 Response effectiveness tracking
🔄 Custom style creation
🔄 Integration with other Mari8X features

---

## 📞 Support

**Technical Issues:**
- Check logs: `apps/ankr-maritime/backend/logs/`
- Discord: #mari8x-support
- Email: tech-support@mari8x.com

**Feature Requests:**
- GitHub Issues: https://github.com/mari8x/mari8x/issues
- Product Feedback Form: https://mari8x.com/feedback

**Documentation:**
- Technical Docs: `/apps/ankr-maritime/docs/`
- API Reference: GraphQL Playground at `http://localhost:4000/graphql`
- User Guide: `/apps/ankr-maritime/docs/USER_GUIDE.md`

---

## 🎉 Conclusion

You're now ready to use the **Email Organizer with AI Response Drafter**!

**Quick Recap:**
- 📁 Organize emails with smart folders and threading
- 🤖 Get AI summaries of every email
- ✨ Generate context-aware responses in 9 styles
- 🚀 Send professional replies in seconds

**Start using it now:** `http://localhost:5173/email-organizer`

Happy emailing! 📧
