import os
import asyncio
import logging
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from openai import OpenAI
import google.generativeai as genai

import aiohttp
import tempfile

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

# ================================
# 🔊 Text-to-Speech (TTS)
# ================================
async def text_to_speech(text: str, voice: str = "pNInz6obpgDQGcFmaJgB") -> str:
    """
    Convert text into speech using ElevenLabs API.
    Returns the path to a temporary .mp3 file.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY not configured in .env")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key,
    }

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.7},
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as resp:
            if resp.status != 200:
                err = await resp.text()
                raise RuntimeError(f"TTS failed ({resp.status}): {err}")

            # Save audio to a temp file
            audio_data = await resp.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
                f.write(audio_data)
                return f.name


# ================================
# 🎙️ Speech-to-Text (STT)
# ================================
async def speech_to_text(audio_path: str) -> str:
    """
    Transcribe speech from an audio file to text using ElevenLabs STT API.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY not configured in .env")

    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = {"xi-api-key": api_key}

    async with aiohttp.ClientSession() as session:
        with open(audio_path, "rb") as f:
            data = aiohttp.FormData()
            data.add_field("file", f, filename=os.path.basename(audio_path))
            data.add_field("model_id", "scribe_v1")

            async with session.post(url, headers=headers, data=data) as resp:
                if resp.status != 200:
                    err = await resp.text()
                    raise RuntimeError(f"STT failed ({resp.status}): {err}")
                result = await resp.json()
                return result.get("text", "")


def _get_motor_client() -> AsyncIOMotorClient:
	global _motor_client
	if _motor_client is None:
		_motor_client = AsyncIOMotorClient(MONGODB_URI)
	return _motor_client


async def setupAgent(AGENT: str, country: str, language: str, db=None, scenario_prompt: Optional[str] = None):
	"""
	Prepare an OpenAI-compatible client for a DigitalOcean agent and create
	a conversation document with an initial system message describing
	the country and language.

	Returns: (client, response, conversation_id)
	"""
	# Validate the input DigitalOcean agent
	if AGENT not in endpoints:
		raise RuntimeError(f"Unknown agent: {AGENT}")

	# Prepare DigitalOcean agent client config
	agent_endpoint = endpoints[AGENT].rstrip("/") + "/api/v1/"
	agent_access_key = os.getenv(f"{AGENT}_PRIVATE_KEY")
	if not agent_access_key:
		raise RuntimeError(f"Access key for agent {AGENT} not configured in environment")

	# Prepare Gemini config as well
	gemini_key = os.getenv("GEMINI_API_KEY")
	gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
	if not gemini_key:
		logging.warning("GEMINI_API_KEY not set; Gemini instance will be skipped")

	# initial system message and conversation document (for both agents)
	system_content = f"Your country is set to {country}, and your language is {language}."
	# Separate system prompt for Gemini-specific behavior
	gemini_prompt = f"""
You are a roleplay director for conversation practice.

User's requested scenario: "{scenario_prompt}"

Facilitate this conversational roleplay scenario. You will recieve alternating input between two parties.
One of them is the user who is trying to achieve goals in a conversation. The other is an AI Agent playing the role of a foreign local.
Help give general direction to the AI Agent to lead the conversation.
ALL your responses must be ONLY with valid JSON in this exact format:

{{
  "description": "Short description of what the user will practice",
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

	# Create a separate conversation document for Gemini if configured
	gemini_conversation_id = None
	if gemini_key:
		conversation_doc_g = {
			"agent": "GEMINI",
			"created_at": datetime.utcnow(),
			"updated_at": datetime.utcnow(),
			"metadata": {"country": country, "language": language, "model": gemini_model_name},
			"messages": [
				{"role": "system", "content": gemini_prompt, "timestamp": datetime.utcnow()}
			],
		}
		res_g = await _db.conversations.insert_one(conversation_doc_g)
		gemini_conversation_id = str(res_g.inserted_id)

	client = None
	response = None
	client_g = None
	response_g = None
	try:
		# DO agent warm-up
		client = OpenAI(base_url=agent_endpoint, api_key=agent_access_key)
		response = await asyncio.to_thread(
			client.chat.completions.create,
			model="n/a",
			messages=[{"role": "system", "content": system_content}],
			extra_body={"include_retrieval_info": True},
		)
		# Gemini warm-up (if configured)
		if gemini_key and gemini_conversation_id:
			genai.configure(api_key=gemini_key)
			client_g = genai.GenerativeModel(gemini_model_name)
			response_g = await asyncio.to_thread(client_g.generate_content, gemini_prompt)
	except Exception:
		logging.exception("Initial agent warmup call failed; continuing")

	return client, response, conversation_id, client_g, response_g, gemini_conversation_id


async def append_message(conversation_id: str, role: str, content: str, *, db=None, max_messages: int = 200):
	_db = db if db is not None else _get_motor_client()[MONGODB_DB]
	oid = ObjectId(conversation_id)
	msg_doc = {"role": role, "content": content, "timestamp": datetime.utcnow()}
	await _db.conversations.update_one(
		{"_id": oid},
		{
			"$push": {"messages": {"$each": [msg_doc], "$slice": -max_messages}},
			"$set": {"updated_at": datetime.utcnow()},
		},
	)


async def get_last_messages(conversation_id: str, n: int = 50, db=None):
	_db = db if db is not None else _get_motor_client()[MONGODB_DB]
	oid = ObjectId(conversation_id)
	doc = await _db.conversations.find_one({"_id": oid}, {"messages": {"$slice": -n}})
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


def _get_client_for_agent(agent: str):
	"""Return a provider client by agent name.
	- 'GEMINI' => GenerativeModel
	- other => OpenAI-compatible client
	"""
	if agent == "GEMINI":
		gemini_key = os.getenv("GEMINI_API_KEY")
		if not gemini_key:
			raise RuntimeError("GEMINI_API_KEY not configured in environment")
		genai.configure(api_key=gemini_key)
		model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
		return genai.GenerativeModel(model_name)
	return _get_openai_client_for_agent(agent)


async def messageAgent(
	client: OpenAI,
	conversation_id: str,
	role: str,
	content: str,
	*,
	db=None,
	max_messages: int = 200,
	history_size: int = 50,
	include_retrieval_info: bool = True,
):
	# store user message
	await append_message(conversation_id, role, content, db=db, max_messages=max_messages)

	# get recent history
	db_messages = await get_last_messages(conversation_id, n=history_size, db=db)
	agent_messages = to_agent_messages(db_messages)

	# call agent (OpenAI-compatible vs Gemini)
	if hasattr(client, "chat"):
		response = await asyncio.to_thread(
			client.chat.completions.create,
			model="n/a",
			messages=agent_messages,
			extra_body={"include_retrieval_info": include_retrieval_info},
		)
		try:
			assistant_text = response.choices[0].message.content
		except Exception:
			assistant_text = str(response)
	else:
		# Gemini GenerativeModel path
		history_text = "\n".join(f"{m['role'].capitalize()}: {m['content']}" for m in db_messages)
		prompt = (
			f"{history_text}\n\nUser: {content}\nAssistant:"
			if history_text
			else f"User: {content}\nAssistant:"
		)
		response = await asyncio.to_thread(client.generate_content, prompt)
		assistant_text = getattr(response, "text", str(response))

	# persist assistant reply
	await append_message(conversation_id, "assistant", assistant_text, db=db, max_messages=max_messages)

	return {"conversation_id": conversation_id, "assistant_text": assistant_text, "raw_response": response}
