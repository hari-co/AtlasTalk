from fastapi import FastAPI
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Access private keys
taxi_key = os.getenv("TAXI_PRIVATE_KEY")

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
