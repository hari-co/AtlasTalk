import os
from dotenv import load_dotenv
from openai import OpenAI
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Body
from typing import Optional

load_dotenv()

# Simple endpoint map for agents
endpoints = {
    "TAXI": "https://t2jd4cy2mk3iestb55rui63l.agents.do-ai.run"
}

# Read Mongo configuration from environment (fallback to local)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "altastalk")

# Cache a Motor client for the module
_motor_client: AsyncIOMotorClient | None = None


def _get_motor_client() -> AsyncIOMotorClient:
    global _motor_client
    if _motor_client is None:
        _motor_client = AsyncIOMotorClient(MONGODB_URI)
    return _motor_client


async def setupAgent(AGENT: str, country: str, language: str):
    """
    Initialize an OpenAI client for a DigitalOcean agent and create a
    conversation document in MongoDB containing the initial system message.

    Returns: (client, response, conversation_id)
    """
    # resolve endpoint and key
    if AGENT not in endpoints:
        raise RuntimeError(f"Unknown agent: {AGENT}")

    agent_endpoint = endpoints[AGENT] + "/api/v1/"
    agent_access_key = os.getenv(f"{AGENT}_PRIVATE_KEY")

    if not agent_access_key:
        raise RuntimeError(f"Access key for agent {AGENT} not configured in environment")

    # prepare the initial system message and conversation document
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

    # insert conversation document into MongoDB
    client_motor = _get_motor_client()
    db = client_motor[MONGODB_DB]
    res = await db.conversations.insert_one(conversation_doc)
    conversation_id = str(res.inserted_id)

    # initialize OpenAI client
    client = OpenAI(
        base_url=agent_endpoint,
        api_key=agent_access_key
    )

    # send initial system prompt to the agent (do this in a thread to avoid blocking)
    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="n/a",
        messages=[{"role": "system", "content": system_content}],
        extra_body={"include_retrieval_info": True}
    )

    print(f"Agent Initiated: {AGENT}, conversation created: {conversation_id}")
    return client, response, conversation_id


async def append_message(conversation_id: str, role: str, content: str, max_messages: int = 200):
    """Append a message to the conversation and keep only the last `max_messages` messages."""
    client_motor = _get_motor_client()
    db = client_motor[MONGODB_DB]
    oid = ObjectId(conversation_id)
    msg_doc = {"role": role, "content": content, "timestamp": datetime.utcnow()}
    result = await db.conversations.update_one(
        {"_id": oid},
        {
            "$push": {"messages": {"$each": [msg_doc], "$slice": -max_messages}},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    return result.modified_count


async def get_last_messages(conversation_id: str, n: int = 50):
    """Return the last `n` messages for a conversation (or empty list)."""
    client_motor = _get_motor_client()
    db = client_motor[MONGODB_DB]
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
        # ensure we only include role/content in the agent call
        msgs.append({"role": m.get("role"), "content": m.get("content")})
    return msgs


async def messageAgent(client, conversation_id: str, role: str, content: str, *,
                       max_messages: int = 200, history_size: int = 50,
                       include_retrieval_info: bool = True):
    """
    Send a message to the agent on behalf of a conversation.

    Steps:
    - append the incoming message to the conversation (atomic push + slice)
    - load recent history (last `history_size` messages)
    - call the agent (non-blocking via asyncio.to_thread)
    - append the assistant reply to the conversation

    Returns: dict with keys: conversation_id, assistant_text, raw_response
    """
    # 1) store the user's message
    await append_message(conversation_id, role, content, max_messages=max_messages)

    # 2) load recent history
    db_messages = await get_last_messages(conversation_id, n=history_size)
    agent_messages = to_agent_messages(db_messages)

    # 3) call the agent in a thread to avoid blocking the event loop
    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="n/a",
        messages=agent_messages,
        extra_body={"include_retrieval_info": include_retrieval_info},
    )

    # 4) extract assistant text if available
    assistant_text = None
    try:
        # typical response shape: response.choices[0].message.content
        assistant_text = response.choices[0].message.content
    except Exception:
        # fallback to string representation
        assistant_text = str(response)

    # 5) store assistant reply
    await append_message(conversation_id, "assistant", assistant_text, max_messages=max_messages)

    return {"conversation_id": conversation_id, "assistant_text": assistant_text, "raw_response": response}


# --- FastAPI router -----------------------------------------------------
router = APIRouter()


def _get_openai_client_for_agent(agent: str) -> OpenAI:
    """Create an OpenAI client configured for the given agent using env key."""
    if agent not in endpoints:
        raise RuntimeError(f"Unknown agent: {agent}")
    base = endpoints[agent] + "/api/v1/"
    key = os.getenv(f"{agent}_PRIVATE_KEY")
    if not key:
        raise RuntimeError(f"Private key for agent {agent} not found in environment")
    return OpenAI(base_url=base, api_key=key)


@router.post("/agents/{agent}/setup")
async def route_setup_agent(agent: str, payload: dict = Body(...)):
    """Create a new conversation and send initial system prompt.

    Body expects: {"country": "..", "language": "..", "user_id": "optional"}
    """
    country = payload.get("country")
    language = payload.get("language")
    user_id = payload.get("user_id")
    if not country or not language:
        raise HTTPException(status_code=400, detail="country and language are required")

    client, response, conversation_id = await setupAgent(agent, country, language)

    # if user_id provided, attach ownership to the conversation
    if user_id:
        db = _get_motor_client()[MONGODB_DB]
        await db.conversations.update_one({"_id": ObjectId(conversation_id)}, {"$set": {"user_id": ObjectId(user_id)}})

    return {"conversation_id": conversation_id, "agent": agent}


@router.post("/conversations/{conversation_id}/messages")
async def route_post_message(conversation_id: str, payload: dict = Body(...)):
    """Post a message to a conversation and get agent reply.

    Body expects: {"role": "user", "content": "..."}
    """
    role = payload.get("role")
    content = payload.get("content")
    if not role or not content:
        raise HTTPException(status_code=400, detail="role and content are required")

    # lookup conversation to learn which agent to use
    db = _get_motor_client()[MONGODB_DB]
    doc = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")

    agent_name = doc.get("agent")
    client = _get_openai_client_for_agent(agent_name)

    result = await messageAgent(client, conversation_id, role, content)
    return {"conversation_id": conversation_id, "assistant": result["assistant_text"]}


@router.get("/conversations/{conversation_id}")
async def route_get_conversation(conversation_id: str):
    db = _get_motor_client()[MONGODB_DB]
    doc = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # convert _id and timestamps to strings for JSON
    doc["conversation_id"] = str(doc.pop("_id"))
    return doc


@router.get("/conversations")
async def route_list_conversations(user_id: Optional[str] = None, limit: int = 20, skip: int = 0):
    db = _get_motor_client()[MONGODB_DB]
    query = {}
    if user_id:
        query["user_id"] = ObjectId(user_id)
    cursor = db.conversations.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    items = []
    async for d in cursor:
        d["conversation_id"] = str(d.pop("_id"))
        items.append(d)
    return {"conversations": items}