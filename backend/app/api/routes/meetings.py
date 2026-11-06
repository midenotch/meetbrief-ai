from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from app.models.schemas import (
    Meeting,
    MeetingCreate,
    MeetingUpdate,
    MeetingWithResearch,
    ResearchJob,
    Briefing,
    BriefingContent,
)
from supabase import Client

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _row_to_meeting(row: dict) -> dict:
    """Normalize DB row to match schema."""
    return row


@router.get("", response_model=list[MeetingWithResearch])
async def list_meetings(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    meetings_res = (
        db.table("meetings")
        .select("*")
        .eq("user_id", user_id)
        .order("meeting_date", desc=False)
        .execute()
    )

    result: list[MeetingWithResearch] = []
    for m in meetings_res.data:
        # Latest research job
        job_res = (
            db.table("research_jobs")
            .select("*")
            .eq("meeting_id", m["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        job = job_res.data[0] if job_res.data else None

        # Briefing (existence check)
        briefing_res = (
            db.table("briefings")
            .select("id, created_at, updated_at, model_used, tokens_used")
            .eq("meeting_id", m["id"])
            .limit(1)
            .execute()
        )
        has_briefing = bool(briefing_res.data)

        result.append(
            MeetingWithResearch(
                **m,
                research_job=ResearchJob(**job) if job else None,
                briefing=None if not has_briefing else _minimal_briefing(m["id"], m["user_id"], briefing_res.data[0]),
            )
        )
    return result


def _minimal_briefing(meeting_id: str, user_id: str, row: dict) -> Briefing:
    """Return a Briefing shell (no full content) for list views."""
    return Briefing(
        id=row["id"],
        meeting_id=meeting_id,
        user_id=user_id,
        content=BriefingContent(
            executive_snapshot="",
            company_insights="",
            industry_context="",
            meeting_strategy="",
        ),
        model_used=row.get("model_used"),
        tokens_used=row.get("tokens_used"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("/{meeting_id}", response_model=MeetingWithResearch)
async def get_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    res = (
        db.table("meetings")
        .select("*")
        .eq("id", meeting_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    m = res.data

    job_res = (
        db.table("research_jobs")
        .select("*")
        .eq("meeting_id", meeting_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    job = job_res.data[0] if job_res.data else None

    briefing_res = (
        db.table("briefings")
        .select("*")
        .eq("meeting_id", meeting_id)
        .limit(1)
        .execute()
    )
    briefing = None
    if briefing_res.data:
        b = briefing_res.data[0]
        briefing = Briefing(
            **{k: v for k, v in b.items() if k != "content"},
            content=BriefingContent(**b["content"]),
        )

    return MeetingWithResearch(
        **m,
        research_job=ResearchJob(**job) if job else None,
        briefing=briefing,
    )


@router.post("", response_model=Meeting, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    payload: MeetingCreate,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    data = payload.model_dump()
    data["user_id"] = user_id
    data["status"] = "upcoming"
    data["meeting_date"] = data["meeting_date"].isoformat()
    data["meeting_type"] = data["meeting_type"].value

    res = db.table("meetings").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create meeting")
    return Meeting(**res.data[0])


@router.patch("/{meeting_id}", response_model=Meeting)
async def update_meeting(
    meeting_id: str,
    payload: MeetingUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    existing = (
        db.table("meetings")
        .select("id")
        .eq("id", meeting_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "meeting_date" in data:
        data["meeting_date"] = data["meeting_date"].isoformat()
    if "meeting_type" in data:
        data["meeting_type"] = data["meeting_type"].value
    if "status" in data:
        data["status"] = data["status"].value

    res = db.table("meetings").update(data).eq("id", meeting_id).execute()
    return Meeting(**res.data[0])


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    existing = (
        db.table("meetings")
        .select("id")
        .eq("id", meeting_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.table("meetings").delete().eq("id", meeting_id).execute()
