# backend/services/conversation.py
from fastapi import APIRouter, HTTPException, Request, status, Depends
from typing import List
from models.conversation import Message, ConversationCreate, ConversationInDB
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/conversations", tags=["conversations"])

def conv_collection(request: Request):
    return request.app.state._mongo_db.get_collection("conversations")

@router.post("", status_code=201)
async def start_conversation(request: Request, payload: ConversationCreate = None):
    coll = conv_collection(request)
    doc = {
        "messages": [],
        "created_at": datetime.utcnow(),
        "metadata": payload.metadata if payload else {}
    }
    result = await coll.insert_one(doc)
    return {"conversation_id": str(result.inserted_id)}

@router.post("/{conversation_id}/messages", status_code=200)
async def add_message(conversation_id: str, message: Message, request: Request):
    coll = conv_collection(request)
    oid = ObjectId(conversation_id)
    msg_doc = {
        "role": message.role,
        "content": message.content,
        "timestamp": message.timestamp or datetime.utcnow()
    }
    result = await coll.update_one({"_id": oid}, {"$push": {"messages": msg_doc}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"ok": True}

@router.get("/{conversation_id}", status_code=200)
async def get_conversation(conversation_id: str, request: Request):
    coll = conv_collection(request)
    doc = await coll.find_one({"_id": ObjectId(conversation_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # Convert to response model
    return {
        "conversation_id": str(doc["_id"]),
        "messages": doc.get("messages", []),
        "created_at": doc.get("created_at"),
        "metadata": doc.get("metadata", {})
    }