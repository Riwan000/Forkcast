from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import init_db
from app.routers.menu import router as menu_router
from app.routers.qr import router as qr_router
from app.routers.room import router as room_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for Forkcast collaborative café ordering and menu RAG",
    lifespan=lifespan,
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(menu_router)
app.include_router(qr_router)
app.include_router(room_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.app_name,
        "docs": "/docs",
    }

@app.get("/api/health")
def health_check():
    db_url = settings.get_sqlalchemy_database_url()
    db_type = "Neon Serverless PostgreSQL" if "neon.tech" in db_url else ("PostgreSQL" if "postgresql" in db_url else "Local SQLite")
    return {
        "status": "healthy",
        "service": "forkcast-backend",
        "database": db_type,
    }

