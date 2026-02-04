# Pratham Voice Saathi - Demo Script

**Purpose:** Demonstrate voice tutor capability to Pratham team
**Duration:** 5-7 minutes
**Presenter:** ANKR Team

---

## Pre-Demo Setup

### Technical Requirements
- [ ] BANI voice system running
- [ ] SWAYAM connected
- [ ] Sample Legal Reasoning content indexed in RAG
- [ ] Screen sharing ready
- [ ] Audio working (both input and output)
- [ ] Backup: Pre-recorded video if live fails

### Content Loaded
- Contract Law basics
- Consideration in contracts
- Sample CLAT legal reasoning questions
- 2-3 case law examples

---

## Demo Flow

### Opening (30 seconds)

**Presenter says:**

> "Let me show you what a Pratham student will experience. Imagine a Class 12 student in Lucknow, preparing for CLAT. It's 11 PM, she has a doubt about Contract Law, and she doesn't want to type in English. Watch this."

---

### Demo 1: Basic Doubt Resolution (90 seconds)

**Action:** Speak into mic in Hindi

**Student Query (Hindi):**
> "Contract law mein consideration ka matlab kya hota hai? Mujhe samajh nahi aa raha."

**Expected AI Response (Hindi):**
> "Consideration ka matlab hai ki contract mein dono parties ko kuch dena ya karna padta hai. Yeh ek tarah ka exchange hai.
>
> Jaise agar aap koi cheez khareed rahe ho, toh aapka consideration hai paisa dena, aur seller ka consideration hai wo cheez dena.
>
> Indian Contract Act ke Section 2(d) ke according, consideration wo hai jo promisee ya koi aur person promisor ki request par karta hai ya karne ka promise karta hai.
>
> Kya aap ek example chahte ho?"

**Presenter highlights:**
- Response in natural Hindi
- Grounded in actual legal content
- Invites follow-up (conversational)

---

### Demo 2: Follow-up Question (60 seconds)

**Student Query (Hindi):**
> "Haan, ek example do. Aur yeh bhi batao ki consideration ke bina contract valid hota hai kya?"

**Expected AI Response (Hindi):**
> "Example: Agar Rahul apna phone Priya ko 10,000 rupees mein bechta hai - toh Rahul ka consideration hai 10,000 rupees lena, aur Priya ka consideration hai phone lena. Dono ne kuch diya, toh consideration complete hai.
>
> Aapke doosre sawaal ka jawab - general rule yeh hai ki consideration ke bina contract void hota hai. Lekin kuch exceptions hain:
>
> 1. Natural love and affection ke case mein - jaise family members ke beech gift
> 2. Past voluntary service - jaise kisi ne pehle se seva ki ho
> 3. Time-barred debt ka promise
>
> CLAT mein aksar yeh exceptions poocha jaata hai. Kya aap in exceptions ke baare mein aur detail mein jaanna chahte ho?"

**Presenter highlights:**
- Remembers context from previous question
- Gives practical example
- Provides exam-relevant tip
- Continues conversation naturally

---

### Demo 3: Practice Question Mode (90 seconds)

**Student Query (Hindi):**
> "Mujhe ek practice question do consideration pe"

**Expected AI Response (Hindi):**
> "Theek hai, yeh lo ek CLAT-style question:
>
> **Question:** Ram apne bete Shyam ko uski shaadi par ek car gift karne ka promise karta hai, lekin yeh promise sirf verbal hai aur koi written agreement nahi hai. Shyam koi consideration nahi deta. Kya yeh contract valid hai?
>
> Options:
> A) Haan, kyunki yeh natural love and affection hai
> B) Nahi, kyunki consideration nahi hai
> C) Haan, agar Shyam ne car receive kar li
> D) Nahi, kyunki written agreement nahi hai
>
> Aapka jawab kya hai?"

**Student responds:**
> "A"

**AI Response:**
> "Bilkul sahi! Option A correct hai.
>
> Explanation: Section 25 ke under, natural love and affection ke case mein consideration ki zaroorat nahi hoti, lekin do conditions hain:
> 1. Parties ke beech close relationship hona chahiye
> 2. Agreement registered aur written hona chahiye
>
> Is case mein father-son relationship hai, toh natural love and affection apply hota hai. Lekin actual CLAT mein dhyan do - agar question mein 'written agreement nahi hai' explicitly bola ho, toh answer change ho sakta hai!
>
> Kya ek aur question try karna hai?"

**Presenter highlights:**
- Generates contextual practice questions
- Evaluates answer
- Provides detailed explanation
- Gives exam strategy tip
- Adaptive learning

---

### Demo 4: Language Switch (45 seconds)

**Presenter says:**
> "Now watch what happens when a student from Tamil Nadu uses the same system."

**Student Query (Tamil):**
> "Contract law-la consideration-oda meaning enna?"

**Expected AI Response (Tamil):**
> [Response in Tamil with same content accuracy]

**Presenter says:**
> "Same quality, same content, different language. This is BANI's power - 22 Indian languages, instant switch."

---

### Demo 5: Analytics Preview (45 seconds)

**Presenter shows dashboard:**

> "Behind the scenes, we're tracking everything:"

| Metric | Display |
|--------|---------|
| Topics asked | Contract Law: Consideration (3 queries) |
| Confidence level | Medium (needed follow-up) |
| Time spent | 4 minutes on this topic |
| Suggested next | "Move to Offer & Acceptance" |

**Presenter says:**
> "This data helps personalize the learning path. The AI knows this student needs more practice on Consideration before moving on."

---

### Closing (30 seconds)

**Presenter says:**

> "What you just saw:
>
> 1. **Voice-first** - No typing required
> 2. **Hindi native** - Natural conversation
> 3. **Syllabus-grounded** - Actual Pratham content, not generic internet
> 4. **Adaptive** - Remembers context, adjusts difficulty
> 5. **24x7** - Available anytime, no scheduling
>
> This is what Pratham students will experience. Questions?"

---

## Backup Scenarios

### If Voice Recognition Fails
- Switch to text input
- Say: "Let me type this one - the voice works, but demo environments can be tricky"

### If AI Gives Wrong Answer
- Acknowledge: "This is why we need SME validation in POC"
- Pivot: "RAG tuning will fix this with more content"

### If Latency is High
- Explain: "Production will be faster - we're on demo infrastructure"
- Show pre-recorded backup

---

## Q&A Prep

### Expected Questions & Answers

**Q: How accurate is the Hindi voice recognition?**
> A: BANI achieves >95% accuracy for standard Hindi. Regional accents need fine-tuning, which is part of POC.

**Q: What if the AI gives wrong information?**
> A: RAG grounds responses in your content. Wrong answers mean content gaps - we fix by adding more material. SME review catches edge cases.

**Q: Can students ask anything?**
> A: System is bounded to indexed content. Off-topic queries get polite redirect: "I'm your Legal Reasoning tutor. For other subjects, please check Pratham's other resources."

**Q: How is this different from ChatGPT?**
> A: Three things - (1) Voice in Indian languages, (2) Grounded in YOUR syllabus not internet, (3) Tracks learning progress. ChatGPT can't do any of these.

**Q: What about cheating in exams?**
> A: This is for learning, not exams. We can add access controls, time limits, or exam-mode lockout if needed.

---

## Demo Script - Hindi Transcript

### For Reference / Practice

**Query 1:**
कॉन्ट्रैक्ट लॉ में कंसीडरेशन का मतलब क्या होता है? मुझे समझ नहीं आ रहा।

**Response 1:**
कंसीडरेशन का मतलब है कि कॉन्ट्रैक्ट में दोनों पार्टीज को कुछ देना या करना पड़ता है। यह एक तरह का एक्सचेंज है।

जैसे अगर आप कोई चीज़ खरीद रहे हो, तो आपका कंसीडरेशन है पैसा देना, और सेलर का कंसीडरेशन है वो चीज़ देना।

इंडियन कॉन्ट्रैक्ट एक्ट के सेक्शन 2(d) के अनुसार, कंसीडरेशन वो है जो प्रॉमिसी या कोई और पर्सन प्रॉमिसर की रिक्वेस्ट पर करता है या करने का प्रॉमिस करता है।

क्या आप एक एक्साम्पल चाहते हो?

---

## Post-Demo Checklist

- [ ] Collect immediate feedback
- [ ] Note technical issues for fixing
- [ ] Schedule follow-up call
- [ ] Send recording to Pratham team
- [ ] Document questions asked
- [ ] Update POC scope if needed

---

*Demo Version: 1.0*
*Last Updated: January 2026*
