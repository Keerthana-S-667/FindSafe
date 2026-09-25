import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.cases import router as cases_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.video_search import router as video_search_router
from app.api.routes.record_search import router as record_search_router
from app.api.routes.reports import router as reports_router
from app.api.routes.search import router as search_router
from app.api.routes.admin import router as admin_router
from app.api.routes.intelligence import router as intelligence_router
from app.api.routes.operations import router as operations_router
from app.api.routes.replay import router as replay_router
from app.api.routes.command_center import router as command_center_router
from app.api.routes.demo import router as demo_router
from app.api.routes.decision_board import router as decision_board_router

# Configure Application Logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("findsafe-api")

app = FastAPI(
    title=settings.APP_NAME,
    description="Privacy-Conscious Missing Person Detection, Matching & Reunification Platform",
    version="0.3.0",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
)

# CORS Middleware Configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import uuid
from fastapi.exceptions import HTTPException

# Standardized API Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
    code = "RESOURCE_NOT_FOUND" if exc.status_code == 404 else ("FORBIDDEN" if exc.status_code == 403 else "VALIDATION_ERROR")
    logger.warning(f"HTTP {exc.status_code} [{req_id}] {request.method} {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": str(exc.detail),
                "request_id": req_id
            }
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
    logger.error(f"Unhandled Exception [{req_id}] on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal system error occurred. Operations have been logged safely.",
                "request_id": req_id
            }
        },
    )


# Include Routers
app.include_router(health_router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(cases_router, prefix=settings.API_PREFIX, tags=["Cases"])
app.include_router(dashboard_router, prefix=settings.API_PREFIX, tags=["Dashboard"])
app.include_router(video_search_router, prefix=settings.API_PREFIX, tags=["Video Search"])
app.include_router(record_search_router, prefix=settings.API_PREFIX, tags=["Record Search"])
app.include_router(reports_router, prefix=settings.API_PREFIX, tags=["Reports & Workspace"])
app.include_router(search_router, prefix=settings.API_PREFIX, tags=["Global Search"])
app.include_router(admin_router, prefix=settings.API_PREFIX, tags=["Admin & RBAC"])
app.include_router(intelligence_router, prefix=settings.API_PREFIX, tags=["Investigation Intelligence"])
app.include_router(operations_router, prefix=settings.API_PREFIX, tags=["Investigation Operations"])
app.include_router(replay_router, prefix=settings.API_PREFIX, tags=["Investigation Replay & Scenarios"])
app.include_router(command_center_router, prefix=settings.API_PREFIX, tags=["Command Center Intelligence"])
app.include_router(demo_router, prefix=settings.API_PREFIX, tags=["Demo Control Center"])
app.include_router(decision_board_router, prefix=settings.API_PREFIX, tags=["Investigation Decision Board"])


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in environment: {settings.ENVIRONMENT}")
    logger.info(f"API Prefix configured as: {settings.API_PREFIX}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.APP_NAME}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
