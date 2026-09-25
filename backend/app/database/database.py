"""
SQLAlchemy and Database Connection setup.
Prepares object-relational mapping structure for PostgreSQL via Supabase or Direct Connection.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

Base = declarative_base()

engine = None
SessionLocal = None

if settings.DATABASE_URL:
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"Warning: Failed to initialize SQLAlchemy engine: {e}")

def get_db() -> Generator:
    """
    Dependency for obtaining SQLAlchemy database session.
    Yields None if DATABASE_URL is not configured.
    """
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
