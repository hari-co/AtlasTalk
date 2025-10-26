from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
from bson import ObjectId

from backend.models.conversation_models import Message, ConversationCreate
from backend.services.conversation import (
	messageAgent,
	_get_openai_client_for_agent,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


def conv_collection(request: Request):
	return request.app.state._mongo_db.get_collection("conversations")


@router.post("", status_code=201)
async def start_conversation(request: Request, payload: ConversationCreate | None = None):
	coll = conv_collection(request)
	doc = {
		"messages": [],
		"created_at": datetime.utcnow(),
		"metadata": payload.metadata if payload else {},
	}
	result = await coll.insert_one(doc)
	return {"conversation_id": str(result.inserted_id)}


@router.post("/{conversation_id}/messages", status_code=200)
async def add_message(conversation_id: str, message: Message, request: Request):
	coll = conv_collection(request)
	oid = ObjectId(conversation_id)

	doc = await coll.find_one({"_id": oid})
	if not doc:
		raise HTTPException(status_code=404, detail="Conversation not found")

	agent_name = doc.get("agent")
	if not agent_name:
		# Plain conversation; just append the message
		msg_doc = {
			"role": message.role,
			"content": message.content,
			"timestamp": message.timestamp or datetime.utcnow(),
		}
		await coll.update_one({"_id": oid}, {"$push": {"messages": msg_doc}})
		return {"ok": True}

	# Agent-backed conversation: delegate to service
	client = _get_openai_client_for_agent(agent_name)
	try:
		result = await messageAgent(client, conversation_id, message.role, message.content)
	except Exception as exc:
		import logging

		logging.exception("Error sending message to agent for conversation %s", conversation_id)
		raise HTTPException(status_code=502, detail=str(exc))

	return {"conversation_id": conversation_id, "assistant": result.get("assistant_text")}


@router.get("/{conversation_id}", status_code=200)
async def get_conversation(conversation_id: str, request: Request):
	coll = conv_collection(request)
	doc = await coll.find_one({"_id": ObjectId(conversation_id)})
	if not doc:
		raise HTTPException(status_code=404, detail="Conversation not found")
	return {
		"conversation_id": str(doc["_id"]),
		"messages": doc.get("messages", []),
		"created_at": doc.get("created_at"),
		"metadata": doc.get("metadata", {}),
	}
