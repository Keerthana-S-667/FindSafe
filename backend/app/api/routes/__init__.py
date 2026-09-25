"""API routes package initialization."""
from app.api.routes.health import router as health_router
from app.api.routes.cases import router as cases_router
from app.api.routes.dashboard import router as dashboard_router

__all__ = ["health_router", "cases_router", "dashboard_router"]
