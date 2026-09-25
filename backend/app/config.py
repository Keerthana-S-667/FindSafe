import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_PATH = os.path.join(_BACKEND_DIR, ".env")

class Settings(BaseSettings):
    APP_NAME: str = "FindSafe AI"
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api"
    
    DATABASE_URL: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Phase 4 Video Processing Settings
    VIDEO_SAMPLE_FPS: int = 2
    MAX_SAMPLED_FRAMES: int = 1000
    MAX_VIDEO_SIZE_MB: int = 500
    VIDEO_MAX_WIDTH: int = 1280
    VIDEO_FRAME_JPEG_QUALITY: int = 88
    TEMP_PROCESSING_DIR: Optional[str] = None
    
    # Phase 5 & 6 Computer Vision & Attribute AI Settings
    YOLO_MODEL: str = "yolov8n.pt"
    REID_MODEL: str = "osnet_x1_0"
    AI_DEVICE: str = "auto"
    VISUAL_SIMILARITY_THRESHOLD: float = 0.45
    CROSS_CAMERA_SIMILARITY_THRESHOLD: float = 0.50
    
    # Phase 6 Multi-Factor Evidence Fusion Weights (Sum = 1.0)
    VISUAL_WEIGHT: float = 0.40
    ATTRIBUTE_WEIGHT: float = 0.25
    TIME_WEIGHT: float = 0.15
    LOCATION_WEIGHT: float = 0.10
    CROSS_CAMERA_WEIGHT: float = 0.10
    
    model_config = SettingsConfigDict(
        env_file=(_ENV_PATH, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

