<!--
Published by ANKR COMPASS
Type: todo
Source: /root/AGFLOW-UXUI-TODO.md
Published: 2026-02-12 15:03:19
Tool: compass publish todo
-->

# AGFLOW UX/UI Implementation TODO

## 🎯 Project: ANKR Command Center
**Goal:** Build layman-friendly interface for discovering 860 packages
**Timeline:** 4 weeks
**Priority:** HIGH

---

## 📋 Phase 1: Foundation (Week 1)

### ✅ Setup & Infrastructure

- [x] Create app structure (`/root/ankr-labs-nx/apps/command-center`)
- [x] Initialize React + TypeScript + Vite
- [x] Configure Tailwind CSS with ANKR theme
- [ ] Set up Zustand for state management
- [ ] Configure React Query for data fetching
- [ ] Create folder structure:
  ```
  src/
  ├── components/
  │   ├── chat/          # Chat interface
  │   ├── packages/      # Package cards
  │   ├── demo/          # Demo system
  │   └── common/        # Shared components
  ├── hooks/             # Custom hooks
  ├── services/          # API services
  ├── stores/            # Zustand stores
  ├── types/             # TypeScript types
  └── utils/             # Utility functions
  ```

### 🎨 Design System

- [ ] **Color Palette**
  - [ ] Primary: ANKR Blue (#2563eb)
  - [ ] Secondary: Cyan (#06b6d4)
  - [ ] Accent: Purple (#8b5cf6)
  - [ ] Success: Green (#10b981)
  - [ ] Warning: Amber (#f59e0b)
  - [ ] Error: Red (#ef4444)
  - [ ] Dark mode colors

- [ ] **Typography**
  - [ ] Headings: Inter/Geist font
  - [ ] Body: System font stack
  - [ ] Code: JetBrains Mono
  - [ ] Scale: 12px, 14px, 16px, 18px, 24px, 32px, 48px

- [ ] **Spacing System**
  - [ ] Base unit: 4px
  - [ ] Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px

- [ ] **Component Library**
  - [ ] Button (primary, secondary, ghost, danger)
  - [ ] Input (text, search, voice)
  - [ ] Card (package, demo, activity)
  - [ ] Badge (status, category, new)
  - [ ] Avatar (user, AI bot)
  - [ ] Tooltip
  - [ ] Modal
  - [ ] Toast notifications
  - [ ] Loading states (skeleton, spinner)

---

## 💬 Phase 2: Chat Interface (Week 1-2)

### Core Chat UI

- [ ] **Chat Container**
  - [ ] Fixed position at bottom (mobile) / right side (desktop)
  - [ ] Expandable/collapsible
  - [ ] Smooth animations
  - [ ] Keyboard shortcuts (Ctrl+K to open)

- [ ] **Message Components**
  - [ ] User message bubble (right-aligned, blue)
  - [ ] AI message bubble (left-aligned, white)
  - [ ] Typing indicator (animated dots)
  - [ ] Timestamp on hover
  - [ ] Message actions (copy, regenerate)

- [ ] **Input Area**
  - [ ] Textarea with auto-resize
  - [ ] Send button (Enter to send, Shift+Enter for newline)
  - [ ] Voice input button (microphone icon)
  - [ ] Attachment button (future: upload docs)
  - [ ] Character counter (optional)

- [ ] **Suggested Prompts**
  - [ ] Quick action chips above input
  - [ ] Examples:
    - "I need warehouse management"
    - "Show me accounting software"
    - "Help me track shipments"
  - [ ] Context-aware suggestions

### Chat Features

- [ ] **Message Streaming**
  - [ ] Real-time AI response streaming
  - [ ] Character-by-character reveal
  - [ ] Markdown rendering (bold, lists, code)

- [ ] **Rich Message Content**
  - [ ] Package cards embedded in messages
  - [ ] Action buttons (Try Demo, Install, Learn More)
  - [ ] Inline videos/screenshots
  - [ ] Collapsible sections for long responses

- [ ] **Chat History**
  - [ ] Persist conversations in localStorage
  - [ ] Load previous conversations
  - [ ] Clear history button
  - [ ] Export conversation

- [ ] **Multi-language Support**
  - [ ] Language selector (EN, HI, TA, TE)
  - [ ] Detect language from input
  - [ ] Translate AI responses
  - [ ] Support code-switching (Hinglish)

- [ ] **Voice Input**
  - [ ] Browser Speech Recognition API
  - [ ] Mic button with visual feedback
  - [ ] Voice waveform animation
  - [ ] Support multiple languages
  - [ ] Fallback to text if speech API unavailable

---

## 📦 Phase 3: Package Discovery (Week 2)

### Package Cards

- [ ] **Card Design**
  - [ ] Package icon/logo (emoji or custom)
  - [ ] Package name (@ankr-universe/dodd-wms)
  - [ ] Short description (1-2 lines)
  - [ ] Star rating (community ratings)
  - [ ] Category badge
  - [ ] "NEW" badge for recent packages
  - [ ] Install count
  - [ ] Last updated date

- [ ] **Card Interactions**
  - [ ] Hover effects (lift, shadow)
  - [ ] Click to expand details
  - [ ] Quick actions toolbar:
    - [ ] 👁️ View Demo
    - [ ] 📥 Install
    - [ ] 📚 Documentation
    - [ ] ⭐ Favorite
  - [ ] Smooth transitions

- [ ] **Card States**
  - [ ] Loading skeleton
  - [ ] Installed (checkmark, different color)
  - [ ] Favorited (filled star)
  - [ ] Recommended (highlighted border)

### Package Detail View

- [ ] **Full-Screen Modal**
  - [ ] Hero image/screenshot
  - [ ] Detailed description
  - [ ] Feature list with checkmarks
  - [ ] Screenshots gallery (carousel)
  - [ ] Video demo (YouTube embed)
  - [ ] Installation instructions
  - [ ] Code examples (syntax highlighted)
  - [ ] Dependencies list
  - [ ] Related packages
  - [ ] User reviews/ratings
  - [ ] "Try Live Demo" button (prominent)

- [ ] **Tabs**
  - [ ] Overview
  - [ ] Features
  - [ ] Installation
  - [ ] Examples
  - [ ] Documentation
  - [ ] Reviews

### Search & Filter

- [ ] **Search Bar**
  - [ ] Global search (top of page)
  - [ ] Auto-complete suggestions
  - [ ] Search history dropdown
  - [ ] Clear button
  - [ ] Search by name, description, keywords
  - [ ] Fuzzy matching

- [ ] **Filters Panel**
  - [ ] Category filter (dropdown/checkboxes)
  - [ ] Domain filter (logistics, ERP, etc.)
  - [ ] Scope filter (@ankr, @ankr-universe, etc.)
  - [ ] Sort by: Relevance, Popularity, Recent, A-Z
  - [ ] "Show installed only" toggle
  - [ ] "Show favorites only" toggle
  - [ ] Clear all filters button

- [ ] **Result Grid**
  - [ ] Responsive grid (1-4 columns based on screen)
  - [ ] Infinite scroll or pagination
  - [ ] Result count ("Showing 12 of 860 packages")
  - [ ] No results state (helpful message + suggestions)

---

## 🎬 Phase 4: Demo System (Week 2-3)

### Live Demo Player

- [ ] **Demo Interface**
  - [ ] iframe-based sandbox
  - [ ] Full-screen mode
  - [ ] Responsive preview (mobile/tablet/desktop)
  - [ ] Interactive playground
  - [ ] Reset demo button

- [ ] **Demo Types**
  - [ ] Video walkthrough (YouTube/Vimeo)
  - [ ] Interactive sandbox (live React app)
  - [ ] Screenshot gallery (before/after)
  - [ ] Step-by-step guide (wizard)

- [ ] **Demo Features**
  - [ ] Play/pause video
  - [ ] Fullscreen toggle
  - [ ] Speed controls (0.5x, 1x, 1.5x, 2x)
  - [ ] Keyboard shortcuts (Space, F, ←/→)
  - [ ] Share demo link
  - [ ] Feedback button ("Was this helpful?")

### Guided Setup Wizard

- [ ] **Wizard UI**
  - [ ] Step indicator (1 of 5)
  - [ ] Progress bar
  - [ ] Back/Next buttons
  - [ ] Skip button
  - [ ] Auto-save progress

- [ ] **Setup Steps**
  1. [ ] Welcome (what this package does)
  2. [ ] Requirements check (Node version, etc.)
  3. [ ] Configuration (API keys, database, etc.)
  4. [ ] Installation (npm install with live logs)
  5. [ ] Success (next steps, links to docs)

- [ ] **Smart Defaults**
  - [ ] Pre-fill common values
  - [ ] Detect environment (dev/prod)
  - [ ] "Use recommended settings" checkbox
  - [ ] Explain each setting (tooltips)

---

## 🏠 Phase 5: Main Dashboard (Week 3)

### Hero Section

- [ ] **Hero Design**
  - [ ] Gradient background (animated)
  - [ ] Large heading: "What would you like to do today?"
  - [ ] Prominent search bar
  - [ ] Voice input button
  - [ ] Quick action chips below search
  - [ ] Illustration/animation (optional)

- [ ] **Quick Actions**
  - [ ] "📦 Browse Packages"
  - [ ] "🚀 Start a Project"
  - [ ] "📚 Learn & Explore"
  - [ ] "🎯 I have a specific need" (opens chat)

### Activity Feed

- [ ] **Feed Design**
  - [ ] Timeline/card layout
  - [ ] Real-time updates
  - [ ] Grouped by date (Today, Yesterday, This Week)
  - [ ] Show latest 10 activities
  - [ ] "View all" link

- [ ] **Activity Types**
  - [ ] Package installed ✅
  - [ ] Demo viewed 👁️
  - [ ] Package favorited ⭐
  - [ ] Setup completed 🎉
  - [ ] Review submitted 💬
  - [ ] Package updated 🆕

- [ ] **Activity Card**
  - [ ] Icon (based on type)
  - [ ] Description ("You installed @ankr-universe/dodd-wms")
  - [ ] Timestamp ("2 hours ago")
  - [ ] Quick action ("View package →")

### Stats Dashboard

- [ ] **User Stats**
  - [ ] Packages installed (number + list)
  - [ ] Favorites (number + grid)
  - [ ] Demos watched (count)
  - [ ] Time saved (estimated hours)

- [ ] **System Stats**
  - [ ] Total packages available (860)
  - [ ] New this week (badge)
  - [ ] Most popular (top 3)
  - [ ] Trending (arrow up)

### Recommendations

- [ ] **Recommendation Engine**
  - [ ] Based on user's industry
  - [ ] "Users like you also use..."
  - [ ] Personalized suggestions
  - [ ] Weekly digest email

- [ ] **Recommendation Card**
  - [ ] Package info
  - [ ] Why recommended ("95% of warehouse managers use this")
  - [ ] One-click install
  - [ ] Dismiss button

---

## 🎨 Phase 6: Visual Polish (Week 3-4)

### Animations

- [ ] **Page Transitions**
  - [ ] Fade in on load
  - [ ] Smooth route transitions
  - [ ] Skeleton loading states
  - [ ] Optimistic UI updates

- [ ] **Micro-interactions**
  - [ ] Button hover/press states
  - [ ] Card hover lift
  - [ ] Icon animations (star fill, checkmark)
  - [ ] Progress indicators
  - [ ] Confetti on success 🎉

- [ ] **Loading States**
  - [ ] Skeleton screens (cards, text)
  - [ ] Spinner for quick loads
  - [ ] Progress bar for installations
  - [ ] Shimmer effect

### Responsive Design

- [ ] **Mobile (< 640px)**
  - [ ] Bottom sheet for chat
  - [ ] Single column grid
  - [ ] Hamburger menu
  - [ ] Touch-friendly buttons (44px min)
  - [ ] Swipe gestures

- [ ] **Tablet (640-1024px)**
  - [ ] 2-column grid
  - [ ] Side panel for filters
  - [ ] Expanded search bar

- [ ] **Desktop (> 1024px)**
  - [ ] 3-4 column grid
  - [ ] Fixed sidebar
  - [ ] Keyboard shortcuts
  - [ ] Right-click context menus

### Dark Mode

- [ ] **Theme Toggle**
  - [ ] Sun/moon icon button
  - [ ] Persist preference
  - [ ] System preference detection
  - [ ] Smooth transition

- [ ] **Dark Theme Colors**
  - [ ] Background: #0a0e27
  - [ ] Cards: #1a1f3a
  - [ ] Text: #e5e7eb
  - [ ] Adjust all colors for contrast

---

## 🔌 Phase 7: Backend Integration (Week 4)

### API Endpoints

- [ ] **Discovery API**
  - [ ] GET `/api/packages` - List all packages
  - [ ] GET `/api/packages/:id` - Package details
  - [ ] GET `/api/search?q=warehouse` - Search packages
  - [ ] POST `/api/chat` - AI chat endpoint

- [ ] **User API**
  - [ ] GET `/api/user/installed` - User's packages
  - [ ] POST `/api/user/favorite/:id` - Favorite package
  - [ ] GET `/api/user/activity` - Activity feed
  - [ ] PUT `/api/user/preferences` - Save preferences

- [ ] **Demo API**
  - [ ] GET `/api/demo/:packageId` - Get demo URL
  - [ ] POST `/api/demo/:packageId/feedback` - Submit feedback
  - [ ] GET `/api/stats` - Global stats

### AGFLOW Integration

- [ ] **Search Integration**
  - [ ] Connect to discovery index (860 packages)
  - [ ] Use searchIndex function
  - [ ] Rank by relevance
  - [ ] Cache results

- [ ] **AI Chat Integration**
  - [ ] Connect to LLM (via @ankr/ai-router)
  - [ ] Stream responses
  - [ ] Include package context
  - [ ] Generate code examples

- [ ] **Analytics**
  - [ ] Track searches
  - [ ] Track package views
  - [ ] Track installations
  - [ ] Track demo plays
  - [ ] Weekly usage reports

---

## 🧪 Phase 8: Testing & Optimization (Week 4)

### Testing

- [ ] **Unit Tests**
  - [ ] Component tests (React Testing Library)
  - [ ] Hook tests
  - [ ] Utility function tests
  - [ ] Store tests

- [ ] **Integration Tests**
  - [ ] API integration
  - [ ] Chat flow
  - [ ] Package installation flow
  - [ ] Demo playback

- [ ] **E2E Tests**
  - [ ] User journey tests (Playwright)
  - [ ] Search → discover → install → demo
  - [ ] Multi-language support
  - [ ] Mobile responsiveness

### Performance

- [ ] **Optimization**
  - [ ] Code splitting (React.lazy)
  - [ ] Image optimization (WebP, lazy loading)
  - [ ] Bundle size analysis
  - [ ] Tree shaking
  - [ ] Gzip compression

- [ ] **Metrics**
  - [ ] Lighthouse score > 90
  - [ ] First Contentful Paint < 1.5s
  - [ ] Time to Interactive < 3s
  - [ ] Bundle size < 300KB

### Accessibility

- [ ] **WCAG 2.1 AA Compliance**
  - [ ] Keyboard navigation (Tab, Enter, Esc)
  - [ ] Screen reader support (aria labels)
  - [ ] Color contrast ratio > 4.5:1
  - [ ] Focus indicators
  - [ ] Skip links

- [ ] **i18n**
  - [ ] English (default)
  - [ ] Hindi
  - [ ] Tamil
  - [ ] Telugu
  - [ ] RTL support (future: Arabic)

---

## 🚀 Phase 9: Deployment (Week 4)

### Build & Deploy

- [ ] **Production Build**
  - [ ] Environment variables
  - [ ] API base URLs
  - [ ] Analytics tracking
  - [ ] Error logging (Sentry)

- [ ] **Hosting**
  - [ ] Deploy to Vercel/Netlify
  - [ ] Custom domain (command.ankr.io)
  - [ ] SSL certificate
  - [ ] CDN configuration

- [ ] **CI/CD**
  - [ ] GitHub Actions workflow
  - [ ] Auto-deploy on main branch
  - [ ] Preview deployments for PRs
  - [ ] Rollback mechanism

### Documentation

- [ ] **User Guide**
  - [ ] Getting started
  - [ ] How to search packages
  - [ ] How to install packages
  - [ ] How to use demos
  - [ ] FAQ

- [ ] **Developer Docs**
  - [ ] Architecture overview
  - [ ] Component API
  - [ ] Contributing guide
  - [ ] API documentation

---

## 📊 Success Metrics

### Week 1 Goals
- [ ] 50+ users try the interface
- [ ] 20+ package searches
- [ ] 5+ demos watched

### Month 1 Goals
- [ ] 500+ users
- [ ] 200+ package searches/day
- [ ] 50+ installations
- [ ] 4.5+ star rating
- [ ] < 5% bounce rate

### Month 3 Goals
- [ ] 2000+ active users
- [ ] 1000+ packages installed
- [ ] 500+ reviews submitted
- [ ] 90+ Lighthouse score
- [ ] Featured in Product Hunt

---

## 🎯 Priority Order

### Must-Have (P0)
1. Chat interface with AI responses
2. Package cards with basic info
3. Search functionality
4. Basic demo player
5. Mobile responsive

### Should-Have (P1)
6. Voice input
7. Multi-language support
8. Advanced filters
9. Activity feed
10. Dark mode

### Nice-to-Have (P2)
11. Guided setup wizard
12. User reviews/ratings
13. Package favorites
14. Recommendation engine
15. Analytics dashboard

---

## 🔄 Iteration Plan

### MVP (2 weeks)
- Basic chat + search + package cards
- Launch to 10 beta users
- Gather feedback

### V1.0 (4 weeks)
- Full feature set
- Public launch
- Marketing push

### V1.1 (6 weeks)
- User feedback incorporated
- Performance optimizations
- New features based on usage

---

## 📝 Notes

- **Design inspiration:** Linear, Vercel, Raycast, Arc browser
- **Target load time:** < 2 seconds on 3G
- **Accessibility:** WCAG 2.1 AA minimum
- **Browser support:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile-first:** 60% of users expected on mobile

---

## ✅ Definition of Done

Each task is done when:
- [ ] Code written and reviewed
- [ ] Tests passing (unit + integration)
- [ ] Accessible (keyboard + screen reader)
- [ ] Responsive (mobile + tablet + desktop)
- [ ] Documented (code comments + user docs)
- [ ] Deployed to staging
- [ ] QA approved
- [ ] User tested (if applicable)

---

**Last Updated:** 2026-02-09
**Owner:** ANKR Labs Team
**Status:** 🚧 In Progress
