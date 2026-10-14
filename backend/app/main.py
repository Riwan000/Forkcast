from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.menu import router as menu_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for Forkcast collaborative café ordering and menu RAG",
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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.app_name,
        "docs": "/docs",
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "forkcast-backend"
    }
