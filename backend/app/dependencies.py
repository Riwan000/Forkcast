from functools import lru_cache
from app.services.menu_service import MenuService

@lru_cache()
def get_menu_service() -> MenuService:
    """Dependency provider factory for MenuService."""
    return MenuService()
