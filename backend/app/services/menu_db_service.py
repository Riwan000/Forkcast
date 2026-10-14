import logging
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.models.db_models import CafeDB, MenuDB, DishDB
from app.models.menu import ConfirmMenuSaveRequest, MenuSaveResponse, DishItem

logger = logging.getLogger("menu_db_service")

class MenuDatabaseService:
    """Business logic service for managing café menus and dishes in Neon Postgres / SQLAlchemy."""

    def __init__(self, db: Session):
        self.db = db

    def _get_database_type(self) -> str:
        """Identify whether currently running on Neon PostgreSQL or local SQLite."""
        raw_url = settings.get_sqlalchemy_database_url()
        if "neon.tech" in raw_url:
            return "Neon Serverless PostgreSQL"
        elif "postgresql" in raw_url:
            return "PostgreSQL"
        return "Local SQLite Database"

    def save_verified_menu(self, request: ConfirmMenuSaveRequest) -> MenuSaveResponse:
        """Persist a verified café menu and its enriched dishes into the database."""
        cafe_id = request.cafe_id.strip() or "demo-cafe"
        cafe_name = request.cafe_name.strip() if request.cafe_name else "Forkcast Artisan Café"

        # 1. Upsert Café record
        cafe = self.db.query(CafeDB).filter(CafeDB.id == cafe_id).first()
        if not cafe:
            cafe = CafeDB(id=cafe_id, name=cafe_name)
            self.db.add(cafe)
            self.db.flush()

        # 2. Compute next menu version
        max_version = self.db.query(func.max(MenuDB.version)).filter(MenuDB.cafe_id == cafe_id).scalar() or 0
        new_version = max_version + 1

        # Deactivate previous menus for this cafe
        self.db.query(MenuDB).filter(MenuDB.cafe_id == cafe_id).update({"is_active": False})

        # 3. Create new active Menu
        menu_id = f"menu_{uuid.uuid4().hex[:12]}"
        new_menu = MenuDB(
            id=menu_id,
            cafe_id=cafe_id,
            title=f"{cafe_name} Menu (v{new_version})",
            version=new_version,
            source_filename=request.filename or "Uploaded Document",
            extraction_engine=request.extraction_engine or "google_vision",
            total_items=len(request.items),
            categories=request.categories,
            is_active=True
        )
        self.db.add(new_menu)
        self.db.flush()

        # 4. Insert all enriched Dish rows
        dish_records = []
        for it in request.items:
            dish = DishDB(
                id=f"dish_{uuid.uuid4().hex[:10]}",
                menu_id=menu_id,
                cafe_id=cafe_id,
                name=it.name.strip(),
                category=it.category.strip(),
                price=float(it.price),
                currency=it.currency,
                description=it.description.strip(),
                is_veg=it.is_veg,
                is_vegan=it.is_vegan,
                is_gluten_free=it.is_gluten_free,
                allergens=it.allergens,
                spice_level=it.spice_level
            )
            dish_records.append(dish)

        self.db.add_all(dish_records)
        self.db.commit()
        self.db.refresh(new_menu)

        db_type = self._get_database_type()
        logger.info(f"Saved menu {menu_id} with {len(dish_records)} dishes to {db_type}")

        return MenuSaveResponse(
            success=True,
            menu_id=menu_id,
            cafe_id=cafe_id,
            saved_dishes=len(dish_records),
            categories=request.categories,
            message=f"Successfully indexed and committed {len(dish_records)} dishes into {db_type}.",
            database_type=db_type
        )

    def get_active_menu(self, cafe_id: str = "demo-cafe") -> Optional[Dict[str, Any]]:
        """Retrieve the currently active menu and its dishes for a café."""
        menu = (
            self.db.query(MenuDB)
            .filter(MenuDB.cafe_id == cafe_id, MenuDB.is_active == True)
            .first()
        )
        if not menu:
            return None

        dishes = self.db.query(DishDB).filter(DishDB.menu_id == menu.id).all()
        dish_list = [
            {
                "id": d.id,
                "name": d.name,
                "category": d.category,
                "price": d.price,
                "currency": d.currency,
                "description": d.description,
                "is_veg": d.is_veg,
                "is_vegan": d.is_vegan,
                "is_gluten_free": d.is_gluten_free,
                "allergens": d.allergens,
                "spice_level": d.spice_level,
            }
            for d in dishes
        ]

        return {
            "cafe_id": cafe_id,
            "menu_id": menu.id,
            "version": menu.version,
            "total_items": len(dish_list),
            "categories": menu.categories,
            "items": dish_list,
            "extraction_engine": menu.extraction_engine,
            "created_at": menu.created_at.isoformat() if menu.created_at else None,
            "database_type": self._get_database_type()
        }
