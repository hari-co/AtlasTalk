import os
import asyncio
import logging
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from openai import OpenAI

load_dotenv()

# Map agent names to their DigitalOcean Agent base URLs
endpoints = {
	"TAXI": "https://t2jd4cy2mk3iestb55rui63l.agents.do-ai.run",
}

# Mongo configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "altastalk")

# Cached Motor client (module-level singleton)
_motor_client: Optional[AsyncIOMotorClient] = None


def _get_motor_client() -> AsyncIOMotorClient:
	global _motor_client
	if _motor_client is None:
		_motor_client = AsyncIOMotorClient(MONGODB_URI)
	return _motor_client


async def setupAgent(AGENT: str, country: str, language: str, db=None):
	"""
	Prepare an OpenAI-compatible client for a DigitalOcean agent and create
	a conversation document with an initial system message describing
	the country and language.

	Returns: (client, response, conversation_id)
	"""
	if AGENT not in endpoints:
		raise RuntimeError(f"Unknown agent: {AGENT}")

	agent_endpoint = endpoints[AGENT].rstrip("/") + "/api/v1/"
	agent_access_key = os.getenv(f"{AGENT}_PRIVATE_KEY")
	if not agent_access_key:
		raise RuntimeError(f"Access key for agent {AGENT} not configured in environment")

	# initial system message and conversation document
	system_content = f"Your country is set to {country}, and your language is {language}."
	conversation_doc = {
		"agent": AGENT,
		"created_at": datetime.utcnow(),
		"updated_at": datetime.utcnow(),
		"metadata": {"country": country, "language": language},
		"messages": [
			{"role": "system", "content": system_content, "timestamp": datetime.utcnow()}
		],
	}

	# Use provided DB (preferred) else fall back to module client
	_db = db if db is not None else _get_motor_client()[MONGODB_DB]
	res = await _db.conversations.insert_one(conversation_doc)
	conversation_id = str(res.inserted_id)

	client = None
	response = None
	try:
		client = OpenAI(base_url=agent_endpoint, api_key=agent_access_key)
		# optional warm-up call; non-fatal
		response = await asyncio.to_thread(
			client.chat.completions.create,
			model="n/a",
			messages=[{"role": "system", "content": system_content}],
			extra_body={"include_retrieval_info": True},
		)
	except Exception:
		logging.exception("Initial agent warmup call failed for %s; continuing", AGENT)

	return client, response, conversation_id


async def append_message(conversation_id: str, role: str, content: str, *, max_messages: int = 200):
	db = _get_motor_client()[MONGODB_DB]
	oid = ObjectId(conversation_id)
	msg_doc = {"role": role, "content": content, "timestamp": datetime.utcnow()}
	await db.conversations.update_one(
		{"_id": oid},
		{
			"$push": {"messages": {"$each": [msg_doc], "$slice": -max_messages}},
			"$set": {"updated_at": datetime.utcnow()},
		},
	)


async def get_last_messages(conversation_id: str, n: int = 50):
	db = _get_motor_client()[MONGODB_DB]
	oid = ObjectId(conversation_id)
	doc = await db.conversations.find_one({"_id": oid}, {"messages": {"$slice": -n}})
	if not doc:
		return []
	return doc.get("messages", [])


def to_agent_messages(db_messages, system_prompt: Optional[str] = None):
	msgs = []
	if system_prompt:
		msgs.append({"role": "system", "content": system_prompt})
	for m in db_messages:
		msgs.append({"role": m.get("role"), "content": m.get("content")})
	return msgs


def _get_openai_client_for_agent(agent: str) -> OpenAI:
	if agent not in endpoints:
		raise RuntimeError(f"Unknown agent: {agent}")
	base = endpoints[agent].rstrip("/") + "/api/v1/"
	key = os.getenv(f"{agent}_PRIVATE_KEY")
	if not key:
		raise RuntimeError(f"Private key for agent {agent} not found in environment")
	return OpenAI(base_url=base, api_key=key)


async def messageAgent(
	client: OpenAI,
	conversation_id: str,
	role: str,
	content: str,
	*,
	max_messages: int = 200,
	history_size: int = 50,
	include_retrieval_info: bool = True,
):
	# store user message
	await append_message(conversation_id, role, content, max_messages=max_messages)

	# get recent history
	db_messages = await get_last_messages(conversation_id, n=history_size)
	agent_messages = to_agent_messages(db_messages)

	# call agent (run sync client in thread)
	response = await asyncio.to_thread(
		client.chat.completions.create,
		model="n/a",
		messages=agent_messages,
		extra_body={"include_retrieval_info": include_retrieval_info},
	)

	# extract assistant text
	try:
		assistant_text = response.choices[0].message.content
	except Exception:
		assistant_text = str(response)

	# persist assistant reply
	await append_message(conversation_id, "assistant", assistant_text, max_messages=max_messages)

	return {"conversation_id": conversation_id, "assistant_text": assistant_text, "raw_response": response}
