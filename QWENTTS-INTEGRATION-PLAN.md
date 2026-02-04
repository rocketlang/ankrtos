# ComfyUI-QwenTTS Integration for Bani & SunoSunao

## Executive Summary

Integration of Qwen3-TTS (via ComfyUI) into Bani.ai and SunoSunao platforms to provide:

- **Voice Cloning** for SunoSunao's memorial/legacy features
- **Multilingual TTS** (10 languages: Chinese, English, Japanese, Korean, German, French, Russian, Portuguese, Spanish, Italian)
- **Instruction-Based Voice Control** (emotion, style, tone via natural language)
- **Cost Optimization** (self-hosted alternative to Sarvam API)
- **Premium Custom Voices** (9 timbres for Bani)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     QWENTTS INTEGRATION                          │
│                                                                  │
│   ┌──────────────┐              ┌──────────────┐                │
│   │   Bani.ai    │              │  SunoSunao   │                │
│   │  (Node.js)   │              │  (Python)    │                │
│   └──────┬───────┘              └──────┬───────┘                │
│          │                              │                        │
│          │ HTTP/REST                    │ HTTP/REST              │
│          │                              │                        │
│   ┌──────▼──────────────────────────────▼───────┐               │
│   │     QwenTTS Bridge Service (FastAPI)        │               │
│   │  - Voice synthesis API                      │               │
│   │  - Voice cloning                            │               │
│   │  - Voice library management                 │               │
│   │  - Instruction-based control                │               │
│   └──────────────────┬──────────────────────────┘               │
│                      │                                           │
│                      │ Python API                                │
│                      │                                           │
│   ┌──────────────────▼──────────────────────────┐               │
│   │         ComfyUI-QwenTTS Nodes               │               │
│   │  - CustomVoice (9 timbres)                  │               │
│   │  - VoiceDesign (description-based)          │               │
│   │  - VoiceClone (3s rapid clone)              │               │
│   │  - Tokenizer (12Hz)                         │               │
│   └──────────────────┬──────────────────────────┘               │
│                      │                                           │
│                      │ Model Loading                             │
│                      │                                           │
│   ┌──────────────────▼──────────────────────────┐               │
│   │      Qwen3-TTS Models (1.7B/0.6B)           │               │
│   │  - CUDA / Apple Silicon (MPS) / CPU         │               │
│   │  - 12Hz Tokenizer                           │               │
│   │  - Local model storage                      │               │
│   └─────────────────────────────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Strategy

### Phase 1: QwenTTS Bridge Service (Week 1)

Build a FastAPI service that wraps ComfyUI-QwenTTS nodes:

**Endpoints:**
- `POST /synthesize` - Text to speech with custom voice
- `POST /clone-voice` - Create voice clone from audio sample
- `POST /design-voice` - Create voice from description
- `GET /voices` - List available voices
- `POST /voices/save` - Save voice to library
- `GET /health` - Service health check

**Features:**
- Automatic model download and caching
- Voice library management (save/load cloned voices)
- Instruction-based emotion control
- Multi-language support
- Streaming audio output (chunked)

### Phase 2: Bani.ai Integration (Week 1-2)

Add QwenTTS as a new TTS provider:

**File:** `ankr-labs-nx/packages/bani/src/tts/qwen.ts`

**Features:**
- 9 custom voice timbres for different personas
- Instruction-based emotion (happy, sad, urgent, calm)
- Multilingual support (especially for Chinese, Japanese, Korean users)
- Voice cloning for personalized bots
- Fallback to existing providers

**Use Cases:**
- Premium voice quality for enterprise customers
- Voice cloning for brand ambassadors
- Multilingual expansion (Chinese, Japanese markets)
- Emotional voice control ("sound urgent", "sound friendly")

### Phase 3: SunoSunao Integration (Week 2)

Enhance voice cloning capabilities:

**File:** `ankr-labs-nx/packages/sunosunao/src/sunosunao/qwen_tts.py`

**Features:**
- High-quality voice cloning from 5-min recordings
- Multi-language voice preservation (speak in any language)
- Instruction-based emotional control
- Voice library management (save family voices)
- DocChain integration for consent records

**Use Cases:**
- Memorial messages (preserve loved one's voice)
- Time capsules (clone voice, schedule delivery)
- Multi-language family messages
- Premium voice quality for paid tiers

### Phase 4: Deployment & Optimization (Week 3)

**Docker Setup:**
- ComfyUI-QwenTTS container
- Bridge service container
- GPU support (CUDA/ROCm)
- Model volume mounting

**Optimizations:**
- Model caching strategy
- FlashAttention 2 integration
- Batch processing for multiple requests
- Load balancing for scale

---

## API Specifications

### Bridge Service API

#### 1. Synthesize Speech

```http
POST /api/v1/synthesize
Content-Type: application/json

{
  "text": "Hello, this is a test message",
  "language": "en",
  "voice": "custom_1",  // or voice_id from library
  "instruction": "speak in a warm, friendly tone",
  "model": "1.7B-CustomVoice",  // or "0.6B-CustomVoice"
  "max_tokens": 1024,
  "temperature": 0.7,
  "streaming": false
}

Response:
{
  "audio": "<base64_encoded_audio>",
  "format": "wav",
  "sample_rate": 24000,
  "duration_ms": 3500,
  "voice_id": "custom_1",
  "model": "1.7B-CustomVoice"
}
```

#### 2. Clone Voice

```http
POST /api/v1/clone-voice
Content-Type: multipart/form-data

{
  "audio": <audio_file>,  // 5-30 seconds
  "transcript": "This is the text being spoken in the audio",
  "name": "Papa's Voice",
  "language": "hi",
  "save_to_library": true
}

Response:
{
  "voice_id": "voice_abc123",
  "name": "Papa's Voice",
  "language": "hi",
  "embedding": "<base64_encoded_embedding>",
  "created_at": "2026-01-31T10:00:00Z"
}
```

#### 3. Design Voice

```http
POST /api/v1/design-voice
Content-Type: application/json

{
  "description": "A warm, elderly male voice with a slight Hindi accent",
  "language": "en",
  "name": "Grandfather Voice",
  "save_to_library": true
}

Response:
{
  "voice_id": "voice_def456",
  "name": "Grandfather Voice",
  "description": "A warm, elderly male voice...",
  "created_at": "2026-01-31T10:00:00Z"
}
```

---

## Language Support Matrix

### Qwen3-TTS Languages

| Language | Code | Bani Use Case | SunoSunao Use Case |
|----------|------|---------------|-------------------|
| English | en | ✅ Primary | ✅ Global reach |
| Chinese | zh | ✅ Expansion | ✅ Chinese diaspora |
| Japanese | ja | ✅ Expansion | ✅ Japan market |
| Korean | ko | ✅ Expansion | ✅ Korea market |
| German | de | ❌ Low priority | ✅ Europe market |
| French | fr | ❌ Low priority | ✅ Europe/Africa |
| Russian | ru | ❌ Low priority | ✅ Russia/CIS |
| Portuguese | pt | ❌ Low priority | ✅ Brazil/Portugal |
| Spanish | es | ❌ Low priority | ✅ LatAm/Spain |
| Italian | it | ❌ Low priority | ✅ Italy market |

### Current Coverage (Bani/SunoSunao)

| Language | Current Provider | Add QwenTTS? |
|----------|-----------------|--------------|
| Hindi | Sarvam/IndicF5 | Optional (quality boost) |
| Tamil | Sarvam/IndicF5 | Optional |
| Telugu | Sarvam/IndicF5 | Optional |
| Bengali | Sarvam/IndicF5 | Optional |
| Marathi | Sarvam/IndicF5 | Optional |
| Gujarati | Sarvam/IndicF5 | Optional |
| Kannada | Sarvam/IndicF5 | Optional |
| Malayalam | Sarvam/IndicF5 | Optional |
| Punjabi | Sarvam/IndicF5 | Optional |
| Odia | Sarvam/IndicF5 | Optional |

**Recommendation:** Use QwenTTS for languages **not** covered by IndicF5 (Chinese, Japanese, Korean, European languages).

---

## Cost Analysis

### Current Costs (Bani)

| Provider | Cost per 1000 chars | Monthly (50K users, 10 msgs/user) |
|----------|---------------------|-----------------------------------|
| Sarvam API | ₹0.50 | ₹2.5L |
| Azure TTS | $0.015 | $75K (~₹62.5L) |
| EdgeTTS | FREE | ₹0 |

### With QwenTTS (Self-Hosted)

| Resource | Cost | Notes |
|----------|------|-------|
| GPU Server (T4) | ₹15K/month | GCP/AWS |
| Storage (500GB) | ₹2K/month | Model storage |
| **Total** | **₹17K/month** | **93% savings vs Azure** |

**ROI:** Self-hosted QwenTTS pays for itself if processing >3.4K requests/month.

---

## Implementation Checklist

### Week 1: Bridge Service

- [ ] Set up ComfyUI-QwenTTS repository
- [ ] Install dependencies and download models
- [ ] Build FastAPI bridge service
- [ ] Implement `/synthesize` endpoint
- [ ] Implement `/clone-voice` endpoint
- [ ] Implement `/design-voice` endpoint
- [ ] Add voice library storage (SQLite)
- [ ] Write API documentation
- [ ] Add health checks and monitoring
- [ ] Dockerize the service

### Week 1-2: Bani Integration

- [ ] Create `QwenTTS` class in `bani/src/tts/qwen.ts`
- [ ] Add to `TTSFactory`
- [ ] Implement voice selection logic
- [ ] Add instruction-based control
- [ ] Test with all 10 languages
- [ ] Add fallback handling
- [ ] Update configuration
- [ ] Write integration tests
- [ ] Document usage

### Week 2: SunoSunao Integration

- [ ] Create `QwenTTS` class in `sunosunao/src/sunosunao/qwen_tts.py`
- [ ] Add to `TTSRouter`
- [ ] Implement voice cloning workflow
- [ ] Add voice library management
- [ ] Integrate with DocChain for consent
- [ ] Test memorial message use case
- [ ] Test multi-language preservation
- [ ] Write integration tests
- [ ] Document usage

### Week 3: Deployment

- [ ] Set up GPU server (GCP/AWS)
- [ ] Deploy Docker containers
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Load testing (100 req/s)
- [ ] Optimize model caching
- [ ] Set up CI/CD pipeline
- [ ] Write runbook
- [ ] Train team on operations

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Model size (1.7B)** | Use 0.6B model for low-priority requests |
| **GPU availability** | Fallback to CPU, add queue system |
| **High latency** | Pre-warm models, use FlashAttention, cache voices |
| **Quality issues** | A/B test with Sarvam, use for non-critical first |
| **Language coverage** | Keep IndicF5/Sarvam for Indian languages |
| **Scaling** | Horizontal scaling with load balancer |

---

## Success Metrics

### Technical

- Latency: <2s for 100-char synthesis (1.7B model)
- Throughput: 100+ requests/sec (with horizontal scaling)
- Uptime: 99.5%
- Voice clone quality: MOS score >4.0

### Business (Bani)

- 20% of premium users enable QwenTTS voices
- 5% cost reduction from Azure TTS migration
- Expand to Chinese market (10K users in 6 months)

### Business (SunoSunao)

- Voice cloning feature adoption: 50% of paid users
- Average 3 voice clones per user
- 90% satisfaction score for voice quality
- Memorial message feature drives 30% upgrades

---

## Next Steps

1. **Review this plan** with team
2. **Provision GPU server** (GCP T4 or AWS g4dn.xlarge)
3. **Set up dev environment** (ComfyUI + QwenTTS)
4. **Start Week 1 tasks** (bridge service implementation)
5. **Schedule weekly sync** to track progress

---

## References

- [ComfyUI-QwenTTS GitHub](https://github.com/1038lab/ComfyUI-QwenTTS)
- [Qwen3-TTS Models](https://huggingface.co/Qwen)
- [Bani.ai Architecture](/root/ankr-universe-docs/BANI-INVESTOR-SLIDES.md)
- [SunoSunao Architecture](/root/ankr-universe-docs/SUNOSUNAO-INVESTOR-SLIDES.md)

---

**Author:** ANKR Labs
**Date:** 2026-01-31
**Status:** Draft for Review
**Next Review:** Week 1 implementation complete
