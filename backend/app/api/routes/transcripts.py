import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from app.core.config import get_settings
from supabase import Client

router = APIRouter(prefix="/api/transcripts", tags=["transcripts"])


class TranscriptSegment(BaseModel):
    speaker: Optional[str] = None
    text: str
    timestamp: float
    confidence: Optional[float] = None


class SaveTranscriptRequest(BaseModel):
    meeting_id: str
    segments: list[TranscriptSegment]
    full_text: str
    duration_seconds: int = 0


@router.post("", status_code=201)
async def save_transcript(
    body: SaveTranscriptRequest,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    result = db.table("transcripts").insert({
        "meeting_id": body.meeting_id,
        "user_id": user_id,
        "segments": [s.model_dump() for s in body.segments],
        "full_text": body.full_text,
        "duration_seconds": body.duration_seconds,
    }).execute()
    return result.data[0]


CLEANUP_PROMPT = """You are a transcript correction assistant. The text below was captured by browser speech recognition and may contain errors.

Fix ONLY:
- Spelling mistakes from mishearing (e.g. "weather" → "whether")
- Missing or wrong punctuation
- Capitalisation of proper nouns (company names, product names, people's names)
- Run-on sentences (add punctuation to separate them)

Do NOT change:
- The actual words, meaning, or content
- Technical terms (even unusual ones)
- Timestamp/speaker labels like "[00:01] You:"
- Sentence structure or phrasing

Return ONLY the corrected transcript text with no commentary.

TRANSCRIPT:
{text}"""


class CleanupRequest(BaseModel):
    text: str


@router.post("/cleanup")
async def cleanup_transcript(
    body: CleanupRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not body.text.strip():
        return {"cleaned_text": body.text}

    settings = get_settings()
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.gemini_model,
        contents=CLEANUP_PROMPT.format(text=body.text[:20000]),
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=8192,
        ),
    )
    return {"cleaned_text": response.text.strip()}


@router.get("/{meeting_id}")
async def get_transcript(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_supabase),
):
    result = (
        db.table("transcripts")
        .select("*")
        .eq("meeting_id", meeting_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No transcript found")
    return result.data[0]
