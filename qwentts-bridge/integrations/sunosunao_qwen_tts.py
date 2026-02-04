"""
QwenTTS Provider for SunoSunao
High-quality voice cloning and multilingual TTS for voice legacy platform

Features:
- Voice cloning from 5-min recordings
- 10 languages with voice preservation
- Instruction-based emotional control
- Voice library management
- Integration with DocChain for consent

Author: ANKR Labs
"""

import asyncio
import aiohttp
import base64
import logging
from typing import Optional, AsyncGenerator, List, Dict, Any
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass

from .config import SunoSunaoConfig
from .tts import BaseTTS

logger = logging.getLogger("sunosunao.qwen_tts")


# ============================================================================
# Models
# ============================================================================

@dataclass
class VoiceInfo:
    """Voice metadata"""
    voice_id: str
    name: str
    language: str
    description: Optional[str] = None
    created_at: str = ""
    embedding_path: Optional[str] = None


@dataclass
class QwenSynthesizeRequest:
    """Synthesis request"""
    text: str
    language: str = "en"
    voice: Optional[str] = None
    instruction: Optional[str] = None
    model: str = "Qwen3-TTS-12Hz-1.7B-CustomVoice"
    max_tokens: int = 1024
    temperature: float = 0.7
    do_sample: bool = False
    streaming: bool = False


# ============================================================================
# QwenTTS Provider
# ============================================================================

class QwenTTS(BaseTTS):
    """
    Qwen3-TTS Provider for SunoSunao

    Best for:
    - Voice cloning (memorial messages, legacy voices)
    - Multi-language voice preservation (10 languages)
    - Premium voice quality
    - Instruction-based emotion control

    Supported languages:
    - English (en)
    - Chinese (zh)
    - Japanese (ja)
    - Korean (ko)
    - German (de)
    - French (fr)
    - Russian (ru)
    - Portuguese (pt)
    - Spanish (es)
    - Italian (it)
    """

    SUPPORTED_LANGS = {
        "en", "zh", "ja", "ko", "de", "fr", "ru", "pt", "es", "it"
    }

    CUSTOM_VOICES = [
        f"custom_{i}" for i in range(1, 10)
    ]

    MODELS = {
        "large": "Qwen3-TTS-12Hz-1.7B-CustomVoice",
        "small": "Qwen3-TTS-12Hz-0.6B-CustomVoice",
        "design": "Qwen3-TTS-12Hz-1.7B-VoiceDesign",
        "base_large": "Qwen3-TTS-12Hz-1.7B-Base",
        "base_small": "Qwen3-TTS-12Hz-0.6B-Base",
    }

    def __init__(
        self,
        bridge_url: str = "http://localhost:8000",
        default_voice: str = "custom_1",
        default_model: str = "large",
        timeout: int = 30,
        enable_voice_cloning: bool = True,
        enable_instructions: bool = True,
    ):
        """
        Initialize QwenTTS provider

        Args:
            bridge_url: URL of QwenTTS bridge service
            default_voice: Default voice (custom_1 to custom_9)
            default_model: Default model (large, small, design)
            timeout: Request timeout in seconds
            enable_voice_cloning: Enable voice cloning features
            enable_instructions: Enable instruction-based control
        """
        self.bridge_url = bridge_url.rstrip("/")
        self.default_voice = default_voice
        self.default_model = self.MODELS[default_model]
        self.timeout = timeout
        self.enable_voice_cloning = enable_voice_cloning
        self.enable_instructions = enable_instructions

        self._session: Optional[aiohttp.ClientSession] = None
        self._voice_cache: Dict[str, VoiceInfo] = {}

        logger.info(f"QwenTTS initialized: {self.bridge_url}")

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
        return self._session

    def supports_language(self, lang: str) -> bool:
        """Check if language is supported"""
        return lang in self.SUPPORTED_LANGS

    async def is_available(self) -> bool:
        """Check if service is available"""
        try:
            session = await self._get_session()
            async with session.get(f"{self.bridge_url}/health") as response:
                return response.status == 200
        except Exception as e:
            logger.warning(f"QwenTTS health check failed: {e}")
            return False

    async def synthesize(
        self,
        text: str,
        lang: str = "en",
        voice: Optional[str] = None,
        instruction: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """
        Synthesize speech from text

        Args:
            text: Text to synthesize
            lang: Language code (en, zh, ja, ko, de, fr, ru, pt, es, it)
            voice: Voice ID (custom_1-9 or cloned voice_id)
            instruction: Style instruction (e.g., "warm tone", "urgent")
            **kwargs: Additional parameters
                - model: Model name or key
                - temperature: Sampling temperature
                - max_tokens: Max output tokens

        Returns:
            Audio bytes (WAV format)
        """
        session = await self._get_session()

        # Prepare request
        request = {
            "text": text,
            "language": lang,
            "voice": voice or self.default_voice,
            "model": kwargs.get("model", self.default_model),
            "temperature": kwargs.get("temperature", 0.7),
            "do_sample": kwargs.get("do_sample", False),
            "max_tokens": kwargs.get("max_tokens", self._estimate_tokens(text)),
        }

        # Add instruction if enabled
        if self.enable_instructions and instruction:
            request["instruction"] = instruction

        try:
            async with session.post(
                f"{self.bridge_url}/api/v1/synthesize",
                json=request
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(
                        f"QwenTTS synthesis failed: {response.status} - {error_text}"
                    )

                data = await response.json()
                audio_b64 = data["audio"]
                audio_bytes = base64.b64decode(audio_b64)

                logger.info(
                    f"Synthesized: '{text[:50]}...' "
                    f"({lang}, {request['voice']}) → {len(audio_bytes)} bytes"
                )

                return audio_bytes

        except Exception as e:
            logger.error(f"QwenTTS synthesis error: {e}")
            raise

    async def synthesize_stream(
        self,
        text: str,
        lang: str = "en",
        voice: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream synthesized speech (currently yields full audio)

        Note: Streaming is not yet implemented in bridge service,
        so this yields the full audio in chunks
        """
        audio = await self.synthesize(text, lang, voice, **kwargs)

        # Yield in chunks
        chunk_size = kwargs.get("chunk_size", 4096)
        for i in range(0, len(audio), chunk_size):
            yield audio[i:i + chunk_size]

    async def clone_voice(
        self,
        audio_path: str,
        transcript: str,
        name: str,
        language: str = "en",
        save_to_library: bool = True,
    ) -> VoiceInfo:
        """
        Clone voice from audio sample

        Args:
            audio_path: Path to reference audio (5-30 seconds)
            transcript: Text being spoken in audio
            name: Name for this voice
            language: Language of the audio
            save_to_library: Save to voice library

        Returns:
            VoiceInfo with voice_id
        """
        if not self.enable_voice_cloning:
            raise RuntimeError("Voice cloning is disabled")

        session = await self._get_session()

        # Read audio file
        with open(audio_path, "rb") as f:
            audio_data = f.read()

        # Prepare form data
        form = aiohttp.FormData()
        form.add_field("audio", audio_data, filename="audio.wav")
        form.add_field("transcript", transcript)
        form.add_field("name", name)
        form.add_field("language", language)
        form.add_field("save_to_library", "true" if save_to_library else "false")

        try:
            async with session.post(
                f"{self.bridge_url}/api/v1/clone-voice",
                data=form
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(
                        f"Voice clone failed: {response.status} - {error_text}"
                    )

                data = await response.json()
                voice_info = VoiceInfo(**data)

                # Cache
                self._voice_cache[voice_info.voice_id] = voice_info

                logger.info(
                    f"Cloned voice: {name} ({voice_info.voice_id})"
                )

                return voice_info

        except Exception as e:
            logger.error(f"Voice clone error: {e}")
            raise

    async def design_voice(
        self,
        description: str,
        name: str,
        language: str = "en",
        save_to_library: bool = True,
    ) -> VoiceInfo:
        """
        Design voice from natural language description

        Args:
            description: Voice description (e.g., "warm elderly male voice")
            name: Name for this voice
            language: Primary language
            save_to_library: Save to voice library

        Returns:
            VoiceInfo with voice_id
        """
        if not self.enable_voice_cloning:
            raise RuntimeError("Voice design is disabled")

        session = await self._get_session()

        request = {
            "description": description,
            "name": name,
            "language": language,
            "save_to_library": save_to_library,
        }

        try:
            async with session.post(
                f"{self.bridge_url}/api/v1/design-voice",
                json=request
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(
                        f"Voice design failed: {response.status} - {error_text}"
                    )

                data = await response.json()
                voice_info = VoiceInfo(**data)

                # Cache
                self._voice_cache[voice_info.voice_id] = voice_info

                logger.info(
                    f"Designed voice: {name} ({voice_info.voice_id})"
                )

                return voice_info

        except Exception as e:
            logger.error(f"Voice design error: {e}")
            raise

    async def list_voices(self) -> List[VoiceInfo]:
        """List all voices in library"""
        session = await self._get_session()

        try:
            async with session.get(f"{self.bridge_url}/api/v1/voices") as response:
                if response.status != 200:
                    raise Exception(f"List voices failed: {response.status}")

                data = await response.json()
                voices = [VoiceInfo(**v) for v in data]

                # Update cache
                for voice in voices:
                    self._voice_cache[voice.voice_id] = voice

                return voices

        except Exception as e:
            logger.error(f"List voices error: {e}")
            raise

    async def delete_voice(self, voice_id: str) -> bool:
        """Delete voice from library"""
        session = await self._get_session()

        try:
            async with session.delete(
                f"{self.bridge_url}/api/v1/voices/{voice_id}"
            ) as response:
                success = response.status == 200

                if success and voice_id in self._voice_cache:
                    del self._voice_cache[voice_id]
                    logger.info(f"Deleted voice: {voice_id}")

                return success

        except Exception as e:
            logger.error(f"Delete voice error: {e}")
            return False

    async def close(self):
        """Close the session"""
        if self._session and not self._session.closed:
            await self._session.close()

    def _estimate_tokens(self, text: str) -> int:
        """Estimate max tokens needed"""
        estimated = int(len(text) * 1.5)
        return max(128, min(4096, estimated))


# ============================================================================
# Integration with SunoSunao TTSRouter
# ============================================================================

"""
To integrate with SunoSunao's TTSRouter:

1. Add to config.py:

    class TTSProvider(str, Enum):
        VIBEVOICE = "vibevoice"
        INDICF5 = "indicf5"
        SARVAM = "sarvam"
        QWEN = "qwen"  # Add this

2. Add to TTSRouter.__init__:

    from .qwen_tts import QwenTTS

    # In _ensure_initialized():
    elif provider == TTSProvider.QWEN:
        self.providers[provider] = QwenTTS(
            bridge_url=self.config.qwen_bridge_url,
            enable_voice_cloning=True,
        )

3. Add to SunoSunaoConfig:

    qwen_bridge_url: str = "http://localhost:8000"
    qwen_enabled: bool = True
"""


# ============================================================================
# Usage Examples
# ============================================================================

async def example_basic_synthesis():
    """Example 1: Basic synthesis"""
    qwen = QwenTTS(bridge_url="http://localhost:8000")

    audio = await qwen.synthesize(
        text="Hello, this is a test message",
        lang="en",
        voice="custom_1"
    )

    # Save audio
    with open("output.wav", "wb") as f:
        f.write(audio)

    await qwen.close()


async def example_with_emotion():
    """Example 2: With emotion instruction"""
    qwen = QwenTTS(bridge_url="http://localhost:8000")

    audio = await qwen.synthesize(
        text="Happy birthday! I hope you have a wonderful day!",
        lang="en",
        voice="custom_2",
        instruction="speak with joy and excitement"
    )

    with open("birthday.wav", "wb") as f:
        f.write(audio)

    await qwen.close()


async def example_voice_cloning():
    """Example 3: Voice cloning (Memorial message use case)"""
    qwen = QwenTTS(bridge_url="http://localhost:8000")

    # Clone voice from recording
    voice_info = await qwen.clone_voice(
        audio_path="grandpa_recording.wav",
        transcript="This is grandpa speaking. I want to preserve my voice for the family.",
        name="Grandpa's Voice",
        language="en",
        save_to_library=True,
    )

    print(f"Cloned voice: {voice_info.voice_id}")

    # Use cloned voice for memorial message
    audio = await qwen.synthesize(
        text="Happy birthday, my dear grandchild. Grandpa loves you always.",
        lang="en",
        voice=voice_info.voice_id,
        instruction="speak warmly and lovingly"
    )

    with open("grandpa_birthday_message.wav", "wb") as f:
        f.write(audio)

    await qwen.close()


async def example_multilingual_preservation():
    """Example 4: Multi-language voice preservation"""
    qwen = QwenTTS(bridge_url="http://localhost:8000")

    # Clone voice (English)
    voice_info = await qwen.clone_voice(
        audio_path="papa_voice.wav",
        transcript="This is papa speaking to preserve my voice",
        name="Papa's Voice",
        language="en",
    )

    # Synthesize in multiple languages with SAME voice
    languages = {
        "en": "Happy birthday, my son. I love you very much.",
        "hi": "जन्मदिन मुबारक बेटा। मैं तुमसे बहुत प्यार करता हूं।",
        "es": "Feliz cumpleaños, mi hijo. Te quiero mucho.",
        "ja": "誕生日おめでとう、息子よ。愛しているよ。",
    }

    for lang, text in languages.items():
        if qwen.supports_language(lang):
            audio = await qwen.synthesize(
                text=text,
                lang=lang,
                voice=voice_info.voice_id,
            )

            with open(f"papa_message_{lang}.wav", "wb") as f:
                f.write(audio)

            print(f"Generated {lang} message")

    await qwen.close()


async def example_voice_design():
    """Example 5: Voice design from description"""
    qwen = QwenTTS(bridge_url="http://localhost:8000")

    voice_info = await qwen.design_voice(
        description="A warm, elderly female voice with a gentle Hindi accent, speaking with love and wisdom",
        name="Grandmother Voice",
        language="en",
    )

    # Use designed voice
    audio = await qwen.synthesize(
        text="Remember, my dear, always be kind and stay true to yourself.",
        lang="en",
        voice=voice_info.voice_id,
        instruction="speak with warmth and wisdom"
    )

    with open("grandmother_advice.wav", "wb") as f:
        f.write(audio)

    await qwen.close()


if __name__ == "__main__":
    # Run examples
    asyncio.run(example_basic_synthesis())
    # asyncio.run(example_voice_cloning())
    # asyncio.run(example_multilingual_preservation())
