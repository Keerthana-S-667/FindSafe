"""
FindSafe AI - Non-Sensitive Visual Attribute Intelligence Service (Phase 6)

Extracts and analyzes non-sensitive visual attributes (clothing colors, broad clothing types,
bags/backpacks, caps/hats) from person crops and reference photographs.

IMPORTANT PRIVACY GUARANTEE:
Operating strictly on clothing colors, body crop HSV histograms, and visible accessories.
NO facial recognition or sensitive attribute classification (race, ethnicity, religion, etc.).
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np

logger = logging.getLogger("findsafe.ai.attribute")

# Broad non-sensitive color vocabulary
COLOR_VOCABULARY = [
    "red", "orange", "yellow", "green", "cyan", "blue", 
    "purple", "pink", "brown", "black", "white", "grey", "beige", "unknown"
]

class AttributeService:
    """Service wrapper for non-sensitive clothing & accessory attribute intelligence."""

    @staticmethod
    def extract_crop_attributes(image: np.ndarray) -> Dict[str, Any]:
        """
        Extracts visual attributes (upper clothing color, lower clothing color, bag presence)
        from a person crop using spatial HSV color analysis.
        """
        if image is None or image.size == 0 or image.shape[0] < 30 or image.shape[1] < 15:
            return {
                "upper_clothing_color": "unknown",
                "lower_clothing_color": "unknown",
                "bag_present": False,
                "bag_type": "unknown",
                "hat_present": False,
                "confidence": 0.0
            }

        try:
            h, w = image.shape[:2]
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

            # Crop into upper body (top 15% to 55%) and lower body (55% to 90%) to avoid head/footwear noise
            upper_crop = hsv[int(h * 0.15):int(h * 0.55), int(w * 0.2):int(w * 0.8)]
            lower_crop = hsv[int(h * 0.55):int(h * 0.90), int(w * 0.2):int(w * 0.8)]

            upper_color, conf_u = AttributeService._detect_dominant_hsv_color(upper_crop)
            lower_color, conf_l = AttributeService._detect_dominant_hsv_color(lower_crop)

            # Detect potential bag / backpack based on lateral contrast & Saturation anomalies
            bag_present, bag_type = AttributeService._detect_bag_heuristic(image)

            overall_conf = round(float((conf_u + conf_l) / 2.0), 2)

            return {
                "upper_clothing_color": upper_color,
                "upper_clothing_type": "top",
                "lower_clothing_color": lower_color,
                "lower_clothing_type": "bottom",
                "bag_present": bag_present,
                "bag_type": bag_type,
                "hat_present": False,
                "confidence": overall_conf
            }

        except Exception as e:
            logger.warning(f"Attribute extraction error on crop: {str(e)}")
            return {
                "upper_clothing_color": "unknown",
                "lower_clothing_color": "unknown",
                "bag_present": False,
                "bag_type": "unknown",
                "hat_present": False,
                "confidence": 0.0
            }

    @staticmethod
    def extract_reference_profile(case_data: Dict[str, Any], ref_image: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Builds structured reference attribute profile from case text descriptors and reference image analysis.
        """
        upper_text = (case_data.get("upper_clothing") or "").lower()
        lower_text = (case_data.get("lower_clothing") or "").lower()
        bag_text = (case_data.get("bag") or "").lower()
        acc_text = (case_data.get("accessories") or "").lower()

        upper_color = AttributeService._parse_color_from_text(upper_text)
        lower_color = AttributeService._parse_color_from_text(lower_text)

        bag_present = bool(bag_text and bag_text != "none" and bag_text != "unknown")
        bag_type = "backpack" if "backpack" in bag_text or "bag" in bag_text else ("bag" if bag_present else "none")

        # If text is unknown and reference image is available, extract from image
        if ref_image is not None and (upper_color == "unknown" or lower_color == "unknown"):
            img_attrs = AttributeService.extract_crop_attributes(ref_image)
            if upper_color == "unknown":
                upper_color = img_attrs["upper_clothing_color"]
            if lower_color == "unknown":
                lower_color = img_attrs["lower_clothing_color"]

        return {
            "upper_clothing_color": upper_color,
            "lower_clothing_color": lower_color,
            "bag_present": bag_present,
            "bag_type": bag_type,
            "accessories": acc_text or "none"
        }

    @staticmethod
    def compare_attributes(ref_profile: Dict[str, Any], cand_attrs: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]]]:
        """
        Compares candidate attributes against reference profile.
        Returns overall attribute score (0.0 to 1.0) and detailed itemized breakdown list.
        """
        breakdown = []

        # 1. Upper clothing color comparison
        u_ref = ref_profile.get("upper_clothing_color", "unknown")
        u_cand = cand_attrs.get("upper_clothing_color", "unknown")
        u_status, u_score = AttributeService._compare_color_pair(u_ref, u_cand)
        breakdown.append({
            "attribute_type": "upper_clothing_color",
            "reference_value": u_ref,
            "candidate_value": u_cand,
            "match_status": u_status,
            "confidence": cand_attrs.get("confidence", 0.8),
            "score": u_score
        })

        # 2. Lower clothing color comparison
        l_ref = ref_profile.get("lower_clothing_color", "unknown")
        l_cand = cand_attrs.get("lower_clothing_color", "unknown")
        l_status, l_score = AttributeService._compare_color_pair(l_ref, l_cand)
        breakdown.append({
            "attribute_type": "lower_clothing_color",
            "reference_value": l_ref,
            "candidate_value": l_cand,
            "match_status": l_status,
            "confidence": cand_attrs.get("confidence", 0.8),
            "score": l_score
        })

        # 3. Bag / Backpack comparison
        b_ref = "present" if ref_profile.get("bag_present") else "none"
        b_cand = "present" if cand_attrs.get("bag_present") else "none"
        if not ref_profile.get("bag_present"):
            b_status, b_score = "unknown", 0.6
        elif cand_attrs.get("bag_present") == ref_profile.get("bag_present"):
            b_status, b_score = "match", 1.0
        else:
            b_status, b_score = "partial_match", 0.5

        breakdown.append({
            "attribute_type": "bag_presence",
            "reference_value": b_ref,
            "candidate_value": b_cand,
            "match_status": b_status,
            "confidence": 0.8,
            "score": b_score
        })

        # Calculate weighted attribute similarity score
        valid_scores = [item["score"] for item in breakdown if item["match_status"] != "unknown"]
        if valid_scores:
            overall_attr_score = float(np.mean(valid_scores))
        else:
            overall_attr_score = 0.60  # Neutral fallback for unknown attributes

        return round(overall_attr_score, 3), breakdown

    @staticmethod
    def _detect_dominant_hsv_color(crop: np.ndarray) -> Tuple[str, float]:
        """Maps crop HSV pixels into dominant non-sensitive color category."""
        if crop is None or crop.size == 0:
            return "unknown", 0.0

        # Convert pixels into flat arrays
        h_vals = crop[:, :, 0].flatten()
        s_vals = crop[:, :, 1].flatten()
        v_vals = crop[:, :, 2].flatten()

        total = len(h_vals)
        if total == 0:
            return "unknown", 0.0

        # Filter out extreme shadows (v < 30) or washed out highlights (s < 20 and v > 220)
        valid_mask = (v_vals >= 25) & ~((s_vals < 20) & (v_vals > 230))
        if np.sum(valid_mask) < total * 0.1:
            # Check for black/white/grey
            avg_v = float(np.mean(v_vals))
            if avg_v < 40:
                return "black", 0.85
            elif avg_v > 200:
                return "white", 0.85
            else:
                return "grey", 0.80

        h_valid = h_vals[valid_mask]
        s_valid = s_vals[valid_mask]
        v_valid = v_vals[valid_mask]

        # Calculate average S & V for greyscale checks
        mean_s = float(np.mean(s_valid))
        mean_v = float(np.mean(v_valid))

        if mean_s < 30:
            if mean_v < 60:
                return "black", 0.85
            elif mean_v > 190:
                return "white", 0.85
            else:
                return "grey", 0.80

        # Histogram of Hue values (0 to 180 in OpenCV)
        hist, _ = np.histogram(h_valid, bins=12, range=(0, 180))
        dom_bin = int(np.argmax(hist))
        dom_ratio = float(hist[dom_bin]) / float(len(h_valid))

        # Bin ranges (15 deg per bin)
        # Bins: 0:Red, 1:Orange, 2:Yellow, 3:Green-Yellow, 4-5:Green, 6-7:Cyan/Blue, 8-9:Blue/Purple, 10-11:Pink/Red
        hue_map = {
            0: "red", 1: "orange", 2: "yellow", 3: "green",
            4: "green", 5: "green", 6: "cyan", 7: "blue",
            8: "blue", 9: "purple", 10: "pink", 11: "red"
        }

        color = hue_map.get(dom_bin, "unknown")
        confidence = min(0.95, max(0.40, dom_ratio * 1.5))
        return color, round(confidence, 2)

    @staticmethod
    def _detect_bag_heuristic(crop: np.ndarray) -> Tuple[bool, str]:
        """Detects presence of a bag/backpack on person crop."""
        try:
            h, w = crop.shape[:2]
            # Check upper torso lateral areas for distinct strap / bag contrast
            left_strap = crop[int(h*0.2):int(h*0.6), 0:int(w*0.25)]
            right_strap = crop[int(h*0.2):int(h*0.6), int(w*0.75):]

            var_l = float(np.var(left_strap)) if left_strap.size > 0 else 0
            var_r = float(np.var(right_strap)) if right_strap.size > 0 else 0

            if var_l > 1200 or var_r > 1200:
                return True, "backpack"
        except Exception:
            pass
        return False, "none"

    @staticmethod
    def _parse_color_from_text(text: str) -> str:
        """Parses color vocabulary word from case descriptor string."""
        if not text:
            return "unknown"
        for col in COLOR_VOCABULARY:
            if col != "unknown" and col in text:
                return col
        return "unknown"

    @staticmethod
    def _compare_color_pair(col1: str, col2: str) -> Tuple[str, float]:
        """Compares two color strings with soft similarity scoring."""
        if col1 == "unknown" or col2 == "unknown":
            return "unknown", 0.60
        if col1 == col2:
            return "match", 1.0

        # Similar color groups (e.g. red/pink/orange, blue/cyan, black/grey)
        similar_groups = [
            {"red", "orange", "pink"},
            {"blue", "cyan"},
            {"black", "grey"},
            {"white", "beige", "grey"},
            {"brown", "orange"}
        ]
        for grp in similar_groups:
            if col1 in grp and col2 in grp:
                return "partial_match", 0.80

        return "mismatch", 0.25
