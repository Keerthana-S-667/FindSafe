import logging
from typing import Optional
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("findsafe.supabase")

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Client using anon key, or None if unconfigured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        logger.warning("Supabase URL or ANON Key not configured.")
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None

def get_supabase_admin_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Client using service role key, or None if unconfigured.
    """
    global _supabase_admin_client
    if _supabase_admin_client is not None:
        return _supabase_admin_client

    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not settings.SUPABASE_URL or not key:
        logger.warning("Supabase URL or Service Role Key not configured.")
        return None

    try:
        _supabase_admin_client = create_client(settings.SUPABASE_URL, key)
        return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase admin client: {str(e)}")
        return None

def check_supabase_status() -> dict:
    """
    Utility function to check Supabase connection status without crashing.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return {
            "configured": False,
            "status": "unconfigured",
            "message": "SUPABASE_URL or SUPABASE_ANON_KEY missing in backend configuration."
        }
    
    client = get_supabase_client()
    if client is None:
        return {
            "configured": True,
            "status": "error",
            "message": "Failed to initialize Supabase client instance."
        }
    
    return {
        "configured": True,
        "status": "connected",
        "message": "Supabase client configured successfully."
    }
