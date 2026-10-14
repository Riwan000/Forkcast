import base64
import io
import logging
import qrcode
from typing import List
from app.models.qr import TableQRItem, CafeQRBatchResponse

logger = logging.getLogger("qr_service")

class QRService:
    """Business logic service for generating high-resolution vector and raster QR codes for café tables."""

    def _generate_qr_data_url(self, url: str) -> str:
        """Generate a base64 PNG data URL for a given target URL."""
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#2b0000", back_color="#ffffff")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    def generate_cafe_tables_qr(
        self,
        cafe_id: str = "demo-cafe",
        cafe_name: str = "Forkcast Artisan Café",
        table_count: int = 10,
        base_url: str = "http://localhost:5173"
    ) -> CafeQRBatchResponse:
        """Generate printable QR codes for all tables in a café, plus staff and digital menu links."""
        clean_cafe = cafe_id.strip() or "demo-cafe"
        clean_base = base_url.rstrip("/")
        count = max(1, min(table_count, 60))  # Between 1 and 60 tables

        tables: List[TableQRItem] = []
        for i in range(1, count + 1):
            table_url = f"{clean_base}/{clean_cafe}/table/{i}"
            qr_data = self._generate_qr_data_url(table_url)
            tables.append(
                TableQRItem(
                    table_number=i,
                    table_label=f"Table {i:02d}",
                    table_url=table_url,
                    qr_data_url=qr_data
                )
            )

        customer_menu_url = f"{clean_base}/{clean_cafe}/menu"
        customer_menu_qr = self._generate_qr_data_url(customer_menu_url)

        staff_kitchen_url = f"{clean_base}/{clean_cafe}/kitchen"
        staff_kitchen_qr = self._generate_qr_data_url(staff_kitchen_url)

        return CafeQRBatchResponse(
            cafe_id=clean_cafe,
            cafe_name=cafe_name,
            total_tables=len(tables),
            base_url=clean_base,
            customer_menu_url=customer_menu_url,
            customer_menu_qr=customer_menu_qr,
            staff_kitchen_url=staff_kitchen_url,
            staff_kitchen_qr=staff_kitchen_qr,
            tables=tables
        )
