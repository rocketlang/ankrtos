# RocketLang Integration for Swayam

## "Bolo Ho Jaayega" - Just say it, it happens!

### Overview

This module integrates RocketLang parsing with Swayam's voice AI system, enabling voice commands in Hindi, Tamil, Telugu, and English.

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  User Voice: "फाइल पढ़ो package.json"                             │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  Swayam WebSocket Handler                                        │
│  ├── processAndRespond()                                         │
│  │   ├── 1. Check looksLikeCommand() → true                     │
│  │   ├── 2. RocketLangExecutor.tryExecute()                     │
│  │   │   ├── parse() via @ankr/rocketlang                       │
│  │   │   └── executeTool() via @ankr/ankrcode-core              │
│  │   ├── 3. formatResult() → Multilingual response              │
│  │   └── 4. TTS synthesis                                        │
│  └── If not a command → fallback to AI conversation              │
└──────────────────────────────────────────────────────────────────┘
```

### Supported Commands

| Hindi | English | Tool | Action |
|-------|---------|------|--------|
| पढ़ो/padho | read | read | Read file contents |
| लिखो/likho | write | write | Write to file |
| देखो/dekho | list/ls | list | List directory |
| खोजो/khojo | search/grep | search | Search in files |
| चलाओ/chalao | run/$ | run | Execute shell command |
| बनाओ/banao | create/touch | create | Create new file |
| गिट स्टेटस | git status | git_status | Show git status |
| कमिट | commit | commit | Create git commit |

### Usage

The integration is automatic. When a user sends text via WebSocket:

1. **Command Detection**: `looksLikeCommand()` checks if text starts with Hindi/English command words
2. **RocketLang Parsing**: If detected, text is parsed by @ankr/rocketlang
3. **Tool Execution**: Valid commands are executed via @ankr/ankrcode-core
4. **Response Formatting**: Results are formatted in user's language (11 Indian languages)
5. **TTS**: Formatted response is synthesized to audio

### Files

- `executor.ts` - Main RocketLang executor with tool implementations
- `test-integration.ts` - Integration test suite

### Testing

```bash
cd /root/swayam/packages/voice/rocketlang
npx ts-node test-integration.ts
```

### Dependencies

```json
{
  "@ankr/rocketlang": "2.0.0",
  "@ankr/ankrcode-core": "2.0.0"
}
```

### Multilingual Responses

Responses are returned in user's language:

| Language | Success Response |
|----------|------------------|
| Hindi | हो गया! |
| Tamil | முடிந்தது! |
| Telugu | అయిపోయింది! |
| Bengali | হয়ে গেছে! |
| Marathi | झाले! |
| Gujarati | થઈ ગયું! |
| Kannada | ಆಯಿತು! |
| Malayalam | കഴിഞ്ഞു! |
| Punjabi | ਹੋ ਗਿਆ! |
| Odia | ହୋଇଗଲା! |
| English | Done! |

### Future Enhancements

1. **Natural Hindi Parsing**: "package.json file padh do" → read package.json
2. **EON Memory**: Remember context across sessions
3. **More Tools**: Database queries, API calls, cloud operations
