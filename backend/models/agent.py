from pydantic import BaseModel
from typing import Optional


class AgentSetupRequest(BaseModel):
    country: str
    language: str
    user_id: Optional[str] = None
    scenario_prompt: Optional[str] = None


class AgentSetupResponse(BaseModel):
    conversation_id: str
    agent: str
    gemini_conversation_id: Optional[str] = None
