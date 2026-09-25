"""
FindSafe AI - Operations API Routes (Phase 12)
Endpoints for Operations Center summary, search session progress tracking, review queue claims,
case handoff summaries, and system operational health indicators.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.database.supabase import get_supabase_client
from app.services.operations_service import OperationsService

logger = logging.getLogger("findsafe.ai.operations_routes")

router = APIRouter(tags=["operations"])


class ClaimReviewRequest(BaseModel):
    entity_type: str
    entity_id: str
    reviewer_email: str


@router.get("/operations/summary")
def get_operations_summary(db=Depends(get_supabase_client)):
    """Retrieves real-time operational dashboard stats, active searches, failed inputs, and recent evidence."""
    return OperationsService.get_operations_summary(db)


@router.get("/operations/system-status")
def get_system_status(db=Depends(get_supabase_client)):
    """Returns system health status for Backend API, PostgreSQL Database, Storage, and AI Engine."""
    return OperationsService.get_system_health(db)


@router.get("/search-sessions/{session_id}/status")
def get_search_session_status(session_id: str, db=Depends(get_supabase_client)):
    """Retrieves processing stage progress, inputs, and events for a search session."""
    detail = OperationsService.get_search_session_detail(db, session_id)
    if not detail["session"]:
        raise HTTPException(status_code=404, detail=f"Search session '{session_id}' not found.")
    return detail


@router.post("/search-sessions/{session_id}/cancel")
def cancel_search_session(session_id: str, db=Depends(get_supabase_client)):
    """Cancels an active or queued search session."""
    success = OperationsService.cancel_search_session(db, session_id)
    if not success:
        raise HTTPException(status_code=400, detail=f"Could not cancel search session '{session_id}'.")
    return {"status": "cancelled", "message": f"Search session {session_id} has been cancelled."}


@router.get("/review-queue")
def get_review_queue(
    status: Optional[str] = Query(None),
    db=Depends(get_supabase_client)
):
    """Retrieves unified review queue items (candidates & record matches) with reviewer claim lock state."""
    return OperationsService.get_review_queue(db, status)


@router.post("/reviews/{review_id}/claim")
def claim_review_item(
    review_id: str,
    body: ClaimReviewRequest,
    db=Depends(get_supabase_client)
):
    """Claims a review lock for a candidate group or record match."""
    success = OperationsService.claim_review_item(db, body.entity_type, body.entity_id, body.reviewer_email)
    if not success:
        raise HTTPException(status_code=400, detail="Could not claim review lock.")
    return {"status": "claimed", "reviewer": body.reviewer_email}


@router.post("/reviews/{review_id}/release")
def release_review_item(review_id: str, db=Depends(get_supabase_client)):
    """Releases a review lock."""
    success = OperationsService.release_review_item(db, review_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not release review lock.")
    return {"status": "released"}


@router.get("/cases/{case_id}/handoff")
def get_case_handoff_summary(case_id: str, db=Depends(get_supabase_client)):
    """Returns structured Case Operations & Investigator Handoff Summary."""
    return OperationsService.get_case_handoff_summary(db, case_id)
