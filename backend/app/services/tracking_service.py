"""
FindSafe AI - ByteTrack Multi-Object Tracking Service (Phase 5)

Maintains temporal frame-to-frame person trajectories per camera feed.
Selects representative crops and aggregates track-level appearance embeddings.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import cv2
import numpy as np

from app.services.detection_service import PersonDetectionService
from app.services.reid_service import ReIDService

logger = logging.getLogger("findsafe.ai.tracking")


class SimpleByteTracker:
    """
    Lightweight ByteTrack / IoU tracker for per-video person trajectory tracking.
    associates detections across sampled video frames using bounding-box overlap & motion.
    """

    def __init__(self, iou_threshold: float = 0.3, max_age: int = 5):
        self.next_track_id = 1
        self.active_tracks: List[Dict[str, Any]] = []
        self.iou_threshold = iou_threshold
        self.max_age = max_age  # Max frames missing before track termination

    def update(self, detections: List[Dict[str, Any]], frame_index: int, timestamp_sec: float) -> List[Dict[str, Any]]:
        """
        Updates active person tracks with current frame detections.
        Returns list of matched detections with assigned track_id.
        """
        matched_results = []
        unmatched_dets = list(range(len(detections)))

        # Age existing tracks
        for trk in self.active_tracks:
            trk["age"] += 1

        if self.active_tracks and detections:
            # Compute IoU matrix
            iou_matrix = np.zeros((len(self.active_tracks), len(detections)), dtype=np.float32)
            for i, trk in enumerate(self.active_tracks):
                for j, det in enumerate(detections):
                    iou_matrix[i, j] = self._compute_iou(trk["bbox"], det["bbox"])

            # Greedy matching
            matched_trk_indices = set()
            matched_det_indices = set()

            # Sort IoU pairs in descending order
            flat_indices = np.unravel_index(np.argsort(-iou_matrix, axis=None), iou_matrix.shape)
            for r, c in zip(flat_indices[0], flat_indices[1]):
                if r in matched_trk_indices or c in matched_det_indices:
                    continue
                if iou_matrix[r, c] >= self.iou_threshold:
                    matched_trk_indices.add(r)
                    matched_det_indices.add(c)

                    # Update track
                    trk = self.active_tracks[r]
                    det = detections[c]
                    trk["bbox"] = det["bbox"]
                    trk["age"] = 0
                    trk["last_seen_seconds"] = timestamp_sec
                    trk["frame_count"] += 1
                    trk["detections"].append({
                        "frame_index": frame_index,
                        "timestamp_seconds": timestamp_sec,
                        "bbox": det["bbox"],
                        "confidence": det["confidence"],
                        "crop": det["crop"],
                        "box_area": det["box_area"]
                    })

                    matched_results.append({
                        "track_id": trk["track_id"],
                        "detection": det
                    })

            unmatched_dets = [j for j in range(len(detections)) if j not in matched_det_indices]

        # Create new tracks for unmatched detections
        for j in unmatched_dets:
            det = detections[j]
            t_id = self.next_track_id
            self.next_track_id += 1

            new_trk = {
                "track_id": t_id,
                "bbox": det["bbox"],
                "first_seen_seconds": timestamp_sec,
                "last_seen_seconds": timestamp_sec,
                "frame_count": 1,
                "age": 0,
                "detections": [{
                    "frame_index": frame_index,
                    "timestamp_seconds": timestamp_sec,
                    "bbox": det["bbox"],
                    "confidence": det["confidence"],
                    "crop": det["crop"],
                    "box_area": det["box_area"]
                }]
            }
            self.active_tracks.append(new_trk)
            matched_results.append({
                "track_id": t_id,
                "detection": det
            })

        # Remove dead tracks
        self.active_tracks = [t for t in self.active_tracks if t["age"] <= self.max_age]

        return matched_results

    @staticmethod
    def _compute_iou(boxA: List[int], boxB: List[int]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        denominator = float(boxAArea + boxBArea - interArea)
        return interArea / denominator if denominator > 0 else 0.0


class TrackingService:
    """Service wrapper for ByteTrack trajectory extraction & representative crop aggregation."""

    @staticmethod
    def process_video_tracks(
        video_path: str,
        target_fps: float = 3.0,
        max_sampled_frames: int = 500
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Processes a video file with YOLO + ByteTrack.
        Returns:
            Tuple[List[Dict], List[Dict]]: (final_tracks, annotated_frames)
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open video {video_path} for tracking.")
            return [], []

        fps = float(cap.get(cv2.CAP_PROP_FPS))
        if fps <= 0 or np.isnan(fps):
            fps = 25.0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        stride = max(1, int(round(fps / target_fps)))

        # Ensure we sample at least 15-30 frames if video is short
        if total_frames > 0 and (total_frames / stride) < 15 and total_frames > 15:
            stride = max(1, total_frames // 25)

        if total_frames > 0 and (total_frames / stride) > max_sampled_frames:
            frame_indices = [int(i * (total_frames - 1) / (max_sampled_frames - 1)) for i in range(max_sampled_frames)]
        else:
            frame_indices = list(range(0, total_frames, stride)) if total_frames > 0 else []

        tracker = SimpleByteTracker()
        all_tracks_history: Dict[int, Dict[str, Any]] = {}
        annotated_frames: List[Dict[str, Any]] = []

        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue

            timestamp_sec = round(frame_idx / fps, 2)
            detections = PersonDetectionService.detect_persons(frame, confidence_threshold=0.20)

            matched = tracker.update(detections, frame_idx, timestamp_sec)

            frame_det_items = []
            for item in matched:
                t_id = item["track_id"]
                det = item["detection"]
                det["track_id"] = t_id
                frame_det_items.append(det)

                if t_id not in all_tracks_history:
                    all_tracks_history[t_id] = {
                        "track_id": t_id,
                        "first_seen_seconds": timestamp_sec,
                        "last_seen_seconds": timestamp_sec,
                        "detections": []
                    }

                all_tracks_history[t_id]["last_seen_seconds"] = timestamp_sec
                all_tracks_history[t_id]["detections"].append({
                    "frame_index": frame_idx,
                    "timestamp_seconds": timestamp_sec,
                    "bbox": det["bbox"],
                    "confidence": det["confidence"],
                    "crop": det["crop"],
                    "box_area": det["box_area"]
                })

            # Create presentation-grade visual frame with YOLO bounding boxes
            annotated_img = PersonDetectionService.draw_detections_on_frame(frame, frame_det_items)

            annotated_frames.append({
                "frame_index": frame_idx,
                "timestamp_seconds": timestamp_sec,
                "annotated_image": annotated_img,
                "detections_count": len(frame_det_items),
                "width": frame.shape[1],
                "height": frame.shape[0],
                "detections": [
                    {
                        "track_id": d.get("track_id"),
                        "bbox": d.get("bbox"),
                        "confidence": d.get("confidence")
                    }
                    for d in frame_det_items
                ]
            })

        cap.release()

        # Build aggregated track objects with representative crops & appearance embeddings
        final_tracks = []
        for t_id, trk in all_tracks_history.items():
            dets = trk["detections"]
            if not dets:
                continue

            # Sort detections by quality (box area * confidence)
            dets.sort(key=lambda d: d["box_area"] * d["confidence"], reverse=True)

            # Top 3 representative crops
            top_crops = [d["crop"] for d in dets[:3] if d["crop"] is not None and d["crop"].size > 0]
            best_crop = top_crops[0] if top_crops else None

            # Compute averaged track-level Re-ID appearance embedding
            embeddings = []
            for crop in top_crops:
                emb = ReIDService.extract_appearance_embedding(crop)
                if emb:
                    embeddings.append(np.array(emb, dtype=np.float32))

            if embeddings:
                avg_emb = np.mean(embeddings, axis=0)
                norm = np.linalg.norm(avg_emb)
                if norm > 0:
                    avg_emb = avg_emb / norm
                track_embedding = avg_emb.tolist()
            else:
                track_embedding = [0.0] * 512

            final_tracks.append({
                "track_id": t_id,
                "first_seen_seconds": trk["first_seen_seconds"],
                "last_seen_seconds": trk["last_seen_seconds"],
                "frame_count": len(dets),
                "best_crop": best_crop,
                "best_detection": dets[0],
                "all_detections": dets,
                "embedding": track_embedding
            })

        logger.info(f"Processed video {video_path}: Extracted {len(final_tracks)} person trajectories across {len(annotated_frames)} sampled frames.")
        return final_tracks, annotated_frames
