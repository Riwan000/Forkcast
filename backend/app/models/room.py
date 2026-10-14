from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Diner(BaseModel):
    id: str
    name: str
    is_captain: bool = False
    dietary_pref: Optional[str] = None
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class TableRoom(BaseModel):
    cafe_id: str
    table_id: str
    target_budget: float = 2000.0
    diners: List[Diner] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # "active", "ordered", "served"

class JoinTableRequest(BaseModel):
    diner_name: str
    dietary_pref: Optional[str] = None

class JoinTableResponse(BaseModel):
    table_id: str
    cafe_id: str
    diner: Diner
    is_captain: bool
    active_diners: List[Diner]
    message: str

class TableRosterResponse(BaseModel):
    table_id: str
    cafe_id: str
    target_budget: float
    captain_name: Optional[str] = None
    active_diners: List[Diner]
    status: str
