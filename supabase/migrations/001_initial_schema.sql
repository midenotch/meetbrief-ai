-- MeetBrief AI — Initial Schema

-- ============================================================
-- MEETINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT        NOT NULL,
  company_or_person TEXT    NOT NULL,
  meeting_date  TIMESTAMPTZ NOT NULL,
  meeting_type  TEXT        NOT NULL DEFAULT 'general',
  objective     TEXT        NOT NULL,
  context       TEXT,
  status        TEXT        NOT NULL DEFAULT 'upcoming',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESEARCH JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.research_jobs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id    UUID        REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending',
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESEARCH FINDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.research_findings (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id      UUID        REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  job_id          UUID        REFERENCES public.research_jobs(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  source_url      TEXT,
  source_name     TEXT,
  published_date  TIMESTAMPTZ,
  relevance_score FLOAT,
  category        TEXT,
  is_verified     BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRIEFINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.briefings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id  UUID        REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     JSONB       NOT NULL,
  model_used  TEXT,
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_briefings_updated_at
  BEFORE UPDATE ON public.briefings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.meetings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_jobs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings        ENABLE ROW LEVEL SECURITY;

-- Meetings
CREATE POLICY "Users manage own meetings"
  ON public.meetings FOR ALL
  USING (auth.uid() = user_id);

-- Research jobs
CREATE POLICY "Users manage own research jobs"
  ON public.research_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Research findings (via meeting ownership)
CREATE POLICY "Users manage own findings"
  ON public.research_findings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE id = research_findings.meeting_id
      AND user_id = auth.uid()
    )
  );

-- Briefings
CREATE POLICY "Users manage own briefings"
  ON public.briefings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_meetings_user_id       ON public.meetings(user_id);
CREATE INDEX idx_meetings_meeting_date  ON public.meetings(meeting_date);
CREATE INDEX idx_research_jobs_meeting  ON public.research_jobs(meeting_id);
CREATE INDEX idx_findings_meeting       ON public.research_findings(meeting_id);
CREATE INDEX idx_briefings_meeting      ON public.briefings(meeting_id);
