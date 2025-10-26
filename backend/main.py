from fastapi import FastAPI
from dotenv import load_dotenv
import os
from backend.services.db import init_db, close_db
from backend.services.conversation import router as conv_router

app = FastAPI()

app.include_router(conv_router)

@app.on_event("startup")
async def startup_event():
    init_db(app)

@app.on_event("shutdown")
async def shutdown_event():
    close_db(app)

@app.get("/")
async def root():
    return {"message": "service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
