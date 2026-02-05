# 🧪 CORALS Platform - Complete Testing Guide

## 🌐 **Platform Access:**
```
Frontend: http://localhost:3013/
Network:  http://10.13.178.6:3013/
```

---

## ✅ **Testing Checklist**

### **1. Daily Horoscope System** ⭐

**URL:** `http://localhost:3013/daily-horoscope`

**Test Steps:**
1. ✅ **Page Load**
   - [ ] Page loads without errors
   - [ ] All 12 zodiac signs display in selector grid
   - [ ] Beautiful gradient design renders correctly

2. ✅ **Sign Selection**
   - [ ] Click on "Aries" - should load Aries horoscope
   - [ ] Click on "Leo" - should switch to Leo horoscope
   - [ ] Click on "Pisces" - should switch to Pisces horoscope
   - [ ] Each sign shows unique icon (♈, ♌, ♓, etc.)

3. ✅ **Horoscope Content**
   - [ ] Overview text displays
   - [ ] Overall rating (1-5 stars) shows
   - [ ] Love category (💕) displays with rating
   - [ ] Career category (💼) displays with rating
   - [ ] Health category (🏥) displays with rating
   - [ ] Finance category (💰) displays with rating

4. ✅ **Lucky Elements Sidebar**
   - [ ] Lucky numbers display (3 numbers)
   - [ ] Lucky colors show with badges
   - [ ] Lucky directions display
   - [ ] Lucky time shows (e.g., "10:00 AM - 12:00 PM")
   - [ ] Lucky gemstone displays

5. ✅ **Do's and Don'ts**
   - [ ] 4 Do's listed with green checkmarks
   - [ ] 4 Don'ts listed with red X marks
   - [ ] All items are readable and relevant

6. ✅ **Compatible Signs**
   - [ ] 2-3 compatible signs display
   - [ ] Each sign shows icon and name

7. ✅ **Special Message**
   - [ ] Inspirational quote displays
   - [ ] Attributed to "Jyotish Acharya Rakesh Sharma"

8. ✅ **Share Buttons**
   - [ ] WhatsApp share button visible
   - [ ] Instagram share button visible
   - [ ] PDF download button visible

9. ✅ **Navigation**
   - [ ] "Back to Dashboard" button works
   - [ ] Smooth scrolling throughout page

**Expected Result:** Full daily horoscope with all categories, lucky elements, and recommendations displays beautifully.

---

### **2. Muhurat Finder** 🗓️

**URL:** `http://localhost:3013/muhurat-finder`

**Test Steps:**
1. ✅ **Landing Page**
   - [ ] Hero section with "Find Your Auspicious Muhurat" displays
   - [ ] "Most Popular" section shows 4 events
   - [ ] "All Events" section shows remaining 6 events

2. ✅ **Popular Events Display**
   - [ ] 💒 Marriage/Wedding card
   - [ ] 💍 Engagement card
   - [ ] 🏡 House Warming card
   - [ ] 🚀 Business Launch card
   - [ ] Each card has icon, title, description
   - [ ] Hover effect works on cards

3. ✅ **Event Selection**
   - [ ] Click "Marriage" - navigates to results
   - [ ] Event header displays with gradient background
   - [ ] Event icon and name show prominently

4. ✅ **Best Muhurat Highlight**
   - [ ] Green highlighted "Best Recommended Muhurat" box
   - [ ] Score (e.g., 85/100) displays
   - [ ] Quality rating (Excellent/Very Good/Good) shows
   - [ ] Date displays in readable format
   - [ ] Time range shows (e.g., "10:00 AM - 12:00 PM")

5. ✅ **Panchang Details**
   - [ ] Nakshatra displays (e.g., "Rohini")
   - [ ] Tithi displays (e.g., "Dwitiya")
   - [ ] Yoga displays (e.g., "Siddhi")
   - [ ] Karana displays (e.g., "Bava")
   - [ ] All in color-coded boxes

6. ✅ **All Muhurats List**
   - [ ] Top 10 muhurats display
   - [ ] Each shows date, time, score
   - [ ] Quality rating badge shows
   - [ ] Panchang elements display for each
   - [ ] "View Details" button on each

7. ✅ **Premium Modal**
   - [ ] Click "Get Detailed Report" - modal opens
   - [ ] Modal shows "₹299" pricing
   - [ ] Lists 6-7 premium features with checkmarks
   - [ ] "Buy Detailed Report" button visible
   - [ ] "X" close button works

8. ✅ **Navigation**
   - [ ] "Back to Event Selection" returns to event list
   - [ ] "Back to Dashboard" returns to dashboard

**Expected Result:** Complete muhurat finder with event selection, top 10 muhurats, and premium upsell.

---

### **3. Dashboard** 📊

**URL:** `http://localhost:3013/dashboard`

**Test Steps:**
1. ✅ **Header**
   - [ ] CORALS logo displays
   - [ ] Navigation links (Store, Book Pandit, Ask Acharya)
   - [ ] Notification bell with count badge
   - [ ] User avatar

2. ✅ **Sidebar**
   - [ ] User profile shows (name, email, avatar)
   - [ ] Subscription tier badge (PRO/FREE/etc.)
   - [ ] 4 navigation tabs (Overview, Systems, Orders, Profile)
   - [ ] "Upgrade Plan" button
   - [ ] "Logout" button

3. ✅ **Welcome Banner**
   - [ ] "Namaste, [Name]!" greeting
   - [ ] Gradient background (orange to purple)
   - [ ] Inspirational message

4. ✅ **Usage Stats Cards**
   - [ ] "Readings Left" card with count
   - [ ] "Questions to Acharya" card with count
   - [ ] "Video Consultations" card with count
   - [ ] Each card has icon and description

5. ✅ **Daily Horoscope Widget** (NEW!)
   - [ ] Beautiful gradient card (indigo to pink)
   - [ ] "Today's Horoscope" title
   - [ ] User's zodiac sign displays (e.g., "Aries ♈")
   - [ ] 5-star rating shows
   - [ ] Brief overview text (2-3 sentences)
   - [ ] Lucky elements mini-display:
     - Lucky Number
     - Lucky Color
     - Lucky Time
   - [ ] "Read Full Horoscope →" button
   - [ ] Share button (📤)

6. ✅ **Quick Access Section**
   - [ ] Birth Chart card
   - [ ] Ask Question card
   - [ ] Temple Store card
   - [ ] Hover effects work

7. ✅ **Upcoming Events**
   - [ ] Lists 2 upcoming events
   - [ ] Each shows date, time, type
   - [ ] Calendar icon displays

**Expected Result:** Complete dashboard with enhanced daily horoscope widget showing personalized preview.

---

### **4. Kundli Matching** 💑

**URL:** `http://localhost:3013/kundli-matching`

**Test Steps:**
1. ✅ **Hero Section**
   - [ ] "Kundli Matching (Ashtakoot Guna Milan)" title
   - [ ] Subtitle explains compatibility checking

2. ✅ **Input Form**
   - [ ] Boy's details section (Name, DOB, Time, Place)
   - [ ] Girl's details section (Name, DOB, Time, Place)
   - [ ] "Calculate Compatibility" button

3. ✅ **Free Results** (Score Display)
   - [ ] Large compatibility score (e.g., "24/36")
   - [ ] Percentage (e.g., "67%")
   - [ ] Compatibility level (Excellent/Good/Average)
   - [ ] Brief interpretation

4. ✅ **Premium Paywall**
   - [ ] Blurred "Detailed Analysis" section
   - [ ] "Unlock Premium Report" modal
   - [ ] "₹999" pricing displays
   - [ ] Lists premium features
   - [ ] "Pay ₹999 & Unlock Now" button

5. ✅ **Ashtakoot Breakdown** (if unlocked)
   - [ ] 8 Gunas listed with scores
   - [ ] Progress bars for each guna
   - [ ] Total score calculation

**Expected Result:** Kundli matching with free basic score and premium detailed report paywall.

---

### **5. Scripture Library** 📚

**URL:** `http://localhost:3013/sanskriti`

**Test Steps:**
1. ✅ **Hero Section**
   - [ ] "Sacred Scriptures Library" title
   - [ ] Subtitle about 31 texts

2. ✅ **Categories**
   - [ ] Vedas section (4 texts)
   - [ ] Upanishads section (5 texts)
   - [ ] Puranas section (18 texts)
   - [ ] Epics section (2 texts)
   - [ ] Others section

3. ✅ **Scripture Cards**
   - [ ] Each shows icon, title (Sanskrit + English)
   - [ ] Verse count, chapter count
   - [ ] Brief description
   - [ ] "Read Now" or "Premium" badge

4. ✅ **Click Scripture**
   - [ ] Should navigate to chapter selection
   - [ ] (If Scripture Reader exists)

**Expected Result:** Beautiful library of 31 sacred texts with categories and descriptions.

---

### **6. Mythology Stories** 📖

**URL:** `http://localhost:3013/mythology`

**Test Steps:**
1. ✅ **Hero Section**
   - [ ] "Sacred Stories from Hindu Scriptures" title
   - [ ] Subtitle about 18 stories

2. ✅ **Category Filter**
   - [ ] "All Stories" button (18)
   - [ ] 9 category buttons (Creation, Gods, Goddesses, etc.)
   - [ ] Active category highlights
   - [ ] Count updates when filtering

3. ✅ **Story Cards**
   - [ ] Each shows icon, title (English + Sanskrit)
   - [ ] Category badge
   - [ ] Source scripture
   - [ ] Brief summary
   - [ ] Character list
   - [ ] Moral lesson
   - [ ] Reading time
   - [ ] "Popular" badge on some

4. ✅ **Filter Test**
   - [ ] Click "Gods" - filters to 6 god stories
   - [ ] Click "Goddesses" - filters to 3 goddess stories
   - [ ] Click "All Stories" - shows all 18

5. ✅ **Search**
   - [ ] Search box accepts text
   - [ ] Results filter as you type

6. ✅ **Story Click**
   - [ ] Clicking story navigates to full story page

**Expected Result:** 18 stories with beautiful cards, filtering, and navigation to full stories.

---

### **7. Landing Page** 🏠

**URL:** `http://localhost:3013/`

**Test Steps:**
1. ✅ **Hero Section**
   - [ ] Main headline displays
   - [ ] Tagline about spiritual journey
   - [ ] CTA buttons (Get Started, Learn More)

2. ✅ **Features Section**
   - [ ] Lists key features with icons
   - [ ] Daily Horoscope
   - [ ] Muhurat Finder
   - [ ] Kundli Matching
   - [ ] Sacred Texts
   - [ ] etc.

3. ✅ **Founder Section**
   - [ ] Jyotish Acharya Rakesh Sharma
   - [ ] Photo/Avatar
   - [ ] Credentials
   - [ ] Message

4. ✅ **CTA Section**
   - [ ] "Start Your Spiritual Journey" button
   - [ ] Links to signup/login

**Expected Result:** Beautiful landing page with all sections rendering correctly.

---

## 🔧 **Backend Testing (Manual)**

### **Test Daily Horoscope Engine:**
```bash
cd /root/apps/corals-astrology/backend/src/lib
node -e "const { generateDailyHoroscope } = require('./daily-horoscope-engine.ts'); console.log(generateDailyHoroscope('Aries'));"
```

### **Test Muhurat Engine:**
```bash
cd /root/apps/corals-astrology/backend/src/lib
node -e "const { findMuhurats } = require('./muhurat-engine.ts'); console.log('Muhurat engine loaded');"
```

---

## 🐛 **Common Issues & Fixes:**

### Issue 1: "Cannot find module"
**Fix:** Run `npm install` in frontend directory

### Issue 2: "Port already in use"
**Fix:** Frontend auto-finds next available port

### Issue 3: Mock data showing
**Expected:** All horoscopes use mock data currently. Backend integration needed.

### Issue 4: Premium features locked
**Expected:** Payment integration needs Razorpay setup

---

## 📱 **Mobile Testing:**

1. **Responsive Design:**
   - [ ] Open on mobile browser (use network URL)
   - [ ] All pages should be mobile-friendly
   - [ ] Touch interactions work
   - [ ] Text is readable without zoom

2. **Key Mobile Features:**
   - [ ] Horoscope cards stack vertically
   - [ ] Buttons are thumb-friendly
   - [ ] Navigation menu accessible
   - [ ] Forms are easy to fill

---

## ✅ **Expected Test Results:**

### **All Pages Should:**
- ✅ Load without console errors
- ✅ Display beautiful gradients and colors
- ✅ Show all content (no missing sections)
- ✅ Have working navigation
- ✅ Be responsive (desktop + mobile)

### **All Features Should:**
- ✅ Daily Horoscope: Full predictions for all 12 signs
- ✅ Muhurat Finder: 10 event types with top 10 muhurats
- ✅ Dashboard: Enhanced widget with horoscope preview
- ✅ Kundli Matching: Free score + premium paywall
- ✅ Scriptures: 31 texts browsable
- ✅ Mythology: 18 stories with filtering

### **Data Notes:**
- All horoscopes use generated predictions (templates with variety)
- Muhurat calculations use simplified algorithms (Swiss Ephemeris for production)
- Panchang data is calculated (accurate enough for demo)
- Premium features show paywall (Razorpay integration ready)

---

## 🎯 **Success Criteria:**

**PASS:** Platform is ready for demo/presentation
- All pages load correctly
- No critical errors in console
- Beautiful UI renders properly
- Core flows work end-to-end
- Data displays make sense

**READY FOR PRODUCTION:** After adding:
- Real backend API integration
- Razorpay payment credentials
- User authentication
- Database connection
- Real-time planetary calculations

---

## 📊 **Performance Testing:**

### **Load Time Goals:**
- Landing Page: < 2 seconds
- Dashboard: < 2 seconds
- Horoscope Pages: < 1 second
- Muhurat Finder: < 2 seconds

### **Check Performance:**
```
Open DevTools → Network Tab
Hard Reload (Ctrl+Shift+R)
Check "Load" time at bottom
```

---

## 🚀 **Next Steps After Testing:**

1. ✅ Verify all features work
2. ✅ Document any bugs found
3. ✅ Test on multiple browsers (Chrome, Firefox, Safari)
4. ✅ Test on mobile devices
5. ✅ Prepare for production deployment

---

**Happy Testing! 🎉**

**If you find any issues, they're likely due to:**
- Mock data (expected until backend integration)
- Missing dependencies (run npm install)
- Environment variables not set (add .env file)

**Platform Status:** ✅ **DEMO READY** | 🚧 **Production Pending**
