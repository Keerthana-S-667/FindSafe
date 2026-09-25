"""
FindSafe AI - Investigation Replay & Scenario API Routes (Phase 13)
Endpoints for investigation replay timelines and synthetic demo scenario walkthroughs.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.supabase import get_supabase_client
from app.services.investigation_replay_service import InvestigationReplayService
from app.services.scenario_service import ScenarioService

logger = logging.getLogger("findsafe.ai.replay_routes")

router = APIRouter(tags=["replay"])


@router.get("/search-sessions/{session_id}/replay")
def get_session_replay(session_id: str, db=Depends(get_supabase_client)):
    """Retrieves chronological investigation replay event timeline for a completed search session."""
    replay = InvestigationReplayService.get_session_replay(db, session_id)
    if not replay["session"]:
        raise HTTPException(status_code=404, detail=f"Search session '{session_id}' replay unavailable.")
    return replay


@router.get("/scenarios")
def get_demo_scenarios(db=Depends(get_supabase_client)):
    """Retrieves list of precomputed synthetic demo scenarios for presentation and training."""
    return ScenarioService.get_scenarios(db)


@router.get("/scenarios/{scenario_id}")
def get_demo_scenario_detail(scenario_id: str, db=Depends(get_supabase_client)):
    """Retrieves detailed synthetic scenario events and reference profile for demo walkthrough."""
    return ScenarioService.get_scenario_detail(db, scenario_id)
