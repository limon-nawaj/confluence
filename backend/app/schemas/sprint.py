from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.sprint import SprintStatus


class SprintBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SprintCreate(SprintBase):
    project_id: int


class SprintUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[SprintStatus] = None


class SprintOut(SprintBase):
    id: int
    project_id: int
    status: SprintStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
