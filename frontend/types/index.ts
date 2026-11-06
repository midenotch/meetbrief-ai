export type MeetingType =
  | "sales_call"
  | "partnership"
  | "investment"
  | "job_interview"
  | "team_meeting"
  | "client_review"
  | "networking"
  | "other";

export type MeetingStatus = "upcoming" | "completed" | "cancelled";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  company_or_person: string;
  meeting_date: string;
  meeting_type: MeetingType;
  objective: string;
  context?: string;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
}

export interface ResearchJob {
  id: string;
  meeting_id: string;
  user_id: string;
  status: JobStatus;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface ResearchFinding {
  id: string;
  meeting_id: string;
  job_id?: string;
  title: string;
  content: string;
  source_url?: string;
  source_name?: string;
  published_date?: string;
  relevance_score?: number;
  category?: string;
  is_verified: boolean;
  created_at: string;
}

export interface BriefingSource {
  url: string;
  title: string;
  source_name?: string;
  published_date?: string;
}

export interface BriefingDevelopment {
  title: string;
  summary: string;
  significance: string;
  source_url?: string;
  published_date?: string;
  category: string;
}

export interface BriefingPerson {
  name: string;
  role: string;
  background: string;
  relevance: string;
}

export interface BriefingContent {
  executive_snapshot: string;
  key_developments: BriefingDevelopment[];
  key_people: BriefingPerson[];
  company_insights: string;
  industry_context: string;
  discussion_points: string[];
  suggested_questions: string[];
  opportunities: string[];
  risks: string[];
  meeting_strategy: string;
  confidence_level: "high" | "medium" | "low";
  sources: BriefingSource[];
}

export interface Briefing {
  id: string;
  meeting_id: string;
  user_id: string;
  content: BriefingContent;
  model_used?: string;
  tokens_used?: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingWithResearch extends Meeting {
  research_job?: ResearchJob;
  briefing?: Briefing;
}

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  sales_call: "Sales Call",
  partnership: "Partnership",
  investment: "Investment",
  job_interview: "Job Interview",
  team_meeting: "Team Meeting",
  client_review: "Client Review",
  networking: "Networking",
  other: "Other",
};
