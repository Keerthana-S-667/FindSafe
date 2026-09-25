"""
FindSafe AI - Command Center API Routes (Phase 14)
Endpoints for Command Center dashboard summary aggregations, camera coverage GIS metadata, and platform activity feeds.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.database.supabase import get_supabase_client
from app.services.command_center_service import CommandCenterService

logger = logging.getLogger("findsafe.ai.command_center_routes")

router = APIRouter(tags=["command_center"])


@router.get("/command-center/summary")
def get_command_center_summary(db=Depends(get_supabase_client)):
    """Retrieves high-level Command Center dashboard summary aggregations and distributions."""
    return CommandCenterService.get_dashboard_summary(db)


@router.get("/command-center/cameras")
def get_camera_coverage(db=Depends(get_supabase_client)):
    """Retrieves camera source metadata and locations for GIS coverage visualization."""
    return CommandCenterService.get_camera_coverage(db)
