"""
Post-meeting intelligence: transcript → Gemini → summary, decisions, action items, follow-up.
"""
import asyncio
import json
import logging
from typing import Optional

from app.core.config import get_settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

POST_MEETING_SYSTEM_PROMPT = """You are an expert meeting analyst and executive assistant.
Analyze the provided meeting transcript and generate structured post-meeting intelligence.

Rules:
- Only use information explicitly stated in the transcript.
- Extract concrete, specific action items with clear owners where identifiable.
- Identify decisions that were actually made (not just discussed).
- Note questions that were raised but not answered.
- If a pre-meeting briefing is provided, compare what was discussed vs. what was anticipated.
- Output ONLY valid JSON matching the schema. No markdown, no prose outside the JSON."""

POST_MEETING_PROMPT = """Analyze this meeting transcript and generate post-meeting intelligence.

## Meeting Context
- **Meeting:** {title}
- **With:** {company_or_person}
- **Type:** {meeting_type}
- **Objective:** {objective}

{briefing_section}

## Full Transcript
{transcript}

## Required Output Schema

Return a single JSON object with exactly these fields:

{{
  "executive_summary": "3-4 sentence overview of what happened in the meeting",
  "key_decisions": [
    {{
      "decision": "What was decided",
      "context": "Why this decision was made",
      "owner": "Who is responsible (if mentioned)"
    }}
  ],
  "action_items": [
    {{
      "task": "Specific action to take",
      "owner": "Person responsible (use 'Unknown' if not mentioned)",
      "deadline": "Deadline if mentioned, else null",
      "priority": "high|medium|low"
    }}
  ],
  "unresolved_questions": [
    {{
      "question": "Question that was raised but not answered",
      "context": "Why it matters"
    }}
  ],
  "briefing_comparison": {{
    "anticipated_vs_actual": "How the meeting compared to pre-meeting research expectations",
    "surprises": ["Unexpected topics or information that came up"],
    "confirmed_intel": ["Pre-meeting intelligence that was confirmed in the meeting"]
  }},
  "key_themes": ["Main topics covered"],
  "sentiment": "positive|neutral|mixed|negative",
  "follow_up_email": {{
    "subject": "Email subject line",
    "body": "Full email body ready to send, in a professional tone"
  }},
  "next_steps": ["Recommended next step 1", "..."],
  "meeting_effectiveness": "Brief assessment of how well the meeting achieved its objective"
}}"""


def _build_prompt(
    title: str,
    company_or_person: str,
    meeting_type: str,
    objective: str,
    transcript: str,
    briefing_content: Optional[dict],
) -> str:
    if briefing_content:
        snapshot = briefing_content.get("executive_snapshot", "")
        strategy = briefing_content.get("meeting_strategy", "")
        briefing_section = f"""## Pre-Meeting Briefing Summary
- **Intel snapshot:** {snapshot}
- **Recommended strategy:** {strategy}"""
    else:
        briefing_section = "## Pre-Meeting Briefing\nNo pre-meeting briefing was available."

    return POST_MEETING_PROMPT.format(
        title=title,
        company_or_person=company_or_person,
        meeting_type=meeting_type,
        objective=objective,
        briefing_section=briefing_section,
        transcript=transcript[:12000],  # cap to avoid token overflow
    )


async def generate_post_meeting_intelligence(
    meeting_id: str,
    transcript_id: str,
    title: str,
    company_or_person: str,
    meeting_type: str,
    objective: str,
    transcript_text: str,
    user_id: str,
) -> dict:
    settings = get_settings()
    db = get_supabase()

    # Fetch briefing for comparison (optional)
    briefing_content = None
    try:
        br = (
            db.table("briefings")
            .select("content")
            .eq("meeting_id", meeting_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if br.data:
            briefing_content = br.data[0].get("content")
    except Exception:
        pass

    prompt = _build_prompt(
        title=title,
        company_or_person=company_or_person,
        meeting_type=meeting_type,
        objective=objective,
        transcript=transcript_text,
        briefing_content=briefing_content,
    )

    from google import genai
    from google.genai import types

    client = genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(api_version="v1beta"),
    )
    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=POST_MEETING_SYSTEM_PROMPT,
            max_output_tokens=8192,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )

    raw = response.text
    tokens = getattr(response.usage_metadata, "total_token_count", 0) if response.usage_metadata else 0

    try:
        intelligence = json.loads(raw)
    except json.JSONDecodeError:
        intelligence = {"executive_summary": raw, "error": "Could not parse structured output"}

    # Persist
    result = db.table("meeting_summaries").insert({
        "meeting_id": meeting_id,
        "user_id": user_id,
        "transcript_id": transcript_id,
        "content": intelligence,
        "model_used": settings.gemini_model,
        "tokens_used": tokens,
    }).execute()

    logger.info("Post-meeting intelligence stored for meeting %s (%d tokens)", meeting_id, tokens)
    return result.data[0]
