"""
FindSafe AI - Scenario Service (Phase 13)
Provides controlled synthetic presentation scenarios for hackathon demonstrations.
Enforces privacy and separation: Synthetic Demo Data ONLY. Does NOT touch real cases.
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("findsafe.ai.scenario_service")


class ScenarioService:
    """Service handling precomputed synthetic demo scenarios for presentation and training."""

    SYNTHETIC_SCENARIOS = [
        {
            "id": "scenario-transit-01",
            "name": "Scenario 01: Crowded Transit Terminal Search",
            "description": "Multi-camera CCTV analysis across 4 terminal cameras with visual attribute matching & shelter record association.",
            "scenario_type": "crowded_transit",
            "status": "ready",
            "reference_profile": {
                "name": "Synthetic Subject (Transit Case)",
                "case_code": "DEMO-2026-001",
                "upper_clothing": "Red Jacket",
                "lower_clothing": "Black Jeans",
                "bag": "Blue Backpack",
                "last_seen": "Central Transit Concourse"
            },
            "events_count": 7
        },
        {
            "id": "scenario-market-02",
            "name": "Scenario 02: Market Concourse Multi-Camera Analysis",
            "description": "Cross-camera sequence tracking across high-density pedestrian market feeds with temporal interval reasoning.",
            "scenario_type": "market_concourse",
            "status": "ready",
            "reference_profile": {
                "name": "Synthetic Subject (Market Case)",
                "case_code": "DEMO-2026-002",
                "upper_clothing": "Yellow Hoodie",
                "lower_clothing": "Dark Grey Trousers",
                "bag": "None",
                "last_seen": "South Pedestrian Gate"
            },
            "events_count": 6
        },
        {
            "id": "scenario-records-03",
            "name": "Scenario 03: Cross-Source Institutional Record Match",
            "description": "Integrated search comparing camera candidate groups with police shelter intake records.",
            "scenario_type": "cross_source_records",
            "status": "ready",
            "reference_profile": {
                "name": "Synthetic Subject (Shelter Match)",
                "case_code": "DEMO-2026-003",
                "upper_clothing": "Blue Sweater",
                "lower_clothing": "Black Pants",
                "bag": "Brown Duffel Bag",
                "last_seen": "Pedestrian Bridge"
            },
            "events_count": 8
        }
    ]

    @staticmethod
    def get_scenarios(supabase: Any) -> List[Dict[str, Any]]:
        """Returns list of precomputed synthetic demo scenarios."""
        return ScenarioService.SYNTHETIC_SCENARIOS

    @staticmethod
    def get_scenario_detail(supabase: Any, scenario_id: str) -> Dict[str, Any]:
        """Returns ordered synthetic scenario events and reference profile for demo walkthrough."""
        # Find matching scenario header
        matching = next((s for s in ScenarioService.SYNTHETIC_SCENARIOS if s["id"] == scenario_id), ScenarioService.SYNTHETIC_SCENARIOS[0])

        events = [
            {
                "sequence_number": 1,
                "event_type": "SEARCH_STARTED",
                "title": "Scenario Search Initiated",
                "timestamp": "14:20",
                "description": f"Launched Search Everywhere for {matching['reference_profile']['name']} ({matching['reference_profile']['case_code']}).",
                "location_name": "Central Terminal Gate 1",
                "evidence_score": None,
                "lat": 28.6139,
                "lng": 77.2090
            },
            {
                "sequence_number": 2,
                "event_type": "INPUT_PROCESSED",
                "title": "Camera 01 (Main Concourse) Analyzed",
                "timestamp": "14:22",
                "description": "Detected person candidate track matching Red Jacket & Blue Backpack descriptors.",
                "location_name": "Main Concourse Entrance",
                "evidence_score": 88,
                "lat": 28.6145,
                "lng": 77.2085
            },
            {
                "sequence_number": 3,
                "event_type": "INPUT_PROCESSED",
                "title": "Camera 02 (North Concourse) Analyzed",
                "timestamp": "14:28",
                "description": "Extracted Re-ID feature vector; high cosine similarity with Camera 01 track.",
                "location_name": "North Pedestrian Corridor",
                "evidence_score": 85,
                "lat": 28.6152,
                "lng": 77.2092
            },
            {
                "sequence_number": 4,
                "event_type": "CANDIDATE_CREATED",
                "title": "Candidate Group 01 Generated",
                "timestamp": "14:32",
                "description": "Formed cross-camera candidate group. Attribute consistency: Upper(Red), Lower(Black), Bag(Blue).",
                "location_name": "Terminal Zone",
                "evidence_score": 86,
                "lat": 28.6148,
                "lng": 77.2088
            },
            {
                "sequence_number": 5,
                "event_type": "RECORD_MATCH_CREATED",
                "title": "Shelter Entry Record Associated",
                "timestamp": "14:52",
                "description": "Matched compatible shelter intake log REC-021 recorded within search radius.",
                "location_name": "Central Shelter Facility",
                "evidence_score": 84,
                "lat": 28.6170,
                "lng": 77.2110
            },
            {
                "sequence_number": 6,
                "event_type": "REVIEW_UPDATED",
                "title": "Authorized Reviewer Verified Lead",
                "timestamp": "15:05",
                "description": "Human investigator evaluated evidence chain and marked verification state in database.",
                "location_name": "Command Center",
                "evidence_score": 86,
                "lat": 28.6139,
                "lng": 77.2090
            }
        ]

        return {
            "scenario": matching,
            "events": events,
            "total_events": len(events),
            "privacy_notice": "SCENARIO MODE • Synthetic Demo Data ONLY • No real biometric or police data used."
        }
