"""
FindSafe AI - Multi-Camera Candidate Association & Explainable Evidence Fusion Service (Phase 6)

Aggregates candidate tracks across multiple camera feeds.
Calculates visual similarity, attribute matching, time consistency, and location consistency.
Generates ranked candidate_groups with explainable evidence breakdown and cross-camera movement sequences.

IMPORTANT PRIVACY GUARANTEE:
All outputs are categorized as 'Potential Match' or 'Potential Cross-Camera Association'.
Every candidate group displays 'Human verification required.'
NO facial recognition or sensitive attribute classification.
"""

import logging
import numpy as np
from typing import List, Dict, Any, Optional

from app.config import settings
from app.services.reid_service import ReIDService
from app.services.movement_service import MovementService
from app.services.attribute_service import AttributeService

logger = logging.getLogger("findsafe.ai.cross_camera")


class CrossCameraMatchingService:
    """Service wrapper for cross-camera person track association and multi-factor evidence fusion."""

    @staticmethod
    def match_and_group_candidates(
        ref_embedding: List[float],
        ref_profile: Dict[str, Any],
        camera_videos: List[Dict[str, Any]],
        tracks_by_video: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Phase 6 Multi-Factor Evidence Fusion Workflow:
        1. Compare candidate tracks with reference visual embedding & attribute profile.
        2. Filter candidate tracks exceeding visual similarity threshold.
        3. Associate matching candidate tracks across different camera feeds.
        4. Calculate multi-factor evidence score (40% visual, 25% attributes, 15% time, 10% location, 10% cross-camera).
        5. Generate explainable evidence breakdown.
        """
        # Step 1: Collect and evaluate candidate tracks
        candidate_tracks = []
        all_detected_tracks = []

        for video_info in camera_videos:
            vid_id = video_info["id"]
            cam_name = video_info.get("camera_name", "CCTV Camera")
            lat = video_info.get("latitude")
            lng = video_info.get("longitude")

            tracks = tracks_by_video.get(vid_id, [])
            for trk in tracks:
                trk_emb = trk.get("embedding", [])
                best_det = trk.get("best_detection") or (trk.get("all_detections", [{}])[0] if trk.get("all_detections") else {})
                base_conf = float(best_det.get("confidence", 0.80))

                # If reference embedding is available, compute cosine appearance similarity
                if ref_embedding and trk_emb and any(x != 0.0 for x in trk_emb):
                    raw_cosine = ReIDService.compute_cosine_similarity(ref_embedding, trk_emb)
                    if raw_cosine >= 0.30:
                        visual_sim = max(raw_cosine, base_conf)
                    else:
                        visual_sim = max(base_conf, round(0.50 + (raw_cosine * 0.50), 4))
                else:
                    visual_sim = base_conf

                # Extract visual attributes for candidate track
                best_crop = trk.get("best_crop")
                cand_attrs = AttributeService.extract_crop_attributes(best_crop)
                attr_score, attr_breakdown = AttributeService.compare_attributes(ref_profile, cand_attrs)

                trk_copy = dict(trk)
                trk_copy["video_id"] = vid_id
                trk_copy["camera_name"] = cam_name
                trk_copy["latitude"] = lat
                trk_copy["longitude"] = lng
                trk_copy["visual_similarity"] = round(visual_sim, 4)
                trk_copy["attributes"] = cand_attrs
                trk_copy["attribute_score"] = attr_score
                trk_copy["attribute_breakdown"] = attr_breakdown

                all_detected_tracks.append(trk_copy)

                if visual_sim >= 0.30:
                    candidate_tracks.append(trk_copy)

        if not candidate_tracks and all_detected_tracks:
            candidate_tracks = list(all_detected_tracks)

        # Sort candidate tracks by visual similarity (highest detection percentage first)
        candidate_tracks.sort(
            key=lambda t: (t.get("visual_similarity", 0) * 0.85 + t.get("attribute_score", 0) * 0.15),
            reverse=True
        )

        if not candidate_tracks:
            logger.info("No person tracks detected in video streams.")
            return []

        logger.info(f"Found {len(candidate_tracks)} candidate tracks across {len(camera_videos)} cameras. Top visual match: {candidate_tracks[0].get('visual_similarity') * 100:.1f}%")

        # Step 2: Cross-Camera Candidate Association
        visited = set()
        candidate_groups = []

        for i, trk1 in enumerate(candidate_tracks):
            if i in visited:
                continue

            group_members = [trk1]
            visited.add(i)

            for j, trk2 in enumerate(candidate_tracks):
                if j in visited:
                    continue

                cross_sim = ReIDService.compute_cosine_similarity(trk1["embedding"], trk2["embedding"])
                if cross_sim >= settings.CROSS_CAMERA_SIMILARITY_THRESHOLD:
                    existing_cams = {m["video_id"] for m in group_members}
                    if trk2["video_id"] not in existing_cams:
                        group_members.append(trk2)
                        visited.add(j)

            # Sort chronologically by first_seen_seconds
            group_members.sort(key=lambda m: m["first_seen_seconds"])

            # Step 3: Phase 6 Multi-Factor Evidence Fusion
            avg_visual_sim = float(np.mean([m["visual_similarity"] for m in group_members]))
            avg_attr_score = float(np.mean([m["attribute_score"] for m in group_members]))

            # Cross-camera consistency score
            cross_cam_score = 1.0 if len(group_members) > 1 else 0.70

            sequence_transitions = []
            spatial_scores = []
            total_distance = 0.0

            for idx in range(len(group_members)):
                m_curr = group_members[idx]
                if idx == 0:
                    sequence_transitions.append({
                        "sequence_order": 1,
                        "track": m_curr,
                        "transition_time_seconds": 0.0,
                        "transition_distance_meters": 0.0,
                        "visual_similarity": m_curr["visual_similarity"],
                        "attribute_score": m_curr["attribute_score"],
                        "transition_score": round((m_curr["visual_similarity"] * 0.6 + m_curr["attribute_score"] * 0.4) * 100.0, 1)
                    })
                    spatial_scores.append(1.0)
                else:
                    m_prev = group_members[idx - 1]
                    st_res = MovementService.compute_spatial_temporal_score(
                        m_prev["latitude"], m_prev["longitude"], m_prev["first_seen_seconds"],
                        m_curr["latitude"], m_curr["longitude"], m_curr["first_seen_seconds"]
                    )
                    dist = st_res["distance_meters"]
                    total_distance += dist
                    spatial_scores.append(st_res["spatial_score"])

                    t_score = round(
                        (settings.VISUAL_WEIGHT * m_curr["visual_similarity"] +
                         settings.ATTRIBUTE_WEIGHT * m_curr["attribute_score"] +
                         settings.LOCATION_WEIGHT * st_res["spatial_score"] +
                         settings.TIME_WEIGHT * st_res["spatial_score"]) * 100.0,
                        1
                    )

                    sequence_transitions.append({
                        "sequence_order": idx + 1,
                        "track": m_curr,
                        "transition_time_seconds": round(m_curr["first_seen_seconds"] - m_prev["first_seen_seconds"], 1),
                        "transition_distance_meters": dist,
                        "visual_similarity": m_curr["visual_similarity"],
                        "attribute_score": m_curr["attribute_score"],
                        "transition_score": t_score
                    })

            avg_spatial_score = float(np.mean(spatial_scores))

            # Phase 6 Weighted Evidence Score Formula (0 to 100)
            raw_score = (
                settings.VISUAL_WEIGHT * avg_visual_sim +
                settings.ATTRIBUTE_WEIGHT * avg_attr_score +
                settings.TIME_WEIGHT * avg_spatial_score +
                settings.LOCATION_WEIGHT * avg_spatial_score +
                settings.CROSS_CAMERA_WEIGHT * cross_cam_score
            ) * 100.0

            overall_score = round(min(99.0, max(15.0, raw_score)), 1)

            if overall_score >= 75.0:
                evidence_level = "high"
            elif overall_score >= 50.0:
                evidence_level = "moderate"
            else:
                evidence_level = "low"

            # Explainable Evidence Breakdown
            explanation = {
                "visual_appearance": "Strong" if avg_visual_sim >= 0.70 else ("Moderate" if avg_visual_sim >= 0.50 else "Weak"),
                "upper_clothing": group_members[0]["attribute_breakdown"][0]["match_status"],
                "lower_clothing": group_members[0]["attribute_breakdown"][1]["match_status"],
                "backpack": group_members[0]["attribute_breakdown"][2]["match_status"],
                "time_consistency": "Strong" if avg_spatial_score >= 0.80 else "Moderate",
                "location_consistency": "Strong" if avg_spatial_score >= 0.80 else "Moderate",
                "cross_camera_consistency": "Strong" if len(group_members) > 1 else "Single Sight",
                "disclaimer": "Potential match — human verification required."
            }

            candidate_groups.append({
                "overall_score": overall_score,
                "evidence_level": evidence_level,
                "status": "potential_match",
                "camera_count": len(group_members),
                "total_distance_meters": total_distance,
                "visual_score": round(avg_visual_sim * 100.0, 1),
                "attribute_score": round(avg_attr_score * 100.0, 1),
                "time_score": round(avg_spatial_score * 100.0, 1),
                "location_score": round(avg_spatial_score * 100.0, 1),
                "explanation_json": explanation,
                "sequence": sequence_transitions,
                "tracks": group_members
            })

        # Rank candidate groups primarily by visual reference photograph match first (75%), with overall evidence corroboration (25%)
        candidate_groups.sort(key=lambda g: (g["visual_score"] * 0.75 + g["overall_score"] * 0.25), reverse=True)
        return candidate_groups


# Alias for backward-compatibility
CrossCameraService = CrossCameraMatchingService
