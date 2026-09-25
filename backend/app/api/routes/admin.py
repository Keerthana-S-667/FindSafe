"""
FindSafe AI - Phase 9 Admin, Role Management & Case Workflow API Routes

Endpoints for:
- User Role Management (Admin, Investigator, Reviewer, Viewer)
- Case Assignment to Investigators
- Workflow Priority Updates (Low, Medium, High, Critical)
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.services.case_service import CaseService

logger = logging.getLogger("findsafe.api.admin")

router = APIRouter()


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Allowed roles: admin, investigator, reviewer, viewer")


class CasePriorityRequest(BaseModel):
    priority: str = Field(..., description="Priority: low, medium, high, critical")


class CaseAssignRequest(BaseModel):
    assigned_to: Optional[str] = Field(None, description="User UUID of assigned investigator")


# 1. GET /api/admin/users
@router.get("/admin/users", summary="List All Users & Roles (Admin Only)")
async def list_admin_users():
    """Retrieves list of registered user profiles and assigned security roles."""
    try:
        supabase = CaseService.get_supabase()

        # Query profiles and user_roles
        profiles = supabase.table("profiles").select("*").execute()
        roles_res = supabase.table("user_roles").select("*").execute()

        roles_map = {r["user_id"]: r["role"] for r in (roles_res.data or [])}

        users_list = []
        for p in (profiles.data or []):
            u_id = p["id"]
            assigned_role = roles_map.get(u_id, p.get("role", "investigator"))
            users_list.append({
                "id": u_id,
                "full_name": p.get("full_name") or "User",
                "email": p.get("full_name") or f"user-{u_id[:6]}@findsafe.ai",
                "role": assigned_role if assigned_role in ("admin", "investigator", "reviewer", "viewer") else "investigator",
                "created_at": p.get("created_at")
            })

        return {"total": len(users_list), "users": users_list}
    except Exception as e:
        logger.error(f"Error listing admin users: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# 2. POST /api/admin/users/{user_id}/role
@router.post("/admin/users/{user_id}/role", summary="Update User Role (Admin Only)")
async def update_user_role(user_id: str, req: RoleUpdateRequest):
    """Updates user security role (admin, investigator, reviewer, viewer) and logs audit event."""
    allowed_roles = {"admin", "investigator", "reviewer", "viewer"}
    if req.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role '{req.role}'. Allowed: {', '.join(allowed_roles)}")

    try:
        supabase = CaseService.get_supabase()

        # Upsert into user_roles
        now_str = datetime.utcnow().isoformat()
        res = supabase.table("user_roles").upsert({
            "user_id": user_id,
            "role": req.role,
            "updated_at": now_str
        }, on_conflict="user_id").execute()

        # Sync profiles table role as well for backward compatibility
        try:
            supabase.table("profiles").update({"role": req.role, "updated_at": now_str}).eq("id", user_id).execute()
        except Exception:
            pass

        # Log role_changed audit action
        try:
            supabase.table("audit_logs").insert({
                "action": "role_changed",
                "entity_type": "user",
                "entity_id": user_id,
                "metadata": {"new_role": req.role, "timestamp": now_str}
            }).execute()
        except Exception:
            pass

        return {"status": "success", "user_id": user_id, "new_role": req.role}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 3. POST /api/cases/{case_id}/priority
@router.post("/cases/{case_id}/priority", summary="Update Case Investigation Priority")
async def update_case_priority(case_id: str, req: CasePriorityRequest):
    """Updates investigation workflow priority (low, medium, high, critical). Human authorized decision."""
    allowed_priorities = {"low", "medium", "high", "critical"}
    if req.priority not in allowed_priorities:
        raise HTTPException(status_code=400, detail=f"Invalid priority '{req.priority}'. Allowed: {', '.join(allowed_priorities)}")

    try:
        supabase = CaseService.get_supabase()

        # Lookup case
        c_res = supabase.table("missing_persons").select("*").eq("id", case_id).execute()
        if not c_res.data:
            c_res = supabase.table("missing_persons").select("*").eq("case_id", case_id).execute()
            if not c_res.data:
                raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
        mp_id = c_res.data[0]["id"]

        now_str = datetime.utcnow().isoformat()
        updated = supabase.table("missing_persons").update({
            "priority": req.priority,
            "priority_updated_at": now_str
        }).eq("id", mp_id).execute()

        # Audit log
        try:
            supabase.table("audit_logs").insert({
                "action": "priority_changed",
                "entity_type": "missing_person",
                "entity_id": mp_id,
                "metadata": {"new_priority": req.priority}
            }).execute()
        except Exception:
            pass

        return {"status": "success", "case": updated.data[0] if updated.data else {}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. POST /api/cases/{case_id}/assign
@router.post("/cases/{case_id}/assign", summary="Assign Case to Investigator")
async def assign_case_to_investigator(case_id: str, req: CaseAssignRequest):
    """Assigns missing person case to a specific investigator user."""
    try:
        supabase = CaseService.get_supabase()

        # Lookup case
        c_res = supabase.table("missing_persons").select("*").eq("id", case_id).execute()
        if not c_res.data:
            c_res = supabase.table("missing_persons").select("*").eq("case_id", case_id).execute()
            if not c_res.data:
                raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
        mp_id = c_res.data[0]["id"]

        updated = supabase.table("missing_persons").update({
            "assigned_to": req.assigned_to
        }).eq("id", mp_id).execute()

        # Audit log
        try:
            supabase.table("audit_logs").insert({
                "action": "case_assigned",
                "entity_type": "missing_person",
                "entity_id": mp_id,
                "metadata": {"assigned_to": req.assigned_to}
            }).execute()
        except Exception:
            pass

        return {"status": "success", "case": updated.data[0] if updated.data else {}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
