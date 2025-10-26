import os
from openai import OpenAI

endpoints = {
    "TAXI" : "https://t2jd4cy2mk3iestb55rui63l.agents.do-ai.run"
}

access_keys = {
    "TAXI" : os.getenv("TAXI_PRIVATE_KEY")
}

def setupAgent(AGENT: str, country: str, language: str):
    agent_endpoint = endpoints[AGENT] + "/api/v1/"
    agent_access_key = access_keys[AGENT]

    client = OpenAI(
        base_url=agent_endpoint,
        api_key=agent_access_key
    )

    return client