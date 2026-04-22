from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.attachment import AttachmentResponse
from app.services import attachment_service

router = APIRouter()


@router.get("/pages/{page_id}", response_model=list[AttachmentResponse])
def list_attachments(
    page_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return attachment_service.get_page_attachments(db, page_id)


@router.post("/pages/{page_id}", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    page_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB} MB",
        )
    # Reset file position after reading for size check
    await file.seek(0)
    return await attachment_service.save_attachment(db, page_id, current_user.id, file)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    attachment = attachment_service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if attachment.uploader_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot delete another user's attachment")
    attachment_service.delete_attachment(db, attachment)


@router.get("/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    attachment = attachment_service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return FileResponse(
        path=attachment.storage_path,
        filename=attachment.original_filename,
        media_type=attachment.mime_type,
    )
