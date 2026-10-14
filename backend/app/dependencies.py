from functools import lru_cache
from typing import Generator, Annotated
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.services.menu_service import MenuService
from app.services.menu_db_service import MenuDatabaseService
from app.services.qr_service import QRService
from app.services.room_service import RoomService

@lru_cache()
def get_menu_service() -> MenuService:
    """Dependency provider factory for MenuService."""
    return MenuService()

def get_db() -> Generator[Session, None, None]:
    """Dependency provider for database session (scoped per request)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_menu_db_service(
    db: Annotated[Session, Depends(get_db)]
) -> MenuDatabaseService:
    """Dependency provider factory for MenuDatabaseService."""
    return MenuDatabaseService(db=db)

@lru_cache()
def get_qr_service() -> QRService:
    """Dependency provider factory for QRService."""
    return QRService()

@lru_cache()
def get_room_service() -> RoomService:
    """Dependency provider factory for RoomService (in-memory live rooms)."""
    return RoomService()


