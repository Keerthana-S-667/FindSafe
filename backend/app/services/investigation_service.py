"""
FindSafe AI - Investigation Timeline & Map Synthesis Service (Phase 7)

Generates unified multi-source chronological timelines and geo-spatial investigation map layers.
Synthesizes camera sightings, police, hospital, shelter, and public report evidence.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.services.case_service import CaseService

logger = logging.getLogger("findsafe.ai.investigation")


class InvestigationService:
    """Service to produce unified investigation timelines and map marker representations."""

    @staticmethod
    def get_unified_timeline(session_id: str) -> Dict[str, Any]:
        """
        Retrieves all timeline events associated with a search session or case.
        Includes missing person last seen, CCTV camera sightings, and institutional record matches.
        """
        supabase = CaseService.get_supabase()

        # 1. Fetch search session to find case_id
        session_res = supabase.table("search_sessions").select("*, missing_persons(*)").eq("id", session_id).execute()
        if not session_res.data or len(session_res.data) == 0:
            raise ValueError(f"Search session '{session_id}' not found.")

        session = session_res.data[0]
        case_data = session.get("missing_persons") or {}
        case_id = session.get("case_id")

        timeline_events = []

        # Event 1: Missing Person Last Known Sighting
        if case_data.get("last_seen_timestamp"):
            timeline_events.append({
                "id": f"event-mp-{case_data.get('id')}",
                "event_type": "last_known_sighting",
                "source": "missing_person_case",
                "source_label": "Last Seen Location",
                "timestamp": case_data.get("last_seen_timestamp"),
                "location_name": case_data.get("last_seen_location", "Unknown Location"),
                "latitude": case_data.get("last_seen_lat"),
                "longitude": case_data.get("last_seen_lng"),
                "description": f"Missing person {case_data.get('reference_name')} reported last seen.",
                "evidence_score": 100.0,
                "badge_color": "amber",
                "icon_type": "user-check"
            })

        # Event 2: Camera Candidates & Sightings
        try:
            candidates_res = supabase.table("candidates").select("*, search_sessions!inner(case_id)").eq("search_sessions.case_id", case_id).execute()
            if candidates_res.data:
                for cand in candidates_res.data:
                    timeline_events.append({
                        "id": f"event-cand-{cand.get('id')}",
                        "event_type": "camera_sighting",
                        "source": "camera",
                        "source_label": f"Camera Sighting ({cand.get('track_id', 'Track')})",
                        "timestamp": cand.get("created_at"),
                        "location_name": "CCTV Surveillance Node",
                        "latitude": 28.6139 + (float(cand.get("location_score") or 0.5) * 0.005),
                        "longitude": 77.2090 + (float(cand.get("time_score") or 0.5) * 0.005),
                        "description": f"Detected track candidate {cand.get('track_id')}. Visual score: {round(float(cand.get('visual_similarity') or 0)*100, 1)}/100.",
                        "evidence_score": float(cand.get("overall_score") or 0),
                        "verification_status": cand.get("verification_status", "under_review"),
                        "badge_color": "sky",
                        "icon_type": "camera"
                    })
        except Exception as e:
            logger.warning(f"Could not load camera candidates for timeline: {str(e)}")

        # Event 3: Record Matches (Police, Hospital, Shelter, Public Report)
        try:
            matches_res = supabase.table("record_matches").select("*, found_person_records(*)").eq("search_session_id", session_id).execute()
            if not matches_res.data:
                # Search by case_id across all record matches
                matches_res = supabase.table("record_matches").select("*, found_person_records(*)").eq("missing_person_id", case_id).execute()

            if matches_res.data:
                for match in matches_res.data:
                    rec = match.get("found_person_records") or {}
                    src_type = (rec.get("source_type") or "public_report").lower()

                    badge_color_map = {
                        "police": "indigo",
                        "hospital": "rose",
                        "shelter": "emerald",
                        "public_report": "violet"
                    }

                    timeline_events.append({
                        "id": f"event-match-{match.get('id')}",
                        "event_type": "record_match",
                        "source": src_type,
                        "source_label": f"{src_type.replace('_', ' ').title()} Record ({rec.get('record_id', '')})",
                        "timestamp": rec.get("record_timestamp") or match.get("created_at"),
                        "location_name": rec.get("location") or "Institutional Record Location",
                        "latitude": rec.get("latitude"),
                        "longitude": rec.get("longitude"),
                        "description": f"Potential match found in {src_type.replace('_', ' ')} records. {rec.get('notes', '')}",
                        "evidence_score": float(match.get("overall_score") or 0),
                        "match_status": match.get("match_status", "under_review"),
                        "badge_color": badge_color_map.get(src_type, "slate"),
                        "icon_type": "file-text"
                    })
        except Exception as e:
            logger.warning(f"Could not load record matches for timeline: {str(e)}")

        # Sort chronological order
        timeline_events.sort(key=lambda x: x.get("timestamp") or "", reverse=False)

        return {
            "session_id": session_id,
            "case": case_data,
            "total_events": len(timeline_events),
            "timeline": timeline_events
        }

    @staticmethod
    def get_investigation_map_data(session_id: str) -> Dict[str, Any]:
        """
        Returns structured map layers, markers, and path sequences for investigation map rendering.
        Categorizes markers by: camera, police, hospital, shelter, public_report.
        """
        timeline_data = InvestigationService.get_unified_timeline(session_id)
        events = timeline_data.get("timeline", [])

        markers = []
        path_points = []

        for ev in events:
            lat = ev.get("latitude")
            lng = ev.get("longitude")
            if lat is not None and lng is not None:
                markers.append({
                    "id": ev["id"],
                    "source": ev["source"],
                    "source_label": ev["source_label"],
                    "title": ev["description"],
                    "location_name": ev["location_name"],
                    "latitude": lat,
                    "longitude": lng,
                    "timestamp": ev["timestamp"],
                    "evidence_score": ev["evidence_score"],
                    "badge_color": ev.get("badge_color", "primary"),
                    "icon_type": ev.get("icon_type", "map-pin")
                })
                path_points.append({"lat": lat, "lng": lng, "label": ev["source_label"], "timestamp": ev["timestamp"]})

        return {
            "session_id": session_id,
            "markers": markers,
            "path_sequence": path_points,
            "case": timeline_data.get("case", {})
        }
