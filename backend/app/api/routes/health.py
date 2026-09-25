from fastapi import APIRouter
from app.database.supabase import check_supabase_status

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint returning system status.
    """
    supabase_info = check_supabase_status()
    return {
        "status": "ok",
        "service": "findsafe-api",
        "supabase": supabase_info
    }

@router.get("/ready")
async def readiness_check():
    """
    Lightweight readiness check endpoint for load balancers & monitoring.
    """
    return {
        "status": "ready",
        "service": "findsafe-api",
        "ready": True
    }

