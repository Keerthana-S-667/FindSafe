"""
FindSafe AI - Geographic & Temporal Movement Plausibility Service (Phase 5)

Calculates Haversine spatial distance, time differences, and movement sequence plausibility
between camera sightings across different locations.
"""

import math
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("findsafe.ai.movement")


class MovementService:
    """Service for Haversine distance and spatial-temporal transition scoring."""

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates geographic distance in meters between two lat/lng coordinates using Haversine formula.
        """
        R = 6371000.0  # Earth's radius in meters

        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = (math.sin(dphi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        return round(R * c, 1)

    @staticmethod
    def compute_spatial_temporal_score(
        lat1: Optional[float], lon1: Optional[float], time1: float,
        lat2: Optional[float], lon2: Optional[float], time2: float
    ) -> Dict[str, Any]:
        """
        Calculates time difference, distance, speed, and spatial-temporal plausibility score in range [0.0, 1.0].
        """
        time_diff = abs(time2 - time1)

        # Default fallback if geographic coordinates are missing
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            # Temporal decay score: higher if within reasonable time window (e.g. 0 to 60 mins)
            time_score = max(0.2, 1.0 - (time_diff / 7200.0))  # Decay over 2 hours
            return {
                "distance_meters": 0.0,
                "time_diff_seconds": time_diff,
                "speed_mps": 0.0,
                "spatial_score": round(time_score, 3),
                "is_plausible": True
            }

        distance = MovementService.haversine_distance(lat1, lon1, lat2, lon2)
        speed_mps = distance / max(1.0, time_diff)

        # Walking speed ~ 1.4 m/s (5 km/h), vehicle speed ~ 15-25 m/s (50-90 km/h)
        # Unrealistic speed threshold > 35 m/s (~126 km/h)
        if speed_mps > 35.0 and distance > 500:
            spatial_score = 0.2
            is_plausible = False
        else:
            # Optimal score when speed is between 0.5 m/s and 20 m/s
            spatial_score = max(0.4, 1.0 - (distance / 50000.0))
            is_plausible = True

        return {
            "distance_meters": distance,
            "time_diff_seconds": time_diff,
            "speed_mps": round(speed_mps, 2),
            "spatial_score": round(spatial_score, 3),
            "is_plausible": is_plausible
        }
