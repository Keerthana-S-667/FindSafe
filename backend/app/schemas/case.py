from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class CaseBase(BaseModel):
    reference_name: str = Field(..., min_length=1, max_length=255, description="Full name or subject reference")
    age_range: Optional[str] = Field(None, description="Age range descriptor")
    upper_clothing: Optional[str] = Field(None, description="Upper clothing details")
    lower_clothing: Optional[str] = Field(None, description="Lower clothing details")
    bag: Optional[str] = Field(None, description="Bag details")
    accessories: Optional[str] = Field(None, description="Accessories / features")
    last_seen_location: str = Field(..., min_length=1, description="Location text")
    last_seen_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    last_seen_lng: Optional[float] = Field(None, ge=-180.0, le=180.0)
    last_seen_timestamp: Optional[datetime] = None
    search_radius_km: Optional[float] = Field(5.0, gt=0)
    notes: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    reference_name: Optional[str] = None
    age_range: Optional[str] = None
    upper_clothing: Optional[str] = None
    lower_clothing: Optional[str] = None
    bag: Optional[str] = None
    accessories: Optional[str] = None
    last_seen_location: Optional[str] = None
    last_seen_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    last_seen_lng: Optional[float] = Field(None, ge=-180.0, le=180.0)
    last_seen_timestamp: Optional[datetime] = None
    search_radius_km: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None
    status: Optional[str] = Field(None, description="active, under_review, resolved, closed, archived")

    @validator("status")
    def validate_status(cls, v):
        if v is not None:
            allowed = {"active", "under_review", "resolved", "closed", "archived"}
            if v.lower() not in allowed:
                raise ValueError(f"Status must be one of: {allowed}")
        return v

class CaseResponse(CaseBase):
    id: str
    case_id: str
    status: str
    reference_image_path: Optional[str] = None
    reference_image_url: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CaseListResponse(BaseModel):
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int

class DashboardStatsResponse(BaseModel):
    active_cases: int
    potential_matches: int
    search_sessions: int
    pending_reviews: int
