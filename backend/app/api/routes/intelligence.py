"""
FindSafe AI - Intelligence API Routes (Phase 11)
Endpoints for investigation insights, evidence chains, candidate comparison, 
evidence relationship graph, task management, and CSV evidence export.
"""

import io
import csv
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel

from app.database.supabase import get_supabase_client
from app.services.investigation_insight_service import InvestigationInsightService
from app.services.evidence_chain_service import EvidenceChainService
from app.services.investigation_task_service import InvestigationTaskService

logger = logging.getLogger("findsafe.ai.intelligence_routes")

router = APIRouter(tags=["intelligence"])


class CompareRequest(BaseModel):
    candidate_ids: List[str]


class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    candidate_group_id: Optional[str] = None
    record_match_id: Optional[str] = None
    assigned_to: Optional[str] = None
    created_by: Optional[str] = "Investigator"


class UpdateTaskRequest(BaseModel):
    status: str
    performed_by: Optional[str] = "Investigator"


@router.get("/candidates/{candidate_id}/insights")
def get_candidate_insights(candidate_id: str, db=Depends(get_supabase_client)):
    """Fetches structured, deterministic investigation insights for a candidate group."""
    return InvestigationInsightService.get_candidate_insights(db, candidate_id)


@router.get("/candidates/{candidate_id}/evidence-chain")
def get_candidate_evidence_chain(candidate_id: str, db=Depends(get_supabase_client)):
    """Fetches sequential evidence chain nodes for a candidate group."""
    return EvidenceChainService.get_candidate_evidence_chain(db, candidate_id)


@router.post("/candidates/compare")
def compare_candidates(body: CompareRequest, db=Depends(get_supabase_client)):
    """Compares 2 to 4 candidate groups side-by-side with equal visual treatment."""
    if not body.candidate_ids:
        raise HTTPException(status_code=400, detail="candidate_ids list cannot be empty")
    return InvestigationInsightService.compare_candidates(db, body.candidate_ids)


@router.get("/cases/{case_id}/evidence-graph")
def get_case_evidence_graph(
    case_id: str,
    filter_type: Optional[str] = Query(None),
    db=Depends(get_supabase_client)
):
    """Fetches 2D relationship graph nodes and edges for a case."""
    return EvidenceChainService.get_case_evidence_graph(db, case_id, filter_type)


@router.get("/cases/{case_id}/search-history")
def get_case_search_history(case_id: str, db=Depends(get_supabase_client)):
    """Fetches search session history and checks for duplicate search configurations."""
    return InvestigationInsightService.check_duplicate_search(db, case_id)


@router.get("/cases/{case_id}/tasks")
def get_case_tasks(
    case_id: str,
    status: Optional[str] = Query(None),
    db=Depends(get_supabase_client)
):
    """Retrieves follow-up investigation tasks for a case."""
    return InvestigationTaskService.get_tasks_for_case(db, case_id, status)


@router.post("/cases/{case_id}/tasks")
def create_case_task(
    case_id: str,
    body: CreateTaskRequest,
    db=Depends(get_supabase_client)
):
    """Creates a new follow-up investigation task."""
    task = InvestigationTaskService.create_task(
        supabase=db,
        case_id=case_id,
        title=body.title,
        description=body.description,
        candidate_group_id=body.candidate_group_id,
        record_match_id=body.record_match_id,
        assigned_to=body.assigned_to,
        created_by=body.created_by
    )
    if not task:
        raise HTTPException(status_code=400, detail="Failed to create investigation task")
    return task


@router.patch("/tasks/{task_id}")
def update_task_status(
    task_id: str,
    body: UpdateTaskRequest,
    db=Depends(get_supabase_client)
):
    """Updates an investigation task status (pending, completed, cancelled)."""
    task = InvestigationTaskService.update_task_status(
        supabase=db,
        task_id=task_id,
        status=body.status,
        performed_by=body.performed_by
    )
    if not task:
        raise HTTPException(status_code=400, detail="Failed to update task status")
    return task


@router.get("/cases/{case_id}/evidence/export")
def export_case_evidence_csv(case_id: str, db=Depends(get_supabase_client)):
    """
    Generates and returns structured CSV evidence export for authorized investigators.
    Includes case evidence summary, candidate groups, timeline, and record matches.
    Excludes sensitive system internals or private credentials.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Header & Case Summary Section
    writer.writerow(["FINDSAFE AI - INVESTIGATION EVIDENCE EXPORT"])
    writer.writerow(["Case ID", case_id])

    c_res = db.table("cases").select("*").eq("id", case_id).execute() if db else None
    if c_res and c_res.data:
        case = c_res.data[0]
        writer.writerow(["Missing Person Name", case.get("full_name", "Unknown")])
        writer.writerow(["Case Status", case.get("status", "Active")])
        writer.writerow(["Case Priority", case.get("priority", "Medium")])

    writer.writerow([])

    # 2. Candidate Groups Section
    writer.writerow(["--- CANDIDATE GROUPS EVIDENCE ---"])
    writer.writerow(["Candidate Group ID", "Evidence Score", "Camera Count", "Evidence Level", "Status", "Created At"])

    cg_res = db.table("candidate_groups").select("*").eq("case_id", case_id).execute() if db else None
    cgroups = cg_res.data if cg_res else []

    if cgroups:
        for cg in cgroups:
            writer.writerow([
                cg.get("id"),
                cg.get("overall_score"),
                cg.get("camera_count"),
                cg.get("evidence_level"),
                cg.get("status"),
                cg.get("created_at")
            ])
    else:
        writer.writerow(["No candidate groups recorded."])

    writer.writerow([])

    # 3. Institutional Record Matches Section
    writer.writerow(["--- INSTITUTIONAL RECORD MATCHES ---"])
    writer.writerow(["Record Match ID", "Record Source", "Record Type", "Match Score", "Verification Status", "Matched At"])

    rm_res = db.table("record_matches").select("*, institutional_records(*)").eq("case_id", case_id).execute() if db else None
    rms = rm_res.data if rm_res else []

    if rms:
        for rm in rms:
            irec = rm.get("institutional_records") or {}
            writer.writerow([
                rm.get("id"),
                irec.get("source_name", "Unknown Source"),
                irec.get("record_type", "Record"),
                rm.get("overall_match_score"),
                rm.get("verification_status"),
                rm.get("created_at")
            ])
    else:
        writer.writerow(["No record matches found."])

    writer.writerow([])

    # 4. Investigation Tasks Section
    writer.writerow(["--- FOLLOW-UP INVESTIGATION TASKS ---"])
    writer.writerow(["Task ID", "Title", "Assigned To", "Status", "Created At", "Completed At"])

    tasks = InvestigationTaskService.get_tasks_for_case(db, case_id)
    if tasks:
        for t in tasks:
            writer.writerow([
                t.get("id"),
                t.get("title"),
                t.get("assigned_to"),
                t.get("status"),
                t.get("created_at"),
                t.get("completed_at", "N/A")
            ])
    else:
        writer.writerow(["No investigation tasks recorded."])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="FindSafe_Evidence_Case_{case_id[:8]}.csv"'}
    )
