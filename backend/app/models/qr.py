from pydantic import BaseModel
from typing import List

class TableQRItem(BaseModel):
    table_number: int
    table_label: str
    table_url: str
    qr_data_url: str

class CafeQRBatchResponse(BaseModel):
    cafe_id: str
    cafe_name: str
    total_tables: int
    base_url: str
    customer_menu_url: str
    customer_menu_qr: str
    staff_kitchen_url: str
    staff_kitchen_qr: str
    tables: List[TableQRItem]
