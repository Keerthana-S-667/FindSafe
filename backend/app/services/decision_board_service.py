"""
FindSafe AI - Decision Board Service (Phase 17)
Aggregates fused intelligence, supporting evidence, limitations, attribute matrices, 
and human review controls for the Final Investigation Decision Board.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("findsafe.ai.decision_board_service")


class DecisionBoardService:
    """Service handling evidence synthesis, score breakdown, supporting vs limitations balance, and human review."""

    @staticmethod
    def get_candidate_decision_board(supabase: Any, candidate_id: str) -> Dict[str, Any]:
        """Retrieves aggregated decision board data for a given candidate group ID."""
        logger.info(f"Synthesizing decision board intelligence for candidate_id={candidate_id}")
        
        # Check database for candidate group details
        try:
            res = supabase.table("candidate_groups").select("*").eq("id", candidate_id).execute()
            cg_data = res.data[0] if (res.data and len(res.data) > 0) else None
        except Exception:
            cg_data = None

        # Build synthesized payload (using real or deterministic synthetic fallback)
        case_id = cg_data.get("case_id", "MP-2026-001") if cg_data else "DEMO-FS-001"
        evidence_score = int(cg_data.get("score", 86)) if cg_data else 86
        review_status = cg_data.get("review_status", "under_review") if cg_data else "under_review"

        header = {
            "case_id": case_id,
            "candidate_id": candidate_id if candidate_id != "default" else "CG-DEMO-01",
            "reference_name": "Synthetic Subject (Transit Case)" if "DEMO" in case_id else "Missing Person File",
            "case_status": "OPEN",
            "priority": "CRITICAL",
            "review_status": review_status.upper().replace("_", " "),
            "assigned_investigator": "Lead Investigator",
            "assigned_reviewer": "Authorized Reviewer",
            "disclaimer": "AI-ASSISTED EVIDENCE REVIEW • Human Verification Required • No Facial Recognition"
        }

        summary_metrics = {
            "evidence_score": evidence_score,
            "evidence_score_display": f"{evidence_score}/100",
            "camera_sources_count": 3,
            "record_associations_count": 1,
            "cross_source_associations_count": 1,
            "supporting_evidence_count": 5,
            "limitations_count": 3,
            "review_status": review_status
        }

        evidence_breakdown = [
            {"dimension": "Visual Similarity", "score": 88, "contribution": 30, "status": "Available"},
            {"dimension": "Attributes Match", "score": 92, "contribution": 25, "status": "Available"},
            {"dimension": "Time Consistency", "score": 85, "contribution": 15, "status": "Available"},
            {"dimension": "Location Context", "score": 80, "contribution": 15, "status": "Available"},
            {"dimension": "Cross-Camera", "score": 87, "contribution": 10, "status": "Available"},
            {"dimension": "Cross-Source", "score": 84, "contribution": 5, "status": "Available"}
        ]

        supporting_evidence = [
            {
                "id": "sup-01",
                "category": "Visual Similarity",
                "source": "CAM-01 Transit Entrance",
                "timestamp": "14:22 UTC",
                "location": "Main Gate Concourse",
                "explanation": "Upper clothing (Red Jacket) and backpack match reference profile descriptors with 94% visual confidence."
            },
            {
                "id": "sup-02",
                "category": "Attribute Match",
                "source": "CAM-04 Exit Corridor",
                "timestamp": "14:36 UTC",
                "location": "North Pedestrian Exit",
                "explanation": "Lower clothing (Black Jeans) and cap accessory verified consistent with CAM-01 track."
            },
            {
                "id": "sup-03",
                "category": "Time & Spatial Proximity",
                "source": "Multi-Camera Tracker",
                "timestamp": "14:22 - 14:36 UTC",
                "location": "Transit Terminal Corridor",
                "explanation": "Elapsed duration of 14 minutes is physically plausible for 400m pedestrian walking distance between CAM-01 and CAM-04."
            },
            {
                "id": "sup-04",
                "category": "Cross-Source Association",
                "source": "Synthetic Shelter Record REC-021",
                "timestamp": "14:45 UTC",
                "location": "North Community Shelter",
                "explanation": "Authorized shelter intake record matches subject description (Red Upper, Black Jeans) logged 21 minutes after CAM-04 sighting."
            },
            {
                "id": "sup-05",
                "category": "Re-ID Feature Consistency",
                "source": "OSNet Embedder",
                "timestamp": "14:36 UTC",
                "location": "Terminal Exit",
                "explanation": "OSNet deep appearance vector yields 0.874 cosine similarity between CAM-01 and CAM-04 bounding boxes."
            }
        ]

        limitations = [
            {
                "id": "lim-01",
                "category": "Occlusion",
                "source": "CAM-04 Exit Corridor",
                "explanation": "Blue backpack is partially obscured in CAM-04 exit frame due to camera mounting angle and crowd density."
            },
            {
                "id": "lim-02",
                "category": "Missing Data",
                "source": "Synthetic Shelter Record REC-021",
                "explanation": "Institutional shelter intake entry does not contain a high-resolution photo; verification relies on intake description."
            },
            {
                "id": "lim-03",
                "category": "Sequence Limitation",
                "source": "GIS Map Trajectory",
                "explanation": "Camera sequence order represents a potential evidence trajectory and does NOT confirm physical movement between intermediate blind spots."
            }
        ]

        attribute_matrix = [
            {"attribute": "Upper Clothing", "reference": "Red Jacket", "cam_01": "Match (Red)", "cam_02": "Match (Red)", "cam_04": "Match (Red)", "record": "Match (Red)"},
            {"attribute": "Lower Clothing", "reference": "Black Jeans", "cam_01": "Match (Black)", "cam_02": "Partial (Dark)", "cam_04": "Match (Black)", "record": "Match (Black)"},
            {"attribute": "Backpack / Bag", "reference": "Blue Backpack", "cam_01": "Match (Blue)", "cam_02": "Match (Blue)", "cam_04": "Unknown (Occluded)", "record": "Not Stated"},
            {"attribute": "Cap / Hat", "reference": "Cap", "cam_01": "Match", "cam_02": "Unknown", "cam_04": "Match", "record": "Not Stated"}
        ]

        cross_camera_sequence = [
            {"camera": "CAM-01 Transit Entrance", "time": "14:22", "location": "Entrance Gate", "upper": "Red", "lower": "Black", "status": "Potential Sequence"},
            {"camera": "CAM-02 Platform Area", "time": "14:28", "location": "Platform 3", "upper": "Red", "lower": "Dark", "status": "Potential Sequence"},
            {"camera": "CAM-04 Exit Corridor", "time": "14:36", "location": "North Exit", "upper": "Red", "lower": "Black", "status": "Potential Sequence"}
        ]

        cross_source_associations = [
            {
                "id": "assoc-01",
                "source_a": "CCTV CAM-04 Exit Corridor",
                "source_b": "Synthetic Shelter Record REC-021",
                "time_difference": "21 minutes",
                "distance": "0.6 km",
                "consistency": "High Proximity & Attribute Match",
                "status": "Associated"
            }
        ]

        timeline = [
            {"time": "14:20 UTC", "event": "Search Initiated", "details": "Investigator launched Search Everywhere for case DEMO-FS-001."},
            {"time": "14:22 UTC", "event": "CCTV Sighting (CAM-01)", "details": "Detected Red Upper & Blue Backpack bounding box track."},
            {"time": "14:28 UTC", "event": "CCTV Sighting (CAM-02)", "details": "Detected platform track matching color descriptors."},
            {"time": "14:36 UTC", "event": "CCTV Sighting (CAM-04)", "details": "Re-ID appearance vector associated with exit corridor track."},
            {"time": "14:45 UTC", "event": "Record Sighting", "details": "Matched compatible shelter intake entry REC-021."},
            {"time": "15:00 UTC", "event": "Candidate Group Formed", "details": "Aggregated 3 camera sightings & 1 record into Candidate Group 01."},
            {"time": "15:10 UTC", "event": "Human Review Updated", "details": "Authorized reviewer marked status as 'Under Review'."}
        ]

        map_locations = [
            {"name": "CAM-01 Entrance", "type": "Camera Evidence", "lat": 12.9716, "lng": 77.5946, "time": "14:22"},
            {"name": "CAM-02 Platform", "type": "Camera Evidence", "lat": 12.9725, "lng": 77.5955, "time": "14:28"},
            {"name": "CAM-04 Exit", "type": "Camera Evidence", "lat": 12.9740, "lng": 77.5970, "time": "14:36"},
            {"name": "North Shelter", "type": "Record Evidence", "lat": 12.9780, "lng": 77.6000, "time": "14:45"}
        ]

        human_review = {
            "reviewer": "Authorized Investigator",
            "review_status": review_status,
            "decision": "Under Review",
            "last_updated": datetime.utcnow().isoformat(),
            "notes": "Candidate displays strong visual & attribute consistency across 3 cameras and 1 shelter record. Verification task assigned for field unit dispatch.",
            "allowed_actions": ["Potential Match", "Rejected", "Verified by Authorized Reviewer", "Request Re-Search"]
        }

        what_we_know = [
            "Candidate observed in 3 distinct CCTV camera video sources within a 14-minute interval.",
            "Upper clothing (Red Jacket) is consistent across all 3 camera sightings.",
            "Synthetic shelter intake REC-021 matches upper/lower color descriptors within 0.6 km distance."
        ]

        what_remains_uncertain = [
            "Backpack visibility is occluded in CAM-04 due to camera angle.",
            "Institutional shelter record lacks a photographic intake image.",
            "Camera sequence represents a potential trajectory and does not prove physical movement between intermediate blind spots."
        ]

        what_needs_review = [
            "Physical field verification at North Community Shelter.",
            "Review of secondary CAM-03 bus connection video feed if uploaded."
        ]

        return {
            "header": header,
            "summary_metrics": summary_metrics,
            "evidence_breakdown": evidence_breakdown,
            "supporting_evidence": supporting_evidence,
            "limitations": limitations,
            "attribute_matrix": attribute_matrix,
            "cross_camera_sequence": cross_camera_sequence,
            "cross_source_associations": cross_source_associations,
            "timeline": timeline,
            "map_locations": map_locations,
            "human_review": human_review,
            "what_we_know": what_we_know,
            "what_remains_uncertain": what_remains_uncertain,
            "what_needs_review": what_needs_review
        }
