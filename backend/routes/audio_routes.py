from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
import tempfile
import aiofiles
import os

from backend.services.conversation import (text_to_speech, speech_to_text)  # adjust path if needed

router = APIRouter(prefix="/audio", tags=["Audio"])

# ===============================
# 🔊 TEXT → SPEECH (TTS)
# ===============================
@router.post("/tts")
async def tts_route(text: str = Form(...)):
    """
    Convert text into speech using ElevenLabs TTS.
    Returns the audio file for playback.
    """
    try:
        file_path = await text_to_speech(text)
        return FileResponse(
            file_path,
            media_type="audio/mpeg",
            filename="speech.mp3"
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ===============================
# 🎙️ SPEECH → TEXT (STT)
# ===============================
@router.post("/stt")
async def stt_route(audio_file: UploadFile = File(...)):
    """
    Transcribe a speech audio file to text using ElevenLabs STT.
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            contents = await audio_file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        # Convert speech to text
        text = await speech_to_text(tmp_path)

        # Clean up
        os.remove(tmp_path)

        return {"transcription": text}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
