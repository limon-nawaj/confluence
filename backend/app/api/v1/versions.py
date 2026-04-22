from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.page import PageDetailResponse
from app.schemas.page_version import PageVersionDetailResponse, VersionDiffResponse
from app.services import version_service

router = APIRouter()


@router.get("/pages/{page_id}", response_model=list[PageVersionDetailResponse])
def list_versions(
    page_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return version_service.get_versions(db, page_id, skip, limit)


@router.get("/{version_id}", response_model=PageVersionDetailResponse)
def get_version(
    version_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    version = version_service.get_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.post("/{version_id}/restore", response_model=PageDetailResponse)
def restore_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = version_service.get_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version_service.restore_version(db, version, current_user.id)


@router.get("/diff", response_model=VersionDiffResponse)
def diff_versions(
    v1: int,
    v2: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    version_a = version_service.get_version(db, v1)
    version_b = version_service.get_version(db, v2)
    if not version_a or not version_b:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    diff_lines = version_service.compute_diff(version_a, version_b)
    return {"version_a": version_a, "version_b": version_b, "diff_lines": diff_lines}
