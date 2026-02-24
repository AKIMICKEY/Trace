from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Dict, List


class TimeEntry(BaseModel):
    time: str
    content: str


class DiaryCreate(BaseModel):
    content: Optional[str] = ""
    date: str
    time_entries: Optional[List[TimeEntry]] = None


class DiaryResponse(BaseModel):
    id: str
    user_id: str
    content: str
    date: date
    time_entries: Optional[List[Dict]] = None
    ai_evaluation: Optional[Dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    dates: List[str]


class PortraitResponse(BaseModel):
    id: str
    user_id: str
    period_start: date
    period_end: date
    portrait_data: Dict
    created_at: datetime

    class Config:
        from_attributes = True


class ApiKeyUpdate(BaseModel):
    api_key: str


class ApiKeyResponse(BaseModel):
    has_api_key: bool
