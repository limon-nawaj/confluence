from pydantic import BaseModel

from app.models.permission import PermissionLevel


class PermissionCreate(BaseModel):
    user_id: int
    level: PermissionLevel


class PermissionResponse(BaseModel):
    id: int
    user_id: int
    space_id: int
    level: PermissionLevel

    model_config = {"from_attributes": True}
