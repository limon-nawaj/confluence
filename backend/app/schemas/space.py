from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse
from app.schemas.team import SpaceTeamAccessResponse


class SpaceBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


class SpaceCreate(SpaceBase):
    key: str


class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class SpacePermissionResponse(BaseModel):
    id: int
    user_id: int
    space_id: int
    level: str
    user: UserResponse

    model_config = {"from_attributes": True}


class SpaceResponse(SpaceBase):
    id: int
    key: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SpaceDetailResponse(SpaceResponse):
    owner: UserResponse
    team_access: list[SpaceTeamAccessResponse] = []
    user_permissions: list[SpacePermissionResponse] = []
