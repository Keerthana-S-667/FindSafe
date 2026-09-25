"""
FindSafe AI - Record Embedding Service (Phase 7)

Generates and caches OSNet Re-ID appearance embeddings for found person record images.
Saves embeddings in `record_embeddings` database table for high-performance reuse.
"""

import logging
from typing import Optional, List, Dict, Any
import numpy as np
import cv2

from app.services.reid_service import ReIDService
from app.services.case_service import CaseService

logger = logging.getLogger("findsafe.ai.record_embedding")


class RecordEmbeddingService:
    """Service to generate and retrieve cached embeddings for found person records."""

    @staticmethod
    def get_or_create_record_embedding(record: Dict[str, Any], record_image_bytes: Optional[bytes] = None) -> Optional[List[float]]:
        """
        Retrieves cached embedding for record or computes OSNet embedding if image is available.
        """
        record_id = record.get("id")
        if not record_id:
            return None

        supabase = CaseService.get_supabase()

        # 1. Check existing record_embeddings entry
        try:
            res = supabase.table("record_embeddings").select("*").eq("record_id", record_id).execute()
            if res.data and len(res.data) > 0:
                emb = res.data[0].get("embedding")
                if isinstance(emb, list) and len(emb) > 0:
                    return emb
        except Exception as e:
            logger.debug(f"No existing record embedding cache found for {record_id}: {str(e)}")

        # 2. Extract image bytes if not supplied directly
        image_np = None
        if record_image_bytes:
            nparr = np.frombuffer(record_image_bytes, np.uint8)
            image_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif record.get("reference_image_url"):
            # Fetch image bytes via httpx/requests if remote URL exists
            try:
                import httpx
                resp = httpx.get(record["reference_image_url"], timeout=10.0)
                if resp.status_code == 200:
                    nparr = np.frombuffer(resp.content, np.uint8)
                    image_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as e:
                logger.warning(f"Failed to fetch record image from URL {record.get('reference_image_url')}: {str(e)}")

        if image_np is None or image_np.size == 0:
            return None

        # 3. Extract 512-dim embedding using ReIDService
        embedding = ReIDService.extract_appearance_embedding(image_np)
        if not embedding:
            return None

        # 4. Cache in record_embeddings table
        try:
            supabase.table("record_embeddings").upsert({
                "record_id": record_id,
                "embedding": embedding,
                "model_name": "osnet_ain_x1_0"
            }).execute()
        except Exception as e:
            logger.warning(f"Could not cache record embedding in DB: {str(e)}")

        return embedding
