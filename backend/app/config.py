import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Explicitly load from backend/.env or root .env
backend_env = Path(__file__).resolve().parent.parent / ".env"
root_env = Path(__file__).resolve().parent.parent.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
elif root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
else:
    load_dotenv(override=True)


class Settings(BaseModel):
    app_name: str = "Forkcast API"
    environment: str = os.getenv("ENVIRONMENT", "development")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "")
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
        ).split(",")
    ]

    def get_sqlalchemy_database_url(self) -> str:
        """Normalize PostgreSQL / Neon connection strings for SQLAlchemy + psycopg."""
        url = self.database_url.strip()
        if not url:
            # Local SQLite fallback for immediate out-of-the-box development
            return "sqlite:///./forkcast.db"
        
        # Neon strings often start with postgres:// or postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        
        return url

settings = Settings()
