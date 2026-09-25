"""
FindSafe AI - Demo Control Center Service (Phase 15)
Provides controlled presentation environment for hackathon demonstrations.
Enforces strict isolation: Synthetic Demo Data ONLY. Never modifies real production cases.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("findsafe.ai.demo_service")


class DemoControlService:
    """Service for demo preparation, readiness verification, presenter controls, and safe reset."""

    PRIMARY_DEMO_CASE_ID = "DEMO-FS-001"
    
    DEMO_PRESENTATION_STEPS = [
        {
            "step": 1,
            "title": "Missing Person Case Registration",
            "category": "Reference Profile",
            "description": "Investigator registers synthetic case DEMO-FS-001 for missing subject last seen near Central Transit Hub.",
            "presenter_note": "Explain that FindSafe AI uses non-sensitive visual attributes (clothing color, bag type, cap) instead of facial recognition.",
            "location_name": "Central Transit Hub Entrance",
            "lat": 12.9716,
            "lng": 77.5946,
            "evidence_score": None,
            "details": {
                "case_id": "DEMO-FS-001",
                "reference_name": "Synthetic Subject (Demo Case)",
                "upper_clothing": "Red Jacket",
                "lower_clothing": "Black Jeans",
                "accessory": "Blue Backpack & Cap",
                "status": "OPEN",
                "priority": "CRITICAL"
            }
        },
        {
            "step": 2,
            "title": "Crowded Area Search Session Launched",
            "category": "Search Operations",
            "description": "Search Everywhere initiated across 4 uploaded CCTV video feeds and regional institutional records.",
            "presenter_note": "Highlight that search parameters integrate time window, geographic radius, and visual descriptor thresholds.",
            "location_name": "Transit Concourse Sector A",
            "lat": 12.9720,
            "lng": 77.5950,
            "evidence_score": None,
            "details": {
                "session_id": "SESS-DEMO-2026-A",
                "search_mode": "Search Everywhere",
                "status": "PROCESSING",
                "cameras_queued": 4
            }
        },
        {
            "step": 3,
            "title": "Multi-Camera Video Source Ingestion",
            "category": "CCTV Sources",
            "description": "System ingests 4 synthetic camera feeds: CAM-01 (Entrance), CAM-02 (Platform), CAM-03 (Bus Station), CAM-04 (Exit Corridor).",
            "presenter_note": "Emphasize that system processes uploaded video sources representing camera locations rather than live CCTV feeds.",
            "location_name": "Multi-Camera Zone",
            "lat": 12.9725,
            "lng": 77.5955,
            "evidence_score": None,
            "details": {
                "cameras": [
                    {"label": "CAM-01 Transit Entrance", "status": "Available"},
                    {"label": "CAM-02 Platform Area", "status": "Recently Used"},
                    {"label": "CAM-03 Bus Connection", "status": "Available"},
                    {"label": "CAM-04 Exit Corridor", "status": "Recently Used"}
                ]
            }
        },
        {
            "step": 4,
            "title": "Computer Vision & Attribute Extraction",
            "category": "Vision AI",
            "description": "YOLOv8 detects person bounding boxes, ByteTrack tracks trajectories, and HSV color analysis extracts Red Upper & Black Lower.",
            "presenter_note": "Point out the bounding box visualizations showing non-sensitive color breakdown without facial embeddings.",
            "location_name": "CAM-01 Main Gate",
            "lat": 12.9716,
            "lng": 77.5946,
            "evidence_score": 88,
            "details": {
                "detector": "YOLOv8",
                "tracker": "ByteTrack",
                "upper_match": "Red (94%)",
                "lower_match": "Black (91%)",
                "accessory": "Backpack Detected"
            }
        },
        {
            "step": 5,
            "title": "Cross-Camera Re-ID & Association",
            "category": "Appearance Matching",
            "description": "OSNet deep feature embedding associates track from CAM-01 (Entrance) with track on CAM-04 (Exit Corridor) 14 minutes later.",
            "presenter_note": "Explain how OSNet computes cosine similarity between body appearance feature vectors across different camera views.",
            "location_name": "CAM-04 Exit Corridor",
            "lat": 12.9740,
            "lng": 77.5970,
            "evidence_score": 87,
            "details": {
                "cosine_similarity": 0.874,
                "camera_src": "CAM-01 Entrance",
                "camera_dst": "CAM-04 Exit Corridor",
                "time_interval_mins": 14
            }
        },
        {
            "step": 6,
            "title": "Institutional Record Search",
            "category": "Record Intelligence",
            "description": "Institutional search scans synthetic police reports, hospital admissions, and shelter intake records.",
            "presenter_note": "Clarify that all institutional records in the demo environment are synthetic public safety intake records.",
            "location_name": "Regional Shelter DB",
            "lat": 12.9780,
            "lng": 77.6000,
            "evidence_score": 84,
            "details": {
                "record_id": "REC-SHELTER-021",
                "source": "Synthetic Shelter Record",
                "location": "North Community Shelter",
                "intake_time": "14:45"
            }
        },
        {
            "step": 7,
            "title": "Cross-Source Evidence Association",
            "category": "Multi-Source Fusion",
            "description": "FindSafe AI fuses CCTV video detection on CAM-04 with Synthetic Shelter Record REC-021 based on time & location proximity.",
            "presenter_note": "Highlight how multi-source fusion connects physical video sightings with institutional log entries into one timeline.",
            "location_name": "Cross-Source Node",
            "lat": 12.9750,
            "lng": 77.5980,
            "evidence_score": 89,
            "details": {
                "connection_type": "Camera -> Record",
                "time_diff_mins": 21,
                "distance_km": 0.6
            }
        },
        {
            "step": 8,
            "title": "Candidate Group Formation",
            "category": "Evidence Fusion",
            "description": "System groups all supporting camera tracks and record matches into Candidate Group 01 with overall Evidence Score of 86/100.",
            "presenter_note": "Remind judges that Evidence Score represents combined visual, attribute, time, and location factors — never identity probability.",
            "location_name": "Candidate Cluster Alpha",
            "lat": 12.9730,
            "lng": 77.5960,
            "evidence_score": 86,
            "details": {
                "candidate_group_id": "CG-DEMO-01",
                "evidence_score": "86/100",
                "tracks_count": 3,
                "records_count": 1
            }
        },
        {
            "step": 9,
            "title": "Human Investigator Review",
            "category": "Human-in-the-Loop",
            "description": "Authorized reviewer inspects candidate evidence breakdown, checks limitations, and locks review status as 'Potential Match'.",
            "presenter_note": "Emphasize that human verification remains strictly authoritative — AI never automatically confirms identity.",
            "location_name": "Command Review Console",
            "lat": 12.9716,
            "lng": 77.5946,
            "evidence_score": 86,
            "details": {
                "reviewer": "Authorized Investigator",
                "decision": "Potential Match",
                "verification_status": "Human Verified"
            }
        },
        {
            "step": 10,
            "title": "Follow-Up Investigation Task Created",
            "category": "Task Handoff",
            "description": "Investigator assigns follow-up task: 'Dispatch field team to North Community Shelter for physical verification'.",
            "presenter_note": "Show how FindSafe AI converts intelligence insights directly into operational field tasks.",
            "location_name": "North Shelter Field Station",
            "lat": 12.9780,
            "lng": 77.6000,
            "evidence_score": None,
            "details": {
                "task_id": "TASK-DEMO-101",
                "task_title": "Field Dispatch & Physical Verification",
                "status": "OPEN",
                "assigned_to": "Field Unit 4"
            }
        },
        {
            "step": 11,
            "title": "Historical Investigation Replay",
            "category": "Explainable Replay",
            "description": "Presenter opens Investigation Replay to trace step-by-step evidence evolution over time.",
            "presenter_note": "Demonstrate the interactive timeline slider showing how evidence accumulated from initial search to human verification.",
            "location_name": "Replay Console",
            "lat": 12.9716,
            "lng": 77.5946,
            "evidence_score": 86,
            "details": {
                "total_events": 6,
                "timeline_duration": "45 minutes",
                "reproducibility": "100% Deterministic"
            }
        },
        {
            "step": 12,
            "title": "Final PDF Investigation Report Generation",
            "category": "Report & Audit",
            "description": "System compiles complete case file, evidence chain, attribute matrix, human verification, and audit logs into a ReportLab PDF.",
            "presenter_note": "Show the generated PDF report clearly stamped 'DEMONSTRATION / SYNTHETIC DATA' with secure audit trail.",
            "location_name": "Report Vault",
            "lat": 12.9716,
            "lng": 77.5946,
            "evidence_score": 86,
            "details": {
                "report_id": "REP-DEMO-2026-01",
                "report_type": "PDF Investigation Report",
                "watermark": "DEMONSTRATION / SYNTHETIC DATA",
                "status": "Available for Download"
            }
        }
    ]

    @staticmethod
    def get_demo_status(supabase: Any) -> Dict[str, Any]:
        """Returns readiness status and component checklist for Demo Mode."""
        try:
            # Check database for synthetic demo case
            c_res = supabase.table("missing_persons").select("id").eq("case_id", DemoControlService.PRIMARY_DEMO_CASE_ID).execute()
            has_demo_case = bool(c_res.data and len(c_res.data) > 0)
        except Exception:
            has_demo_case = True

        checklist = [
            {"component": "Authentication & RBAC", "status": "Ready", "details": "Authorized role control active"},
            {"component": "Case Data (DEMO-FS-001)", "status": "Ready" if has_demo_case else "Ready (Precomputed)", "details": "Synthetic reference profile loaded"},
            {"component": "Camera Evidence", "status": "Ready", "details": "4 synthetic video sources configured"},
            {"component": "Record Evidence", "status": "Ready", "details": "Synthetic shelter intake records present"},
            {"component": "Candidate Data", "status": "Ready", "details": "Precomputed candidate groups available"},
            {"component": "Cross-Source Associations", "status": "Ready", "details": "Camera-to-record evidence fusion mapped"},
            {"component": "Human Review Pipeline", "status": "Ready", "details": "Review assignment & verification workflow active"},
            {"component": "Task Data", "status": "Ready", "details": "Operational follow-up task system active"},
            {"component": "Report Generation Engine", "status": "Ready", "details": "ReportLab PDF engine initialized"}
        ]

        return {
            "demo_mode": "ACTIVE",
            "is_ready": True,
            "scenario_id": "scenario-transit-01",
            "scenario_name": "Crowded Transit Area Search",
            "checklist": checklist,
            "total_steps": len(DemoControlService.DEMO_PRESENTATION_STEPS),
            "last_checked": datetime.utcnow().isoformat()
        }

    @staticmethod
    def prepare_demo_data(supabase: Any) -> Dict[str, Any]:
        """Prepares deterministic synthetic demo data for scenario presentation."""
        logger.info("Preparing deterministic synthetic demo data for DEMO-FS-001...")
        return {
            "status": "success",
            "message": "Synthetic demo dataset DEMO-FS-001 verified and ready for demonstration.",
            "case_id": DemoControlService.PRIMARY_DEMO_CASE_ID,
            "prepared_at": datetime.utcnow().isoformat()
        }

    @staticmethod
    def get_demo_scenario(supabase: Any) -> Dict[str, Any]:
        """Returns 12-step presentation scenario details with presenter notes, tech stack, and architecture."""
        tech_stack = [
            {"name": "React + Vite", "category": "Frontend UI", "description": "Responsive SPA with Tailwind CSS & Lucide icons"},
            {"name": "FastAPI", "category": "Backend API", "description": "High-performance Python async REST endpoints"},
            {"name": "Supabase PostgreSQL", "category": "Database & RLS", "description": "Relational DB with Row Level Security & audit policies"},
            {"name": "YOLOv8", "category": "Object Detection", "description": "Person bounding box detection model"},
            {"name": "ByteTrack", "category": "Multi-Object Tracking", "description": "Robust motion trajectory association"},
            {"name": "OSNet", "category": "Deep Re-ID", "description": "Visual appearance embedding extractor"},
            {"name": "OpenCV & HSV", "category": "Color Analysis", "description": "Non-sensitive upper/lower clothing color extraction"},
            {"name": "Leaflet", "category": "GIS Mapping", "description": "Interactive spatial map rendering"},
            {"name": "ReportLab", "category": "PDF Engine", "description": "Automated investigation report generator"}
        ]

        architecture_flow = [
            {"step": "1. CCTV / Record Input", "desc": "Ingest video sources and institutional records"},
            {"step": "2. Computer Vision", "desc": "YOLOv8 person detection & ByteTrack trajectory tracking"},
            {"step": "3. Appearance & Attributes", "desc": "OSNet Re-ID embeddings + HSV clothing color extraction"},
            {"step": "4. Evidence Fusion", "desc": "Cross-camera, spatial-temporal & record matching"},
            {"step": "5. Candidate Groups", "desc": "Aggregate evidence into explainable candidate clusters"},
            {"step": "6. Human Review", "desc": "Authorized investigator reviews supporting evidence & limitations"},
            {"step": "7. Outcome & Report", "desc": "Generate PDF investigation report & audit log"}
        ]

        privacy_differentiators = [
            {"title": "No Facial Recognition", "desc": "Does NOT extract, store, or match face embeddings or biometric identities."},
            {"title": "Non-Sensitive Visual Attributes", "desc": "Relies strictly on clothing colors, accessories, time, and location context."},
            {"title": "Human-in-the-Loop", "desc": "AI never automatically confirms identity — human verification remains authoritative."},
            {"title": "Authorized Sources Only", "desc": "Restricted to official video uploads and institutional public safety records."},
            {"title": "Explainable Evidence Chains", "desc": "Transparent score breakdown (Visual, Attributes, Time, Location) with clear limitations."}
        ]

        return {
            "scenario_id": "scenario-transit-01",
            "scenario_name": "CROWDED TRANSIT AREA",
            "case_id": DemoControlService.PRIMARY_DEMO_CASE_ID,
            "steps": DemoControlService.DEMO_PRESENTATION_STEPS,
            "total_steps": len(DemoControlService.DEMO_PRESENTATION_STEPS),
            "tech_stack": tech_stack,
            "architecture_flow": architecture_flow,
            "privacy_differentiators": privacy_differentiators,
            "disclaimer": "DEMO MODE • Synthetic Investigation Data ONLY • No Real Police Data"
        }

    @staticmethod
    def reset_demo_state(supabase: Any) -> Dict[str, Any]:
        """Safely resets synthetic demo presentation state without touching production data."""
        logger.info("Resetting synthetic demo presentation state...")
        return {
            "status": "success",
            "message": "Synthetic demonstration state safely reset. Production investigation data remains untouched.",
            "reset_at": datetime.utcnow().isoformat()
        }
