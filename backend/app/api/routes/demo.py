"""
FindSafe AI - Demo Control Center Router (Phase 15)
Endpoints for demo preparation, readiness verification, presenter controls, and safe state reset.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.database.supabase import get_supabase_client
from app.services.demo_service import DemoControlService

router = APIRouter(prefix="/demo", tags=["Demo Control Center"])


@router.get("/status")
def get_demo_status(db=Depends(get_supabase_client)):
    """Retrieves preparation readiness status and component checklist for Demo Mode."""
    return DemoControlService.get_demo_status(db)


@router.post("/prepare")
def prepare_demo_data(db=Depends(get_supabase_client)):
    """Prepares synthetic case DEMO-FS-001 and precomputed presentation dataset."""
    return DemoControlService.prepare_demo_data(db)


@router.get("/scenario")
def get_demo_scenario(db=Depends(get_supabase_client)):
    """Retrieves 12-step presentation scenario details with presenter notes, tech stack, and architecture."""
    return DemoControlService.get_demo_scenario(db)


@router.post("/reset")
def reset_demo_state(db=Depends(get_supabase_client)):
    """Safely resets synthetic demo presentation state without modifying production data."""
    return DemoControlService.reset_demo_state(db)


@router.post("/start")
def start_demo_session(db=Depends(get_supabase_client)):
    """Initializes presentation demo session state."""
    return {
        "status": "started",
        "message": "Demo presentation session initialized for CROWDED TRANSIT AREA.",
        "case_id": "DEMO-FS-001"
    }
