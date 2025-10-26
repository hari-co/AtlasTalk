from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

class ConversationCreate(BaseModel):
    # metadata fields if you want
    metadata: Optional[dict] = None

class ConversationInDB(BaseModel):
    id: str
    messages: List[Message]
    created_at: datetime
    metadata: Optional[dict] = None

    class Config:
        orm_mode = True