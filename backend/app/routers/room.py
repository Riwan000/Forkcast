from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_room_service
from app.services.room_service import RoomService
from app.models.room import JoinTableRequest, JoinTableResponse, TableRosterResponse

router = APIRouter(prefix="/api/room", tags=["Table Room"])

@router.post("/{cafe_id}/tables/{table_id}/join", response_model=JoinTableResponse)
def join_table(
    cafe_id: str,
    table_id: str,
    req: JoinTableRequest,
    room_service: Annotated[RoomService, Depends(get_room_service)]
):
    """Join a table room session. The first diner automatically becomes Table Captain (C-1)."""
    if not req.diner_name or not req.diner_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Diner name is required to enter table room."
        )
    return room_service.join_table(
        cafe_id=cafe_id,
        table_id=table_id,
        diner_name=req.diner_name,
        dietary_pref=req.dietary_pref
    )

@router.get("/{cafe_id}/tables/{table_id}/roster", response_model=TableRosterResponse)
def get_table_roster(
    cafe_id: str,
    table_id: str,
    room_service: Annotated[RoomService, Depends(get_room_service)]
):
    """Fetch current active table roster, captain, and status."""
    return room_service.get_roster(cafe_id=cafe_id, table_id=table_id)

@router.post("/{cafe_id}/tables/{table_id}/leave", response_model=TableRosterResponse)
def leave_table(
    cafe_id: str,
    table_id: str,
    diner_id: str,
    room_service: Annotated[RoomService, Depends(get_room_service)]
):
    """Leave a table room and reassign captaincy if necessary."""
    return room_service.leave_table(cafe_id=cafe_id, table_id=table_id, diner_id=diner_id)

@router.post("/{cafe_id}/tables/{table_id}/reset", response_model=TableRosterResponse)
def reset_table(
    cafe_id: str,
    table_id: str,
    room_service: Annotated[RoomService, Depends(get_room_service)]
):
    """Reset a table session for testing and live demos."""
    return room_service.reset_table(cafe_id=cafe_id, table_id=table_id)
