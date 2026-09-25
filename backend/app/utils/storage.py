import os
import re
import time
import logging
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.database.supabase import get_supabase_admin_client, get_supabase_client

logger = logging.getLogger("findsafe.storage")

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes original filename to prevent path traversal and special character issues.
    """
    base = os.path.basename(filename)
    name, ext = os.path.splitext(base)
    sanitized_name = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    return f"{sanitized_name}{ext.lower()}"

async def upload_reference_image(
    file: UploadFile,
    user_id: str,
    case_id: str
) -> Tuple[str, str]:
    """
    Validates and uploads a reference photograph to Supabase Storage bucket 'missing-person-photos'.
    Path structure: missing-person-photos/{user_id}/{case_id}/{filename}
    Returns: (storage_path, signed_or_public_url)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has no filename."
        )

    _, ext = os.path.splitext(file.filename)
    ext_lower = ext.lower()

    if ext_lower not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    # Read and check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of 10MB."
        )

    safe_name = sanitize_filename(file.filename)
    timestamp = int(time.time())
    relative_path = f"{user_id}/{case_id}/ref_{timestamp}_{safe_name}"

    admin_client = get_supabase_admin_client() or get_supabase_client()

    if not admin_client:
        logger.warning("Supabase admin client unconfigured. Returning local reference path.")
        return relative_path, f"/placeholder/images/{safe_name}"

    try:
        # Upload file bytes to missing-person-photos bucket
        upload_res = admin_client.storage.from_("missing-person-photos").upload(
            path=relative_path,
            file=contents,
            file_options={"content-type": file.content_type or "image/jpeg", "upsert": "true"}
        )
        logger.info(f"Uploaded reference photo to Supabase storage: {relative_path}")
    except Exception as e:
        logger.error(f"Failed to upload image to Supabase Storage: {str(e)}")
        # If upload fails, fallback to path reference rather than breaking whole transaction
        return relative_path, ""

    # Generate signed URL (expires in 2 hours = 7200 seconds)
    url = get_signed_image_url(relative_path)
    return relative_path, url

def get_signed_image_url(storage_path: Optional[str], expires_in: int = 7200) -> str:
    """
    Generates a signed URL for a file stored in missing-person-photos bucket.
    """
    if not storage_path:
        return ""

    admin_client = get_supabase_admin_client() or get_supabase_client()
    if not admin_client:
        return ""

    try:
        res = admin_client.storage.from_("missing-person-photos").create_signed_url(
            path=storage_path,
            expires_in=expires_in
        )
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        elif hasattr(res, "get"):
            return res.get("signedUrl", res.get("signedURL", ""))
        return str(res)
    except Exception as e:
        logger.warning(f"Failed to generate signed URL for path {storage_path}: {str(e)}")
        return ""
