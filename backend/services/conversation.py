import os
from dotenv import load_dotenv
from openai import OpenAI

def setupAgent(AGENT: str, country: str, language: str):
    load_dotenv()

    endpoints = {
        "TAXI" : "https://t2jd4cy2mk3iestb55rui63l.agents.do-ai.run"
    }

    access_keys = {
        "TAXI" : os.getenv("TAXI_PRIVATE_KEY")
    }

    agent_endpoint = endpoints[AGENT] + "/api/v1/"
    agent_access_key = access_keys[AGENT]

    client = OpenAI(
        base_url=agent_endpoint,
        api_key=agent_access_key
    )

    response = client.chat.completions.create(
        model="n/a",
        messages=[{"role": "system", "content": f"Your country is set to {country}, and your language is {language}."}],
        extra_body={"include_retrieval_info": True}
    )

    print(f"Agent Initiated: {AGENT}")
    print(response)

    return client, response