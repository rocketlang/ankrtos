# ANKR + Pratham: Fermi-Inspired Feature Integration

**Date:** 2026-01-24
**Strategy:** Cherry-pick best features from Fermi.ai, adapt for Pratham's mass-market students

---

## Core Philosophy

**Fermi's Approach:** "Productive struggle" - never give answers, always guide
**ANKR's Approach:** "Adaptive support" - explain when needed, challenge when ready

**Best of Both:** **Hybrid tutoring mode** - student/teacher chooses the right level of support

---

## Features to Adopt from Fermi

### ✅ Feature 1: Dual Tutoring Modes

**What Fermi Does:**
- Always forces "productive struggle"
- Asks clarifying questions instead of giving answers
- Makes students think through problems

**What ANKR Should Do:**
Add **two modes** in AI Tutor:

#### Mode 1: "Explain Mode" (Default for Pratham)
- **Use when:** Student is learning a new concept
- **Behavior:** Provides clear step-by-step explanations
- **Example:**
  ```
  Student: "HCF aur LCM mein kya farak hai?"
  AI: "HCF (Highest Common Factor) वो सबसे बड़ी संख्या है जो दोनों numbers को पूरी तरह divide करे।
       उदाहरण: 12 और 18 का HCF = 6

       LCM (Lowest Common Multiple) वो सबसे छोटी संख्या है जो दोनों numbers से divide हो जाए।
       उदाहरण: 12 और 18 का LCM = 36

       क्या आप एक और example के साथ practice करना चाहेंगे?"
  ```

#### Mode 2: "Guide Mode" (Fermi-style)
- **Use when:** Student is practicing/testing knowledge
- **Behavior:** Asks questions, doesn't give direct answers
- **Example:**
  ```
  Student: "24 aur 36 ka HCF kaise nikalun?"
  AI: "अच्छा सवाल! पहले सोचो:
       - 24 को किन-किन numbers से divide कर सकते हो?
       - 36 को किन-किन numbers से divide कर सकते हो?
       - दोनों lists में common कौन से numbers हैं?"

  Student: "24 = 1,2,3,4,6,8,12,24 aur 36 = 1,2,3,4,6,9,12,18,36"
  AI: "बिल्कुल सही! अब common numbers में सबसे बड़ा कौन है?"

  Student: "12"
  AI: "Perfect! 🎉 तो 24 और 36 का HCF = 12 है।"
  ```

**Implementation:**
```typescript
interface TutorMode {
  mode: 'explain' | 'guide';
  autoSwitch: boolean; // Switch to 'guide' after 3 successful solves in 'explain' mode
}

// In AI Tutor
if (mode === 'explain') {
  return generateDetailedExplanation(question);
} else {
  return generateSocraticQuestions(question);
}

// Auto-progression
if (student.consecutiveCorrect >= 3 && mode === 'explain') {
  suggestSwitchToGuideMode();
}
```

**Why This Works for Pratham:**
- Students struggling with basics → "Explain mode"
- Students gaining confidence → Auto-suggest "Guide mode"
- Gradual transition from support to independence
- Teacher can override mode for specific students

---

### ✅ Feature 2: Enhanced Teacher Dashboard

**What Fermi Does:**
- "Classroom Command" shows where student reasoning fails
- Identifies specific patterns of struggle
- Gives teachers visibility into thinking process

**What ANKR Should Do:**
Add **"Reasoning Tracker"** to existing teacher dashboard:

#### New Teacher Dashboard Features:

**1. Concept Mastery Heatmap**
```
Topic              | Struggling | Improving | Mastered
-------------------|-----------|-----------|----------
HCF/LCM           |    12     |    23     |    15
Percentages       |    18     |    20     |    12
Time & Distance   |    25     |    15     |    10
```

**2. Common Misconception Detector**
```
Top 3 Misconceptions (This Week):

1. "LCM is always larger than both numbers"
   → 18 students (36%)
   → Suggested action: Quick 10-min class revision

2. "Percentage = divide by 10"
   → 15 students (30%)
   → Suggested action: Use real-world examples (discounts)

3. "Speed = Distance × Time"
   → 12 students (24%)
   → Suggested action: Practice with formula triangle
```

**3. Student Struggle Pattern**
```
Student: Rahul Kumar
Recent struggle: Time & Distance

Attempt History:
❌ Q1: Confused speed and distance
❌ Q2: Wrong formula application
🟡 Q3: Correct method, calculation error
✅ Q4: Solved correctly

AI Recommendation:
"Rahul understands the concept but makes calculation errors.
Suggest: 5 more practice problems with simpler numbers first."
```

**4. Progress Comparison (Fermi-style metrics)**
```
Class Average Progress (Last 30 days):

Week 1: 3.2/10 average score
Week 2: 4.1/10 (+28% improvement)
Week 3: 5.5/10 (+34% improvement)
Week 4: 6.8/10 (+24% improvement)

Top Improving Students:
1. Priya Sharma: 2.5 → 7.5 (+200%)
2. Amit Patel: 3.0 → 7.0 (+133%)
3. Neha Singh: 4.0 → 7.5 (+88%)
```

**Implementation:**
```typescript
// New API endpoint
GET /api/teacher/reasoning-analytics

Response:
{
  conceptMastery: {
    "HCF/LCM": { struggling: 12, improving: 23, mastered: 15 },
    "Percentages": { struggling: 18, improving: 20, mastered: 12 }
  },
  commonMisconceptions: [
    {
      misconception: "LCM is always larger than both numbers",
      studentCount: 18,
      percentage: 36,
      suggestedAction: "Quick 10-min class revision"
    }
  ],
  studentProgress: [
    {
      studentId: "123",
      studentName: "Rahul Kumar",
      weeklyScores: [3.2, 4.1, 5.5, 6.8],
      improvementRate: 28,
      strugglingTopics: ["Time & Distance"],
      aiRecommendation: "..."
    }
  ]
}
```

**Why This Works for Pratham:**
- Teachers see exactly where class is struggling
- Proactive intervention (before exams)
- Data-driven teaching decisions
- Measurable impact (like Fermi's pilot: 2/10 → 6.7/10)

---

### ✅ Feature 3: Optional Handwriting Input

**What Fermi Does:**
- Handwriting-first interface (requires stylus)
- Students draw diagrams, write equations
- Feels like real homework

**What ANKR Should Do:**
**Support handwriting, but don't require it**

#### Implementation Strategy:

**Option A: Student has tablet with stylus**
→ Enable handwriting mode (like Fermi)

**Option B: Student has smartphone only**
→ Text/voice input (current ANKR)

**Option C: Student has phone with basic touch**
→ Simple drawing tool (finger-based)

```typescript
interface InputMode {
  type: 'text' | 'voice' | 'handwriting' | 'drawing';
  device: 'smartphone' | 'tablet' | 'laptop';
}

// Auto-detect device capability
if (hasStylus && screenSize > 8) {
  offerHandwritingMode();
} else if (hasTouchScreen) {
  offerDrawingMode();
} else {
  defaultToTextVoice();
}
```

**Handwriting Canvas (for tablet users):**
```tsx
import { useHandwriting } from '@ankr/handwriting-recognition';

function HandwritingCanvas() {
  const { recognize, clearCanvas } = useHandwriting();

  return (
    <div className="smart-canvas">
      <canvas
        id="work-area"
        width={800}
        height={600}
        onPointerMove={handleDraw}
      />
      <button onClick={() => recognize()}>
        Submit Work
      </button>
      <div className="ai-feedback">
        {/* AI analyzes handwritten work, provides feedback */}
      </div>
    </div>
  );
}
```

**Why This Works for Pratham:**
- Some Pratham students DO have tablets (NGO donations)
- Others only have basic phones
- Support both, don't force hardware upgrades
- Gradual adoption as devices improve

---

### ✅ Feature 4: Multi-Model Backend

**What Fermi Does:**
- Uses both GPT 5.2 and Gemini 2.5
- Proprietary "GE bench" to evaluate which model is best for each task
- Agile model switching

**What ANKR Should Do:**
**Use best model for each task type**

#### Model Selection Strategy:

**GPT-4o (Current ANKR):**
- ✅ Best for: Explanations in Hindi
- ✅ Best for: Conversational tutoring
- ✅ Best for: Understanding context
- ❌ Expensive: $0.005/1K tokens

**Gemini 2.0 Flash (Add this):**
- ✅ Best for: Math problem generation
- ✅ Best for: Step-by-step solutions
- ✅ Best for: Pattern recognition
- ✅ Cheaper: $0.001/1K tokens (5x cheaper)
- ✅ Faster: 2x response time

**Llama 3.2 (Local fallback):**
- ✅ Best for: Offline mode
- ✅ Best for: Simple queries
- ✅ Free (self-hosted)

#### Implementation:
```typescript
async function selectModel(taskType: TaskType, query: string) {
  switch (taskType) {
    case 'explanation':
      // GPT-4o is best for nuanced explanations in Hindi
      return await callGPT4o(query);

    case 'problem_generation':
      // Gemini is best for structured math problems
      return await callGemini2Flash(query);

    case 'step_by_step_solution':
      // Gemini is faster and cheaper for procedural tasks
      return await callGemini2Flash(query);

    case 'doubt_clarification':
      // GPT-4o understands context better
      return await callGPT4o(query);

    case 'offline_mode':
      // Use local Llama model
      return await callLocalLlama(query);

    default:
      // Default to GPT-4o
      return await callGPT4o(query);
  }
}

// Cost optimization
async function optimizedAICall(query: string, taskType: TaskType) {
  // Try cheaper model first
  if (taskType === 'simple_query') {
    const result = await callGemini2Flash(query);
    if (confidenceScore(result) > 0.8) {
      return result; // Good enough, save money
    }
  }

  // Fall back to GPT-4o for complex queries
  return await callGPT4o(query);
}
```

**Why This Works for Pratham:**
- **40% cost reduction** (use Gemini for math, GPT for explanations)
- **2x faster responses** (Gemini Flash is quicker)
- **Offline support** (Llama for low-connectivity areas)
- **Better quality** (right model for right task)

---

### ✅ Feature 5: Measurable Pilot Metrics (Fermi-style)

**What Fermi Does:**
- Tracks: 2/10 → 6.7/10 improvement over 3 months
- 21% drop in hint reliance
- Clear, measurable success metrics

**What ANKR Should Do:**
**Define clear metrics for Pratham pilot**

#### Pratham Pilot Success Metrics:

**Primary Metrics:**
```
1. Score Improvement
   Baseline: Pre-test average (target: ~3/10)
   Target: Post-test average (target: ~7/10)
   Measurement: Weekly quiz scores

2. Engagement Rate
   Baseline: 0% (no AI tutor currently)
   Target: 60%+ students use AI tutor weekly
   Measurement: Active users / total enrolled

3. Doubt Resolution Time
   Baseline: ~24 hours (teacher responds next day)
   Target: <2 minutes (AI instant response)
   Measurement: Avg time from question to answer

4. Practice Volume
   Baseline: ~10 problems/week (textbook only)
   Target: ~50 problems/week (AI-generated practice)
   Measurement: Problems attempted per student
```

**Secondary Metrics:**
```
1. Hint Dependency Reduction (like Fermi)
   Baseline: 80% of problems need hints initially
   Target: <40% need hints after 4 weeks
   Measurement: Hint usage per problem

2. Concept Mastery Progression
   Baseline: 15% students master each topic
   Target: 60%+ students master each topic
   Measurement: Test scores by topic

3. Teacher Time Savings
   Baseline: 10 hours/week answering doubts
   Target: 3 hours/week (70% reduction)
   Measurement: Teacher survey + time tracking

4. Student Confidence
   Baseline: Survey pre-pilot
   Target: +50% confidence increase
   Measurement: Post-pilot survey
```

**Implementation:**
```typescript
// Pilot tracking dashboard
interface PilotMetrics {
  weekNumber: number;
  averageScore: number;
  engagementRate: number;
  doubtResolutionTime: number; // minutes
  practiceVolume: number; // problems/week
  hintDependency: number; // percentage
  conceptMastery: {
    topic: string;
    masteryRate: number; // percentage
  }[];
  teacherTimeSavings: number; // hours/week
  studentConfidence: number; // 1-10 scale
}

// Weekly report generation
async function generatePilotReport(week: number) {
  const metrics = await calculateMetrics(week);

  return {
    summary: `
      Week ${week} Summary:
      - Average Score: ${metrics.averageScore}/10 (${getImprovement(week)}% improvement)
      - Engagement: ${metrics.engagementRate}% students active
      - Practice Volume: ${metrics.practiceVolume} problems/student
      - Hint Usage: ${metrics.hintDependency}% (${getHintReduction(week)}% reduction)
    `,
    charts: generateCharts(metrics),
    recommendations: generateRecommendations(metrics)
  };
}
```

**Why This Works for Pratham:**
- Clear, measurable success criteria
- Data to convince more NGOs/schools
- Teacher buy-in (time savings proven)
- Student motivation (see their progress)

---

## Implementation Plan for Pratham Pilot

### Phase 1: Core Features (Week 1-2)

**Week 1: Dual Tutoring Modes**
- [ ] Add "Explain Mode" (current behavior, formalize it)
- [ ] Add "Guide Mode" (Socratic questioning)
- [ ] Teacher/student toggle in UI
- [ ] Auto-suggest mode switching based on performance

**Week 2: Teacher Dashboard Enhancements**
- [ ] Concept Mastery Heatmap
- [ ] Common Misconception Detector
- [ ] Student Struggle Patterns
- [ ] Progress Comparison Charts

### Phase 2: Advanced Features (Week 3-4)

**Week 3: Multi-Model Backend**
- [ ] Integrate Gemini 2.0 Flash API
- [ ] Build model selection logic
- [ ] A/B test: GPT vs Gemini for math
- [ ] Optimize costs (use cheaper model when possible)

**Week 4: Optional Handwriting + Metrics**
- [ ] Basic handwriting canvas for tablet users
- [ ] Finger-drawing tool for smartphone users
- [ ] Pilot metrics tracking dashboard
- [ ] Weekly report generation

### Phase 3: Pratham Pilot Launch (Week 5)

**Week 5: Deploy to Pratham**
- [ ] 100 students, 5 teachers
- [ ] Training session for teachers
- [ ] Baseline assessment (pre-test)
- [ ] Launch with "Explain Mode" default
- [ ] Collect feedback

**Week 6-13: 8-Week Pilot**
- [ ] Weekly metric reports
- [ ] Bi-weekly teacher check-ins
- [ ] Student feedback surveys
- [ ] Iterate based on data

**Week 14: Results & Next Steps**
- [ ] Final assessment (post-test)
- [ ] Success metrics analysis
- [ ] Case study creation
- [ ] Expansion plan (more NGOs)

---

## Feature Comparison: ANKR (Enhanced) vs Fermi

| Feature | Fermi.ai | ANKR (Current) | ANKR (Pratham Enhanced) |
|---------|----------|----------------|------------------------|
| **Tutoring Mode** | Guide only | Explain only | **Both (hybrid)** |
| **Teacher Dashboard** | Classroom Command | Basic analytics | **Enhanced (Fermi-style)** |
| **Input Method** | Handwriting required | Text/Voice | **All 3 (adaptive)** |
| **AI Backend** | Multi-model (GPT+Gemini) | GPT-4o only | **Multi-model (GPT+Gemini+Llama)** |
| **Metrics Tracking** | Detailed (2/10→6.7/10) | Basic | **Detailed (Fermi-style)** |
| **Device Support** | Tablet+stylus required | Any smartphone | **Any device (adaptive)** |
| **Language** | English | Hindi+English | Hindi+English |
| **Pricing** | ₹200-500/month | ₹50-75/month | ₹50-75/month |
| **Market** | Premium (top 20%) | Mass market (80%) | Mass market (80%) |

---

## Cost-Benefit Analysis

### Investment Required

**Development Time:**
- Dual Tutoring Modes: 3 days
- Enhanced Teacher Dashboard: 5 days
- Multi-Model Backend: 4 days
- Optional Handwriting: 6 days
- Metrics Tracking: 2 days

**Total:** ~20 days (4 weeks, 1 developer)

**Development Cost:** ₹2,00,000 (1 developer × 4 weeks)

### Benefits

**Immediate Benefits:**
- **40% cost reduction** (Gemini for math vs GPT for everything)
- **Better pedagogy** (guide mode for practice, explain mode for learning)
- **Teacher buy-in** (data-driven insights like Fermi)
- **Competitive positioning** (hybrid approach vs pure "productive struggle")

**Long-term Benefits:**
- **Pratham case study** with Fermi-quality metrics (2/10 → 7/10)
- **Replication to other NGOs** (proven, measurable impact)
- **Investor appeal** (best of both worlds: Fermi rigor + ANKR accessibility)
- **Premium tier potential** (₹200/month "ANKR Pro" with advanced features)

**ROI:**
- Investment: ₹2L
- Pratham pilot (100 students × ₹60/month × 3 months): ₹18,000/month = ₹54,000 total
- If successful → 10 more NGOs (1,000 students): ₹1,80,000/month = ₹21.6L/year

**Payback Period:** ~1 month after 10 NGO partnerships

---

## Pratham Pilot Proposal (Updated with Fermi Features)

### Email to Pratham (After Initial Response)

**Subject:** Re: ANKR - Pratham | Pilot Proposal with Enhanced Features

Dear Ankit, Pranav,

Based on our discussion, I'd like to propose a pilot with some enhanced features inspired by leading AI education research:

**Pilot Structure:**
- **Duration:** 8 weeks
- **Students:** 100 students (2 batches of 50)
- **Teachers:** 5 teachers
- **Cost:** ₹50,000 (₹500/student for 8 weeks)

**Enhanced Features for Pratham:**

1. **Dual Tutoring Modes:**
   - "Explain Mode" for new concepts (AI provides clear explanations)
   - "Guide Mode" for practice (AI asks questions, doesn't give answers)
   - Teachers can switch modes for different students

2. **Advanced Teacher Dashboard:**
   - Real-time concept mastery heatmap
   - Common misconception detector
   - Student-by-student struggle patterns
   - Weekly progress reports

3. **Multi-Device Support:**
   - Smartphone: Text + voice input
   - Tablet: Optional handwriting/drawing
   - WhatsApp: Bot for 24/7 doubt resolution

4. **Measurable Success Metrics:**
   - Track score improvement (target: 3/10 → 7/10)
   - Engagement rate (target: 60%+ weekly usage)
   - Teacher time savings (target: 70% reduction in doubt-answering)

**Timeline:**
- Week 1: Teacher training + student onboarding
- Week 2-9: Active pilot
- Week 10: Results analysis + case study

**Success Criteria:**
- 60%+ students show measurable score improvement
- 50%+ teachers report time savings
- 40%+ reduction in student hint dependency

If successful, we can discuss scaling to all Pratham centers pan-India.

Interested in discussing this week?

Best regards,
Captain Anil Sharma

---

## Summary

### Best Features from Fermi to Adopt:

✅ **Dual Tutoring Modes** (explain + guide)
✅ **Enhanced Teacher Dashboard** (reasoning analytics)
✅ **Multi-Model Backend** (GPT + Gemini + Llama)
✅ **Optional Handwriting** (support, don't require)
✅ **Fermi-Style Metrics** (measurable pilot results)

### Why This Works:

**Fermi's Strengths:**
- Rigorous pedagogy ("productive struggle")
- Data-driven teacher insights
- Proven pilot results
- Multi-model architecture

**ANKR's Strengths:**
- Accessible (any device)
- Affordable (₹50-75/month)
- Hindi-first
- Flexible (explain or guide)

**Combined = Best of Both Worlds:**
- Fermi-quality pedagogy + rigor
- ANKR accessibility + affordability
- Hybrid approach (not one-size-fits-all)
- Mass market reach (10x larger)

---

## Next Steps

1. **Immediate (This Week):**
   - [ ] Wait for Pratham response to Email 1
   - [ ] Start building dual tutoring modes
   - [ ] Design enhanced teacher dashboard

2. **Short-term (2-4 Weeks):**
   - [ ] Complete Fermi-inspired features
   - [ ] Test with small group (10 students)
   - [ ] Refine based on feedback

3. **Medium-term (1-2 Months):**
   - [ ] Launch Pratham pilot with enhanced features
   - [ ] Track Fermi-style metrics
   - [ ] Create compelling case study

4. **Long-term (3-6 Months):**
   - [ ] Scale to 10 more NGOs
   - [ ] Build "ANKR Pro" tier (₹200/month with all features)
   - [ ] Compete directly with Fermi in premium segment

---

**Document Version:** 1.0
**Date:** 2026-01-24
**Strategy:** Best of Fermi (rigor) + Best of ANKR (accessibility) = Winning combination
**Prepared By:** ANKR Labs + Claude Sonnet 4.5
