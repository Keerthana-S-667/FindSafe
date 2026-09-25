"""Application level dependencies for FastAPI endpoints."""
from typing import Generator
from app.database.database import get_db
from app.database.supabase import get_supabase_client, get_supabase_admin_client

__all__ = ["get_db", "get_supabase_client", "get_supabase_admin_client"]
