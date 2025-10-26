from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
from bson import ObjectId

from backend.models.conversation_models import Message, ConversationCreate
from backend.services.conversation import (
	messageAgent,
	_get_client_for_agent,
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

	# Agent-backed conversation: delegate to service (supports DO agents and Gemini)
	client = _get_client_for_agent(agent_name)
	try:
		result = await messageAgent(
			client,
			conversation_id,
			message.role,
			message.content,
			db=request.app.state._mongo_db,
		)
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


@router.post("/{conversation_id}/end", status_code=200)
async def end_conversation_in_character(conversation_id: str, request: Request):
	"""Ask the agent to end the conversation in-character with a short farewell.

	Returns the assistant's closing message.
	"""
	coll = conv_collection(request)
	oid = ObjectId(conversation_id)

	doc = await coll.find_one({"_id": oid})
	if not doc:
		raise HTTPException(status_code=404, detail="Conversation not found")

	agent_name = doc.get("agent")
	if not agent_name:
		raise HTTPException(status_code=400, detail="Conversation is not agent-backed")

	# Build an in-character closing instruction using conversation metadata
	metadata = doc.get("metadata", {}) or {}
	language = metadata.get("language")
	scenario_prompt = metadata.get("scenario_prompt")

	parts = [
		"Please end this conversation now in character."
	]
	if scenario_prompt:
		parts.append(f"Stay consistent with this scenario: {scenario_prompt}")
	# Keep it brief and avoid new topics
	parts.append("Provide a brief, warm farewell (1-3 sentences). Do not introduce new topics.")
	if language and isinstance(language, str):
		parts.append(f"Respond in {language}.")

	closing_instruction = " ".join(parts)

	client = _get_client_for_agent(agent_name)
	try:
		result = await messageAgent(
			client,
			conversation_id,
			"user",
			closing_instruction,
			db=request.app.state._mongo_db,
		)
	except Exception as exc:
		import logging
		logging.exception("Error ending conversation %s", conversation_id)
		raise HTTPException(status_code=502, detail=str(exc))

	return {"conversation_id": conversation_id, "assistant": result.get("assistant_text")}
