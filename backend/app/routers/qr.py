from typing import Annotated
from fastapi import APIRouter, Depends, Query, Request
from app.dependencies import get_qr_service
from app.models.qr import CafeQRBatchResponse
from app.services.qr_service import QRService

router = APIRouter(prefix="/api/qr", tags=["Table QR Asset Generation"])

@router.get("/tables/{cafe_id}", response_model=CafeQRBatchResponse)
def get_table_qr_cards(
    cafe_id: str,
    request: Request,
    table_count: Annotated[int, Query(description="Number of tables in the café", ge=1, le=60)] = 10,
    cafe_name: Annotated[str, Query(description="Display café name")] = "Forkcast Artisan Café",
    qr_service: Annotated[QRService, Depends(get_qr_service)] = None,
):
    """Generate high-resolution printable QR codes for all tables in a café."""
    # Determine base host URL (defaults to client origin or localhost)
    origin = request.headers.get("origin") or request.headers.get("referer") or "http://localhost:5173"
    base_url = origin.rstrip("/")
    if "/api" in base_url:
        base_url = base_url.split("/api")[0]

    return qr_service.generate_cafe_tables_qr(
        cafe_id=cafe_id,
        cafe_name=cafe_name,
        table_count=table_count,
        base_url=base_url
    )
