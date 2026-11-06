from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import meetings, research, briefings, transcripts, post_meeting

settings = get_settings()

app = FastAPI(
    title="MeetBrief AI API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

def _cors_origins() -> list[str]:
    origins = settings.cors_origins
    # Also allow any Chrome extension origin during development
    return origins + ["*"] if "*" in origins else origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # extension + localhost; tighten for production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)
app.include_router(research.router)
app.include_router(briefings.router)
app.include_router(transcripts.router)
app.include_router(post_meeting.router)


@app.get("/health")
def health():
    return {"status": "ok"}
