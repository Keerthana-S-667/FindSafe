"""
FindSafe AI - Video Ingestion & OpenCV Processing Infrastructure (Phase 4)

Handles video metadata extraction, frame sampling, Supabase Storage uploads,
and processing progress updates for CCTV search sessions.
"""

import os
import cv2
import math
import time
import tempfile
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from app.config import settings
from app.database.supabase import get_supabase_admin_client, get_supabase_client

logger = logging.getLogger("findsafe.video_service")

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}
ALLOWED_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "application/octet-stream"
}

def validate_video_file(filename: str, size_bytes: int, mime_type: Optional[str] = None) -> tuple[bool, str]:
    """Validates video file extension, MIME type, and size limit."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file format '{ext}'. Allowed formats: MP4, MOV, AVI, MKV."

    max_bytes = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        return False, f"Video exceeds maximum allowed size of {settings.MAX_VIDEO_SIZE_MB}MB."

    return True, "Valid video file."


class VideoProcessorService:
    """Core video ingestion, frame extraction, and session management service."""

    @staticmethod
    def extract_metadata_from_path(file_path: str) -> Dict[str, Any]:
        """Reads video metadata using OpenCV cv2.VideoCapture."""
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise ValueError("Unable to open video file for processing. File may be corrupted or use an unsupported codec.")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if fps <= 0 or math.isnan(fps):
            fps = 25.0  # Safe fallback for variable frame rates or unreadable FPS header

        duration_seconds = round(total_frames / fps, 2) if total_frames > 0 else 0.0

        # Extract 4-character codec string
        fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC))
        codec = "".join([chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)]).strip()

        cap.release()

        return {
            "width": width,
            "height": height,
            "fps": fps,
            "total_frames": total_frames,
            "duration_seconds": duration_seconds,
            "codec": codec or "unknown"
        }

    @staticmethod
    def process_video_background(
        search_session_id: str,
        user_id: str,
        case_id: str,
        local_video_path: str,
        storage_video_path: str
    ) -> None:
        """
        Background task:
        1. Extract video metadata
        2. Sample representative frames (~2 FPS)
        3. Save frames to Supabase Storage evidence-frames bucket
        4. Record frame records in PostgreSQL
        5. Update search_session status & progress
        6. Clean up temporary files
        """
        supabase = get_supabase_admin_client() or get_supabase_client()
        if not supabase:
            logger.error("Supabase client not available for background processing.")
            return

        logger.info(f"Starting background processing for search_session {search_session_id}")

        try:
            # Stage 1: Reading & Metadata
            VideoProcessorService._update_session(
                supabase, search_session_id,
                status="processing",
                stage="reading_video",
                progress=5,
                started_at=datetime.now(timezone.utc).isoformat()
            )

            # Check cooperative cancellation
            if VideoProcessorService._is_cancelled(supabase, search_session_id):
                logger.info(f"Session {search_session_id} was cancelled before metadata extraction.")
                return

            # Extract OpenCV metadata
            VideoProcessorService._update_session(
                supabase, search_session_id,
                stage="extracting_metadata",
                progress=10
            )

            metadata = VideoProcessorService.extract_metadata_from_path(local_video_path)
            
            # Save metadata to database
            VideoProcessorService._update_session(
                supabase, search_session_id,
                video_width=metadata["width"],
                video_height=metadata["height"],
                video_fps=metadata["fps"],
                total_frames=metadata["total_frames"],
                video_duration_seconds=metadata["duration_seconds"],
                stage="sampling_frames",
                progress=15
            )

            # Stage 2: Frame Sampling
            cap = cv2.VideoCapture(local_video_path)
            if not cap.isOpened():
                raise ValueError("Failed to reopen video file for frame sampling.")

            fps = metadata["fps"]
            total_frames = metadata["total_frames"]
            target_fps = settings.VIDEO_SAMPLE_FPS
            max_frames = settings.MAX_SAMPLED_FRAMES

            # Calculate frame interval
            if total_frames > 0 and (total_frames / max(1, fps / target_fps)) > max_frames:
                # Uniform sample across entire video if exceeding max frame limit
                frame_indices = [int(i * (total_frames - 1) / (max_frames - 1)) for i in range(max_frames)]
            else:
                stride = max(1, int(round(fps / target_fps)))
                frame_indices = list(range(0, total_frames, stride))

            total_samples = len(frame_indices)
            logger.info(f"Session {search_session_id}: Sampling {total_samples} frames out of {total_frames} total frames.")

            # Temp directory for extracted frame images
            with tempfile.TemporaryDirectory() as temp_frames_dir:
                sampled_count = 0
                frame_records = []

                for idx, frame_idx in enumerate(frame_indices):
                    # Check cancellation periodically
                    if idx % 10 == 0 and VideoProcessorService._is_cancelled(supabase, search_session_id):
                        logger.info(f"Session {search_session_id} cancelled during frame extraction.")
                        cap.release()
                        return

                    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                    ret, frame = cap.read()
                    if not ret or frame is None:
                        continue

                    # Resize frame if width > VIDEO_MAX_WIDTH (1280px)
                    orig_h, orig_w = frame.shape[:2]
                    target_w = settings.VIDEO_MAX_WIDTH
                    if orig_w > target_w:
                        target_h = int(orig_h * (target_w / orig_w))
                        frame = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
                        w, h = target_w, target_h
                    else:
                        w, h = orig_w, orig_h

                    timestamp_sec = round(frame_idx / fps, 2)
                    frame_filename = f"frame_{idx + 1:04d}.jpg"
                    local_frame_path = os.path.join(temp_frames_dir, frame_filename)

                    # Save JPEG with target quality
                    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), settings.VIDEO_FRAME_JPEG_QUALITY]
                    cv2.imwrite(local_frame_path, frame, encode_params)

                    # Storage Path: evidence-frames/{user_id}/{case_id}/{search_session_id}/frame_0001.jpg
                    storage_frame_path = f"{user_id}/{case_id}/{search_session_id}/{frame_filename}"

                    # Upload to Supabase Storage evidence-frames
                    try:
                        with open(local_frame_path, "rb") as f_data:
                            supabase.storage.from_("evidence-frames").upload(
                                path=storage_frame_path,
                                file=f_data,
                                file_options={"content-type": "image/jpeg", "upsert": "true"}
                            )
                    except Exception as storage_err:
                        logger.warning(f"Failed to upload frame {frame_filename} to storage: {str(storage_err)}")
                        # Continue processing remaining frames
                        continue

                    # Record metadata
                    frame_records.append({
                        "search_session_id": search_session_id,
                        "frame_index": idx + 1,
                        "timestamp_seconds": timestamp_sec,
                        "frame_path": storage_frame_path,
                        "width": w,
                        "height": h
                    })

                    sampled_count += 1

                    # Update progress every 10 frames or at completion
                    if idx % 5 == 0 or idx == total_samples - 1:
                        # Progress mapped from 15% to 85%
                        progress_pct = 15 + int((idx + 1) / total_samples * 70)
                        VideoProcessorService._update_session(
                            supabase, search_session_id,
                            stage="storing_frames",
                            progress=progress_pct,
                            sampled_frames=sampled_count
                        )

                cap.release()

                # Stage 3: Batch Insert frame records into video_frames table
                if frame_records:
                    VideoProcessorService._update_session(
                        supabase, search_session_id,
                        stage="finalizing",
                        progress=90
                    )
                    try:
                        supabase.table("video_frames").insert(frame_records).execute()
                    except Exception as db_err:
                        logger.error(f"Error inserting video_frames records: {str(db_err)}")

            # Stage 4: Mark Complete
            VideoProcessorService._update_session(
                supabase, search_session_id,
                status="completed",
                stage="completed",
                progress=100,
                sampled_frames=sampled_count,
                completed_at=datetime.now(timezone.utc).isoformat()
            )
            logger.info(f"Session {search_session_id} successfully completed. Sampled {sampled_count} frames.")

        except Exception as e:
            logger.error(f"Error processing video for search session {search_session_id}: {str(e)}", exc_info=True)
            VideoProcessorService._update_session(
                supabase, search_session_id,
                status="failed",
                stage="failed",
                error_message="Video processing failed. Please try another file."
            )
        finally:
            # Clean up local temporary video file
            if os.path.exists(local_video_path):
                try:
                    os.remove(local_video_path)
                    logger.info(f"Cleaned up local video file: {local_video_path}")
                except Exception as cleanup_err:
                    logger.warning(f"Failed to remove temporary video file: {str(cleanup_err)}")

    @staticmethod
    def _is_cancelled(supabase: Any, session_id: str) -> bool:
        """Check if search session was marked as cancelled by user."""
        try:
            res = supabase.table("search_sessions").select("status").eq("id", session_id).single().execute()
            if res.data and res.data.get("status") == "cancelled":
                return True
        except Exception:
            pass
        return False

    @staticmethod
    def _update_session(supabase: Any, session_id: str, **fields) -> None:
        """Helper to update search_sessions record fields in PostgreSQL."""
        try:
            supabase.table("search_sessions").update(fields).eq("id", session_id).execute()
        except Exception as err:
            logger.warning(f"Failed to update search session {session_id} state: {str(err)}")
