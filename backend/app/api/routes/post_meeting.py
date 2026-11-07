from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from app.services.post_meeting_service import generate_post_meeting_intelligence
from supabase import Client

router = APIRouter(prefix="/api/post-meeting", tags=["post-meeting"])


class GenerateRequest(BaseModel):
    meeting_id: str
    transcript_id: str


@router.post("/generate/{meeting_id}", status_code=201)
async def generate(
    meeting_id: str,
    body: GenerateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    # Fetch meeting
    mtg = db.table("meetings").select("*").eq("id", meeting_id).eq("user_id", user_id).single().execute()
    if not mtg.data:
        raise HTTPException(status_code=404, detail="Meeting not found")
    m = mtg.data

    # Fetch transcript
    tr = db.table("transcripts").select("*").eq("id", body.transcript_id).eq("user_id", user_id).single().execute()
    if not tr.data:
        raise HTTPException(status_code=404, detail="Transcript not found")

    result = await generate_post_meeting_intelligence(
        meeting_id=meeting_id,
        transcript_id=body.transcript_id,
        title=m.get("title", "Meeting"),
        company_or_person=m.get("company_or_person", ""),
        meeting_type=m.get("meeting_type", "other"),
        objective=m.get("objective", ""),
        transcript_text=tr.data.get("full_text", ""),
        user_id=user_id,
    )
    return result


@router.get("/{meeting_id}")
async def get_summary(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    result = (
        db.table("meeting_summaries")
        .select("*")
        .eq("meeting_id", meeting_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No post-meeting intelligence found")
    return result.data[0]
