from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from app.models.schemas import Briefing, BriefingContent
from supabase import Client

router = APIRouter(prefix="/api/briefings", tags=["briefings"])


@router.get("/{meeting_id}", response_model=Briefing)
async def get_briefing(
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
        db.table("briefings")
        .select("*")
        .eq("meeting_id", meeting_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Briefing not found")

    b = res.data[0]
    return Briefing(
        **{k: v for k, v in b.items() if k != "content"},
        content=BriefingContent(**b["content"]),
    )
