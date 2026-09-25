"""
FindSafe AI - Phase 7 Institutional Record Search & Search Everywhere API Routes

Endpoints for:
- Institutional Record Search (Police, Hospital, Shelter, Public Report)
- CSV Demonstration Data Import & Validation
- Search Everywhere Unified Orchestration Pipeline
- Investigation Timeline & Map Data Retrieval
- Record Match & Cross-Source Candidate Review Management
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from pydantic import BaseModel, Field

from app.services.record_search_service import RecordSearchService
from app.services.cross_source_service import CrossSourceService
from app.services.investigation_service import InvestigationService
from app.services.case_service import CaseService

logger = logging.getLogger("findsafe.api.record_search")

router = APIRouter()


# Request / Response Schemas
class RecordSearchRequest(BaseModel):
    case_id: str = Field(..., description="UUID or Case ID string of the missing person case")
    source_types: Optional[List[str]] = Field(default=["all"], description="List of record sources to search: police, hospital, shelter, public_report, or all")
    search_radius_km: float = Field(default=25.0, description="Search radius distance threshold in kilometers")
    time_window_hours: float = Field(default=72.0, description="Temporal window threshold in hours")


class SearchEverywhereRequest(BaseModel):
    case_id: str = Field(..., description="UUID or Case ID of missing person case")
    video_ids: Optional[List[str]] = Field(default=None, description="Optional CCTV video IDs for crowd search")
    source_types: Optional[List[str]] = Field(default=["all"], description="Record source types filter")
    search_radius_km: float = Field(default=25.0, description="Search radius in kilometers")
    time_window_hours: float = Field(default=72.0, description="Temporal window in hours")


class ReviewMatchRequest(BaseModel):
    status: str = Field(..., description="New match status: under_review, potential_match, rejected, verified")
    note: Optional[str] = Field(default="", description="Optional reviewer notes")


# 1. POST /api/record-search
@router.post("/record-search", summary="Execute Institutional Record Search")
def execute_record_search(req: RecordSearchRequest):
    """Executes AI-assisted matching between missing person case and institutional records."""
    try:
        result = RecordSearchService.execute_record_search(
            case_id=req.case_id,
            source_types=req.source_types,
            search_radius_km=req.search_radius_km,
            time_window_hours=req.time_window_hours
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Record search error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Record search failed: {str(e)}")


# 2. GET /api/record-search/{session_id}
@router.get("/record-search/{session_id}", summary="Get Record Search Session Results")
def get_record_search_session(session_id: str):
    """Retrieves record search session status and match items."""
    try:
        supabase = CaseService.get_supabase()
        sess = supabase.table("search_sessions").select("*").eq("id", session_id).execute()
        if not sess.data or len(sess.data) == 0:
            raise HTTPException(status_code=404, detail=f"Record search session '{session_id}' not found.")

        matches = supabase.table("record_matches").select("*, found_person_records(*)").eq("search_session_id", session_id).order("overall_score", desc=True).execute()

        return {
            "session": sess.data[0],
            "total_matches": len(matches.data) if matches.data else 0,
            "matches": matches.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 3. GET /api/record-matches
@router.get("/record-matches", summary="List All Record Matches")
def list_record_matches(
    case_id: Optional[str] = None,
    match_status: Optional[str] = None,
    source_type: Optional[str] = None
):
    """Lists record match entries with optional case, status, and source filters."""
    try:
        supabase = CaseService.get_supabase()
        query = supabase.table("record_matches").select("*, found_person_records(*), missing_persons(*)")

        if case_id:
            query = query.eq("missing_person_id", case_id)
        if match_status:
            query = query.eq("match_status", match_status)

        res = query.order("overall_score", desc=True).execute()
        matches = res.data or []

        # Filter by source_type in Python if requested
        if source_type and source_type != "all":
            matches = [m for m in matches if m.get("found_person_records", {}).get("source_type") == source_type]

        return {"total": len(matches), "matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. GET /api/record-matches/{match_id}
@router.get("/record-matches/{match_id}", summary="Get Detailed Record Match Comparison")
def get_record_match_detail(match_id: str):
    """Retrieves full side-by-side evidence comparison detail for a single record match."""
    try:
        supabase = CaseService.get_supabase()
        res = supabase.table("record_matches").select("*, found_person_records(*), missing_persons(*)").eq("id", match_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail=f"Record match '{match_id}' not found.")

        match_item = res.data[0]
        return match_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. GET /api/record-matches/{match_id}/evidence
@router.get("/record-matches/{match_id}/evidence", summary="Get Record Match Itemized Evidence")
def get_record_match_evidence(match_id: str):
    """Retrieves breakdown list of visual, clothing, location, time, and source evidence for a record match."""
    try:
        supabase = CaseService.get_supabase()
        res = supabase.table("record_matches").select("evidence_details, overall_score, match_status").eq("id", match_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail=f"Record match '{match_id}' not found.")

        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. POST /api/records/import-csv
@router.post("/records/import-csv", summary="Import Demonstration Records CSV")
async def import_csv_records(file: UploadFile = File(...)):
    """Validates and imports demonstration found-person records from CSV file."""
    if not file.filename.endswith(".csv") and not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV file.")

    try:
        content = await file.read()
        csv_text = content.decode("utf-8", errors="replace")
        
        result = RecordSearchService.import_csv_demo_records(csv_text)
        return result
    except Exception as e:
        logger.error(f"CSV import error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")


# 7. POST /api/search-everywhere
@router.post("/search-everywhere", summary="Execute Search Everywhere Orchestration")
async def execute_search_everywhere(req: SearchEverywhereRequest):
    """Orchestrates multi-camera CCTV crowd search and institutional record search into unified candidate evidence."""
    try:
        result = CrossSourceService.execute_search_everywhere(
            case_id=req.case_id,
            video_ids=req.video_ids,
            source_types=req.source_types,
            search_radius_km=req.search_radius_km,
            time_window_hours=req.time_window_hours
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Search Everywhere execution error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search Everywhere failed: {str(e)}")


# 8. GET /api/search-everywhere/{session_id}
@router.get("/search-everywhere/{session_id}", summary="Get Search Everywhere Results")
async def get_search_everywhere_results(session_id: str):
    """Retrieves Search Everywhere camera candidates, record matches, and cross-source associations."""
    try:
        supabase = CaseService.get_supabase()
        sess = supabase.table("search_sessions").select("*, missing_persons(*)").eq("id", session_id).execute()
        if not sess.data or len(sess.data) == 0:
            raise HTTPException(status_code=404, detail=f"Search Everywhere session '{session_id}' not found.")

        # Get candidates, record matches, cross-source associations
        rec_matches = supabase.table("record_matches").select("*, found_person_records(*)").eq("search_session_id", session_id).execute()
        cross_assocs = supabase.table("cross_source_associations").select("*, record_matches(*, found_person_records(*)), candidate_groups(*)").eq("search_session_id", session_id).execute()

        return {
            "session": sess.data[0],
            "record_matches": rec_matches.data or [],
            "cross_source_associations": cross_assocs.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 9. GET /api/investigations/{session_id}/timeline
@router.get("/investigations/{session_id}/timeline", summary="Get Unified Investigation Timeline")
async def get_investigation_timeline(session_id: str):
    """Retrieves chronological timeline of camera sightings and institutional record events."""
    try:
        timeline = InvestigationService.get_unified_timeline(session_id)
        return timeline
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 10. GET /api/investigations/{session_id}/map
@router.get("/investigations/{session_id}/map", summary="Get Investigation Map Markers & Sequence")
async def get_investigation_map(session_id: str):
    """Retrieves spatial markers and movement path for camera and record evidence."""
    try:
        map_data = InvestigationService.get_investigation_map_data(session_id)
        return map_data
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 11. POST /api/record-matches/{match_id}/review
@router.post("/record-matches/{match_id}/review", summary="Review Record Match Status")
async def review_record_match(match_id: str, req: ReviewMatchRequest):
    """Updates match review status (potential_match, rejected, under_review) and records verification notes."""
    # Ensure AI never assigns 'verified' automatically (Human verification required)
    allowed = {"under_review", "potential_match", "rejected", "verified"}
    if req.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status '{req.status}'. Allowed: {', '.join(allowed)}")

    try:
        supabase = CaseService.get_supabase()
        res = supabase.table("record_matches").update({
            "match_status": req.status
        }).eq("id", match_id).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail=f"Record match '{match_id}' not found.")

        # Log audit action
        try:
            supabase.table("audit_logs").insert({
                "action": "record_match_reviewed",
                "entity_type": "record_match",
                "entity_id": match_id,
                "metadata": {"new_status": req.status, "note": req.note}
            }).execute()
        except Exception:
            pass

        return {"status": "success", "updated_match": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 12. POST /api/cross-source-associations/{id}/review
@router.post("/cross-source-associations/{assoc_id}/review", summary="Review Cross-Source Association Status")
async def review_cross_source_association(assoc_id: str, req: ReviewMatchRequest):
    """Updates cross-source association status."""
    try:
        supabase = CaseService.get_supabase()
        res = supabase.table("cross_source_associations").update({
            "status": req.status
        }).eq("id", assoc_id).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail=f"Cross-source association '{assoc_id}' not found.")

        return {"status": "success", "updated_association": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
