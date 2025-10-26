from fastapi import APIRouter, HTTPException, Request
import logging
from bson import ObjectId

from backend.models.agent import AgentSetupRequest, AgentSetupResponse
from backend.services.conversation import setupAgent, _get_motor_client, MONGODB_DB

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/{agent}/setup", response_model=AgentSetupResponse, status_code=201)
async def route_setup_agent(agent: str, payload: AgentSetupRequest, request: Request):
    """Create a new conversation and send initial system prompt to the agent.

    Body expects: {"country": "..", "language": "..", "user_id": "optional"}
    """
    country = payload.country
    language = payload.language
    user_id = payload.user_id

    try:
        # Prefer using the already-initialized DB attached to app.state
        client, response, conversation_id = await setupAgent(
            agent, country, language, db=request.app.state._mongo_db
        )
    except Exception as exc:
        logging.exception("Agent setup failed")
        # Return a 502 Bad Gateway to indicate upstream/third-party failure
        raise HTTPException(status_code=502, detail=str(exc))

    # if user_id provided, attach ownership to the conversation
    if user_id:
        db = request.app.state._mongo_db
        try:
            try:
                uid = ObjectId(user_id)
            except Exception:
                uid = user_id  # store as string if not a valid ObjectId
            await db.conversations.update_one(
                {"_id": ObjectId(conversation_id)}, {"$set": {"user_id": uid}}
            )
        except Exception as exc:
            logging.exception("Failed to attach user_id to conversation %s", conversation_id)
            raise HTTPException(status_code=502, detail=f"Failed to attach user_id: {exc}")

    return AgentSetupResponse(conversation_id=conversation_id, agent=agent)
