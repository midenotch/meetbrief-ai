"""
Briefing generation: formats research findings → Claude or Gemini → structured JSON → DB.
Falls back to Gemini when ANTHROPIC_API_KEY is not set.
"""
import asyncio
import json
import logging
from typing import Optional

from app.core.config import get_settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

MEETING_TYPE_LABELS = {
    "sales_call": "Sales Call",
    "partnership": "Partnership Discussion",
    "investment": "Investment Meeting",
    "job_interview": "Job Interview",
    "team_meeting": "Team Meeting",
    "client_review": "Client Review",
    "networking": "Networking",
    "other": "Meeting",
}

BRIEFING_SYSTEM_PROMPT = """You are an elite research analyst and strategic advisor.
Your task is to synthesize research findings into a comprehensive, actionable meeting briefing.

Rules:
- Only use information from the provided research findings — never invent facts or statistics.
- Always attribute claims to their sources using the provided URLs.
- Be specific and concrete. Avoid vague generalities.
- Adapt your analysis to the meeting type and stated objective.
- If information is limited, acknowledge it and work with what you have.
- Output ONLY valid JSON matching the schema provided. No markdown, no prose outside the JSON."""

BRIEFING_PROMPT_TEMPLATE = """Prepare a comprehensive meeting briefing.

## Meeting Details
- **Target:** {company_or_person}
- **Meeting type:** {meeting_type_label}
- **Scheduled:** {meeting_date}
- **Objective:** {objective}
{context_section}

## Research Findings ({finding_count} sources from the last 30 days)

{formatted_findings}

## Required Output Schema

Return a single JSON object with exactly these fields:

{{
  "executive_snapshot": "2-3 sentence high-level overview of {company_or_person}'s current situation",
  "key_developments": [
    {{
      "title": "Event title",
      "summary": "What happened and key details",
      "significance": "Why this matters specifically for this meeting",
      "source_url": "https://...",
      "published_date": "YYYY-MM-DD or null",
      "category": "news|funding|product|leadership|partnership|acquisition|other"
    }}
  ],
  "key_people": [
    {{
      "name": "Full name",
      "role": "Title",
      "background": "Brief professional background",
      "relevance": "Why relevant to this meeting"
    }}
  ],
  "company_insights": "Paragraph analyzing company's current market position, strategy, and momentum",
  "industry_context": "Relevant industry trends and competitive landscape",
  "discussion_points": ["Concrete topic to cover", "..."],
  "suggested_questions": ["Specific question to ask", "..."],
  "opportunities": ["Specific opportunity relevant to this meeting objective", "..."],
  "risks": ["Potential challenge or risk to be aware of", "..."],
  "meeting_strategy": "Strategic recommendation for how to approach this specific meeting",
  "confidence_level": "high|medium|low",
  "sources": [
    {{
      "url": "https://...",
      "title": "Article or source title",
      "source_name": "Publication name",
      "published_date": "YYYY-MM-DD or null"
    }}
  ]
}}

Provide at least 3 key_developments, 5 discussion_points, 5 suggested_questions, 3 opportunities, and 3 risks.
confidence_level should reflect how much solid information was available."""


def _format_findings(findings: list[dict]) -> str:
    if not findings:
        return "No specific recent news found. Base your briefing on general knowledge about this company/person type and meeting context."

    lines = []
    for i, f in enumerate(findings, 1):
        lines.append(f"### {i}. {f['title']}")
        if f.get("source_name") or f.get("published_date"):
            meta = " | ".join(filter(None, [
                f.get("source_name"),
                f.get("published_date", "")[:10] if f.get("published_date") else None,
            ]))
            lines.append(f"*{meta}*")
        lines.append(f['content'][:600])
        if f.get("source_url"):
            lines.append(f"Source: {f['source_url']}")
        lines.append("")
    return "\n".join(lines)


def _strip_code_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        end = -1 if lines[-1].strip() == "```" else len(lines)
        raw = "\n".join(lines[1:end])
    return raw.strip()


async def _call_anthropic(prompt: str, settings) -> tuple[str, int]:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = await asyncio.to_thread(
        client.messages.create,
        model=settings.anthropic_model,
        max_tokens=8192,
        system=BRIEFING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text
    tokens = response.usage.input_tokens + response.usage.output_tokens
    return raw, tokens


async def _call_gemini(prompt: str, settings) -> tuple[str, int]:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=settings.gemini_api_key)
    response = await asyncio.to_thread(
        client.models.generate_content,
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=BRIEFING_SYSTEM_PROMPT,
            max_output_tokens=16384,
            temperature=0.3,
            response_mime_type="application/json",
        ),
    )
    raw = response.text
    tokens = getattr(response.usage_metadata, "total_token_count", 0) if response.usage_metadata else 0
    return raw, tokens


async def generate_and_store_briefing(
    meeting_id: str,
    company_or_person: str,
    meeting_date: str,
    meeting_type: str,
    objective: str,
    context: Optional[str],
    findings: list[dict],
    user_id: str,
) -> None:
    settings = get_settings()
    db = get_supabase()

    context_section = f"- **Context:** {context}" if context else ""
    meeting_type_label = MEETING_TYPE_LABELS.get(meeting_type, meeting_type)

    prompt = BRIEFING_PROMPT_TEMPLATE.format(
        company_or_person=company_or_person,
        meeting_type_label=meeting_type_label,
        meeting_date=meeting_date[:10] if meeting_date else "TBD",
        objective=objective,
        context_section=context_section,
        finding_count=len(findings),
        formatted_findings=_format_findings(findings),
    )

    provider = settings.ai_provider
    logger.info("Generating briefing using provider: %s", provider)

    if provider == "anthropic":
        raw, tokens = await _call_anthropic(prompt, settings)
        model_used = settings.anthropic_model
    else:
        raw, tokens = await _call_gemini(prompt, settings)
        model_used = settings.gemini_model

    cleaned = _strip_code_fences(raw)
    try:
        briefing_content = json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Model truncated the JSON — attempt to salvage by truncating at last complete object
        logger.warning("JSON parse failed (%s), attempting repair on %d chars", e, len(cleaned))
        # Find the last valid closing brace for the top-level object
        for i in range(len(cleaned) - 1, -1, -1):
            if cleaned[i] == '}':
                try:
                    briefing_content = json.loads(cleaned[:i + 1])
                    logger.info("JSON repaired by truncating at char %d", i)
                    break
                except json.JSONDecodeError:
                    continue
        else:
            raise ValueError(f"Could not parse or repair AI response: {e}") from e

    db.table("briefings").insert({
        "meeting_id": meeting_id,
        "user_id": user_id,
        "content": briefing_content,
        "model_used": model_used,
        "tokens_used": tokens,
    }).execute()

    logger.info("Briefing stored for meeting %s via %s (%d tokens)", meeting_id, provider, tokens)
