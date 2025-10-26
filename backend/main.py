from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes.voice_roleplay import router as voice_roleplay_router

app = FastAPI(title="AtlasTalk API", description="Voice Roleplay and Conversation API")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_roleplay_router)

@app.get("/")
async def root():
    from services.voice_roleplay import VoiceRoleplayService
    voice_service = VoiceRoleplayService()
    config = voice_service.get_config()
    
    return {
        "message": "AtlasTalk API is running",
        "voice_roleplay": {
            "enabled": True,
            "text_only_mode": config["text_only_mode"],
            "audio_enabled": config["audio_enabled"],
            "elevenlabs_configured": config["elevenlabs_configured"],
            "gemini_configured": config["gemini_configured"]
        },
        "endpoints": {
            "voice_roleplay": "/voice-roleplay/",
            "conversation": "/conversation/",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
