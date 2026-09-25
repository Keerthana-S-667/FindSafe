import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from app.core.security import get_current_user
from app.schemas.case import CaseResponse, CaseListResponse, CaseUpdate
from app.services.case_service import (
    create_case_record,
    list_cases_records,
    get_case_record_by_id,
    update_case_record
)
from app.utils.storage import upload_reference_image

logger = logging.getLogger("findsafe.api.cases")
router = APIRouter()

@router.post("/missing-persons", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_missing_person(
    reference_name: str = Form(...),
    age_range: Optional[str] = Form(None),
    upper_clothing: Optional[str] = Form(None),
    lower_clothing: Optional[str] = Form(None),
    bag: Optional[str] = Form(None),
    accessories: Optional[str] = Form(None),
    last_seen_location: str = Form(...),
    last_seen_lat: Optional[float] = Form(None),
    last_seen_lng: Optional[float] = Form(None),
    last_seen_timestamp: Optional[str] = Form(None),
    search_radius_km: Optional[float] = Form(5.0),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Creates a new missing-person case record and uploads the reference photograph to Supabase Storage.
    """
    user_id = current_user.get("id", "operator")
    image_path = None
    image_url = None

    if file:
        try:
            temp_case_id = "draft"
            image_path, image_url = await upload_reference_image(file, user_id, temp_case_id)
        except HTTPException:
            raise
        except Exception as err:
            logger.error(f"Image upload exception: {str(err)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload reference image to storage."
            )

    case_data = {
        "reference_name": reference_name,
        "age_range": age_range,
        "upper_clothing": upper_clothing,
        "lower_clothing": lower_clothing,
        "bag": bag,
        "accessories": accessories,
        "last_seen_location": last_seen_location,
        "last_seen_lat": last_seen_lat,
        "last_seen_lng": last_seen_lng,
        "last_seen_timestamp": last_seen_timestamp,
        "search_radius_km": search_radius_km,
        "notes": notes,
        "reference_image_path": image_path,
        "reference_image_url": image_url,
    }

    try:
        new_case = await create_case_record(case_data, user_id)
        return new_case
    except Exception as e:
        logger.error(f"Failed to create case: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create missing-person case record."
        )

@router.get("/missing-persons", response_model=CaseListResponse)
async def get_missing_persons(
    search: Optional[str] = Query(None, description="Search by case ID, reference name, or location"),
    status: Optional[str] = Query(None, description="Status filter: active, under_review, resolved, closed, archived"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Lists missing person cases with search, status filtering, and pagination.
    """
    res = await list_cases_records(search=search, status=status, page=page, page_size=page_size)
    return res

@router.get("/missing-persons/{case_id_or_uuid}", response_model=CaseResponse)
async def get_missing_person_detail(
    case_id_or_uuid: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves a single missing-person case detail.
    """
    case_item = await get_case_record_by_id(case_id_or_uuid)
    if not case_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Missing person case '{case_id_or_uuid}' not found."
        )
    return case_item

@router.patch("/missing-persons/{case_id_or_uuid}", response_model=CaseResponse)
async def update_missing_person(
    case_id_or_uuid: str,
    payload: CaseUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Updates attributes or status of an existing missing-person case record.
    """
    user_id = current_user.get("id", "operator")
    update_dict = payload.dict(exclude_unset=True)

    updated_case = await update_case_record(case_id_or_uuid, update_dict, user_id)
    if not updated_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case record '{case_id_or_uuid}' not found or update failed."
        )
    return updated_case

@router.post("/missing-persons/{case_id_or_uuid}/archive", response_model=CaseResponse)
async def archive_missing_person(
    case_id_or_uuid: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Archives an existing missing-person case record.
    """
    user_id = current_user.get("id", "operator")
    updated_case = await update_case_record(case_id_or_uuid, {"status": "archived"}, user_id)
    if not updated_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case record '{case_id_or_uuid}' not found or archiving failed."
        )
    return updated_case
