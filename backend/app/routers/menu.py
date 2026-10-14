from typing import Annotated
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from app.dependencies import get_menu_service, get_menu_db_service
from app.models.menu import MenuIngestionResponse, ConfirmMenuSaveRequest, MenuSaveResponse
from app.services.menu_service import MenuService
from app.services.menu_db_service import MenuDatabaseService

router = APIRouter(prefix="/api/menu", tags=["Menu Ingestion & Database"])

class TextParseRequest(BaseModel):
    raw_text: str
    cafe_id: str = "demo-cafe"

@router.post("/upload", response_model=MenuIngestionResponse)
async def upload_menu_file(
    file: Annotated[UploadFile, File(description="PDF, DOCX, TXT, or CSV menu file")],
    cafe_id: Annotated[str, Form(description="Café identifier")] = "demo-cafe",
    menu_service: Annotated[MenuService, Depends(get_menu_service)] = None,
):
    """Upload and ingest a single café menu document."""
    try:
        content = await file.read()
        return menu_service.process_multiple_files([(content, file.filename or "menu.txt")], cafe_id=cafe_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Menu processing failed: {str(e)}")

@router.post("/upload-multiple", response_model=MenuIngestionResponse)
async def upload_multiple_menu_files(
    files: Annotated[list[UploadFile], File(description="Multiple menu image/PDF files")],
    cafe_id: Annotated[str, Form(description="Café identifier")] = "demo-cafe",
    menu_service: Annotated[MenuService, Depends(get_menu_service)] = None,
):
    """Upload and merge multiple café menu files (photos, multi-page PDFs)."""
    try:
        files_data = [(await f.read(), f.filename or "menu_page.jpg") for f in files]
        return menu_service.process_multiple_files(files_data, cafe_id=cafe_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Multi-file menu processing failed: {str(e)}")

@router.post("/parse-text", response_model=MenuIngestionResponse)
def parse_menu_text(
    payload: TextParseRequest,
    menu_service: Annotated[MenuService, Depends(get_menu_service)] = None,
):
    """Ingest raw menu text or markdown directly."""
    try:
        return menu_service.parse_menu(payload.raw_text, cafe_id=payload.cafe_id, filename="pasted_text.txt")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Text parsing failed: {str(e)}")

@router.get("/sample", response_model=MenuIngestionResponse)
def get_sample_menu(
    menu_service: Annotated[MenuService, Depends(get_menu_service)] = None,
):
    """Provide a curated artisan café sample menu for immediate testing."""
    sample_text = """
    # Brews & Beverages
    Cold Brew Reserve - Steeped for 18 hours with citrus undertones. ₹240
    Vanilla Bean Oat Latte - Double shot espresso with organic steamed oat milk. (Vegan) ₹280
    Cascara Sparkling Spritz - Coffee cherry infusion with sparkling tonic and lemon. ₹220

    # Starters & Small Plates
    Crispy Truffle Fries - Hand-cut potatoes tossed in white truffle oil and rosemary salt. ₹290
    Smoked Paprika Paneer Tikka - Charred cottage cheese with mint emulsion and pickled onion. (Veg, Dairy) ₹340
    Chili Garlic Lotus Stem - Crispy lotus crisps tossed in fiery schezwan honey. (Vegan, GF) ₹310
    Herb Butter Garlic Bread - Toasted sourdough loaf with roasted garlic herb butter. (Veg, Gluten, Dairy) ₹260

    # Mains & Entrees
    Wild Porcini Truffle Fettuccine - Ribbon pasta in slow-reduced mushroom broth and parmesan. (Veg, Dairy, Gluten) ₹480
    Charred Grilled Chicken Breast - Served with creamy mashed potatoes and red wine jus. (Non-Veg, Dairy) ₹520
    Spicy Burrito Rice Bowl - Brown rice, black beans, avocado, roasted corn, and fire-roasted salsa. (Vegan, GF) ₹390
    Woodfired Margherita Pizza - Fresh San Marzano tomato sauce, fior di latte, and basil. (Veg, Dairy, Gluten) ₹440

    # Desserts & Bakes
    Valrhona Dark Chocolate Brownie - Warm fudge brownie with toasted almond shavings. (Veg, Nuts, Dairy) ₹280
    Basque Burnt Cheesecake - Caramelized crust with a molten vanilla core. (Veg, Dairy) ₹320
    """
    return menu_service.parse_menu(sample_text.strip(), cafe_id="sample-artisan", filename="sample_artisan_menu.txt")

@router.post("/confirm-save", response_model=MenuSaveResponse)
def confirm_and_save_menu(
    payload: ConfirmMenuSaveRequest,
    menu_db: Annotated[MenuDatabaseService, Depends(get_menu_db_service)],
):
    """Persist verified menu and enriched dishes into the PostgreSQL / Neon database."""
    try:
        return menu_db.save_verified_menu(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

@router.get("/active/{cafe_id}")
def get_active_cafe_menu(
    cafe_id: str,
    menu_db: Annotated[MenuDatabaseService, Depends(get_menu_db_service)],
):
    """Fetch the active menu and dishes for a café directly from the database."""
    active = menu_db.get_active_menu(cafe_id=cafe_id)
    if not active:
        raise HTTPException(status_code=404, detail=f"No active menu found for café '{cafe_id}'")
    return active

