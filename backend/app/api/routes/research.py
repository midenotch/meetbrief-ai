from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from app.models.schemas import ResearchJob, ResearchFinding
from app.services.research_service import run_research_pipeline
from supabase import Client
from datetime import datetime, timezone

router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("/start/{meeting_id}", response_model=ResearchJob)
async def start_research(
    meeting_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    # Verify meeting belongs to user
    meeting_res = (
        db.table("meetings")
        .select("*")
        .eq("id", meeting_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not meeting_res.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting = meeting_res.data

    # Check for an already running job
    running_res = (
        db.table("research_jobs")
        .select("*")
        .eq("meeting_id", meeting_id)
        .in_("status", ["pending", "running"])
        .limit(1)
        .execute()
    )
    if running_res.data:
        return ResearchJob(**running_res.data[0])

    # Create job record
    job_data = {
        "meeting_id": meeting_id,
        "user_id": user_id,
        "status": "pending",
    }
    job_res = db.table("research_jobs").insert(job_data).execute()
    job = job_res.data[0]

    # Kick off background research
    background_tasks.add_task(
        run_research_pipeline,
        job_id=job["id"],
        meeting_id=meeting_id,
        company_or_person=meeting["company_or_person"],
        meeting_date=meeting["meeting_date"],
        meeting_type=meeting["meeting_type"],
        objective=meeting["objective"],
        context=meeting.get("context"),
        user_id=user_id,
    )

    return ResearchJob(**job)


@router.get("/status/{job_id}", response_model=ResearchJob)
async def get_research_status(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    res = (
        db.table("research_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Research job not found")
    return ResearchJob(**res.data)


@router.get("/findings/{meeting_id}", response_model=list[ResearchFinding])
async def get_findings(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    # Verify ownership
    meeting_res = (
        db.table("meetings")
        .select("id")
        .eq("id", meeting_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not meeting_res.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    res = (
        db.table("research_findings")
        .select("*")
        .eq("meeting_id", meeting_id)
        .order("relevance_score", desc=True)
        .execute()
    )
    return [ResearchFinding(**f) for f in res.data]
