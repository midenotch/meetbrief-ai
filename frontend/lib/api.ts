import { createClient } from "@/lib/supabase/client";
import type {
  Meeting,
  ResearchJob,
  ResearchFinding,
  Briefing,
  MeetingWithResearch,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Meetings ────────────────────────────────────────────────

export async function getMeetings(): Promise<MeetingWithResearch[]> {
  return apiFetch<MeetingWithResearch[]>("/api/meetings");
}

export async function getMeeting(id: string): Promise<MeetingWithResearch> {
  return apiFetch<MeetingWithResearch>(`/api/meetings/${id}`);
}

export async function createMeeting(
  data: Omit<Meeting, "id" | "user_id" | "created_at" | "updated_at" | "status">
): Promise<Meeting> {
  return apiFetch<Meeting>("/api/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMeeting(
  id: string,
  data: Partial<Omit<Meeting, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: string): Promise<void> {
  await apiFetch(`/api/meetings/${id}`, { method: "DELETE" });
}

// ── Research ─────────────────────────────────────────────────

export async function startResearch(meetingId: string): Promise<ResearchJob> {
  return apiFetch<ResearchJob>(`/api/research/start/${meetingId}`, {
    method: "POST",
  });
}

export async function getResearchStatus(jobId: string): Promise<ResearchJob> {
  return apiFetch<ResearchJob>(`/api/research/status/${jobId}`);
}

export async function getResearchFindings(
  meetingId: string
): Promise<ResearchFinding[]> {
  return apiFetch<ResearchFinding[]>(`/api/research/findings/${meetingId}`);
}

// ── Briefings ────────────────────────────────────────────────

export async function getBriefing(meetingId: string): Promise<Briefing> {
  return apiFetch<Briefing>(`/api/briefings/${meetingId}`);
}

// ── Post-meeting ──────────────────────────────────────────────

export interface MeetingSummary {
  id: string;
  meeting_id: string;
  transcript_id: string | null;
  content: PostMeetingContent;
  model_used: string;
  tokens_used: number;
  created_at: string;
}

export interface PostMeetingContent {
  executive_summary?: string;
  key_decisions?: Array<{ decision: string; context?: string; owner?: string } | string>;
  action_items?: Array<{ task: string; owner?: string; deadline?: string | null; priority?: string } | string>;
  unresolved_questions?: Array<{ question: string; context?: string } | string>;
  briefing_comparison?: { anticipated_vs_actual?: string; surprises?: string[]; confirmed_intel?: string[] };
  key_themes?: string[];
  sentiment?: string;
  follow_up_email?: { subject?: string; body?: string };
  next_steps?: string[];
  meeting_effectiveness?: string;
}

export async function getPostMeeting(meetingId: string): Promise<MeetingSummary> {
  return apiFetch<MeetingSummary>(`/api/post-meeting/${meetingId}`);
}
