"""
FindSafe AI - Record Matching Service (Phase 7)

Compares missing-person case reference profiles against found-person records from:
Police, Hospital, Shelter, Public Reports.

Calculates multi-modal evidence score (Visual, Attributes, Location, Time, Age Context).
Ensures non-sensitive privacy guarantees and human-verification compliance.
"""

import math
import logging
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from app.services.reid_service import ReIDService
from app.services.attribute_service import AttributeService
from app.services.movement_service import MovementService
from app.services.record_embedding_service import RecordEmbeddingService

logger = logging.getLogger("findsafe.ai.record_matching")


class RecordMatchingService:
    """Service to execute evidence matching between missing person case and institutional record."""

    @staticmethod
    def match_case_to_record(
        case_data: Dict[str, Any],
        case_ref_embedding: Optional[List[float]],
        record_data: Dict[str, Any],
        record_embedding: Optional[List[float]] = None,
        search_radius_km: float = 25.0,
        time_window_hours: float = 72.0
    ) -> Dict[str, Any]:
        """
        Executes complete evidence comparison between case reference and found-person record.
        """
        has_record_image = bool(record_data.get("reference_image_url") or record_data.get("reference_image_path") or record_embedding)

        # 1. Visual Similarity (OSNet Re-ID Cosine Similarity)
        visual_similarity = 0.0
        if has_record_image and case_ref_embedding and record_embedding:
            visual_similarity = ReIDService.compute_cosine_similarity(case_ref_embedding, record_embedding)

        # 2. Attribute Profile Comparison (Phase 6 Attribute Engine Reuse)
        case_ref_profile = AttributeService.extract_reference_profile(case_data)
        
        record_attrs_dict = {
            "upper_clothing_color": (record_data.get("upper_clothing") or "unknown").lower(),
            "lower_clothing_color": (record_data.get("lower_clothing") or "unknown").lower(),
            "bag_present": bool(record_data.get("bag") and record_data.get("bag").lower() not in ("none", "unknown")),
            "accessories": (record_data.get("accessories") or "").lower(),
            "confidence": 0.85
        }
        
        attr_score, attr_breakdown = AttributeService.compare_attributes(case_ref_profile, record_attrs_dict)

        # 3. Location Distance Score (Haversine)
        c_lat, c_lng = case_data.get("last_seen_lat"), case_data.get("last_seen_lng")
        r_lat, r_lng = record_data.get("latitude"), record_data.get("longitude")
        
        distance_meters = 0.0
        location_score = 0.60  # Default neutral score if location is unknown

        if c_lat is not None and c_lng is not None and r_lat is not None and r_lng is not None:
            distance_meters = MovementService.haversine_distance(c_lat, c_lng, r_lat, r_lng)
            dist_km = distance_meters / 1000.0
            
            if dist_km <= search_radius_km:
                # Smooth decay inside search radius
                location_score = max(0.2, 1.0 - (dist_km / (search_radius_km * 1.5)))
            else:
                # Penalty outside search radius
                location_score = max(0.05, 0.5 * (search_radius_km / max(1.0, dist_km)))

        # 4. Temporal Consistency Score
        time_score = 0.60  # Default neutral score if timestamp missing
        time_diff_hours = 0.0

        c_time_str = case_data.get("last_seen_timestamp")
        r_time_str = record_data.get("record_timestamp")

        if c_time_str and r_time_str:
            try:
                c_time = RecordMatchingService._parse_iso_datetime(c_time_str)
                r_time = RecordMatchingService._parse_iso_datetime(r_time_str)

                if c_time and r_time:
                    time_diff_seconds = abs((r_time - c_time).total_seconds())
                    time_diff_hours = round(time_diff_seconds / 3600.0, 2)

                    if time_diff_hours <= time_window_hours:
                        time_score = max(0.2, 1.0 - (time_diff_hours / (time_window_hours * 1.2)))
                    else:
                        time_score = max(0.05, 0.4 * (time_window_hours / max(1.0, time_diff_hours)))
            except Exception as e:
                logger.debug(f"Error computing time match score: {str(e)}")

        # 5. Age Context Score (Structured textual age comparison only — NO face estimation)
        age_score = RecordMatchingService._compare_age_ranges(case_data.get("age_range"), record_data.get("age_range"))

        # 6. Evidence Fusion Weighting
        if has_record_image and case_ref_embedding and record_embedding:
            # Image available
            w_visual, w_attr, w_loc, w_time, w_age = 0.40, 0.25, 0.15, 0.15, 0.05
        else:
            # Image unavailable -> normalize remaining weights
            w_visual = 0.0
            w_attr = 0.25 / 0.60   # ~0.4167
            w_loc = 0.15 / 0.60    # ~0.2500
            w_time = 0.15 / 0.60   # ~0.2500
            w_age = 0.05 / 0.60    # ~0.0833

        overall_score_unit = (
            (visual_similarity * w_visual) +
            (attr_score * w_attr) +
            (location_score * w_loc) +
            (time_score * w_time) +
            (age_score * w_age)
        )
        
        overall_score_100 = round(float(np.clip(overall_score_unit * 100.0, 0.0, 100.0)), 1)

        # Build detailed evidence breakdown dictionary
        evidence_summary = {
            "has_record_image": has_record_image,
            "visual_similarity": round(float(visual_similarity), 3),
            "attribute_score": round(float(attr_score), 3),
            "location_score": round(float(location_score), 3),
            "time_score": round(float(time_score), 3),
            "age_score": round(float(age_score), 3),
            "distance_meters": round(float(distance_meters), 1),
            "time_diff_hours": round(float(time_diff_hours), 2),
            "attribute_breakdown": attr_breakdown,
            "normalized_weights": {
                "visual": round(w_visual, 3),
                "attribute": round(w_attr, 3),
                "location": round(w_loc, 3),
                "time": round(w_time, 3),
                "age": round(w_age, 3)
            }
        }

        return {
            "visual_similarity": round(float(visual_similarity), 3),
            "attribute_score": round(float(attr_score), 3),
            "location_score": round(float(location_score), 3),
            "time_score": round(float(time_score), 3),
            "age_score": round(float(age_score), 3),
            "overall_score": overall_score_100,
            "evidence_details": evidence_summary
        }

    @staticmethod
    def _parse_iso_datetime(dt_val: Any) -> Optional[datetime]:
        """Parses ISO timestamp string or datetime object into timezone-aware UTC datetime."""
        if isinstance(dt_val, datetime):
            return dt_val.astimezone(timezone.utc)
        if isinstance(dt_val, str):
            try:
                dt_str = dt_val.replace("Z", "+00:00")
                return datetime.fromisoformat(dt_str).astimezone(timezone.utc)
            except Exception:
                return None
        return None

    @staticmethod
    def _compare_age_ranges(c_age: Optional[str], r_age: Optional[str]) -> float:
        """Compares structured age range strings contextual evidence (NO face inference)."""
        if not c_age or not r_age or c_age.lower() == "unknown" or r_age.lower() == "unknown":
            return 0.60

        c_clean = c_age.strip().lower()
        r_clean = r_age.strip().lower()

        if c_clean == r_clean:
            return 1.0

        # Extract numeric bounds if possible (e.g. "20-30" -> 20, 30)
        try:
            c_nums = [int(s) for s in c_clean.replace("-", " ").split() if s.isdigit()]
            r_nums = [int(s) for s in r_clean.replace("-", " ").split() if s.isdigit()]

            if len(c_nums) >= 2 and len(r_nums) >= 2:
                c_min, c_max = c_nums[0], c_nums[1]
                r_min, r_max = r_nums[0], r_nums[1]

                # Check overlap
                overlap = max(0, min(c_max, r_max) - max(c_min, r_min))
                if overlap > 0:
                    return 0.85
                elif abs(c_min - r_min) <= 10:
                    return 0.50
                else:
                    return 0.25
        except Exception:
            pass

        return 0.60
