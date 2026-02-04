"""
QwenTTS Bridge Service
FastAPI service that wraps ComfyUI-QwenTTS for easy integration with Bani and SunoSunao

Features:
- Text-to-speech synthesis
- Voice cloning
- Voice design from descriptions
- Voice library management
- Multi-language support

Author: ANKR Labs
"""

import asyncio
import base64
import hashlib
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from enum import Enum

import aiofiles
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, Field
import soundfile as sf

# ComfyUI imports (will be available when running in ComfyUI environment)
try:
    from nodes import NODE_CLASS_MAPPINGS
    QWEN_NODES = {
        'CustomVoice': NODE_CLASS_MAPPINGS.get('AILab_QwenTTS'),
        'VoiceDesign': NODE_CLASS_MAPPINGS.get('AILab_QwenTTS_VoiceDesign'),
        'VoiceClone': NODE_CLASS_MAPPINGS.get('AILab_QwenTTS_VoiceClone'),
    }
    COMFYUI_AVAILABLE = True
except ImportError:
    COMFYUI_AVAILABLE = False
    QWEN_NODES = {}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qwentts-bridge")

# ============================================================================
# Configuration
# ============================================================================

VOICE_LIBRARY_PATH = Path(os.getenv("VOICE_LIBRARY_PATH", "/data/voices"))
VOICE_LIBRARY_PATH.mkdir(parents=True, exist_ok=True)

MODEL_CACHE_PATH = Path(os.getenv("MODEL_CACHE_PATH", "/data/models"))
MODEL_CACHE_PATH.mkdir(parents=True, exist_ok=True)

# ============================================================================
# Models
# ============================================================================

class QwenModel(str, Enum):
    CUSTOM_VOICE_1_7B = "Qwen3-TTS-12Hz-1.7B-CustomVoice"
    CUSTOM_VOICE_0_6B = "Qwen3-TTS-12Hz-0.6B-CustomVoice"
    VOICE_DESIGN_1_7B = "Qwen3-TTS-12Hz-1.7B-VoiceDesign"
    BASE_1_7B = "Qwen3-TTS-12Hz-1.7B-Base"
    BASE_0_6B = "Qwen3-TTS-12Hz-0.6B-Base"


class CustomVoice(str, Enum):
    """9 premium custom voices"""
    VOICE_1 = "custom_1"
    VOICE_2 = "custom_2"
    VOICE_3 = "custom_3"
    VOICE_4 = "custom_4"
    VOICE_5 = "custom_5"
    VOICE_6 = "custom_6"
    VOICE_7 = "custom_7"
    VOICE_8 = "custom_8"
    VOICE_9 = "custom_9"


class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    language: str = Field("en", description="Language code (en, zh, ja, ko, de, fr, ru, pt, es, it)")
    voice: Optional[str] = Field(None, description="Voice ID from library or custom_1-9")
    instruction: Optional[str] = Field(None, description="Style instruction (e.g., 'speak warmly', 'urgent tone')")
    model: QwenModel = Field(QwenModel.CUSTOM_VOICE_1_7B, description="Model to use")
    max_tokens: int = Field(1024, ge=128, le=4096, description="Max output tokens")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    do_sample: bool = Field(False, description="Enable sampling (False for stability)")
    streaming: bool = Field(False, description="Stream audio chunks")


class CloneVoiceRequest(BaseModel):
    transcript: str = Field(..., description="Text being spoken in audio")
    name: str = Field(..., description="Name for this voice")
    language: str = Field("en", description="Language of the audio")
    save_to_library: bool = Field(True, description="Save to voice library")


class DesignVoiceRequest(BaseModel):
    description: str = Field(..., description="Natural language description of desired voice")
    language: str = Field("en", description="Primary language for this voice")
    name: str = Field(..., description="Name for this voice")
    save_to_library: bool = Field(True, description="Save to voice library")


class VoiceInfo(BaseModel):
    voice_id: str
    name: str
    language: str
    description: Optional[str] = None
    created_at: str
    embedding_path: Optional[str] = None


class SynthesizeResponse(BaseModel):
    audio: str = Field(..., description="Base64-encoded audio")
    format: str = Field("wav", description="Audio format")
    sample_rate: int = Field(24000, description="Sample rate in Hz")
    duration_ms: int = Field(..., description="Duration in milliseconds")
    voice_id: Optional[str] = None
    model: str


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="QwenTTS Bridge Service",
    description="TTS service powered by Qwen3-TTS for Bani and SunoSunao",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Voice Library Management
# ============================================================================

class VoiceLibrary:
    """Manage saved voice embeddings"""

    @staticmethod
    async def save_voice(
        voice_id: str,
        name: str,
        language: str,
        embedding: np.ndarray,
        description: Optional[str] = None
    ) -> VoiceInfo:
        """Save voice embedding to library"""
        voice_dir = VOICE_LIBRARY_PATH / voice_id
        voice_dir.mkdir(exist_ok=True)

        # Save embedding
        embedding_path = voice_dir / "embedding.npy"
        np.save(embedding_path, embedding)

        # Save metadata
        metadata = {
            "voice_id": voice_id,
            "name": name,
            "language": language,
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
            "embedding_path": str(embedding_path),
        }

        import json
        metadata_path = voice_dir / "metadata.json"
        async with aiofiles.open(metadata_path, "w") as f:
            await f.write(json.dumps(metadata, indent=2))

        logger.info(f"Saved voice: {voice_id} ({name})")
        return VoiceInfo(**metadata)

    @staticmethod
    async def load_voice(voice_id: str) -> Optional[np.ndarray]:
        """Load voice embedding from library"""
        embedding_path = VOICE_LIBRARY_PATH / voice_id / "embedding.npy"
        if not embedding_path.exists():
            return None

        embedding = np.load(embedding_path)
        logger.info(f"Loaded voice: {voice_id}")
        return embedding

    @staticmethod
    async def list_voices() -> List[VoiceInfo]:
        """List all voices in library"""
        voices = []
        import json

        for voice_dir in VOICE_LIBRARY_PATH.iterdir():
            if not voice_dir.is_dir():
                continue

            metadata_path = voice_dir / "metadata.json"
            if not metadata_path.exists():
                continue

            async with aiofiles.open(metadata_path, "r") as f:
                content = await f.read()
                metadata = json.loads(content)
                voices.append(VoiceInfo(**metadata))

        return voices

    @staticmethod
    async def delete_voice(voice_id: str) -> bool:
        """Delete voice from library"""
        import shutil
        voice_dir = VOICE_LIBRARY_PATH / voice_id
        if voice_dir.exists():
            shutil.rmtree(voice_dir)
            logger.info(f"Deleted voice: {voice_id}")
            return True
        return False


# ============================================================================
# QwenTTS Wrapper
# ============================================================================

class QwenTTSEngine:
    """Wrapper around ComfyUI-QwenTTS nodes"""

    def __init__(self):
        self.models_loaded = {}

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        voice: Optional[str] = None,
        instruction: Optional[str] = None,
        model: QwenModel = QwenModel.CUSTOM_VOICE_1_7B,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        do_sample: bool = False,
    ) -> tuple[np.ndarray, int]:
        """
        Synthesize speech from text

        Returns:
            (audio_array, sample_rate)
        """
        if not COMFYUI_AVAILABLE:
            raise RuntimeError("ComfyUI not available")

        # Select node based on whether we have a voice ID or custom voice
        if voice and voice.startswith("voice_"):
            # Load voice embedding from library
            embedding = await VoiceLibrary.load_voice(voice)
            if embedding is None:
                raise HTTPException(status_code=404, detail=f"Voice {voice} not found")

            # Use VoiceClone node with embedding
            node_class = QWEN_NODES['VoiceClone']
        else:
            # Use CustomVoice node
            node_class = QWEN_NODES['CustomVoice']
            if voice is None:
                voice = CustomVoice.VOICE_1

        # Initialize node
        node = node_class()

        # Prepare inputs based on model type
        inputs = {
            "text": text,
            "model_name": model.value,
            "max_new_tokens": max_tokens,
            "temperature": temperature,
            "do_sample": do_sample,
        }

        if instruction:
            inputs["instruction"] = instruction

        if voice and not voice.startswith("voice_"):
            # Custom voice (1-9)
            inputs["speaker"] = voice

        # Run synthesis
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, node.generate, **inputs)

        # Extract audio
        audio_array = result.get("audio")
        sample_rate = result.get("sample_rate", 24000)

        return audio_array, sample_rate

    async def clone_voice(
        self,
        audio_path: str,
        transcript: str,
        language: str = "en"
    ) -> np.ndarray:
        """
        Clone voice from audio sample

        Returns:
            Voice embedding
        """
        if not COMFYUI_AVAILABLE:
            raise RuntimeError("ComfyUI not available")

        node_class = QWEN_NODES['VoiceClone']
        node = node_class()

        # Create voice embedding
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            node.create_voice,
            audio_path,
            transcript,
            language
        )

        embedding = result.get("embedding")
        return embedding

    async def design_voice(
        self,
        description: str,
        language: str = "en"
    ) -> np.ndarray:
        """
        Design voice from natural language description

        Returns:
            Voice embedding
        """
        if not COMFYUI_AVAILABLE:
            raise RuntimeError("ComfyUI not available")

        node_class = QWEN_NODES['VoiceDesign']
        node = node_class()

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            node.design_voice,
            description,
            language
        )

        embedding = result.get("embedding")
        return embedding


# Global engine instance
engine = QwenTTSEngine()


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "QwenTTS Bridge",
        "version": "1.0.0",
        "status": "operational",
        "comfyui_available": COMFYUI_AVAILABLE,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "comfyui": COMFYUI_AVAILABLE,
        "voice_library": str(VOICE_LIBRARY_PATH),
        "voices_count": len(list(VOICE_LIBRARY_PATH.iterdir())),
    }


@app.post("/api/v1/synthesize", response_model=SynthesizeResponse)
async def synthesize_speech(request: SynthesizeRequest):
    """
    Synthesize speech from text

    Example:
        {
          "text": "Hello, how are you today?",
          "language": "en",
          "voice": "custom_1",
          "instruction": "speak in a warm, friendly tone",
          "model": "Qwen3-TTS-12Hz-1.7B-CustomVoice"
        }
    """
    start_time = time.time()

    try:
        # Synthesize
        audio_array, sample_rate = await engine.synthesize(
            text=request.text,
            language=request.language,
            voice=request.voice,
            instruction=request.instruction,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            do_sample=request.do_sample,
        )

        # Convert to WAV bytes
        import io
        buffer = io.BytesIO()
        sf.write(buffer, audio_array, sample_rate, format='WAV')
        buffer.seek(0)
        audio_bytes = buffer.read()

        # Calculate duration
        duration_ms = int((len(audio_array) / sample_rate) * 1000)

        latency = time.time() - start_time
        logger.info(
            f"Synthesized: '{request.text[:50]}...' "
            f"({request.language}, {request.voice or 'default'}) "
            f"→ {len(audio_bytes)} bytes in {latency:.2f}s"
        )

        return SynthesizeResponse(
            audio=base64.b64encode(audio_bytes).decode(),
            format="wav",
            sample_rate=sample_rate,
            duration_ms=duration_ms,
            voice_id=request.voice,
            model=request.model.value,
        )

    except Exception as e:
        logger.error(f"Synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/clone-voice", response_model=VoiceInfo)
async def clone_voice(
    audio: UploadFile = File(...),
    transcript: str = "",
    name: str = "",
    language: str = "en",
    save_to_library: bool = True,
):
    """
    Clone voice from audio sample

    Upload 5-30 seconds of audio with transcript
    """
    start_time = time.time()

    try:
        # Save uploaded audio to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_path = temp_file.name

        # Clone voice
        embedding = await engine.clone_voice(
            audio_path=temp_path,
            transcript=transcript,
            language=language,
        )

        # Generate voice ID
        voice_id = f"voice_{hashlib.md5(name.encode()).hexdigest()[:8]}"

        # Save to library
        if save_to_library:
            voice_info = await VoiceLibrary.save_voice(
                voice_id=voice_id,
                name=name,
                language=language,
                embedding=embedding,
                description=f"Cloned from audio: {audio.filename}",
            )
        else:
            voice_info = VoiceInfo(
                voice_id=voice_id,
                name=name,
                language=language,
                created_at=datetime.utcnow().isoformat(),
            )

        # Cleanup
        os.unlink(temp_path)

        latency = time.time() - start_time
        logger.info(f"Cloned voice: {name} ({voice_id}) in {latency:.2f}s")

        return voice_info

    except Exception as e:
        logger.error(f"Voice clone error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/design-voice", response_model=VoiceInfo)
async def design_voice(request: DesignVoiceRequest):
    """
    Design voice from natural language description

    Example:
        {
          "description": "A warm, elderly male voice with a slight Hindi accent",
          "language": "en",
          "name": "Grandfather Voice"
        }
    """
    start_time = time.time()

    try:
        # Design voice
        embedding = await engine.design_voice(
            description=request.description,
            language=request.language,
        )

        # Generate voice ID
        voice_id = f"voice_{hashlib.md5(request.name.encode()).hexdigest()[:8]}"

        # Save to library
        if request.save_to_library:
            voice_info = await VoiceLibrary.save_voice(
                voice_id=voice_id,
                name=request.name,
                language=request.language,
                embedding=embedding,
                description=request.description,
            )
        else:
            voice_info = VoiceInfo(
                voice_id=voice_id,
                name=request.name,
                language=request.language,
                description=request.description,
                created_at=datetime.utcnow().isoformat(),
            )

        latency = time.time() - start_time
        logger.info(f"Designed voice: {request.name} ({voice_id}) in {latency:.2f}s")

        return voice_info

    except Exception as e:
        logger.error(f"Voice design error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/voices", response_model=List[VoiceInfo])
async def list_voices():
    """List all voices in the library"""
    voices = await VoiceLibrary.list_voices()
    return voices


@app.delete("/api/v1/voices/{voice_id}")
async def delete_voice(voice_id: str):
    """Delete a voice from the library"""
    success = await VoiceLibrary.delete_voice(voice_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Voice {voice_id} not found")
    return {"status": "deleted", "voice_id": voice_id}


# ============================================================================
# Startup
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("QwenTTS Bridge Service starting...")
    logger.info(f"ComfyUI available: {COMFYUI_AVAILABLE}")
    logger.info(f"Voice library: {VOICE_LIBRARY_PATH}")
    logger.info(f"Model cache: {MODEL_CACHE_PATH}")

    if not COMFYUI_AVAILABLE:
        logger.warning("ComfyUI not available - running in mock mode")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("QwenTTS Bridge Service shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level="info",
    )
