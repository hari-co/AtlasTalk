import os
import base64
import tempfile
import json
import re
import requests
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class VoiceRoleplayService:
    def __init__(self):
        self.elevenlabs_key = os.getenv('ELEVENLABS_API_KEY', '')
        self.gemini_key = os.getenv('GEMINI_API_KEY', '')
        
        # Configuration: Set to False for text-only mode, True for audio mode
        self.text_only_mode = os.getenv('TEXT_ONLY_MODE', 'true').lower() == 'true'
        
        if not self.gemini_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Check audio mode
        self.use_audio = not self.text_only_mode and self.elevenlabs_key and self.elevenlabs_key != ""
        
        # Chat session tracking (in production, use proper session storage)
        self.chat_sessions = {}
        
        print(f"Voice Roleplay Service initialized:")
        print(f"- Text-only mode: {self.text_only_mode}")
        print(f"- Audio enabled: {self.use_audio}")
        print(f"- ElevenLabs key present: {bool(self.elevenlabs_key)}")
    
    def _get_or_create_session(self, session_id: str) -> dict:
        """Get or create a chat session."""
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = {
                'conversation_history': [],
                'goals': [],
                'scenario_context': None
            }
        return self.chat_sessions[session_id]
    
    def _parse_json_response(self, response_text: str):
        """Safely parse JSON from response text (handles objects and arrays)."""
        # Remove markdown code fences if present
        response_text = response_text.strip()
        
        # Remove markdown code fence patterns (```json ... ``` or ``` ... ```)
        response_text = re.sub(r'^```json\s*', '', response_text, flags=re.MULTILINE)
        response_text = re.sub(r'^```\s*', '', response_text, flags=re.MULTILINE)
        response_text = re.sub(r'\s*```\s*$', '', response_text, flags=re.MULTILINE)
        response_text = response_text.strip()
        
        # Try to find JSON (either object {} or array [])
        json_match = re.search(r'(\[.*?\]|\{.*?\})', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Attempted to parse: {json_str}")
                print(f"Full response: {response_text}")
        else:
            print(f"No JSON found in response: {response_text}")
        
        return None

    async def generate_scenario(self, scenario_prompt: str) -> dict:
        """Generate a conversational roleplay scenario using Gemini."""
        try:
            print(f"Generating scenario for: {scenario_prompt}")
            
            prompt = f"""
You are a roleplay generator for conversation practice.

User's requested scenario: "{scenario_prompt}"

Generate a conversational roleplay scenario. Respond ONLY with valid JSON in this exact format:

{{
  "scenario_title": "Brief title for the scenario",
  "description": "Short description of what the user will practice",
  "ai_character": "Who the AI will play as",
  "environment": "Where the conversation takes place",
  "goals": [
    {{ "goal": "First goal to accomplish", "completed": false }},
    {{ "goal": "Second goal to accomplish", "completed": false }},
    {{ "goal": "Third goal to accomplish", "completed": false }}
  ],
  "opening_line": "What the AI character says to start the conversation"
}}

Make it realistic and interactive. Keep goals simple and achievable through conversation.
"""
            
            response = self.model.generate_content(prompt)
            print(f"Gemini scenario response: {response.text}")
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response_text
            
            try:
                scenario_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Raw response: {response_text}")
                # Fallback scenario
                scenario_data = {
                    "scenario_title": f"Practice: {scenario_prompt}",
                    "description": f"Practice conversation for {scenario_prompt}",
                    "ai_character": "AI Assistant",
                    "environment": "General setting",
                    "goals": [
                        {"goal": "Start the conversation", "completed": False},
                        {"goal": "Complete the main task", "completed": False},
                        {"goal": "End politely", "completed": False}
                    ],
                    "opening_line": f"Hello! Let's practice {scenario_prompt}. How can I help you today?"
                }
            
            return scenario_data
            
        except Exception as e:
            print(f"Error generating scenario: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def update_goals_smart(self, user_text: str, conversation_history: list, goals: list) -> list:
        """Smart goal tracking based on conversation context."""
        try:
            print(f"Updating goals for: {user_text}")
            
            # Build conversation context
            history_context = ""
            if conversation_history:
                history_context = "\nRecent conversation:\n"
                for msg in conversation_history[-4:]:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    history_context += f"{role}: {content}\n"
            
            prompt = f"""
You are analyzing a conversation to determine if goals have been achieved.

Current goals:
{json.dumps([g.get('goal', '') for g in goals], indent=2)}

{history_context}
Latest user message: "{user_text}"

For each goal, determine if it has been completed based on the conversation.

Return ONLY a JSON array of booleans representing completion status for each goal, in order.
Example: [true, false, true]

Do not add any explanation or additional text. Only the JSON array.
"""
            
            response = self.model.generate_content(prompt)
            print(f"Goal completion response: {response.text}")
            
            # Parse the boolean array
            result = self._parse_json_response(response.text)
            if result is not None and isinstance(result, list):
                # Update goals with completion status
                updated_goals = []
                for i, goal in enumerate(goals):
                    updated_goal = goal.copy()
                    if i < len(result):
                        updated_goal['completed'] = bool(result[i])
                    updated_goals.append(updated_goal)
                return updated_goals
            else:
                # Return goals unchanged if parsing fails
                print("Failed to parse goal completion, keeping current state")
                return goals
            
        except Exception as e:
            print(f"Error in smart goal tracking: {e}")
            return goals

    async def speech_to_text(self, audio_file_path: str) -> str:
        """Convert audio to text using ElevenLabs Speech-to-Text API."""
        if not self.use_audio:
            return "Text-only mode: Audio processing disabled"
            
        url = "https://api.elevenlabs.io/v1/speech-to-text"
        headers = {
            "xi-api-key": self.elevenlabs_key
        }
        try:
            with open(audio_file_path, "rb") as audio_file:
                files = {
                    "file": audio_file
                }
                data = {
                    "model_id": "scribe_v1"
                }
                print(f"Sending audio to ElevenLabs Speech-to-Text API...")
                response = requests.post(url, headers=headers, files=files, data=data)
                print(f"ElevenLabs Speech-to-Text response status: {response.status_code}")
                print(f"ElevenLabs Speech-to-Text response: {response.text}")
                if response.status_code == 200:
                    result = response.json()
                    transcription = result.get("text", "")
                    print(f"ElevenLabs transcribed: '{transcription}'")
                    return transcription
                else:
                    print(f"ElevenLabs Speech-to-Text failed: {response.status_code}")
                    return f"Speech-to-Text failed (status: {response.status_code})"
        except Exception as e:
            print(f"Error calling ElevenLabs Speech-to-Text: {e}")
            return f"Error transcribing audio: {str(e)}"

    async def text_to_speech(self, text: str) -> str:
        """Convert text to speech using ElevenLabs Text-to-Speech API."""
        if not self.use_audio:
            return ""
            
        url = "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.elevenlabs_key
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        try:
            print(f"Converting text to speech: '{text}'")
            response = requests.post(url, json=data, headers=headers)
            print(f"ElevenLabs TTS response status: {response.status_code}")
            if response.status_code == 200:
                print("Audio conversion complete")
            else:
                print(f"ElevenLabs TTS failed: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error calling ElevenLabs TTS: {e}")
            return ""
        
        # Convert audio to base64
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        return audio_base64

    async def process_voice_input(self, audio_file_path: str) -> dict:
        """Process voice input and return transcription, reply, and audio."""
        try:
            # Convert speech to text
            print("Starting speech-to-text...")
            transcription = await self.speech_to_text(audio_file_path)
            print(f"Transcription: {transcription}")
            
            # Generate reply with Gemini
            print("Generating reply with Gemini...")
            response = self.model.generate_content(transcription)
            reply = response.text
            print(f"Reply: {reply}")
            
            # Convert reply to speech
            print("Converting to speech...")
            audio_base64 = await self.text_to_speech(reply)
            
            return {
                "transcription": transcription,
                "reply": reply,
                "audio_base64": audio_base64
            }
            
        except Exception as e:
            print(f"Error processing voice input: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def chat_with_context(self, user_text: str, scenario_context: dict = None, conversation_history: list = None) -> str:
        """Generate a conversational response with proper context awareness."""
        try:
            print(f"Chat request for: {user_text}")
            print(f"Scenario context: {scenario_context}")
            print(f"Conversation history: {conversation_history}")
            
            # Build context-aware prompt
            if scenario_context:
                context_prompt = f"""
You are roleplaying as a character in a conversation practice scenario.

SCENARIO CONTEXT:
- Scenario: {scenario_context.get('scenario_title', 'General conversation')}
- Character: {scenario_context.get('ai_character', 'AI Assistant')}
- Environment: {scenario_context.get('environment', 'General setting')}
- Description: {scenario_context.get('description', '')}

Your role: You are playing the character "{scenario_context.get('ai_character', 'AI Assistant')}" in a realistic practice scenario. Respond naturally and in character.
"""
            else:
                context_prompt = f"""
You are a helpful AI assistant for conversation practice.
"""
            
            # Add conversation history if available
            history_text = ""
            if conversation_history and len(conversation_history) > 0:
                history_text = "\n\nCONVERSATION HISTORY:\n"
                for msg in conversation_history[-6:]:  # Last 6 messages for context
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    if role == 'user':
                        history_text += f"User: {content}\n"
                    elif role == 'assistant':
                        history_text += f"Assistant: {content}\n"
            
            # Build the final prompt
            final_prompt = f"""{context_prompt}{history_text}

USER'S MESSAGE: "{user_text}"

Respond naturally as the character in this scenario. Keep your response conversational and appropriate for the context. If the user is continuing a previous topic, acknowledge that continuity.
"""
            
            response = self.model.generate_content(final_prompt)
            reply = response.text.strip()
            print(f"Generated reply: {reply}")
            
            return reply
            
        except Exception as e:
            print(f"Error in chat_with_context: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_config(self) -> dict:
        """Get current configuration."""
        return {
            "text_only_mode": self.text_only_mode,
            "audio_enabled": self.use_audio,
            "elevenlabs_configured": bool(self.elevenlabs_key),
            "gemini_configured": bool(self.gemini_key)
        }
