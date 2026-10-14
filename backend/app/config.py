import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    app_name: str = "Forkcast API"
    environment: str = os.getenv("ENVIRONMENT", "development")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
        ).split(",")
    ]

settings = Settings()
