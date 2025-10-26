import os
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI, Depends
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGODB_DB", "altastalk")

client: AsyncIOMotorClient | None = None

def init_db(app: FastAPI):
    """
    Call this during FastAPI startup to attach the client and db to app.state
    """
    global client
    client = AsyncIOMotorClient(MONGO_URI)
    app.state._mongo_client = client
    app.state._mongo_db = client[MONGO_DB]

def close_db(app: FastAPI):
    global client
    if client:
        client.close()

def get_db(app: FastAPI = Depends()):
    """
    Dependency: returns a Motor database object (async-friendly).
    Use in route functions as: db = Depends(get_db)
    """
    return app.state._mongo_db