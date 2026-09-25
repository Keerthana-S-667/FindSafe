import logging
import datetime
import random
from typing import Optional, List, Dict, Any
from app.database.supabase import get_supabase_admin_client, get_supabase_client
from app.utils.storage import get_signed_image_url

logger = logging.getLogger("findsafe.case_service")

def generate_unique_case_id() -> str:
    """
    Generates a human-readable unique case ID in the format: MP-YYYY-XXXX
    """
    year = datetime.datetime.now().year
    rand_num = random.randint(1000, 9999)
    return f"MP-{year}-{rand_num}"

def format_case_record(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats raw database row and generates signed image URL if reference image path exists.
    """
    path = row.get("reference_image_path")
    url = row.get("reference_image_url")

    if path and not url:
        url = get_signed_image_url(path)
    elif path and url and ("supabase" in url or "placeholder" in url):
        # Regenerate fresh signed URL if needed
        signed = get_signed_image_url(path)
        if signed:
            url = signed

    row["reference_image_url"] = url
    return row

async def create_case_record(
    case_data: Dict[str, Any],
    user_id: str
) -> Dict[str, Any]:
    """
    Inserts a new missing person case record into PostgreSQL via Supabase client.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    case_id = generate_unique_case_id()

    payload = {
        "case_id": case_id,
        "reference_name": case_data["reference_name"],
        "age_range": case_data.get("age_range"),
        "upper_clothing": case_data.get("upper_clothing"),
        "lower_clothing": case_data.get("lower_clothing"),
        "bag": case_data.get("bag"),
        "accessories": case_data.get("accessories"),
        "last_seen_location": case_data["last_seen_location"],
        "last_seen_lat": case_data.get("last_seen_lat"),
        "last_seen_lng": case_data.get("last_seen_lng"),
        "last_seen_timestamp": case_data.get("last_seen_timestamp"),
        "search_radius_km": case_data.get("search_radius_km", 5.0),
        "notes": case_data.get("notes"),
        "reference_image_path": case_data.get("reference_image_path"),
        "reference_image_url": case_data.get("reference_image_url"),
        "status": "active",
        "created_by": user_id if user_id and not user_id.startswith("dev-") else None
    }

    if not client:
        logger.warning("Supabase client unconfigured. Returning memory mock record.")
        payload["id"] = "dev-case-uuid-" + str(random.randint(1000, 9999))
        payload["created_at"] = datetime.datetime.now().isoformat()
        payload["updated_at"] = datetime.datetime.now().isoformat()
        return payload

    try:
        res = client.table("missing_persons").insert(payload).execute()
        if res.data and len(res.data) > 0:
            record = res.data[0]
            # Write Audit Log
            try:
                client.table("audit_logs").insert({
                    "user_id": payload["created_by"],
                    "action": "case_created",
                    "entity_type": "missing_persons",
                    "entity_id": record["id"],
                    "metadata": {"case_id": case_id, "reference_name": case_data["reference_name"]}
                }).execute()
            except Exception as audit_err:
                logger.warning(f"Failed to record audit log: {str(audit_err)}")

            return format_case_record(record)
        return format_case_record(payload)
    except Exception as e:
        logger.error(f"Error inserting missing person case: {str(e)}")
        payload["id"] = "fallback-case-id-" + str(random.randint(1000, 9999))
        payload["created_at"] = datetime.datetime.now().isoformat()
        payload["updated_at"] = datetime.datetime.now().isoformat()
        return payload

async def list_cases_records(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """
    Lists missing person cases with search, status filtering, and pagination.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

    try:
        query = client.table("missing_persons").select("*", count="exact")

        if status and status.upper() != "ALL":
            query = query.eq("status", status.lower())

        if search and search.strip():
            term = search.strip()
            query = query.or_(f"case_id.ilike.%{term}%,reference_name.ilike.%{term}%,last_seen_location.ilike.%{term}%")

        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        res = query.execute()
        items = [format_case_record(row) for row in (res.data or [])]
        total = res.count if res.count is not None else len(items)

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        logger.error(f"Error fetching cases list: {str(e)}")
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

async def get_case_record_by_id(id_or_case_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches a single case record by UUID or human-readable case_id.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return None

    try:
        # Try matching id or case_id
        res = client.table("missing_persons").select("*").or_(f"id.eq.{id_or_case_id},case_id.eq.{id_or_case_id}").execute()
        if res.data and len(res.data) > 0:
            return format_case_record(res.data[0])
        return None
    except Exception as e:
        logger.error(f"Error fetching case detail for {id_or_case_id}: {str(e)}")
        return None

async def update_case_record(
    id_or_case_id: str,
    update_data: Dict[str, Any],
    user_id: str
) -> Optional[Dict[str, Any]]:
    """
    Updates attributes or status of a case record.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return None

    clean_data = {k: v for k, v in update_data.items() if v is not None}
    if not clean_data:
        return await get_case_record_by_id(id_or_case_id)

    try:
        # First retrieve existing record to get primary UUID
        existing = await get_case_record_by_id(id_or_case_id)
        if not existing:
            return None

        record_id = existing["id"]
        res = client.table("missing_persons").update(clean_data).eq("id", record_id).execute()

        if res.data and len(res.data) > 0:
            updated = res.data[0]
            # Write Audit Log
            try:
                action_name = "case_status_changed" if "status" in clean_data else "case_updated"
                client.table("audit_logs").insert({
                    "user_id": user_id if user_id and not user_id.startswith("dev-") else None,
                    "action": action_name,
                    "entity_type": "missing_persons",
                    "entity_id": record_id,
                    "metadata": clean_data
                }).execute()
            except Exception as audit_err:
                logger.warning(f"Failed to record audit log: {str(audit_err)}")

            return format_case_record(updated)
        return None
    except Exception as e:
        logger.error(f"Error updating case {id_or_case_id}: {str(e)}")
        return None

async def get_dashboard_statistics() -> Dict[str, int]:
    """
    Queries real statistics counts from Supabase PostgreSQL tables.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return {"active_cases": 0, "potential_matches": 0, "search_sessions": 0, "pending_reviews": 0}

    try:
        # Active cases count
        res_cases = client.table("missing_persons").select("id", count="exact").eq("status", "active").execute()
        active_cases_count = res_cases.count if res_cases.count is not None else 0

        # Potential matches count
        res_matches = client.table("candidates").select("id", count="exact").eq("verification_status", "potential_match").execute()
        potential_matches_count = res_matches.count if res_matches.count is not None else 0

        # Search sessions count
        res_sessions = client.table("search_sessions").select("id", count="exact").execute()
        sessions_count = res_sessions.count if res_sessions.count is not None else 0

        # Pending reviews count
        res_reviews = client.table("candidates").select("id", count="exact").eq("verification_status", "under_review").execute()
        pending_reviews_count = res_reviews.count if res_reviews.count is not None else 0

        return {
            "active_cases": active_cases_count,
            "potential_matches": potential_matches_count,
            "search_sessions": sessions_count,
            "pending_reviews": pending_reviews_count
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard statistics: {str(e)}")
        return {"active_cases": 0, "potential_matches": 0, "search_sessions": 0, "pending_reviews": 0}


class CaseService:
    """Helper class providing database client access for services."""

    @staticmethod
    def get_supabase():
        return get_supabase_admin_client() or get_supabase_client()
