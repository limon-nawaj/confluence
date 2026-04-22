from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamMemberBase(BaseModel):
    role: str = "member"

class TeamMemberCreate(TeamMemberBase):
    user_id: int

class TeamMemberResponse(TeamMemberBase):
    id: int
    team_id: int
    user_id: int
    created_at: datetime
    user: UserResponse

    model_config = {"from_attributes": True}

class TeamResponse(TeamBase):
    id: int
    owner_id: int
    created_at: datetime
    members: List[TeamMemberResponse] = []

    model_config = {"from_attributes": True}


class SpaceTeamAccessBase(BaseModel):
    permission: str = "read"

class SpaceTeamAccessCreate(SpaceTeamAccessBase):
    team_id: int

class SpaceTeamAccessResponse(SpaceTeamAccessBase):
    id: int
    space_id: int
    team_id: int
    created_at: datetime
    team: TeamResponse

    model_config = {"from_attributes": True}
