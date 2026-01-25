# ankrshield Demo Mode Implementation

**Date**: January 23, 2026 11:11 IST
**Status**: ✅ Complete and Deployed

---

## Overview

Implemented fully functional demo mode for ankrshield dashboard, allowing users to experience the application without creating an account or installing the desktop app.

---

## What is Demo Mode?

Demo mode is activated when users visit the dashboard with the `?demo=true` query parameter:

**URL**: https://ankr.digital/dashboard?demo=true

In demo mode:
- ✅ No API calls are made (all GraphQL queries skipped)
- ✅ Realistic mock data is displayed
- ✅ All UI features work normally
- ✅ Clear "Demo Mode" indicator shown
- ✅ Instructions on how to get real data

---

## Implementation Details

### 1. Query Parameter Detection

Used React Router's `useSearchParams` hook to detect demo mode:

```typescript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const isDemoMode = searchParams.get('demo') === 'true';
```

### 2. Skip API Calls in Demo Mode

Modified Apollo Client queries to skip when in demo mode:

```typescript
const { data: userData } = useQuery(ME_QUERY, { skip: isDemoMode });
const { data: scoresData, loading: scoresLoading } = useQuery(PRIVACY_SCORES_QUERY, {
  variables: { limit: 1, period: 'daily' },
  skip: isDemoMode,
});
const { data: eventsData, loading: eventsLoading } = useQuery(NETWORK_EVENTS_QUERY, {
  variables: { limit: 10 },
  skip: isDemoMode,
});
```

### 3. Mock Data

Created realistic demo data that showcases ankrshield's features:

#### User Data
```typescript
const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@ankrshield.com'
};
```

#### Privacy Scores
```typescript
const DEMO_SCORE = {
  overallScore: 87,        // Strong privacy score (out of 100)
  totalRequests: 12847,    // Realistic daily request count
  blockedRequests: 9234,   // High block rate (71.8%)
  trackersBlocked: 2156,   // Significant tracker blocking
};
```

#### Network Events (8 events)
Real-world domains and event types:

1. **doubleclick.net** - TRACKER_BLOCKED (2 minutes ago)
2. **googletagmanager.com** - TRACKER_BLOCKED (5 minutes ago)
3. **facebook.com** - PIXEL_BLOCKED (8 minutes ago)
4. **cdn.jsdelivr.net** - REQUEST_ALLOWED (12 minutes ago)
5. **analytics.google.com** - TRACKER_BLOCKED (15 minutes ago)
6. **amazon-adsystem.com** - AD_BLOCKED (20 minutes ago)
7. **cloudflare.com** - REQUEST_ALLOWED (25 minutes ago)
8. **scorecardresearch.com** - TRACKER_BLOCKED (30 minutes ago)

**Event Types Shown**:
- TRACKER_BLOCKED (5 events) - Shows tracker protection
- AD_BLOCKED (1 event) - Shows ad blocking
- PIXEL_BLOCKED (1 event) - Shows social media pixel blocking
- REQUEST_ALLOWED (2 events) - Shows legitimate traffic

**Blocked vs Allowed Ratio**: 6 blocked / 2 allowed = 75% block rate

### 4. UI Indicators

#### Demo Mode Alert (Top of Page)
```typescript
{isDemoMode && (
  <Alert variant="info">
    <div className="flex items-center gap-3">
      <Info className="w-5 h-5" />
      <div>
        <p className="font-semibold">Demo Mode Active</p>
        <p className="text-sm">
          You're viewing ankrshield with sample data. Download the app or create an account to see your real privacy metrics.
        </p>
      </div>
    </div>
  </Alert>
)}
```

#### Demo Mode Badge (Header)
```typescript
{isDemoMode && (
  <Badge variant="info">
    <Info className="w-4 h-4 inline mr-1" />
    Demo Mode
  </Badge>
)}
```

### 5. Conditional Data Rendering

Data source switches based on mode:

```typescript
const user = isDemoMode ? DEMO_USER : userData?.me;
const latestScore = isDemoMode ? DEMO_SCORE : scoresData?.privacyScores?.[0];
const events = isDemoMode ? DEMO_EVENTS : (eventsData?.networkEvents || []);
```

### 6. Loading State Handling

Demo mode shows instant data (no loading):

```typescript
{!isDemoMode && scoresLoading ? '...' : stat.value.toLocaleString()}
```

---

## User Experience

### Accessing Demo Mode

Users can access demo mode in two ways:

1. **From Landing Page**: Click "🎬 Launch Live Demo" button
   - Links to: `/dashboard?demo=true`
   - Prominent placement (3 locations on landing page)

2. **Direct URL**: Navigate to https://ankr.digital/dashboard?demo=true

### What Users See

#### Dashboard Header
```
🔵 Demo Mode Active
You're viewing ankrshield with sample data. Download the app or
create an account to see your real privacy metrics.

Dashboard                                    🔵 Demo Mode
Welcome back, Demo User!
```

#### Privacy Stats (4 Cards)
- **Privacy Score**: 87 (strong protection)
- **Total Requests**: 12,847 (high activity)
- **Blocked Requests**: 9,234 (71.8% blocked)
- **Trackers Blocked**: 2,156 (significant blocking)

#### Recent Network Activity (8 Events)
Shows real-world tracking domains being blocked in real-time:
- Google DoubleClick (tracker blocked)
- Google Tag Manager (tracker blocked)
- Facebook pixel (pixel blocked)
- Amazon ads (ad blocked)
- Analytics (tracker blocked)
- Legitimate CDN (allowed)
- Cloudflare (allowed)

### Conversion Path

1. **Land on homepage** → See "Your Privacy is Under Attack" message
2. **Click "Try Live Demo"** → Instant access to dashboard (no signup)
3. **See impressive stats** → "Wow, this blocks a lot!"
4. **See real tracker names** → "Oh, these are tracking me!"
5. **Want real protection** → Click "Download" or "Create Account"

---

## Technical Benefits

### 1. Zero Friction
- No account creation required
- No email verification
- No form filling
- Instant access

### 2. Performance
- No API latency (data is instant)
- No database queries
- No network requests
- Fast page load

### 3. Reliability
- Works even if API is down
- No authentication errors
- No rate limiting
- Always available

### 4. Privacy-Preserving
- No user data collected (even for demo)
- No cookies set
- No tracking
- No telemetry

---

## Build Metrics

### Production Bundle

| Metric | Value |
|--------|-------|
| **JS Size** | 479 KB (raw) |
| **JS Gzipped** | 141.8 KB |
| **CSS Size** | 21 KB (raw) |
| **CSS Gzipped** | 4.6 KB |
| **Total Gzipped** | ~146 KB |

### Size Comparison

| Version | JS Size | Change |
|---------|---------|--------|
| Without Demo | 477 KB | - |
| With Demo | 479 KB | +2 KB |

**Reason for increase**: Demo data constants (~1.5 KB) + demo mode logic (~0.5 KB)

### Load Time Estimate
- **HTML**: ~100ms
- **CSS**: ~200ms (4.6 KB gzipped)
- **JS**: ~600ms (141.8 KB gzipped)
- **Demo Data**: 0ms (instant, no API calls)
- **Total**: ~900ms for fully interactive demo

---

## Files Modified

### `/root/ankrshield/apps/web/src/pages/Dashboard.tsx`

**Changes**:
1. Added `useSearchParams` import from react-router-dom
2. Added `Info` icon import from lucide-react
3. Created demo data constants (DEMO_USER, DEMO_SCORE, DEMO_EVENTS)
4. Added demo mode detection logic
5. Modified GraphQL queries to skip in demo mode
6. Added conditional data rendering
7. Added demo mode alert banner
8. Added demo mode badge in header
9. Updated loading states for demo mode

**Lines Added**: ~80 lines
**Lines Modified**: ~15 lines

---

## Next Steps

### Immediate
✅ Demo mode implemented
✅ Deployed to production
✅ Accessible at /dashboard?demo=true

### Recommended
1. **Analytics Tracking**: Track demo mode usage (privacy-friendly)
2. **Conversion CTAs**: Add "Download App" or "Create Account" buttons in demo mode
3. **Demo Duration**: Consider adding a timer or session limit
4. **Demo Features**: Add interactive elements (e.g., "block this tracker" demo)

### Optional Enhancements
- Add demo mode for other pages (Devices, Analytics, Policies)
- Add "Exit Demo Mode" button
- Add demo data variations (different privacy scores)
- Add tooltips explaining what users see
- Add comparison: "Your score would be..." personalization

---

## Testing

### Manual Test Checklist

✅ **URL works**: https://ankr.digital/dashboard?demo=true
✅ **No API calls**: Check browser network tab
✅ **Stats display**: All 4 stat cards show demo data
✅ **Events display**: 8 network events shown
✅ **Demo indicator**: Alert banner and badge visible
✅ **No loading states**: Instant data display
✅ **No errors**: No console errors or GraphQL errors

### User Flow Test

1. ✅ Click "Launch Live Demo" from landing page
2. ✅ Dashboard loads instantly with demo data
3. ✅ See "Demo Mode Active" alert
4. ✅ See realistic privacy stats (87 score, 12K requests)
5. ✅ See real tracker names being blocked
6. ✅ Understand what ankrshield does

---

## Success Metrics

### Engagement Targets
- **Demo Activation Rate**: 15-25% of landing page visitors
- **Time in Demo**: >1 minute (exploring features)
- **Demo → Download**: 10-15% conversion
- **Demo → Signup**: 5-10% conversion

### Trust Building
- **Realistic Data**: Shows actual tracker domains (not generic)
- **Strong Protection**: 87/100 score, 71% block rate
- **Recent Activity**: Events from 2-30 minutes ago (feels live)
- **Clear Indicators**: Users know it's demo mode (transparency)

---

## Summary

**Status**: ✅ **COMPLETE and DEPLOYED**

Demo mode is now fully functional at https://ankr.digital/dashboard?demo=true

**Features Implemented**:
- ✅ Query parameter detection (`?demo=true`)
- ✅ Realistic mock data (user, scores, events)
- ✅ Skip API calls in demo mode
- ✅ Demo mode indicators (alert + badge)
- ✅ Instant data display (no loading)
- ✅ Privacy-preserving (no data collection)

**User Benefits**:
- ✅ Try ankrshield with zero friction
- ✅ See realistic protection in action
- ✅ No account creation required
- ✅ Instant access from landing page

**Business Benefits**:
- ✅ Lower conversion barrier
- ✅ Higher demo usage (no signup friction)
- ✅ Better user understanding (see it in action)
- ✅ Increased downloads/signups (informed users)

---

**Deployed**: January 23, 2026 11:11 IST
**Build Tool**: Vite 5.4.21
**Status**: Production Live ✅
**URL**: https://ankr.digital/dashboard?demo=true
