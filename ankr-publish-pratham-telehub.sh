#!/bin/bash
# ANKR Publish - Pratham Telehub Project Documents
# Publishes Pratham Telehub documentation to ANKR Viewer

set -e

echo "📱 === Publishing Pratham Telehub Documentation === 📱"
echo ""

# Configuration
DOCS_SOURCE="/root"
DOCS_DESTINATION="/root/ankr-universe-docs/project/documents/pratham-telehub"
VIEWER_URL="https://ankr.in/project/documents/pratham-telehub"

# Create destination directory
echo "📁 Creating destination directory..."
mkdir -p "$DOCS_DESTINATION"
echo "  ✅ Created: $DOCS_DESTINATION"

# Copy all Pratham Telehub documents
echo ""
echo "📄 Publishing Pratham Telehub Documents..."

# Unified documents (NEW)
if [ -f "$DOCS_SOURCE/PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md"
fi

if [ -f "$DOCS_SOURCE/PRATHAM-TELEHUB-UNIFIED-TODO.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-TELEHUB-UNIFIED-TODO.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-TELEHUB-UNIFIED-TODO.md"
fi

# Original documents
if [ -f "$DOCS_SOURCE/PRATHAM-TELEHUB-PROJECT-REPORT.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-TELEHUB-PROJECT-REPORT.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-TELEHUB-PROJECT-REPORT.md"
fi

if [ -f "$DOCS_SOURCE/PRATHAM-TELEHUB-TODO.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-TELEHUB-TODO.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-TELEHUB-TODO.md"
fi

if [ -f "$DOCS_SOURCE/PRATHAM-REQUIREMENTS-GAP-ANALYSIS.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-REQUIREMENTS-GAP-ANALYSIS.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-REQUIREMENTS-GAP-ANALYSIS.md"
fi

# Communication guides
if [ -f "$DOCS_SOURCE/PRATHAM-COMMUNICATION-STACK.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-COMMUNICATION-STACK.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-COMMUNICATION-STACK.md"
fi

if [ -f "$DOCS_SOURCE/PRATHAM-MSG91-INTEGRATION-GUIDE.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-MSG91-INTEGRATION-GUIDE.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-MSG91-INTEGRATION-GUIDE.md"
fi

if [ -f "$DOCS_SOURCE/PRATHAM-PLIVO-INTEGRATION-GUIDE.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-PLIVO-INTEGRATION-GUIDE.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-PLIVO-INTEGRATION-GUIDE.md"
fi

# POC documentation
if [ -f "$DOCS_SOURCE/pratham-telehub-poc/README.md" ]; then
  cp "$DOCS_SOURCE/pratham-telehub-poc/README.md" "$DOCS_DESTINATION/POC-README.md" && \
    echo "  ✅ POC-README.md"
fi

# Additional documents
if [ -f "$DOCS_SOURCE/PRATHAM-TELEHUB-POC-COMPLETE.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-TELEHUB-POC-COMPLETE.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-TELEHUB-POC-COMPLETE.md"
fi

if [ -f "$DOCS_SOURCE/PRATHAM-TELEHUB-SHOWCASE-PUBLISHED.md" ]; then
  cp "$DOCS_SOURCE/PRATHAM-TELEHUB-SHOWCASE-PUBLISHED.md" "$DOCS_DESTINATION/" && \
    echo "  ✅ PRATHAM-TELEHUB-SHOWCASE-PUBLISHED.md"
fi

# Create comprehensive index
echo ""
echo "📝 Creating viewer index..."
cat > "$DOCS_DESTINATION/README.md" << 'INDEXEOF'
# 📱 Pratham TeleHub - Complete Documentation

**AI-Powered Telecalling & Sales Management Platform**
**Client:** Pratham Education Foundation
**Status:** Planning & Development Phase

---

## 🎯 Quick Links

### 📊 Main Documents (Start Here!)

1. **[Unified Project Report](PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md)** 🔥 **LATEST**
   - Complete technical analysis (900+ lines)
   - All 12 requirements detailed
   - Architecture, cost, ROI analysis
   - Database schemas & API designs

2. **[Unified TODO & Roadmap](PRATHAM-TELEHUB-UNIFIED-TODO.md)** 🔥 **LATEST**
   - 27-week execution plan (1,200+ lines)
   - Phase-by-phase implementation
   - 300+ actionable tasks
   - Complete testing strategy

3. **[Requirements Gap Analysis](PRATHAM-REQUIREMENTS-GAP-ANALYSIS.md)**
   - Detailed breakdown of 12 features
   - Current vs required state
   - Effort estimates per feature
   - Critical path analysis

---

## 📚 Additional Documentation

### Planning & Analysis
- **[Original Project Report](PRATHAM-TELEHUB-PROJECT-REPORT.md)** - Initial technical analysis
- **[Original TODO](PRATHAM-TELEHUB-TODO.md)** - Original 5-phase roadmap
- **[POC Documentation](POC-README.md)** - Demo setup & usage guide

### Integration Guides
- **[Communication Stack](PRATHAM-COMMUNICATION-STACK.md)** - SMS, Email, WhatsApp
- **[MSG91 Integration](PRATHAM-MSG91-INTEGRATION-GUIDE.md)** - SMS provider setup
- **[Plivo Integration](PRATHAM-PLIVO-INTEGRATION-GUIDE.md)** - Voice API setup

### Status Reports
- **[POC Complete](PRATHAM-TELEHUB-POC-COMPLETE.md)** - POC completion summary
- **[Showcase Published](PRATHAM-TELEHUB-SHOWCASE-PUBLISHED.md)** - Demo showcase details

---

## 🎯 Project Overview

### Business Context
- **Client:** Pratham Education Foundation
- **Team Size:** 30 telecallers + managers
- **Challenge:** Disjointed systems, inefficient operations
- **Solution:** AI-powered unified platform

### Expected Impact
- **30-40%** improvement in telecaller efficiency
- **15-20%** increase in conversion rates
- **50%** reduction in manual data entry
- **100%** visibility into team performance

### Timeline & Budget
- **Development:** 24-27 weeks
- **Year 1 Cost:** ₹43.21 lakhs
- **ROI:** 5.6 months payback period

---

## 🏗️ Technical Stack

### Frontend
- React 18 + TypeScript
- Vite build tool
- TanStack Query + Zustand
- Tailwind CSS + Shadcn/ui

### Backend
- Node.js 20 + TypeScript
- NestJS/Fastify framework
- GraphQL + REST APIs
- Socket.io for real-time

### Infrastructure
- PostgreSQL 16 + TimescaleDB
- Redis for caching
- MinIO for storage
- Docker + PM2

### External Services
- Exotel/Twilio (Voice)
- WhatsApp Business API
- SendGrid (Email)
- ANKR AI Proxy (LLM)

---

## 📋 The 12 Core Requirements

### Phase 1 - Core Features (5 items)
1. ✅ **Lead Ingestion Manager** - Collect from CSV, API, manual
2. ✅ **Lead Distribution Engine** - Auto-assign with rules
3. 🔄 **The Smart Queue** - Prioritized task list
4. ❌ **Active Call HUD** - Real-time call interface
5. 🔄 **Call Disposition** - Record outcomes

### Phase 2 - Automation & Logistics (4 items)
6. ❌ **Campaign Automation** - WhatsApp/Email drip
7. ❌ **Visit Scheduler** - Field appointment booking
8. ❌ **Mobile Visits App** - Field agent interface
9. ❌ **Sale/Closure Form** - Deal closing workflow

### Phase 3 - Intelligence & Analytics (3 items)
10. ❌ **Customer 360 History** - Complete interaction view
11. ❌ **Command Center Dashboard** - Manager analytics
12. ❌ **Sales Empowerment Panel** - AI-powered insights

**Legend:**
- ✅ Complete
- 🔄 Partial (needs enhancement)
- ❌ Not started

---

## 🚀 Getting Started

### For Developers
1. Read [Unified Project Report](PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md)
2. Review [Unified TODO](PRATHAM-TELEHUB-UNIFIED-TODO.md)
3. Check [POC Documentation](POC-README.md)

### For Project Managers
1. Start with [Requirements Gap Analysis](PRATHAM-REQUIREMENTS-GAP-ANALYSIS.md)
2. Review timeline in [Unified TODO](PRATHAM-TELEHUB-UNIFIED-TODO.md)
3. Check budget in [Unified Project Report](PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md)

### For Stakeholders
1. Read Executive Summary in [Unified Project Report](PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md)
2. Review expected impact and ROI
3. Check phased rollout plan

---

## 📊 Key Deliverables

### Completed ✅
- POC demo (localhost running)
- Professional showcase (HTML + PDF)
- Database schema design
- Sample data generation
- WebSocket real-time updates

### In Progress 🔄
- Lead data import from CRM
- Requirements analysis
- Technical documentation
- Unified roadmap

### Upcoming 🎯
- Active Call HUD (Critical!)
- Campaign automation
- Customer 360 view
- Command center dashboard

---

## 📞 Project Contacts

### ANKR Team
- **Project Lead:** Capt. Anil Sharma
- **Tech Stack:** Node.js + React + PostgreSQL
- **AI Integration:** ANKR AI Proxy

### Pratham Team
- **Organization:** Pratham Education Foundation
- **Use Case:** Telecalling & Sales Management
- **Team Size:** 30+ users

---

## 🔗 Related Links

- **POC Demo:** http://localhost:3101 (when running)
- **Backend API:** http://localhost:3100 (when running)
- **ANKR Platform:** https://ankr.in
- **Source Code:** `/root/pratham-telehub-poc/`

---

**Last Updated:** February 14, 2026
**Document Version:** 2.0
**Status:** Active Development

🙏 **Jai Guru Ji** | Built with ❤️ by ANKR Labs
INDEXEOF

echo "  ✅ Created: README.md (Index)"

# Create shortcut index.md
cp "$DOCS_DESTINATION/README.md" "$DOCS_DESTINATION/index.md"
echo "  ✅ Created: index.md (Shortcut)"

echo ""
echo "🎉 Publishing Complete!"
echo ""
echo "📍 Documents published to:"
echo "   Local: $DOCS_DESTINATION"
echo "   Viewer: $VIEWER_URL"
echo ""
echo "🌐 Access via ANKR Viewer:"
echo "   Main Index: $VIEWER_URL/README.md"
echo "   Project Report: $VIEWER_URL/PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md"
echo "   TODO/Roadmap: $VIEWER_URL/PRATHAM-TELEHUB-UNIFIED-TODO.md"
echo ""
echo "✅ All Pratham Telehub documentation is now live!"
