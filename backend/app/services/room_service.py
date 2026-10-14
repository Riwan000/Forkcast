import uuid
from typing import Dict, List, Optional
from datetime import datetime
from app.models.room import Diner, TableRoom, JoinTableResponse, TableRosterResponse

class RoomService:
    """
    Manages in-memory live table rooms and diner rosters for instant, zero-latency demos.
    Keys table rooms by f"{cafe_id}:{table_id}".
    """
    def __init__(self):
        # Room store: (cafe_id, table_id) -> TableRoom
        self._rooms: Dict[str, TableRoom] = {}

    def _get_room_key(self, cafe_id: str, table_id: str) -> str:
        return f"{cafe_id.strip().lower()}:{table_id.strip()}"

    def get_or_create_room(self, cafe_id: str, table_id: str) -> TableRoom:
        key = self._get_room_key(cafe_id, table_id)
        if key not in self._rooms:
            self._rooms[key] = TableRoom(
                cafe_id=cafe_id,
                table_id=table_id,
                target_budget=2000.0,
                diners=[],
                status="active"
            )
        return self._rooms[key]

    def join_table(self, cafe_id: str, table_id: str, diner_name: str, dietary_pref: Optional[str] = None) -> JoinTableResponse:
        room = self.get_or_create_room(cafe_id, table_id)
        clean_name = diner_name.strip()
        
        # Check if diner with exact same name already exists in room (re-connecting in demo)
        existing_diner = next((d for d in room.diners if d.name.lower() == clean_name.lower()), None)
        if existing_diner:
            captain = next((d for d in room.diners if d.is_captain), None)
            return JoinTableResponse(
                table_id=table_id,
                cafe_id=cafe_id,
                diner=existing_diner,
                is_captain=existing_diner.is_captain,
                active_diners=room.diners,
                message=f"Welcome back {existing_diner.name}!"
            )

        # First diner becomes Table Captain (C-1)
        is_first_diner = len(room.diners) == 0
        new_diner = Diner(
            id=f"diner_{uuid.uuid4().hex[:8]}",
            name=clean_name,
            is_captain=is_first_diner,
            dietary_pref=dietary_pref,
            joined_at=datetime.utcnow()
        )
        room.diners.append(new_diner)

        return JoinTableResponse(
            table_id=table_id,
            cafe_id=cafe_id,
            diner=new_diner,
            is_captain=new_diner.is_captain,
            active_diners=room.diners,
            message=f"{clean_name} joined Table {table_id}" + (" as Table Captain 👑" if is_first_diner else "")
        )

    def get_roster(self, cafe_id: str, table_id: str) -> TableRosterResponse:
        room = self.get_or_create_room(cafe_id, table_id)
        captain = next((d for d in room.diners if d.is_captain), None)
        return TableRosterResponse(
            table_id=table_id,
            cafe_id=cafe_id,
            target_budget=room.target_budget,
            captain_name=captain.name if captain else None,
            active_diners=room.diners,
            status=room.status
        )

    def leave_table(self, cafe_id: str, table_id: str, diner_id: str) -> TableRosterResponse:
        key = self._get_room_key(cafe_id, table_id)
        if key in self._rooms:
            room = self._rooms[key]
            leaving_diner = next((d for d in room.diners if d.id == diner_id), None)
            room.diners = [d for d in room.diners if d.id != diner_id]

            # If the leaving diner was captain, reassign captaincy to next member
            if leaving_diner and leaving_diner.is_captain and len(room.diners) > 0:
                room.diners[0].is_captain = True

        return self.get_roster(cafe_id, table_id)

    def reset_table(self, cafe_id: str, table_id: str) -> TableRosterResponse:
        key = self._get_room_key(cafe_id, table_id)
        if key in self._rooms:
            self._rooms[key].diners = []
            self._rooms[key].status = "active"
        return self.get_roster(cafe_id, table_id)
