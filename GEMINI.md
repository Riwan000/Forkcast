# Project Guidelines & Rules

## Backend Architecture: 3-Layer Pattern & Dependency Injection (DI)

Always follow the 3-Layer Architecture with FastAPI Dependency Injection for any backend development in this project:

### 1. Layer Separation
- **`app/routers/` (HTTP Presentation Layer)**:
  - Responsible ONLY for routing, path/query parameter validation, status codes, and HTTP responses.
  - Keep router functions lean (3–10 lines).
  - NEVER place raw business logic, database queries, or external AI API calls directly inside router functions.

- **`app/services/` (Business Logic Layer)**:
  - Pure Python classes (e.g., `MenuService`, `RagService`, `OrderService`, `BillSplitterService`).
  - Completely decoupled from FastAPI request/response objects so they can be unit-tested without HTTP servers.
  - Implement core algorithms (RAG parsing, semantic search, budget knapsack solver, order management) here.

- **`app/dependencies.py` (Dependency Injection Glue)**:
  - Contains factory functions (e.g., `get_menu_service()`, `get_rag_service()`).
  - Handles client initializations, database sessions, and configuration injection.

### 2. Dependency Injection Rule
- All router functions MUST receive services via FastAPI's `Depends()`:
  ```python
  from typing import Annotated
  from fastapi import APIRouter, Depends
  from app.dependencies import get_rag_service
  from app.services.rag_service import RagService

  router = APIRouter(prefix="/api/chat", tags=["Chat"])

  @router.post("/query")
  def query_menu(
      query: str,
      rag: Annotated[RagService, Depends(get_rag_service)]
  ):
      return rag.query(query)
  ```
- This ensures full testability via `app.dependency_overrides`, clean separation of concerns, and reusable service instances across routes.
