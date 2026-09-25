"""
FindSafe AI - Cross-Source Evidence Association Service (Phase 7)

Associates CCTV camera candidates and institutional record matches into unified evidence
and cross-source candidate relationships.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.services.case_service import CaseService
from app.services.reid_service import ReIDService
from app.services.attribute_service import AttributeService
from app.services.movement_service import MovementService
from app.services.record_search_service import RecordSearchService
from app.services.cross_camera_service import CrossCameraService

logger = logging.getLogger("findsafe.ai.cross_source")


class CrossSourceService:
    """Service to execute Search Everywhere orchestration and cross-source evidence association."""

    @staticmethod
    def execute_search_everywhere(
        case_id: str,
        video_ids: Optional[List[str]] = None,
        source_types: Optional[List[str]] = None,
        search_radius_km: float = 25.0,
        time_window_hours: float = 72.0,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates Search Everywhere pipeline:
        1. Camera Crowd Search (YOLO + ByteTrack + OSNet + Cross-Camera Fusion)
        2. Institutional Record Search (Police + Hospital + Shelter + Public Reports)
        3. Cross-Source Evidence Association & Unified Timeline Generation
        """
        supabase = CaseService.get_supabase()

        # 1. Fetch case details
        case_res = supabase.table("missing_persons").select("*").eq("id", case_id).execute()
        if not case_res.data or len(case_res.data) == 0:
            case_res = supabase.table("missing_persons").select("*").eq("case_id", case_id).execute()
            if not case_res.data or len(case_res.data) == 0:
                raise ValueError(f"Missing person case '{case_id}' not found.")
        
        mp_data = case_res.data[0]
        mp_id = mp_data["id"]

        # 2. Create Master 'everywhere' Search Session
        session_data = {
            "case_id": mp_id,
            "search_type": "everywhere",
            "status": "processing",
            "created_by": created_by,
            "started_at": datetime.utcnow().isoformat()
        }
        session_res = supabase.table("search_sessions").insert(session_data).execute()
        session_id = session_res.data[0]["id"]

        # 3. Step A: Record Search
        record_search_res = RecordSearchService.execute_record_search(
            case_id=mp_id,
            source_types=source_types,
            search_radius_km=search_radius_km,
            time_window_hours=time_window_hours,
            created_by=created_by
        )
        record_matches = record_search_res.get("matches", [])

        # 4. Step B: Camera Search (if videos supplied or existing candidate groups exist)
        candidate_groups = []
        try:
            # Check existing candidate groups for this case or run cross camera analysis
            cg_res = supabase.table("candidate_groups").select("*, candidates(*)").eq("case_id", mp_id).execute()
            if cg_res.data:
                candidate_groups = cg_res.data
            else:
                # Run cross camera matching if video search sessions exist
                cg_res = CrossCameraService.process_cross_camera_matching(session_id, mp_id)
                candidate_groups = cg_res.get("candidate_groups", [])
        except Exception as e:
            logger.warning(f"Could not load camera candidate groups for Search Everywhere: {str(e)}")

        # 5. Step C: Build Cross-Source Evidence Associations
        associations_created = []
        for match in record_matches:
            rec = match.get("record", {})
            for group in candidate_groups:
                assoc_result = CrossSourceService._compute_cross_source_association(
                    session_id=session_id,
                    group=group,
                    match=match,
                    record=rec
                )
                if assoc_result and assoc_result.get("overall_score", 0) >= 40.0:
                    # Insert into cross_source_associations
                    row = {
                        "search_session_id": session_id,
                        "candidate_group_id": group.get("id"),
                        "record_match_id": match.get("id"),
                        "visual_consistency": assoc_result["visual_consistency"],
                        "attribute_consistency": assoc_result["attribute_consistency"],
                        "time_consistency": assoc_result["time_consistency"],
                        "location_consistency": assoc_result["location_consistency"],
                        "overall_score": assoc_result["overall_score"],
                        "status": "under_review",
                        "evidence_summary": assoc_result["evidence_summary"]
                    }
                    inserted = supabase.table("cross_source_associations").insert(row).execute()
                    if inserted.data and len(inserted.data) > 0:
                        assoc_row = inserted.data[0]
                        assoc_row["candidate_group"] = group
                        assoc_row["record_match"] = match
                        associations_created.append(assoc_row)

        # 6. Update session status
        supabase.table("search_sessions").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", session_id).execute()

        associations_created.sort(key=lambda x: x.get("overall_score", 0), reverse=True)

        return {
            "search_session_id": session_id,
            "status": "completed",
            "camera_candidate_groups": candidate_groups,
            "record_matches": record_matches,
            "cross_source_associations": associations_created
        }

    @staticmethod
    def _compute_cross_source_association(
        session_id: str,
        group: Dict[str, Any],
        match: Dict[str, Any],
        record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculates consistency between a CCTV camera candidate group and a found-person record match."""
        g_attr_score = float(group.get("attribute_score") or group.get("overall_score") or 50.0) / 100.0
        r_attr_score = float(match.get("attribute_score") or 0.6)

        attribute_consistency = round(float((g_attr_score + r_attr_score) / 2.0), 3)

        # Visual consistency (if record visual similarity exists)
        visual_consistency = float(match.get("visual_similarity") or 0.5)

        # Location consistency
        g_lat = group.get("centroid_lat")
        g_lng = group.get("centroid_lng")
        r_lat = record.get("latitude")
        r_lng = record.get("longitude")

        location_consistency = 0.60
        if g_lat is not None and g_lng is not None and r_lat is not None and r_lng is not None:
            dist = MovementService.haversine_distance(g_lat, g_lng, r_lat, r_lng)
            if dist <= 10000.0:  # Within 10 km
                location_consistency = max(0.2, 1.0 - (dist / 20000.0))
            else:
                location_consistency = max(0.1, 0.5 * (10000.0 / dist))

        # Time consistency
        time_consistency = float(match.get("time_score") or 0.6)

        # Overall Evidence Score for cross-source association
        overall_unit = (
            (attribute_consistency * 0.35) +
            (location_consistency * 0.25) +
            (time_consistency * 0.25) +
            (visual_consistency * 0.15)
        )
        overall_score_100 = round(float(overall_unit * 100.0), 1)

        return {
            "visual_consistency": round(visual_consistency, 3),
            "attribute_consistency": attribute_consistency,
            "location_consistency": round(location_consistency, 3),
            "time_consistency": round(time_consistency, 3),
            "overall_score": overall_score_100,
            "evidence_summary": {
                "group_label": group.get("group_label", "Camera Candidate"),
                "record_source": record.get("source_type", "unknown"),
                "record_id": record.get("record_id", ""),
                "description": f"Camera sighting and {record.get('source_type', 'institutional').upper()} record exhibit compatible evidence features."
            }
        }
