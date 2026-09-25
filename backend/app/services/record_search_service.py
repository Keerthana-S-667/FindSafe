"""
FindSafe AI - Record Search & Demo Data Management Service (Phase 7)

Handles institutional record search sessions, CSV demo dataset import with validation,
and persistence of record match results in Supabase.
"""

import io
import csv
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.services.case_service import CaseService
from app.services.reid_service import ReIDService
from app.services.record_matching_service import RecordMatchingService
from app.services.record_embedding_service import RecordEmbeddingService

logger = logging.getLogger("findsafe.ai.record_search")

VALID_SOURCE_TYPES = {"police", "hospital", "shelter", "public_report"}


class RecordSearchService:
    """Service for searching institutional records and importing demonstration CSV datasets."""

    @staticmethod
    def execute_record_search(
        case_id: str,
        source_types: Optional[List[str]] = None,
        search_radius_km: float = 25.0,
        time_window_hours: float = 72.0,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs complete Record Search for a given missing person case against found_person_records.
        """
        supabase = CaseService.get_supabase()

        # 1. Fetch missing person case data
        case_res = supabase.table("missing_persons").select("*").eq("id", case_id).execute()
        if not case_res.data or len(case_res.data) == 0:
            # Try case_id string match if UUID lookup fails
            case_res = supabase.table("missing_persons").select("*").eq("case_id", case_id).execute()
            if not case_res.data or len(case_res.data) == 0:
                raise ValueError(f"Missing person case '{case_id}' not found.")

        case_data = case_res.data[0]
        mp_id = case_data["id"]

        # 2. Extract reference image embedding if available
        case_ref_embedding = None
        ref_image_url = case_data.get("reference_image_url")
        if ref_image_url:
            try:
                import httpx
                import numpy as np
                import cv2
                resp = httpx.get(ref_image_url, timeout=10.0)
                if resp.status_code == 200:
                    nparr = np.frombuffer(resp.content, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img is not None:
                        case_ref_embedding = ReIDService.extract_appearance_embedding(img)
            except Exception as e:
                logger.warning(f"Could not load reference image for Re-ID embedding: {str(e)}")

        # 3. Create Search Session
        session_data = {
            "case_id": mp_id,
            "search_type": "records",
            "status": "processing",
            "created_by": created_by,
            "started_at": datetime.utcnow().isoformat()
        }
        session_res = supabase.table("search_sessions").insert(session_data).execute()
        search_session_id = session_res.data[0]["id"]

        # 4. Load Records from found_person_records
        records_query = supabase.table("found_person_records").select("*")
        
        # Apply source type filtering if specified (and not 'all')
        if source_types and len(source_types) > 0 and "all" not in [s.lower() for s in source_types]:
            clean_sources = [s.lower() for s in source_types if s.lower() in VALID_SOURCE_TYPES]
            if clean_sources:
                records_query = records_query.in_("source_type", clean_sources)

        records_res = records_query.execute()
        candidate_records = records_res.data or []

        matches_inserted = []

        # 5. Evaluate matching score for each record
        for record in candidate_records:
            rec_id = record["id"]

            # Get or compute record embedding if image present
            rec_embedding = RecordEmbeddingService.get_or_create_record_embedding(record)

            match_result = RecordMatchingService.match_case_to_record(
                case_data=case_data,
                case_ref_embedding=case_ref_embedding,
                record_data=record,
                record_embedding=rec_embedding,
                search_radius_km=search_radius_km,
                time_window_hours=time_window_hours
            )

            # Insert into record_matches table
            match_row = {
                "search_session_id": search_session_id,
                "missing_person_id": mp_id,
                "record_id": rec_id,
                "visual_similarity": match_result["visual_similarity"],
                "attribute_score": match_result["attribute_score"],
                "location_score": match_result["location_score"],
                "time_score": match_result["time_score"],
                "age_score": match_result["age_score"],
                "overall_score": match_result["overall_score"],
                "match_status": "under_review",
                "evidence_details": match_result["evidence_details"]
            }

            inserted = supabase.table("record_matches").insert(match_row).execute()
            if inserted.data and len(inserted.data) > 0:
                match_item = inserted.data[0]
                match_item["record"] = record
                matches_inserted.append(match_item)

        # 6. Update search session status to completed
        supabase.table("search_sessions").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", search_session_id).execute()

        # Sort matches by overall_score descending
        matches_inserted.sort(key=lambda x: x.get("overall_score", 0), reverse=True)

        return {
            "search_session_id": search_session_id,
            "status": "completed",
            "total_records_searched": len(candidate_records),
            "total_matches_found": len(matches_inserted),
            "matches": matches_inserted
        }

    @staticmethod
    def import_csv_demo_records(csv_content: str) -> Dict[str, Any]:
        """
        Validates and imports demonstration found-person records from CSV content string.
        Enforces source_type validation, coordinate parsing, and clean error reporting.
        """
        supabase = CaseService.get_supabase()

        reader = csv.DictReader(io.StringIO(csv_content))
        valid_rows = []
        invalid_rows = []

        row_index = 0
        for row in reader:
            row_index += 1
            # Skip comment rows or empty rows
            first_val = list(row.values())[0] if row else ""
            if first_val and first_val.startswith("#"):
                continue

            record_id = (row.get("record_id") or "").strip()
            source_type = (row.get("source_type") or "").strip().lower()

            errors = []
            if not record_id:
                errors.append("Missing record_id")
            if source_type not in VALID_SOURCE_TYPES:
                errors.append(f"Invalid source_type '{source_type}'. Allowed: {', '.join(VALID_SOURCE_TYPES)}")

            # Parse lat / lng
            lat, lng = None, None
            if row.get("latitude"):
                try:
                    lat = float(row["latitude"])
                except ValueError:
                    errors.append("Invalid latitude number")
            if row.get("longitude"):
                try:
                    lng = float(row["longitude"])
                except ValueError:
                    errors.append("Invalid longitude number")

            # Validate record timestamp
            rec_timestamp = None
            ts_str = (row.get("record_timestamp") or "").strip()
            if ts_str:
                try:
                    ts_clean = ts_str.replace("Z", "+00:00")
                    rec_timestamp = datetime.fromisoformat(ts_clean).isoformat()
                except Exception:
                    # Default to current timestamp if unparseable
                    rec_timestamp = datetime.utcnow().isoformat()
            else:
                rec_timestamp = datetime.utcnow().isoformat()

            cleaned_record = {
                "record_id": record_id or f"REC-{row_index:04d}",
                "source_type": source_type if source_type in VALID_SOURCE_TYPES else "public_report",
                "reference_name": (row.get("reference_name") or "").strip(),
                "age_range": (row.get("age_range") or "unknown").strip(),
                "upper_clothing": (row.get("upper_clothing") or "unknown").strip(),
                "lower_clothing": (row.get("lower_clothing") or "unknown").strip(),
                "bag": (row.get("bag") or "none").strip(),
                "accessories": (row.get("accessories") or "none").strip(),
                "location": (row.get("location") or "").strip(),
                "latitude": lat,
                "longitude": lng,
                "record_timestamp": rec_timestamp,
                "notes": (row.get("notes") or "").strip(),
                "status": "active"
            }

            if errors:
                invalid_rows.append({"row": row_index, "data": row, "errors": errors})
            else:
                valid_rows.append(cleaned_record)

        # Batch insert valid records into Supabase
        inserted_count = 0
        if valid_rows:
            try:
                res = supabase.table("found_person_records").upsert(valid_rows, on_conflict="record_id").execute()
                inserted_count = len(res.data) if res.data else len(valid_rows)
            except Exception as e:
                logger.error(f"Error inserting valid CSV records to Supabase: {str(e)}")
                # Try single row insertions if batch fails
                for r in valid_rows:
                    try:
                        supabase.table("found_person_records").upsert(r, on_conflict="record_id").execute()
                        inserted_count += 1
                    except Exception:
                        pass

        return {
            "total_found": len(valid_rows) + len(invalid_rows),
            "valid_count": len(valid_rows),
            "invalid_count": len(invalid_rows),
            "inserted_count": inserted_count,
            "invalid_rows": invalid_rows
        }
