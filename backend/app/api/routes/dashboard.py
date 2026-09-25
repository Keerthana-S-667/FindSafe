import logging
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.schemas.case import DashboardStatsResponse
from app.services.case_service import get_dashboard_statistics

logger = logging.getLogger("findsafe.api.dashboard")
router = APIRouter()

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns real statistics counts from Supabase PostgreSQL tables.
    """
    stats = await get_dashboard_statistics()
    return stats
