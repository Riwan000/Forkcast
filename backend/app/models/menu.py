from typing import List, Optional
from pydantic import BaseModel, Field

class DishItem(BaseModel):
    id: str
    name: str
    category: str = "General"
    price: float
    currency: str = "₹"
    description: str = ""
    is_veg: bool = True
    is_vegan: bool = False
    is_gluten_free: bool = False
    allergens: List[str] = Field(default_factory=list)
    spice_level: int = 0  # 0 to 3

class MenuIngestionResponse(BaseModel):
    cafe_id: str
    filename: Optional[str] = None
    total_items: int
    categories: List[str]
    items: List[DishItem]
    raw_text_preview: str = ""
    message: str = "Menu ingested successfully"
    extraction_engine: Optional[str] = "google_vision"  # "google_vision" | "local_ocr"

class ConfirmMenuSaveRequest(BaseModel):
    cafe_id: str = "demo-cafe"
    cafe_name: Optional[str] = "Forkcast Artisan Café"
    filename: Optional[str] = None
    extraction_engine: Optional[str] = "google_vision"
    categories: List[str]
    items: List[DishItem]

class MenuSaveResponse(BaseModel):
    success: bool = True
    menu_id: str
    cafe_id: str
    saved_dishes: int
    categories: List[str]
    message: str
    database_type: str


