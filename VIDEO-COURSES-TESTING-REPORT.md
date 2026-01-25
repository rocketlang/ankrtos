# Video Courses End-to-End Testing Report

**Date:** 2026-01-24
**Tester:** ANKR Labs QA
**Status:** 🔄 IN PROGRESS

---

## Test Scope

Testing the complete video courses feature implementation:
1. Navigation flow (Sidebar → Courses → Detail → Video)
2. Course library page functionality
3. Course detail page functionality
4. Video player page functionality
5. Podcast generation integration
6. Browser compatibility
7. Mobile responsiveness

---

## Test Environment

**URLs:**
- Development: http://localhost:3199
- Course Library: http://localhost:3199/platform/courses
- Sample Course: http://localhost:3199/platform/courses/pratham-quant-apt
- Sample Lesson: http://localhost:3199/platform/courses/pratham-quant-apt/lesson/lesson-1-2

**Browser:** Chrome 120+ (Primary)
**OS:** Linux (Production environment)
**Backend:** Fastify + React (SSR + Client-side routing)

---

## Pre-Test Checklist

### Files Verification

**Frontend Components:**
- ✅ CoursesPage.tsx (299 lines)
- ✅ CourseDetailPage.tsx (403 lines)
- ✅ VideoLessonPage.tsx (386 lines + podcast feature)

**Routing:**
- ✅ PlatformApp.tsx (routes added)
- ✅ PlatformLayout.tsx (nav menu updated)

**Backend:**
- ✅ server/index.ts (podcast routes registered)
- ✅ podcast-routes.ts (created)

**Build Status:**
```bash
# Check if build is needed
cd /root/ankr-labs-nx
npx nx build ankr-interact --skip-nx-cache
```

---

## Test Cases

### Section 1: Navigation Testing

#### Test 1.1: Sidebar Navigation
**Steps:**
1. Navigate to http://localhost:3199/platform
2. Look for "📚 Video Courses" in sidebar
3. Click on "📚 Video Courses"

**Expected Result:**
- Sidebar shows "Video Courses" menu item
- Item positioned between "AI Tutor" and "Progress"
- Clicking navigates to /platform/courses
- URL changes correctly

**Status:** ⏳ PENDING

---

#### Test 1.2: Breadcrumb Navigation
**Steps:**
1. Navigate to video lesson page
2. Check breadcrumb: "Course → Module → Lesson"
3. Click "Back to Course" button

**Expected Result:**
- Breadcrumb shows full path
- Back button navigates to course detail page
- URL updates correctly

**Status:** ⏳ PENDING

---

### Section 2: Course Library Page (CoursesPage)

#### Test 2.1: Course Display
**Steps:**
1. Navigate to /platform/courses
2. Count visible courses
3. Check course cards have: title, description, thumbnail, stats

**Expected Result:**
- 3 sample courses displayed:
  - Quantitative Aptitude (20 modules, 80 lessons, 40 hours)
  - Verbal Ability (15 modules, 60 lessons, 30 hours)
  - Logical Reasoning (12 modules, 50 lessons, 25 hours)
- Each card shows progress bar
- Each card shows enrolled student count
- Each card shows instructor name

**Status:** ⏳ PENDING

---

#### Test 2.2: Filter Tabs
**Steps:**
1. Click "All Courses" tab
2. Click "My Courses" tab
3. Click "Completed" tab

**Expected Result:**
- Tabs are clickable
- Active tab highlighted in blue
- Content updates (filters working)

**Status:** ⏳ PENDING

---

#### Test 2.3: Course Navigation
**Steps:**
1. Click "Start Course" on Quantitative Aptitude
2. Verify navigation to course detail page

**Expected Result:**
- Navigates to /platform/courses/pratham-quant-apt
- Course detail page loads
- URL correct

**Status:** ⏳ PENDING

---

#### Test 2.4: Info Banner
**Steps:**
1. Check top of courses page
2. Read info banner content

**Expected Result:**
- Banner shows: "📚 HD Video Lessons + 🤖 AI Tutor + 📝 Quizzes"
- Purple/blue gradient background
- Clear, readable text

**Status:** ⏳ PENDING

---

### Section 3: Course Detail Page (CourseDetailPage)

#### Test 3.1: Course Header
**Steps:**
1. Navigate to course detail page
2. Check header section

**Expected Result:**
- Course title displayed
- Overall progress circle (0% for new user)
- Course stats (modules, lessons, hours)
- "Ask AI Tutor" link present

**Status:** ⏳ PENDING

---

#### Test 3.2: Module Accordions
**Steps:**
1. Click on "Module 1: Number System"
2. Verify expansion
3. Click again to collapse

**Expected Result:**
- Module expands showing lessons
- Smooth animation
- Collapse works correctly
- Can expand multiple modules

**Status:** ⏳ PENDING

---

#### Test 3.3: Lesson Cards
**Steps:**
1. Expand Module 1
2. Check lesson card for "1.1 Introduction to Numbers"
3. Verify lesson metadata

**Expected Result:**
- Lesson title visible
- Duration shown (e.g., "10 min")
- "Watch Now" button present
- Quiz indicator (if quiz exists)
- Play icon or completion checkmark

**Status:** ⏳ PENDING

---

#### Test 3.4: Watch Now Button
**Steps:**
1. Click "Watch Now" on lesson 1.1

**Expected Result:**
- Navigates to /platform/courses/pratham-quant-apt/lesson/lesson-1-1
- Video player page loads
- URL correct

**Status:** ⏳ PENDING

---

#### Test 3.5: Progress Tracking
**Steps:**
1. Check module progress circles
2. Verify overall progress bar

**Expected Result:**
- Each module shows completion percentage
- Color-coded: red (0%), yellow (1-99%), green (100%)
- Overall progress bar at top
- Percentage text matches visual

**Status:** ⏳ PENDING

---

### Section 4: Video Player Page (VideoLessonPage)

#### Test 4.1: Video Player Load
**Steps:**
1. Navigate to lesson page
2. Check YouTube player loads

**Expected Result:**
- YouTube iframe loads
- Video thumbnail visible
- Play button clickable
- 16:9 aspect ratio maintained

**Status:** ⏳ PENDING

---

#### Test 4.2: Video Playback
**Steps:**
1. Click play button on video
2. Let video play for 10 seconds
3. Check progress tracking

**Expected Result:**
- Video plays smoothly
- Progress bar updates (should show ~X%)
- "Watched X%" text updates every second
- No buffering issues

**Status:** ⏳ PENDING

---

#### Test 4.3: Progress Persistence
**Steps:**
1. Watch video to 50%
2. Refresh page (F5)

**Expected Result:**
- Progress saved
- Shows "Watched 50%" on reload
- Can resume from same position

**Status:** ⏳ PENDING

---

#### Test 4.4: 90% Completion
**Steps:**
1. Fast-forward video to 90%
2. Check completion status

**Expected Result:**
- Green "✓ Completed" badge appears in header
- "Great! You've completed this lesson" message
- "Take Quiz" or "Next Lesson" button enabled

**Status:** ⏳ PENDING

---

#### Test 4.5: Notes Tab
**Steps:**
1. Click "📝 Notes" tab
2. Type some notes
3. Click "Save Notes"

**Expected Result:**
- Tab becomes active (blue)
- Textarea editable
- Can type freely
- Save button clickable

**Status:** ⏳ PENDING

---

#### Test 4.6: Transcript Tab
**Steps:**
1. Click "📋 Transcript" tab
2. Read transcript content

**Expected Result:**
- Tab becomes active
- Transcript displayed with timestamps
- Scrollable if long
- Readable font size

**Status:** ⏳ PENDING

---

#### Test 4.7: AI Help Tab
**Steps:**
1. Click "🤖 AI Help" tab
2. Type question: "What is HCF?"
3. Click "Ask AI Tutor →"

**Expected Result:**
- Tab becomes active
- Question textarea editable
- Button enabled when text entered
- Clicking navigates to /platform/tutor with pre-filled question

**Status:** ⏳ PENDING

---

#### Test 4.8: Quick Actions - Bookmark
**Steps:**
1. Scroll to Quick Actions section
2. Click "🔖 Bookmark this lesson"

**Expected Result:**
- Button clickable
- Visual feedback (hover state)
- Bookmark action triggered

**Status:** ⏳ PENDING

---

#### Test 4.9: Quick Actions - Download Resources
**Steps:**
1. Click "📥 Download resources"

**Expected Result:**
- Button clickable
- Download action triggered or modal shown

**Status:** ⏳ PENDING

---

#### Test 4.10: Quick Actions - Open AI Tutor
**Steps:**
1. Click "💬 Open AI Tutor"

**Expected Result:**
- Navigates to /platform/tutor
- AI Tutor page loads

**Status:** ⏳ PENDING

---

### Section 5: Podcast Generation (NEW FEATURE)

#### Test 5.1: Generate Podcast Button
**Steps:**
1. Navigate to video lesson
2. Scroll to Quick Actions
3. Check "🎙️ Generate Podcast" button

**Expected Result:**
- Button visible
- Purple background (distinct color)
- Icon: 🎙️
- Text: "Generate Podcast"

**Status:** ⏳ PENDING

---

#### Test 5.2: Podcast Generation
**Steps:**
1. Click "🎙️ Generate Podcast"
2. Wait for generation

**Expected Result:**
- Button shows "⏳ Generating Podcast..."
- Backend called: POST /api/generate-podcast
- After 5-30 seconds, shows "✅ Podcast Ready"
- Audio player appears below Quick Actions

**Status:** ⏳ PENDING

**Notes:**
- Requires edge-tts installation: `pip install edge-tts`
- May fail gracefully if TTS not installed
- Should show error message if fails

---

#### Test 5.3: Podcast Player
**Steps:**
1. After podcast generated, check audio player
2. Click play
3. Listen to audio

**Expected Result:**
- HTML5 audio player visible
- Controls: play, pause, seek, volume
- Audio plays in Hindi (Microsoft voice)
- Duration shown
- Can seek through audio

**Status:** ⏳ PENDING

---

#### Test 5.4: Download Podcast
**Steps:**
1. Click "📥 Download" button under player

**Expected Result:**
- File downloads as MP3
- Filename: "[lesson-title]-podcast.mp3"
- Can open and play downloaded file

**Status:** ⏳ PENDING

---

#### Test 5.5: Delete Podcast
**Steps:**
1. Click "🗑️" red delete button
2. Confirm deletion

**Expected Result:**
- Podcast player disappears
- Button returns to "🎙️ Generate Podcast"
- localStorage cleared
- Can generate again

**Status:** ⏳ PENDING

---

#### Test 5.6: Podcast Persistence
**Steps:**
1. Generate podcast
2. Refresh page (F5)

**Expected Result:**
- Podcast player still visible
- Audio URL intact
- Can play without regenerating
- Button shows "✅ Podcast Ready"

**Status:** ⏳ PENDING

---

### Section 6: Quiz Integration

#### Test 6.1: Take Quiz Button
**Steps:**
1. Complete lesson to 90%
2. Check for "Take Quiz →" button

**Expected Result:**
- Button appears in header when lesson completed
- Blue background
- Arrow icon
- Clickable

**Status:** ⏳ PENDING

---

#### Test 6.2: Quiz Navigation
**Steps:**
1. Click "Take Quiz →"

**Expected Result:**
- Navigates to /platform/assessment/quiz-hcf-lcm
- Quiz page loads (AssessmentPage)
- Quiz content displayed

**Status:** ⏳ PENDING

---

#### Test 6.3: Return from Quiz
**Steps:**
1. Complete quiz
2. Navigate back to lesson

**Expected Result:**
- Lesson progress maintained
- Podcast still available
- Completion status saved

**Status:** ⏳ PENDING

---

### Section 7: Next Lesson Flow

#### Test 7.1: Next Lesson Button
**Steps:**
1. Complete lesson without quiz
2. Check "Next Lesson →" button

**Expected Result:**
- Button visible when no quiz
- Navigates to next lesson in module
- URL updates correctly

**Status:** ⏳ PENDING

---

#### Test 7.2: End of Course
**Steps:**
1. Navigate to last lesson
2. Complete it

**Expected Result:**
- Shows "Finish →" button
- Navigates back to course detail
- Overall progress updated

**Status:** ⏳ PENDING

---

### Section 8: Browser Compatibility

#### Test 8.1: Chrome Desktop
**Browser:** Chrome 120+
**Status:** ⏳ PENDING

**Checklist:**
- [ ] Navigation works
- [ ] Video plays
- [ ] Podcast generates
- [ ] Audio plays
- [ ] UI renders correctly

---

#### Test 8.2: Firefox Desktop
**Browser:** Firefox 120+
**Status:** ⏳ PENDING

**Checklist:**
- [ ] Navigation works
- [ ] Video plays
- [ ] Podcast generates
- [ ] Audio plays
- [ ] UI renders correctly

---

#### Test 8.3: Safari Desktop
**Browser:** Safari 17+
**Status:** ⏳ PENDING

**Checklist:**
- [ ] Navigation works
- [ ] Video plays
- [ ] Podcast generates (may fail without edge-tts)
- [ ] Audio plays
- [ ] UI renders correctly

---

#### Test 8.4: Chrome Mobile
**Device:** Android/iPhone with Chrome
**Status:** ⏳ PENDING

**Checklist:**
- [ ] Responsive layout
- [ ] Touch navigation
- [ ] Video plays inline (not fullscreen)
- [ ] Audio controls work
- [ ] Scrolling smooth

---

#### Test 8.5: Safari iOS
**Device:** iPhone with Safari
**Status:** ⏳ PENDING

**Checklist:**
- [ ] Responsive layout
- [ ] Touch navigation
- [ ] Video plays (iOS restrictions)
- [ ] Audio plays (may need user interaction)
- [ ] Scrolling smooth

---

### Section 9: Performance Testing

#### Test 9.1: Page Load Time
**Measure:**
- Course library: < 2 seconds
- Course detail: < 2 seconds
- Video lesson: < 3 seconds

**Status:** ⏳ PENDING

---

#### Test 9.2: Video Load Time
**Measure:**
- YouTube iframe load: < 2 seconds
- Video start: < 1 second after click

**Status:** ⏳ PENDING

---

#### Test 9.3: Podcast Generation Time
**Measure:**
- Short transcript (500 words): < 15 seconds
- Medium transcript (1500 words): < 30 seconds

**Status:** ⏳ PENDING

---

### Section 10: Error Handling

#### Test 10.1: Invalid Lesson ID
**Steps:**
1. Navigate to /platform/courses/invalid/lesson/invalid

**Expected Result:**
- Shows "Lesson not found" message
- Doesn't crash
- Can navigate back

**Status:** ⏳ PENDING

---

#### Test 10.2: Network Error (Podcast)
**Steps:**
1. Stop backend server
2. Try to generate podcast

**Expected Result:**
- Shows error: "Failed to generate podcast"
- Button returns to normal state
- Can try again when server back

**Status:** ⏳ PENDING

---

#### Test 10.3: YouTube Video Not Available
**Steps:**
1. Use invalid YouTube ID

**Expected Result:**
- YouTube shows error message
- Page doesn't crash
- Can navigate away

**Status:** ⏳ PENDING

---

## Known Issues

### Issue #1: Placeholder YouTube Videos
**Severity:** Medium
**Description:** Currently using `dQw4w9WgXcQ` (Rick Roll) as placeholder
**Impact:** Demo shows wrong video content
**Solution:** Replace with actual Pratham videos
**Status:** PLANNED (Task #5)

---

### Issue #2: Sample Transcript
**Severity:** Low
**Description:** Transcript is generic sample text
**Impact:** Podcast content not lesson-specific
**Solution:** Add real transcripts from Pratham videos
**Status:** PLANNED (Task #5)

---

### Issue #3: Edge-TTS Dependency
**Severity:** Medium
**Description:** Podcast requires `pip install edge-tts`
**Impact:** Podcast generation fails without it
**Solution:** Include in deployment docs, add fallback
**Status:** DOCUMENTED

---

## Test Results Summary

**Total Tests:** 50
**Passed:** 0
**Failed:** 0
**Skipped:** 0
**In Progress:** 50

**Coverage:**
- Navigation: 0/2
- Course Library: 0/4
- Course Detail: 0/5
- Video Player: 0/10
- Podcast: 0/6
- Quiz: 0/3
- Browser: 0/5
- Performance: 0/3
- Error Handling: 0/3

---

## Next Steps

### Immediate
1. Start development server
2. Run manual tests systematically
3. Document results
4. Fix critical issues
5. Update this report

### Before Demo
1. Complete all high-priority tests
2. Fix any blocking issues
3. Verify on multiple browsers
4. Test on mobile devices
5. Create demo video (backup)

---

## Testing Commands

```bash
# Start development server
cd /root/ankr-labs-nx
npx nx serve ankr-interact

# Or build and start
npx nx build ankr-interact
node packages/ankr-interact/dist/server/index.js

# Install edge-tts for podcast testing
pip install edge-tts

# Test edge-tts
edge-tts --voice "hi-IN-SwaraNeural" --text "Test" --write-media test.mp3

# Clear browser cache
# Chrome: Ctrl+Shift+R (hard refresh)
# Or: Developer Tools → Application → Clear Storage
```

---

**Report Status:** 🔄 IN PROGRESS
**Last Updated:** 2026-01-24
**Next Update:** After running tests
