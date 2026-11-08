# MeetBrief AI — Setup Guide

## Prerequisites
- Node.js 20+
- Python 3.11+
- A Supabase project
- Anthropic API key
- Tavily API key

---

## 1. Environment variables

Copy `.env.example` to `.env` in the project root and fill in your keys:

```bash
cp .env.example .env
```

| Key | Where to find it |
|-----|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Settings → JWT Secret |
| `ANTHROPIC_API_KEY` | console.anthropic.com/settings/keys |
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey |
| `TAVILY_API_KEY` | app.tavily.com |
| `BACKEND_SECRET_KEY` | Any random 32-char string |

---

## 2. Database

Run the migrations in order in the Supabase SQL editor:

1. `supabase/migrations/001_initial_schema.sql` (Tables for meetings, research jobs, findings, briefings + RLS)
2. `supabase/migrations/002_meeting_companion.sql` (Tables for transcripts and post-meeting summaries + RLS)

Copy-paste each file's contents into the Supabase SQL editor and click **Run**.

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:3000

---

## 4. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Runs at http://localhost:8000
API docs: http://localhost:8000/docs

---

## 5. Verify

1. Open http://localhost:3000
2. Sign up with an email
3. Create a meeting (e.g. "Call with Stripe", company: "Stripe")
4. Click **Prepare briefing** — research takes 30–60 seconds
5. View the AI-generated briefing under the **Briefing** tab

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel
```
Add all `NEXT_PUBLIC_*` env vars in the Vercel project settings.

### Backend → Render
1. Create a new **Web Service** pointing to the `backend/` directory
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all backend env vars in Render's Environment settings
5. Set `NEXT_PUBLIC_API_URL` in Vercel to `https://meetbrief-ai.onrender.com` for Production and Preview deployments. Local development uses `http://localhost:8000` by default.
6. Update `ALLOWED_ORIGINS` in Render to include your Vercel URL
