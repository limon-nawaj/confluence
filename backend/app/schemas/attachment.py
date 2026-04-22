from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserResponse


class AttachmentResponse(BaseModel):
    id: int
    page_id: int
    uploader_id: int
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    created_at: datetime
    uploader: UserResponse

    model_config = {"from_attributes": True}
