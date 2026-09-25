"""
FindSafe AI - Multi-Camera Computer Vision & Attribute AI Orchestrator (Phase 6)

Orchestrates multi-camera video ingestion, YOLO person detection, ByteTrack trajectory tracking,
OSNet Re-ID appearance feature extraction, visual attribute intelligence, cross-camera track association, and explainable evidence fusion.

IMPORTANT PRIVACY GUARANTEE:
Operating strictly on visual appearance, clothing, accessories, and spatial-temporal context.
NO facial recognition or sensitive personal identifier extraction.
All candidate results are flagged as 'Potential Match' and specify 'Human verification required.'
"""

import os
import cv2
import tempfile
import logging
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

from app.config import settings
from app.database.supabase import get_supabase_admin_client, get_supabase_client
from app.services.detection_service import PersonDetectionService
from app.services.tracking_service import TrackingService
from app.services.reid_service import ReIDService
from app.services.attribute_service import AttributeService
from app.services.cross_camera_service import CrossCameraMatchingService
from app.services.candidate_service import CandidateService

logger = logging.getLogger("findsafe.ai.video_analysis")


class VideoAIOrchestrator:
    """
    Main AI orchestrator for multi-camera video analysis & candidate matching.
    """

    def __init__(self):
        logger.info("Initializing VideoAIOrchestrator for Phase 6 multi-camera attribute search.")

    def process_multi_camera_session(
        self,
        search_session_id: str,
        case_id: str,
        user_id: str,
        videos: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes end-to-end multi-camera analysis:
        1. Download reference image for case_id, load case descriptors, and extract reference embedding & attribute profile.
        2. For each camera video:
           a. Process video with YOLO + ByteTrack
           b. Extract representative crops
           c. Compute appearance embeddings and clothing/accessory attributes
           d. Store person_tracks, person_embeddings, and track_attributes in DB & Storage
        3. Perform cross-camera track matching & multi-factor evidence fusion.
        4. Persist candidate_groups, candidate_group_tracks, and candidate_evidence in DB.
        5. Update search session status to 'completed'.
        """
        supabase = get_supabase_admin_client() or get_supabase_client()
        if not supabase:
            logger.error("Supabase client unavailable for multi-camera session.")
            return {"status": "failed", "error": "Database unavailable."}

        logger.info(f"Starting Multi-Camera AI Processing for Session {search_session_id} ({len(videos)} camera videos)")

        try:
            # Update session status
            self._update_session(
                supabase, search_session_id,
                status="processing",
                processing_stage="reading_videos",
                processing_progress=5
            )

            # Step 1: Obtain Reference Image, Appearance Embedding, and Attribute Profile
            ref_image, ref_embedding, ref_profile = self._load_reference_data(supabase, case_id)
            if not ref_embedding:
                logger.warning(f"Could not load reference image for case {case_id}. Using fallback zero-embedding.")
                ref_embedding = [0.0] * 512

            # Step 2: Process Each Camera Video Sequentially
            tracks_by_video: Dict[str, List[Dict[str, Any]]] = {}
            total_videos = len(videos)

            for v_idx, v_info in enumerate(videos):
                vid_id = v_info["id"]
                cam_name = v_info.get("camera_name", f"Camera {v_idx + 1}")
                local_path = v_info.get("local_path")
                storage_video_path = v_info.get("video_path")

                logger.info(f"Processing Camera Video {v_idx + 1}/{total_videos}: {cam_name}")

                self._update_session_video(
                    supabase, vid_id,
                    processing_status="processing",
                    processing_stage="detecting_people",
                    processing_progress=10
                )

                if not local_path or not os.path.exists(local_path):
                    logger.warning(f"Local video file missing for {vid_id}, skipping.")
                    continue

                # Run YOLO + ByteTrack on Video
                self._update_session_video(supabase, vid_id, processing_stage="tracking_people", processing_progress=30)
                extracted_tracks, annotated_frames = TrackingService.process_video_tracks(
                    video_path=local_path,
                    target_fps=float(settings.VIDEO_SAMPLE_FPS),
                    max_sampled_frames=settings.MAX_SAMPLED_FRAMES
                )

                # Save visual YOLO-annotated frames for frame-by-frame presentation
                self._persist_annotated_frames(
                    supabase=supabase,
                    search_session_id=search_session_id,
                    video_id=vid_id,
                    user_id=user_id,
                    case_id=case_id,
                    annotated_frames=annotated_frames
                )

                # Save tracks & crops to DB & Storage
                self._update_session_video(supabase, vid_id, processing_stage="generating_embeddings", processing_progress=70)
                db_tracks = self._persist_video_tracks(
                    supabase=supabase,
                    search_session_id=search_session_id,
                    video_id=vid_id,
                    user_id=user_id,
                    case_id=case_id,
                    camera_id=v_info.get("camera_id"),
                    camera_name=cam_name,
                    tracks=extracted_tracks
                )

                tracks_by_video[vid_id] = db_tracks

                self._update_session_video(
                    supabase, vid_id,
                    processing_status="completed",
                    processing_stage="completed",
                    processing_progress=100,
                    sampled_frames=len(annotated_frames)
                )

                # Progress map for session across videos (10% to 75%)
                session_pct = 10 + int(((v_idx + 1) / total_videos) * 65)
                self._update_session(
                    supabase, search_session_id,
                    processing_stage="tracking_people",
                    processing_progress=session_pct,
                    sampled_frames=len(annotated_frames)
                )

            # Step 3: Cross-Camera Candidate Association & Phase 6 Evidence Fusion
            self._update_session(
                supabase, search_session_id,
                status="processing",
                processing_stage="cross_camera_analysis",
                processing_progress=80
            )

            candidate_groups = CrossCameraMatchingService.match_and_group_candidates(
                ref_embedding=ref_embedding,
                ref_profile=ref_profile,
                camera_videos=videos,
                tracks_by_video=tracks_by_video
            )

            # Step 4: Persist Candidate Groups in PostgreSQL
            self._update_session(
                supabase, search_session_id,
                processing_stage="finalizing",
                processing_progress=90
            )

            created_ids = CandidateService.persist_candidate_results(
                supabase=supabase,
                search_session_id=search_session_id,
                case_id=case_id,
                candidate_groups=candidate_groups
            )

            # Step 5: Mark Session Completed
            self._update_session(
                supabase, search_session_id,
                status="completed",
                processing_stage="completed",
                processing_progress=100,
                completed_at=datetime.now(timezone.utc).isoformat()
            )

            logger.info(f"Multi-Camera AI Processing completed successfully. Generated {len(candidate_groups)} candidate groups.")
            return {
                "status": "completed",
                "search_session_id": search_session_id,
                "candidate_groups_count": len(candidate_groups),
                "created_group_ids": created_ids
            }

        except Exception as e:
            logger.error(f"Multi-camera AI processing failed for session {search_session_id}: {str(e)}", exc_info=True)
            self._update_session(
                supabase, search_session_id,
                status="failed",
                processing_stage="failed",
                error_message="Multi-camera processing failed. Please verify video files and parameters."
            )
            return {"status": "failed", "error": str(e)}

    def _load_reference_data(self, supabase: Any, case_id: str) -> Tuple[Optional[Any], Optional[List[float]], Dict[str, Any]]:
        """Loads reference photograph & case attribute descriptors for missing person case."""
        try:
            res = supabase.table("missing_persons").select("*").eq("id", case_id).execute()
            if not res.data:
                res = supabase.table("missing_persons").select("*").eq("case_id", case_id).execute()

            if not res.data:
                return None, None, {}

            case_item = res.data[0]
            ref_url = case_item.get("reference_image_url")
            ref_img = None
            ref_emb = None

            if ref_url:
                import httpx
                resp = httpx.get(ref_url, timeout=10.0)
                if resp.status_code == 200:
                    arr = np.frombuffer(resp.content, np.uint8)
                    ref_img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                    if ref_img is not None:
                        ref_emb = ReIDService.extract_appearance_embedding(ref_img)

            ref_profile = AttributeService.extract_reference_profile(case_item, ref_img)
            return ref_img, ref_emb, ref_profile

        except Exception as e:
            logger.warning(f"Could not load reference data: {str(e)}")

        return None, None, {}

    def _persist_video_tracks(
        self,
        supabase: Any,
        search_session_id: str,
        video_id: str,
        user_id: str,
        case_id: str,
        camera_id: Optional[str],
        camera_name: str,
        tracks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Saves representative crops to evidence-frames storage and records person_tracks in DB."""
        db_tracks = []

        for trk in tracks:
            best_crop = trk.get("best_crop")
            crop_storage_path = None

            if best_crop is not None and best_crop.size > 0:
                crop_filename = f"track_{trk['track_id']:03d}_crop.jpg"
                crop_storage_path = f"{user_id}/{case_id}/{search_session_id}/{video_id}/{crop_filename}"

                try:
                    ret, buf = cv2.imencode(".jpg", best_crop, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
                    if ret:
                        supabase.storage.from_("evidence-frames").upload(
                            path=crop_storage_path,
                            file=buf.tobytes(),
                            file_options={"content-type": "image/jpeg", "upsert": "true"}
                        )
                except Exception as upload_err:
                    logger.warning(f"Crop upload failed for track {trk['track_id']}: {str(upload_err)}")

            # Insert person_track record
            track_data = {
                "search_session_video_id": video_id,
                "search_session_id": search_session_id,
                "camera_id": camera_id if camera_id else None,
                "camera_name": camera_name,
                "track_id": trk["track_id"],
                "first_seen_seconds": trk["first_seen_seconds"],
                "last_seen_seconds": trk["last_seen_seconds"],
                "frame_count": trk["frame_count"],
                "best_crop_path": crop_storage_path
            }

            try:
                t_res = supabase.table("person_tracks").insert(track_data).execute()
                if t_res.data:
                    db_id = t_res.data[0]["id"]
                    trk["db_track_id"] = db_id
                    trk["crop_storage_path"] = crop_storage_path

                    # Save embedding vector
                    if trk.get("embedding"):
                        supabase.table("person_embeddings").insert({
                            "person_track_id": db_id,
                            "embedding": trk["embedding"],
                            "model_name": settings.REID_MODEL
                        }).execute()

                    db_tracks.append(trk)
            except Exception as trk_err:
                logger.error(f"Failed to insert person_track record: {str(trk_err)}")

        return db_tracks

    def _persist_annotated_frames(
        self,
        supabase: Any,
        search_session_id: str,
        video_id: str,
        user_id: str,
        case_id: str,
        annotated_frames: List[Dict[str, Any]]
    ) -> int:
        """Saves visual YOLO annotated frames to evidence-frames storage and records them in video_frames table."""
        saved_count = 0
        for f_item in annotated_frames:
            frame_idx = f_item["frame_index"]
            timestamp_sec = f_item["timestamp_seconds"]
            annotated_img = f_item.get("annotated_image")
            width = f_item.get("width", 1280)
            height = f_item.get("height", 720)

            if annotated_img is None or annotated_img.size == 0:
                continue

            frame_filename = f"yolo_frame_{frame_idx:05d}.jpg"
            storage_frame_path = f"{user_id}/{case_id}/{search_session_id}/{video_id}/{frame_filename}"

            try:
                ret, buf = cv2.imencode(".jpg", annotated_img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
                if ret:
                    supabase.storage.from_("evidence-frames").upload(
                        path=storage_frame_path,
                        file=buf.tobytes(),
                        file_options={"content-type": "image/jpeg", "upsert": "true"}
                    )

                supabase.table("video_frames").insert({
                    "search_session_id": search_session_id,
                    "frame_index": frame_idx,
                    "timestamp_seconds": timestamp_sec,
                    "frame_path": storage_frame_path,
                    "width": width,
                    "height": height
                }).execute()
                saved_count += 1
            except Exception as f_err:
                logger.warning(f"Failed to persist frame {frame_idx}: {str(f_err)}")

        return saved_count

    def _update_session(self, supabase: Any, session_id: str, **fields) -> None:
        try:
            supabase.table("search_sessions").update(fields).eq("id", session_id).execute()
        except Exception as err:
            logger.warning(f"Failed to update search session {session_id}: {str(err)}")

    def _update_session_video(self, supabase: Any, video_id: str, **fields) -> None:
        try:
            supabase.table("search_session_videos").update(fields).eq("id", video_id).execute()
        except Exception as err:
            logger.warning(f"Failed to update search_session_video {video_id}: {str(err)}")


ai_orchestrator = VideoAIOrchestrator()
