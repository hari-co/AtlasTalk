from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import tempfile
import os
from services.voice_roleplay import VoiceRoleplayService

router = APIRouter(prefix="/voice-roleplay", tags=["voice-roleplay"])

# Initialize the service
voice_service = VoiceRoleplayService()

class ScenarioRequest(BaseModel):
    scenario: str

class Goal(BaseModel):
    goal: str
    completed: bool

class UpdateGoalsRequest(BaseModel):
    user_text: str
    goals: List[Goal]

class TalkResponse(BaseModel):
    transcription: str
    reply: str
    audio_base64: str

class ChatRequest(BaseModel):
    text: str
    scenario_context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = None

@router.get("/config")
async def get_config():
    """Get current voice roleplay configuration."""
    return voice_service.get_config()

@router.post("/scenario")
async def create_scenario(request: ScenarioRequest):
    """Generate a conversational roleplay scenario."""
    return await voice_service.generate_scenario(request.scenario)

@router.post("/update-goals")
async def update_goals(request: UpdateGoalsRequest):
    """Update goal completion status based on user response."""
    # Convert Pydantic models to dicts
    goals_dict = [{"goal": goal.goal, "completed": goal.completed} for goal in request.goals]
    return await voice_service.update_goals_smart(request.user_text, [], goals_dict)

@router.post("/talk", response_model=TalkResponse)
async def talk(audio_file: UploadFile = File(...)):
    """Process voice input and return transcription, reply, and audio."""
    try:
        print(f"Received audio file: {audio_file.filename}, content_type: {audio_file.content_type}")
        
        if not voice_service.use_audio:
            # Text-only mode: return a mock response
            print("Text-only mode: Skipping audio processing")
            mock_transcription = "Text-only mode: Audio processing disabled"
            mock_reply = "I'm running in text-only mode. Please use the scenario interface for roleplay practice!"
            
            return TalkResponse(
                transcription=mock_transcription,
                reply=mock_reply,
                audio_base64=""
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        print(f"Saved audio to: {temp_file_path}")
        
        # Process the voice input
        result = await voice_service.process_voice_input(temp_file_path)
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return TalkResponse(
            transcription=result["transcription"],
            reply=result["reply"],
            audio_base64=result["audio_base64"]
        )
        
    except Exception as e:
        print(f"Error in /talk endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: ChatRequest):
    """Text-only chat endpoint for scenario conversations with goal tracking."""
    try:
        user_text = request.text
        session_id = request.session_id or "default"
        
        # Get or create session
        session = voice_service._get_or_create_session(session_id)
        
        # If first message and scenario_context provided, initialize session
        if not session['conversation_history'] and request.scenario_context:
            session['scenario_context'] = request.scenario_context
            session['goals'] = request.scenario_context.get('goals', []).copy()
        
        scenario_context = session.get('scenario_context', {})
        conversation_history = session.get('conversation_history', [])
        
        print(f"Received text message: {user_text}")
        print(f"Session ID: {session_id}")
        print(f"Conversation history length: {len(conversation_history)}")
        
        # Generate AI response
        print("Generating contextual reply with Gemini...")
        ai_reply = await voice_service.chat_with_context(user_text, scenario_context, conversation_history)
        print(f"AI Reply: {ai_reply}")
        
        # Update session with new messages
        session['conversation_history'].append({'role': 'user', 'content': user_text})
        session['conversation_history'].append({'role': 'assistant', 'content': ai_reply})
        
        # Update goals if scenario context includes goals
        updated_goals = []
        if session['goals']:
            updated_goals = await voice_service.update_goals_smart(
                user_text, 
                session['conversation_history'], 
                session['goals']
            )
            session['goals'] = updated_goals
            print(f"Updated goals: {updated_goals}")
        
        return {
            "user_text": user_text,
            "ai_reply": ai_reply,
            "updated_goals": updated_goals,
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"Error in /chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
