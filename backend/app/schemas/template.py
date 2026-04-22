from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "general"
    content: str


class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    content: str
    is_system: bool
    created_at: datetime

    model_config = {"from_attributes": True}
