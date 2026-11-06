from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────

class MeetingType(str, Enum):
    sales_call = "sales_call"
    partnership = "partnership"
    investment = "investment"
    job_interview = "job_interview"
    team_meeting = "team_meeting"
    client_review = "client_review"
    networking = "networking"
    other = "other"


class MeetingStatus(str, Enum):
    upcoming = "upcoming"
    completed = "completed"
    cancelled = "cancelled"


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


# ── Meeting ──────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    title: str
    company_or_person: str
    meeting_date: datetime
    meeting_type: MeetingType = MeetingType.other
    objective: str
    context: Optional[str] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    company_or_person: Optional[str] = None
    meeting_date: Optional[datetime] = None
    meeting_type: Optional[MeetingType] = None
    objective: Optional[str] = None
    context: Optional[str] = None
    status: Optional[MeetingStatus] = None


class Meeting(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    company_or_person: str
    meeting_date: datetime
    meeting_type: MeetingType
    objective: str
    context: Optional[str] = None
    status: MeetingStatus
    created_at: datetime
    updated_at: datetime


# ── Research Job ─────────────────────────────────────────────

class ResearchJob(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    user_id: str
    status: JobStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime


# ── Research Finding ─────────────────────────────────────────

class ResearchFinding(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    job_id: Optional[str] = None
    title: str
    content: str
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    published_date: Optional[datetime] = None
    relevance_score: Optional[float] = None
    category: Optional[str] = None
    is_verified: bool
    created_at: datetime


# ── Briefing ─────────────────────────────────────────────────

class BriefingSource(BaseModel):
    url: str
    title: Optional[str] = None
    source_name: Optional[str] = None
    published_date: Optional[str] = None


class BriefingDevelopment(BaseModel):
    title: str
    summary: str
    significance: str
    source_url: Optional[str] = None
    published_date: Optional[str] = None
    category: str


class BriefingPerson(BaseModel):
    name: str
    role: str
    background: str
    relevance: str


class BriefingContent(BaseModel):
    executive_snapshot: str
    key_developments: list[BriefingDevelopment] = []
    key_people: list[BriefingPerson] = []
    company_insights: str
    industry_context: str
    discussion_points: list[str] = []
    suggested_questions: list[str] = []
    opportunities: list[str] = []
    risks: list[str] = []
    meeting_strategy: str
    confidence_level: Literal["high", "medium", "low"] = "medium"
    sources: list[BriefingSource] = []


class Briefing(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    user_id: str
    content: BriefingContent
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# ── Composite response ───────────────────────────────────────

class MeetingWithResearch(Meeting):
    research_job: Optional[ResearchJob] = None
    briefing: Optional[Briefing] = None
