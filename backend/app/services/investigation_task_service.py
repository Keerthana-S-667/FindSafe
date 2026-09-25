"""
FindSafe AI - Investigation Task Service (Phase 11)
Handles lightweight investigation task management and audit logging.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("findsafe.ai.investigation_task_service")


class InvestigationTaskService:
    """Service to create, update, list, and audit follow-up investigation tasks."""

    @staticmethod
    def get_tasks_for_case(supabase: Any, case_id: str, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves investigation tasks for a given case."""
        if not supabase or not case_id:
            return []

        try:
            query = supabase.table("investigation_tasks").select("*").eq("case_id", case_id)
            if status_filter and status_filter != "all":
                query = query.eq("status", status_filter)

            res = query.order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching tasks for case {case_id}: {str(e)}", exc_info=True)
            return []

    @staticmethod
    def create_task(
        supabase: Any,
        case_id: str,
        title: str,
        description: Optional[str] = None,
        candidate_group_id: Optional[str] = None,
        record_match_id: Optional[str] = None,
        assigned_to: Optional[str] = None,
        created_by: Optional[str] = "Investigator"
    ) -> Optional[Dict[str, Any]]:
        """Creates a new follow-up investigation task and logs to audit_logs."""
        if not supabase or not case_id or not title:
            return None

        try:
            task_data = {
                "case_id": case_id,
                "candidate_group_id": candidate_group_id,
                "record_match_id": record_match_id,
                "title": title,
                "description": description or "",
                "assigned_to": assigned_to or created_by,
                "status": "pending",
                "created_by": created_by
            }

            res = supabase.table("investigation_tasks").insert(task_data).execute()
            if not res.data:
                return None

            created_task = res.data[0]

            # Audit log entry
            try:
                supabase.table("audit_logs").insert({
                    "case_id": case_id,
                    "action_type": "task_created",
                    "performed_by": created_by or "Investigator",
                    "details": {"task_id": created_task["id"], "title": title, "assigned_to": assigned_to}
                }).execute()
            except Exception as audit_err:
                logger.warning(f"Could not create audit log for task_created: {str(audit_err)}")

            return created_task
        except Exception as e:
            logger.error(f"Error creating task for case {case_id}: {str(e)}", exc_info=True)
            return None

    @staticmethod
    def update_task_status(
        supabase: Any,
        task_id: str,
        status: str,
        performed_by: Optional[str] = "Investigator"
    ) -> Optional[Dict[str, Any]]:
        """Updates task status ('completed', 'cancelled', 'pending') and records completed_at timestamp."""
        if not supabase or not task_id or status not in ["pending", "completed", "cancelled"]:
            return None

        try:
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }
            if status == "completed":
                update_data["completed_at"] = datetime.utcnow().isoformat()

            res = supabase.table("investigation_tasks").update(update_data).eq("id", task_id).execute()
            if not res.data:
                return None

            updated_task = res.data[0]
            case_id = updated_task.get("case_id")

            # Audit log entry
            action_name = "task_completed" if status == "completed" else "task_cancelled"
            if case_id:
                try:
                    supabase.table("audit_logs").insert({
                        "case_id": case_id,
                        "action_type": action_name,
                        "performed_by": performed_by or "Investigator",
                        "details": {"task_id": task_id, "new_status": status, "title": updated_task.get("title")}
                    }).execute()
                except Exception as audit_err:
                    logger.warning(f"Could not create audit log for {action_name}: {str(audit_err)}")

            return updated_task
        except Exception as e:
            logger.error(f"Error updating task status for task {task_id}: {str(e)}", exc_info=True)
            return None
