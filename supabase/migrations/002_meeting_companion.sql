-- Meeting companion: transcripts & post-meeting intelligence

CREATE TABLE IF NOT EXISTS transcripts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segments        jsonb NOT NULL DEFAULT '[]',
  full_text       text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own transcripts"
  ON transcripts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS meeting_summaries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript_id   uuid REFERENCES transcripts(id) ON DELETE SET NULL,
  content         jsonb NOT NULL DEFAULT '{}',
  model_used      text,
  tokens_used     integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own meeting_summaries"
  ON meeting_summaries FOR ALL USING (auth.uid() = user_id);
