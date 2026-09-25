"""
FindSafe AI - YOLO Person Detection Service (Phase 5)

Utilizes Ultralytics YOLO (yolov8n / yolo11n) for person bounding box detection.
Filters exclusively for COCO class 0 ('person').
NO facial recognition or sensitive attribute extraction.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger("findsafe.ai.detection")

_yolo_model = None

def get_yolo_model():
    """Lazy loader for YOLO model to ensure single load across sessions."""
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    try:
        from ultralytics import YOLO
        import torch

        device = "cuda" if torch.cuda.is_available() and settings.AI_DEVICE in ("auto", "cuda") else "cpu"
        logger.info(f"Loading YOLO model '{settings.YOLO_MODEL}' on device '{device}'...")

        _yolo_model = YOLO(settings.YOLO_MODEL)
        _yolo_model.to(device)
        logger.info("YOLO model loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {str(e)}")
        return None


class PersonDetectionService:
    """Service wrapper for person detection using YOLO."""

    @staticmethod
    def detect_persons(frame: np.ndarray, confidence_threshold: float = 0.20) -> List[Dict[str, Any]]:
        """
        Detects person objects in an OpenCV BGR frame.
        Returns list of detections with bbox [x1, y1, x2, y2], confidence, and cropped person image.
        """
        model = get_yolo_model()
        if model is None or frame is None:
            return []

        h, w = frame.shape[:2]
        detections = []

        try:
            results = model.predict(frame, classes=[0], conf=confidence_threshold, verbose=False)
            if not results:
                return []

            boxes = results[0].boxes
            if boxes is None:
                return []

            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy())

                x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
                # Clamp coordinates
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)

                box_w, box_h = x2 - x1, y2 - y1
                if box_w < 8 or box_h < 15:  # Ignore microscopic noise
                    continue

                crop = frame[y1:y2, x1:x2]

                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": round(conf, 4),
                    "crop": crop,
                    "box_area": box_w * box_h
                })

        except Exception as e:
            logger.warning(f"YOLO detection error on frame: {str(e)}")

        return detections

    @staticmethod
    def draw_detections_on_frame(frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """
        Renders crisp, high-visibility presentation-grade YOLO bounding boxes and labels on the frame.
        """
        if frame is None or not detections:
            return frame.copy() if frame is not None else np.zeros((720, 1280, 3), dtype=np.uint8)

        annotated = frame.copy()
        h, w = annotated.shape[:2]

        colors = [
            (0, 220, 100),   # Vibrant Emerald Green
            (255, 140, 0),   # Electric Amber
            (0, 180, 255),   # Bright Cyan
            (255, 80, 80),   # Coral Red
            (180, 100, 255)  # Purple
        ]

        for det in detections:
            bbox = det.get("bbox", [0, 0, 0, 0])
            x1, y1, x2, y2 = bbox
            conf = det.get("confidence", 0.90)
            track_id = det.get("track_id")

            color_idx = (track_id or 0) % len(colors)
            box_color = colors[color_idx]

            # Main bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2, cv2.LINE_AA)

            # Modern corner highlights
            c_len = min(15, (x2 - x1) // 4, (y2 - y1) // 4)
            if c_len > 3:
                # Top-Left
                cv2.line(annotated, (x1, y1), (x1 + c_len, y1), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(annotated, (x1, y1), (x1, y1 + c_len), (255, 255, 255), 3, cv2.LINE_AA)
                # Top-Right
                cv2.line(annotated, (x2, y1), (x2 - c_len, y1), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(annotated, (x2, y1), (x2, y1 + c_len), (255, 255, 255), 3, cv2.LINE_AA)
                # Bottom-Left
                cv2.line(annotated, (x1, y2), (x1 + c_len, y2), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(annotated, (x1, y2), (x1, y2 - c_len), (255, 255, 255), 3, cv2.LINE_AA)
                # Bottom-Right
                cv2.line(annotated, (x2, y2), (x2 - c_len, y2), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(annotated, (x2, y2), (x2, y2 - c_len), (255, 255, 255), 3, cv2.LINE_AA)

            # Label text
            label = f"ID #{track_id:02d} | {conf * 100:.1f}%" if track_id is not None else f"PERSON | {conf * 100:.1f}%"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.45
            font_thickness = 1
            (txt_w, txt_h), baseline = cv2.getTextSize(label, font, font_scale, font_thickness)

            badge_y1 = max(0, y1 - txt_h - 8)
            badge_y2 = max(txt_h + 8, y1)
            badge_x2 = min(w, x1 + txt_w + 10)

            # Semi-dark label badge background for ultra-crisp contrast
            cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), (20, 25, 30), -1)
            cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), box_color, 1)

            # White text
            cv2.putText(annotated, label, (x1 + 5, badge_y2 - 4), font, font_scale, (255, 255, 255), font_thickness, cv2.LINE_AA)

        return annotated
