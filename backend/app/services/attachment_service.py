import os
import uuid
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.attachment import Attachment
from app.models.page import Page
from app.models.space import Space


def get_page_attachments(db: Session, page_id: int) -> list[Attachment]:
    return db.query(Attachment).filter(Attachment.page_id == page_id).all()


def get_attachment(db: Session, attachment_id: int) -> Optional[Attachment]:
    return db.get(Attachment, attachment_id)


def _cloudinary_folder(db: Session, page_id: int) -> str:
    """Build an organised Cloudinary folder path for a page's attachments."""
    page = db.get(Page, page_id)
    if page:
        space = db.get(Space, page.space_id)
        if space:
            return f"unidocs/spaces/{space.key}/pages/{page_id}"
    return f"unidocs/pages/{page_id}"


async def save_attachment(
    db: Session, page_id: int, uploader_id: int, file: UploadFile
) -> Attachment:
    content = await file.read()
    ext = os.path.splitext(file.filename or "")[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"

    cloudinary_public_id: Optional[str] = None
    storage_path: str

    if settings.cloudinary_enabled:
        from app.core.cloudinary import upload_file
        folder = _cloudinary_folder(db, page_id)
        public_id_in_folder = uuid.uuid4().hex  # Cloudinary appends ext automatically
        result = upload_file(
            content=content,
            public_id=public_id_in_folder,
            folder=folder,
            resource_type="auto",
        )
        storage_path = result["secure_url"]
        cloudinary_public_id = result["public_id"]
    else:
        # Local filesystem fallback (dev / SQLite)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        storage_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(storage_path, "wb") as f:
            f.write(content)

    attachment = Attachment(
        page_id=page_id,
        uploader_id=uploader_id,
        filename=unique_name,
        original_filename=file.filename or unique_name,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        storage_path=storage_path,
        cloudinary_public_id=cloudinary_public_id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def delete_attachment(db: Session, attachment: Attachment) -> None:
    if attachment.is_cloud:
        try:
            from app.core.cloudinary import delete_file
            delete_file(attachment.cloudinary_public_id)
        except Exception:
            pass  # Don't block DB deletion if Cloudinary call fails
    elif os.path.exists(attachment.storage_path):
        os.remove(attachment.storage_path)

    db.delete(attachment)
    db.commit()
