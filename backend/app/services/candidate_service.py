"""
FindSafe AI - Candidate Group & Attribute Evidence Persistence Service (Phase 6)
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("findsafe.ai.candidate_service")


class CandidateService:
    """Handles candidate group & explainable attribute evidence persistence into Supabase PostgreSQL."""

    @staticmethod
    def persist_candidate_results(
        supabase: Any,
        search_session_id: str,
        case_id: str,
        candidate_groups: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Persists generated candidate_groups, candidate_group_tracks, track_attributes, and candidate_evidence in PostgreSQL.
        Returns list of created candidate group IDs.
        """
        if not supabase or not candidate_groups:
            return []

        created_group_ids = []

        try:
            for grp in candidate_groups:
                # Insert candidate_group with Phase 6 evidence breakdown fields
                group_data = {
                    "search_session_id": search_session_id,
                    "case_id": case_id if (case_id and len(case_id) >= 32 and case_id != "ALL") else None,
                    "overall_score": grp["overall_score"],
                    "visual_score": grp.get("visual_score", 0.0),
                    "attribute_score": grp.get("attribute_score", 0.0),
                    "time_score": grp.get("time_score", 0.0),
                    "location_score": grp.get("location_score", 0.0),
                    "cross_camera_score": grp.get("cross_camera_score", 0.0),
                    "evidence_level": grp["evidence_level"],
                    "status": grp["status"],
                    "camera_count": grp["camera_count"],
                    "explanation_json": grp.get("explanation_json", {})
                }
                group_res = None
                try:
                    group_res = supabase.table("candidate_groups").insert(group_data).execute()
                except Exception as insert_err:
                    if group_data.get("case_id"):
                        group_data["case_id"] = None
                        try:
                            group_res = supabase.table("candidate_groups").insert(group_data).execute()
                        except Exception:
                            pass
                    logger.warning(f"Notice during candidate_group insert: {insert_err}")

                if not group_res or not group_res.data:
                    continue

                group_id = group_res.data[0]["id"]
                created_group_ids.append(group_id)

                # Insert candidate_group_tracks & track_attributes
                seq_records = []
                for seq in grp.get("sequence", []):
                    trk = seq["track"]
                    seq_records.append({
                        "candidate_group_id": group_id,
                        "person_track_id": trk["db_track_id"],
                        "sequence_order": seq["sequence_order"],
                        "transition_time_seconds": seq["transition_time_seconds"],
                        "transition_distance_meters": seq["transition_distance_meters"],
                        "visual_similarity": seq["visual_similarity"],
                        "transition_score": seq["transition_score"]
                    })

                    # Persist track_attributes if present
                    if trk.get("attributes"):
                        attrs = trk["attributes"]
                        try:
                            supabase.table("track_attributes").insert({
                                "person_track_id": trk["db_track_id"],
                                "upper_clothing_color": attrs.get("upper_clothing_color", "unknown"),
                                "upper_clothing_type": attrs.get("upper_clothing_type", "top"),
                                "lower_clothing_color": attrs.get("lower_clothing_color", "unknown"),
                                "lower_clothing_type": attrs.get("lower_clothing_type", "bottom"),
                                "bag_present": attrs.get("bag_present", False),
                                "bag_type": attrs.get("bag_type", "unknown"),
                                "hat_present": attrs.get("hat_present", False),
                                "attribute_confidence": attrs.get("confidence", 0.8)
                            }).execute()
                        except Exception as attr_err:
                            logger.warning(f"Could not save track_attributes for track {trk['db_track_id']}: {str(attr_err)}")

                if seq_records:
                    supabase.table("candidate_group_tracks").insert(seq_records).execute()

                # Insert into candidates table for review pages
                best_seq = grp["sequence"][0] if grp.get("sequence") else None
                best_trk = best_seq["track"] if best_seq else None

                candidate_record = {
                    "search_session_id": search_session_id,
                    "track_id": str(best_trk["track_id"]) if best_trk else "1",
                    "evidence_image_path": best_trk.get("crop_storage_path") if best_trk else None,
                    "visual_similarity": grp["overall_score"] / 100.0,
                    "overall_score": grp["overall_score"],
                    "verification_status": "potential_match"
                }
                c_res = supabase.table("candidates").insert(candidate_record).execute()
                if c_res.data:
                    c_id = c_res.data[0]["id"]
                    # Insert candidate_evidence breakdown items
                    if best_trk and best_trk.get("attribute_breakdown"):
                        ev_records = []
                        for ab in best_trk["attribute_breakdown"]:
                            ev_records.append({
                                "candidate_id": c_id,
                                "evidence_type": ab["attribute_type"],
                                "description": f"{ab['attribute_type']}: Ref({ab['reference_value']}) vs Cand({ab['candidate_value']})",
                                "value": ab["candidate_value"],
                                "confidence": ab["confidence"],
                                "attribute_type": ab["attribute_type"],
                                "reference_value": ab["reference_value"],
                                "candidate_value": ab["candidate_value"],
                                "match_status": ab["match_status"]
                            })
                        try:
                            supabase.table("candidate_evidence").insert(ev_records).execute()
                        except Exception as ev_err:
                            logger.warning(f"Could not save candidate_evidence items: {str(ev_err)}")

            logger.info(f"Persisted {len(created_group_ids)} candidate groups with Phase 6 attribute evidence.")
        except Exception as e:
            logger.error(f"Error persisting candidate results: {str(e)}", exc_info=True)

        return created_group_ids
