import os
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.attachment import Attachment


def get_page_attachments(db: Session, page_id: int) -> list[Attachment]:
    return db.query(Attachment).filter(Attachment.page_id == page_id).all()


def get_attachment(db: Session, attachment_id: int) -> Attachment | None:
    return db.get(Attachment, attachment_id)


async def save_attachment(
    db: Session, page_id: int, uploader_id: int, file: UploadFile
) -> Attachment:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read()
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
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def delete_attachment(db: Session, attachment: Attachment) -> None:
    if os.path.exists(attachment.storage_path):
        os.remove(attachment.storage_path)
    db.delete(attachment)
    db.commit()
