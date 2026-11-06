"""
Research pipeline: Tavily multi-query search → deduplication → DB storage → briefing.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import urlparse

from tavily import TavilyClient

from app.core.config import get_settings
from app.core.database import get_supabase
from app.services.briefing_service import generate_and_store_briefing

logger = logging.getLogger(__name__)

RESEARCH_WINDOW_DAYS = 30

CATEGORY_QUERIES: dict[str, list[str]] = {
    "news": [
        "{company} news",
        "{company} announcement",
        "{company} press release",
    ],
    "funding": [
        "{company} funding investment valuation",
        "{company} series round raised",
    ],
    "product": [
        "{company} product launch feature update",
        "{company} new release",
    ],
    "leadership": [
        "{company} CEO founder leadership team",
        "{company} executive appointment",
    ],
    "partnership": [
        "{company} partnership deal collaboration",
        "{company} acquisition merger",
    ],
}


def _extract_source_name(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def _is_within_window(published_date: Optional[str], cutoff: datetime) -> bool:
    if not published_date:
        return True  # Include undated articles
    try:
        dt = datetime.fromisoformat(published_date.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt >= cutoff
    except Exception:
        return True


def run_research_pipeline(
    job_id: str,
    meeting_id: str,
    company_or_person: str,
    meeting_date: str,
    meeting_type: str,
    objective: str,
    context: Optional[str],
    user_id: str,
) -> None:
    """Synchronous entry point called by FastAPI BackgroundTasks."""
    asyncio.run(
        _run_pipeline(
            job_id=job_id,
            meeting_id=meeting_id,
            company_or_person=company_or_person,
            meeting_date=meeting_date,
            meeting_type=meeting_type,
            objective=objective,
            context=context,
            user_id=user_id,
        )
    )


async def _run_pipeline(
    job_id: str,
    meeting_id: str,
    company_or_person: str,
    meeting_date: str,
    meeting_type: str,
    objective: str,
    context: Optional[str],
    user_id: str,
) -> None:
    db = get_supabase()
    settings = get_settings()

    def update_job(status: str, error: Optional[str] = None) -> None:
        data: dict = {"status": status}
        if status == "running":
            data["started_at"] = datetime.now(timezone.utc).isoformat()
        if status in ("completed", "failed"):
            data["completed_at"] = datetime.now(timezone.utc).isoformat()
        if error:
            data["error_message"] = error
        db.table("research_jobs").update(data).eq("id", job_id).execute()

    try:
        update_job("running")

        # Calculate 30-day cutoff before meeting date
        try:
            mtg_dt = datetime.fromisoformat(meeting_date.replace("Z", "+00:00"))
        except Exception:
            mtg_dt = datetime.now(timezone.utc)
        cutoff = mtg_dt - timedelta(days=RESEARCH_WINDOW_DAYS)

        tavily = TavilyClient(api_key=settings.tavily_api_key)

        seen_urls: set[str] = set()
        all_findings: list[dict] = []

        # Run searches across all categories
        for category, queries in CATEGORY_QUERIES.items():
            for query_template in queries:
                query = query_template.replace("{company}", company_or_person)
                try:
                    result = await asyncio.to_thread(
                        tavily.search,
                        query=query,
                        search_depth="advanced",
                        max_results=5,
                        days=RESEARCH_WINDOW_DAYS + 5,  # small buffer
                    )
                    for item in result.get("results", []):
                        url = item.get("url", "")
                        if not url or url in seen_urls:
                            continue
                        if not _is_within_window(item.get("published_date"), cutoff):
                            continue

                        seen_urls.add(url)
                        all_findings.append(
                            {
                                "meeting_id": meeting_id,
                                "job_id": job_id,
                                "title": item.get("title", "Untitled"),
                                "content": item.get("content", ""),
                                "source_url": url,
                                "source_name": _extract_source_name(url),
                                "published_date": item.get("published_date"),
                                "relevance_score": item.get("score", 0.5),
                                "category": category,
                                "is_verified": False,
                            }
                        )
                except Exception as e:
                    logger.warning("Tavily query '%s' failed: %s", query, e)

        if not all_findings:
            logger.warning("No findings for meeting %s — will generate briefing with limited data.", meeting_id)

        # Sort by relevance, take top 15 (keeps AI response within token budget)
        all_findings.sort(key=lambda x: x.get("relevance_score") or 0, reverse=True)
        top_findings = all_findings[:15]

        # Persist findings
        if top_findings:
            # Normalize dates
            for f in top_findings:
                if f.get("published_date"):
                    try:
                        dt = datetime.fromisoformat(f["published_date"].replace("Z", "+00:00"))
                        f["published_date"] = dt.isoformat()
                    except Exception:
                        f["published_date"] = None

            db.table("research_findings").insert(top_findings).execute()

        # Generate AI briefing
        await generate_and_store_briefing(
            meeting_id=meeting_id,
            company_or_person=company_or_person,
            meeting_date=meeting_date,
            meeting_type=meeting_type,
            objective=objective,
            context=context,
            findings=top_findings,
            user_id=user_id,
        )

        update_job("completed")
        logger.info("Research pipeline completed for meeting %s — %d findings.", meeting_id, len(top_findings))

    except Exception as exc:
        logger.exception("Research pipeline failed for meeting %s", meeting_id)
        update_job("failed", error=str(exc))
