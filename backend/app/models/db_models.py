from datetime import datetime
import uuid
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class CafeDB(Base):
    """Represents a café or restaurant location."""
    __tablename__ = "cafes"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="Forkcast Artisan Café")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    menus = relationship("MenuDB", back_populates="cafe", cascade="all, delete-orphan")
    dishes = relationship("DishDB", back_populates="cafe", cascade="all, delete-orphan")

class MenuDB(Base):
    """Represents an ingested and verified menu version."""
    __tablename__ = "menus"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    cafe_id = Column(String(64), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="Artisan Menu")
    version = Column(Integer, default=1)
    source_filename = Column(String(255), nullable=True)
    extraction_engine = Column(String(64), default="google_vision")
    total_items = Column(Integer, default=0)
    categories = Column(JSON, default=list)  # Ordered list of canonical courses
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cafe = relationship("CafeDB", back_populates="menus")
    dishes = relationship("DishDB", back_populates="menu", cascade="all, delete-orphan")

class DishDB(Base):
    """Represents a validated culinary dish item with dietary enrichment."""
    __tablename__ = "dishes"

    id = Column(String(64), primary_key=True, default=lambda: f"dish_{uuid.uuid4().hex[:10]}")
    menu_id = Column(String(64), ForeignKey("menus.id", ondelete="CASCADE"), nullable=False, index=True)
    cafe_id = Column(String(64), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="₹")
    description = Column(Text, default="")
    is_veg = Column(Boolean, default=True, index=True)
    is_vegan = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    allergens = Column(JSON, default=list)
    spice_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    menu = relationship("MenuDB", back_populates="dishes")
    cafe = relationship("CafeDB", back_populates="dishes")
