# Backend Architecture & Dependency Injection Rules

## Mandatory 3-Layer Pattern with Dependency Injection

When implementing or extending any backend functionality in this repository:

1. **`app/routers/` (HTTP Routing Layer)**
   - Only handle endpoint routing, input validation (Pydantic models / query params), and HTTP response formatting.
   - Must remain lean (under 10 lines per endpoint).
   - No direct business logic, database manipulation, or AI API calls in routes.

2. **`app/services/` (Service / Business Logic Layer)**
   - All business logic, algorithms, OCR, RAG search, and order processing reside in pure Python classes.
   - Independent of FastAPI request/response objects to ensure testability.

3. **`app/dependencies.py` (Dependency Injection Providers)**
   - All services, DB clients, and configuration must be provided through dependency provider functions.
   - Router endpoints must declare service dependencies via `Annotated[ServiceClass, Depends(get_service)]`.
   - Never instantiate services directly inside router handlers.
