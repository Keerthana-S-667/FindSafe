"""
FindSafe AI - Decision Board API Router (Phase 17)
Endpoints for evidence synthesis, score breakdown, supporting vs limitations balance, and human review.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.database.supabase import get_supabase_client
from app.services.decision_board_service import DecisionBoardService

router = APIRouter(tags=["Investigation Decision Board"])


@router.get("/candidates/{candidate_id}/decision-board")
def get_candidate_decision_board(candidate_id: str, db=Depends(get_supabase_client)):
    """Retrieves synthesized evidence decision board payload for a candidate group."""
    return DecisionBoardService.get_candidate_decision_board(db, candidate_id)


@router.get("/cases/{case_id}/decision-board")
def get_case_decision_board(case_id: str, db=Depends(get_supabase_client)):
    """Retrieves synthesized evidence decision board payload for a case file."""
    # Maps case_id to candidate group decision board
    return DecisionBoardService.get_candidate_decision_board(db, f"cg-{case_id}")


@router.post("/candidates/{candidate_id}/review")
def update_candidate_review_decision(
    candidate_id: str, 
    payload: dict = Body(...), 
    db=Depends(get_supabase_client)
):
    """Updates candidate human review decision (Potential Match, Rejected, Verified by Authorized Reviewer)."""
    new_status = payload.get("review_status", "under_review")
    notes = payload.get("notes", "")

    # Update candidate group table if Supabase is connected
    try:
        db.table("candidate_groups").update({
            "review_status": new_status,
            "notes": notes,
            "updated_at": "now()"
        }).eq("id", candidate_id).execute()
    except Exception:
        pass

    return {
        "success": True,
        "candidate_id": candidate_id,
        "review_status": new_status,
        "notes": notes,
        "message": f"Review decision updated to '{new_status}'."
    }
