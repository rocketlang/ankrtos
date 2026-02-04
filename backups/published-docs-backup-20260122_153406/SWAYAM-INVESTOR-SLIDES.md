# Swayam - Voice AI Engine

## 11-Language Voice AI for Bharat

**SDK:** @ankr/swayam | **Demo:** swayam.ankr.in

---

# Slide 1: The Problem

## Voice is Bharat's Natural Interface

| Pain Point | Impact |
|------------|--------|
| **Low Literacy** | 25% adult illiteracy, text interfaces fail |
| **English-Only Voice** | Alexa/Siri don't understand Hindi dialects |
| **High Latency** | Cloud-only voice = 2-3s delay |
| **Expensive** | Voice APIs cost $0.01-0.05 per minute |
| **No Context** | Voice assistants have no memory |
| **Limited Actions** | Can't integrate with business systems |

> **800M+ Indians prefer voice but have no AI that understands them**

---

# Slide 2: The Solution

## Swayam - Voice AI That Speaks India

**Complete voice AI engine with STT, TTS, NLU in 11 Indian languages**

```
┌─────────────────────────────────────────────────────────────────┐
│                          SWAYAM                                  │
│                 "स्वयं - Self-Sufficient Voice AI"               │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   VOICE PIPELINE                         │   │
│   │                                                         │   │
│   │   🎤 Input → 📝 STT → 🧠 NLU → ⚡ Action → 🔊 TTS → 🎧   │   │
│   │   (Audio)   (Text)   (Intent)  (350+ tools)  (Voice)   │   │
│   │                                                         │   │
│   │   Latency: <500ms end-to-end                           │   │
│   │   Cost: $0.001/minute (10x cheaper)                    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Languages: Hindi, Tamil, Telugu, Bengali, Marathi,            │
│              Gujarati, Kannada, Malayalam, Punjabi, Odia,       │
│              English + Hinglish (code-switching)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# Slide 3: 11 Languages + Dialects

## Deep Indian Language Support

### Languages Supported

| Language | Code | Speakers | Status |
|----------|------|----------|--------|
| Hindi | hi-IN | 600M | ✅ Full |
| English | en-IN | 125M | ✅ Full |
| Tamil | ta-IN | 80M | ✅ Full |
| Telugu | te-IN | 80M | ✅ Full |
| Bengali | bn-IN | 70M | ✅ Full |
| Marathi | mr-IN | 95M | ✅ Full |
| Gujarati | gu-IN | 60M | ✅ Full |
| Kannada | kn-IN | 50M | ✅ Full |
| Malayalam | ml-IN | 35M | ✅ Full |
| Punjabi | pa-IN | 30M | ✅ Full |
| Odia | or-IN | 40M | ✅ Full |
| **Hinglish** | hi-en | 200M+ | ✅ Full |

### Dialect Support
- Hindi: Bhojpuri, Rajasthani, Haryanvi accents
- Tamil: Chennai, Madurai, Coimbatore variants
- Auto-detection and adaptation

---

# Slide 4: Speech-to-Text (STT)

## Accurate Transcription for India

### Technology Stack

| Component | Implementation |
|-----------|----------------|
| Primary | Whisper (fine-tuned) |
| Fallback | Bhashini API |
| Streaming | WebSocket real-time |
| VAD | Silero VAD |

### Performance

| Metric | Value |
|--------|-------|
| WER (Hindi) | <8% |
| WER (English) | <5% |
| Latency | <200ms |
| Streaming | Yes (word-by-word) |

### Code-Switching

```
Input: "Mere account mein kitna balance hai?"
       (Mixed Hindi-English)

Output: "mere account mein kitna balance hai"
        [Language: Hinglish, Intent: balance_check]
```

---

# Slide 5: Text-to-Speech (TTS)

## Natural Voice Generation

### Voice Library

| Category | Options |
|----------|---------|
| Gender | Male, Female, Neutral |
| Age | Young, Adult, Senior |
| Tone | Formal, Friendly, Professional |
| Speed | 0.5x - 2.0x |

### Technology

| Component | Implementation |
|-----------|----------------|
| Primary | Azure Cognitive TTS |
| Fallback | Google TTS |
| Indic | Bhashini voices |
| Cloning | Voice cloning (consent-based) |

### Quality

| Feature | Status |
|---------|--------|
| SSML Support | ✅ Yes |
| Emotion | ✅ Happy, Sad, Neutral |
| Pronunciation | ✅ Custom dictionary |
| Multi-voice | ✅ Per-sentence switching |

---

# Slide 6: Natural Language Understanding

## Intent That Understands Context

### NLU Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    NLU PROCESSING                                │
│                                                                  │
│   Input: "कल का invoice Sharma ji को भेजो"                      │
│                          ↓                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  INTENT DETECTION                                       │   │
│   │  → Primary: send_invoice                                │   │
│   │  → Confidence: 0.94                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  ENTITY EXTRACTION                                      │   │
│   │  → date: "कल" → yesterday                               │   │
│   │  → recipient: "Sharma ji" → CUST-00456 (from EON)      │   │
│   │  → document: "invoice"                                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  ACTION RESOLUTION                                      │   │
│   │  → Tool: invoice_send                                   │   │
│   │  → Params: {date: "2026-01-18", recipient: "CUST-00456"}│   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# Slide 7: Wake Word Detection

## "Hey Swayam" Always Listening

### Technology

| Feature | Implementation |
|---------|----------------|
| Wake Word | "Hey Swayam" (customizable) |
| Detection | Porcupine / Custom |
| False Positive | <0.5 per hour |
| Latency | <100ms |
| Power | Low-power mode available |

### Custom Wake Words
- "Hey Saathi" (for truckers)
- "Ok Bani" (for bani.ai)
- "Mitra" (for ComplyMitra)
- Enterprise custom words

### Privacy
- Wake word detection runs locally
- Audio only sent after activation
- No always-on cloud streaming

---

# Slide 8: Voice Cloning

## Consent-Based Voice Replication

### Use Cases

| Application | Description |
|-------------|-------------|
| **SunoSunao** | Preserve voices of loved ones |
| **IVR Branding** | Company voice identity |
| **Accessibility** | Voice for speech-impaired |
| **Entertainment** | Character voices |

### Process

```
1. User records 30 sentences (5 minutes)
2. Explicit consent captured (video)
3. Voice model trained (24-48 hours)
4. Clone used only with verification

Security:
- Blockchain consent record
- Watermarking on all cloned audio
- Abuse detection system
```

### Quality
- MOS Score: 4.2/5 (near human)
- Emotion transfer supported
- Multiple language same voice

---

# Slide 9: Integration & SDK

## Easy to Build With

### SDK Packages

| Package | Purpose |
|---------|---------|
| @ankr/swayam | Complete SDK |
| @ankr/stt | STT only |
| @ankr/tts | TTS only |
| @ankr/vad | Voice Activity Detection |
| @ankr/wake-word | Wake word detection |
| @ankr/voice-ai | High-level wrapper |
| @ankr/i18n | Internationalization |
| @ankr/ai-translate | Real-time translation |

### Code Example

```typescript
import { Swayam } from '@ankr/swayam';

const swayam = new Swayam({
  language: 'hi-IN',
  wakeWord: 'hey swayam'
});

swayam.on('speech', async (text) => {
  const response = await swayam.process(text);
  await swayam.speak(response);
});

swayam.start();
```

---

# Slide 10: Blockchain Integration

## Voice Records on DocChain

### What Gets Anchored

| Record Type | Purpose |
|-------------|---------|
| **Voice Consent** | Clone authorization |
| **Verbal Agreements** | Contract proof |
| **Voice Instructions** | Transaction authorization |
| **Authentication** | Voice KYC |

### Use Cases
- "I agree to the loan terms" → Blockchain record
- Voice-based e-signing
- IVR authorization trails

---

# Slide 11: Applications Built on Swayam

## Products Using Swayam

| Product | Voice Use Case |
|---------|----------------|
| **bani.ai** | Full conversational AI |
| **Saathi** | Trucker assistant |
| **WowTruck** | Driver commands |
| **ComplyMitra** | GST queries |
| **ankrBFC** | Loan applications |
| **SunoSunao** | Voice legacy messages |

### Daily Usage
- 100K+ voice interactions
- 11 languages active
- <500ms average latency
- 93% intent accuracy

---

# Slide 12: Competitive Analysis

## Swayam vs Competition

| Feature | Swayam | Google | Amazon | Azure |
|---------|--------|--------|--------|-------|
| Indian Languages | 11 | 5 | 2 | 4 |
| Hinglish | ✅ Native | ❌ Poor | ❌ No | ❌ Poor |
| Latency | <500ms | 1-2s | 1-2s | 1-2s |
| Cost/min | $0.001 | $0.006 | $0.008 | $0.005 |
| Local SLM | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Custom Wake | ✅ Yes | Limited | Limited | ❌ No |
| Voice Clone | ✅ Yes | ❌ No | ❌ No | Limited |
| EON Memory | ✅ Yes | ❌ No | ❌ No | ❌ No |

### Our Moat
1. **Deepest Indian language support**
2. **10x cheaper with local SLM**
3. **Code-switching (Hinglish)**
4. **Consent-based cloning**

---

# Slide 13: Revenue Model

## SDK & Platform Monetization

### SDK Licensing
| Tier | Price | Usage |
|------|-------|-------|
| Free | ₹0 | 1K min/month |
| Starter | ₹999/mo | 10K min/month |
| Pro | ₹4,999/mo | 100K min/month |
| Enterprise | Custom | Unlimited |

### Usage-Based
| Service | Price |
|---------|-------|
| STT | ₹0.10/minute |
| TTS | ₹0.05/minute |
| NLU | ₹0.02/query |
| Clone | ₹5,000/voice |

### Enterprise
- On-premise deployment
- Custom voice training
- SLA support

---

# Slide 14: Investment Ask

## Standalone Seed Round: $2 Million

### Use of Funds
| Category | Allocation | Purpose |
|----------|------------|---------|
| **Voice Infrastructure** | 35% ($700K) | STT/TTS/NLU scaling |
| **Data Platform** | 25% ($500K) | Voice/text data collection & anonymization |
| **Self-Hosted LLM** | 20% ($400K) | On-premise multilingual model hosting |
| **SDK & Integration** | 15% ($300K) | Developer tools & partnerships |
| **Operations** | 5% ($100K) | Team & compliance |

### The Vision: Voice Infrastructure for Bharat

```
┌─────────────────────────────────────────────────────────────────┐
│                 SWAYAM DATA STRATEGY                             │
│                                                                  │
│   CAPTURE LAYER                                                  │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│   │ Voice     │ │ Text      │ │ Behavioral│ │ Context   │      │
│   │ Commands  │ │ Messages  │ │ Sensors   │ │ Metadata  │      │
│   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘      │
│         └─────────────┴─────────────┴─────────────┘              │
│                               ↓                                   │
│   ANONYMIZATION LAYER                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ PII Removal → Tokenization → Differential Privacy       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                               ↓                                   │
│   OUTPUT: India's Largest Multilingual Voice Dataset             │
│   • 11 Languages + Dialects                                      │
│   • Code-switching patterns (Hinglish)                           │
│   • Regional accents & expressions                               │
│   • Intent-action mappings                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Products Powered by Swayam
| Product | Voice Use | Data Contribution |
|---------|-----------|-------------------|
| **bani.ai** | Full conversational AI | WhatsApp/Telegram data |
| **SunoSunao** | Voice legacy messages | Emotional voice patterns |
| **Saathi** | Trucker assistant | Regional dialect data |
| **WowTruck** | Driver commands | Logistics vocabulary |
| **ComplyMitra** | GST queries | Business terminology |
| **ankrBFC** | Loan applications | Financial voice UX |

### Why Self-Hosted LLM?
1. **Data Sovereignty** — Keep Indian voice data in India
2. **Latency** — <100ms local inference
3. **Cost** — 10x cheaper than cloud APIs at scale
4. **Customization** — Fine-tune on Indian languages

### Milestones (18 months)
- 100M+ voice interactions collected
- 50M+ anonymized training samples
- Self-hosted 7B multilingual model
- 25 partner integrations
- ₹10 Cr ARR from SDK licensing

### Engineering Investment to Date
- $500K+ development value
- 12 packages published
- 50+ integration points

---

# Slide 15: Summary

## Swayam Investment Highlights

| Factor | Strength |
|--------|----------|
| **Languages** | 11 + Hinglish |
| **Performance** | <500ms latency |
| **Cost** | 10x cheaper |
| **Technology** | STT + TTS + NLU + Clone |
| **Ecosystem** | Powers all ANKR products |
| **SDK** | Easy integration |

### The Vision
**Every voice-enabled product in India runs on Swayam**

---

# Thank You

## Voice AI for Bharat

**Swayam - स्वयं**

**SDK:** @ankr/swayam | **Demo:** swayam.ankr.in

---

**Capt. Anil Sharma**
Founder & CEO

📱 +91 7506926394
📧 capt.anil.sharma@powerpbox.org
🌐 ankr.in

---

*Confidential - For Investor Use Only*
*January 2026*
*Part of ANKR Universe*
