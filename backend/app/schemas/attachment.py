from datetime import datetime
from typing import Optional

from pydantic import BaseModel, computed_field

from app.schemas.user import UserResponse


class AttachmentResponse(BaseModel):
    id: int
    page_id: int
    uploader_id: int
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    storage_path: str
    cloudinary_public_id: Optional[str] = None
    created_at: datetime
    uploader: UserResponse

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def url(self) -> str:
        """CDN URL for cloud files; API download path for local files."""
        if self.cloudinary_public_id:
            return self.storage_path  # already the Cloudinary https:// URL
        return f"/api/v1/attachments/{self.id}/download"
