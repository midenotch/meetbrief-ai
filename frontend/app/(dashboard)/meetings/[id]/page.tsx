"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Target,
  Trash2,
  Sparkles,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  getMeeting,
  startResearch,
  getResearchStatus,
  getResearchFindings,
  deleteMeeting,
  getPostMeeting,
} from "@/lib/api";
import type { MeetingSummary } from "@/lib/api";
import { BriefingView } from "@/components/briefing/BriefingView";
import { ResearchFindingsList } from "@/components/meetings/ResearchFindingsList";
import { PostMeetingView } from "@/components/meetings/PostMeetingView";
import type { MeetingWithResearch, ResearchFinding, JobStatus } from "@/types";
import { MEETING_TYPE_LABELS } from "@/types";
import { formatMeetingDate } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "overview" | "findings" | "briefing" | "post-meeting";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<MeetingWithResearch | null>(null);
  const [findings, setFindings] = useState<ResearchFinding[]>([]);
  const [postMeeting, setPostMeeting] = useState<MeetingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [researchLoading, setResearchLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [deleting, setDeleting] = useState(false);

  const fetchMeeting = useCallback(async () => {
    const data = await getMeeting(id);
    setMeeting(data);
    return data;
  }, [id]);

  useEffect(() => {
    fetchMeeting()
      .catch(() => toast.error("Failed to load meeting"))
      .finally(() => setLoading(false));
  }, [fetchMeeting]);

  // Poll research job status when running
  useEffect(() => {
    if (!meeting?.research_job) return;
    const { status, id: jobId } = meeting.research_job;
    if (status !== "running" && status !== "pending") return;

    const interval = setInterval(async () => {
      const job = await getResearchStatus(jobId).catch(() => null);
      if (!job) return;

      if (job.status === "completed" || job.status === "failed") {
        clearInterval(interval);
        const updated = await fetchMeeting();
        if (job.status === "completed") {
          const f = await getResearchFindings(id).catch(() => []);
          setFindings(f);
          toast.success("Research complete — briefing is ready.");
          if (updated?.briefing) setTab("briefing");
        } else {
          toast.error(`Research failed: ${job.error_message || "Unknown error"}`);
        }
      } else {
        setMeeting((prev) =>
          prev ? { ...prev, research_job: job } : prev
        );
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [meeting?.research_job?.status, meeting?.research_job?.id, id, fetchMeeting]);

  async function handleStartResearch() {
    setResearchLoading(true);
    try {
      const job = await startResearch(id);
      setMeeting((prev) => (prev ? { ...prev, research_job: job } : prev));
      toast.info("Research started — this takes about 30–60 seconds.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start research");
    } finally {
      setResearchLoading(false);
    }
  }

  async function handleLoadFindings() {
    const f = await getResearchFindings(id).catch(() => []);
    setFindings(f);
    setTab("findings");
  }

  async function handleLoadPostMeeting() {
    try {
      const pm = await getPostMeeting(id);
      setPostMeeting(pm);
      setTab("post-meeting");
    } catch {
      toast.error("No post-meeting intelligence found. Use the Chrome extension to record and analyse a meeting.");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this meeting and all its data?")) return;
    setDeleting(true);
    try {
      await deleteMeeting(id);
      toast.success("Meeting deleted.");
      router.push("/meetings");
    } catch {
      toast.error("Failed to delete meeting.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="text-gray-500">Meeting not found.</p>
        <Link href="/meetings" className="text-sm text-gray-900 hover:underline mt-2 inline-block">
          Back to meetings
        </Link>
      </div>
    );
  }

  const jobStatus: JobStatus | undefined = meeting.research_job?.status;
  const isRunning = jobStatus === "running" || jobStatus === "pending";
  const hasBriefing = !!meeting.briefing;

  return (
    <div>
      {/* Back */}
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        All meetings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {formatMeetingDate(meeting.meeting_date)}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete meeting"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Research CTA */}
      {!jobStatus && (
        <div className="bg-gray-900 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Ready to prepare your briefing?</p>
            <p className="text-gray-400 text-xs mt-0.5">
              We'll research {meeting.company_or_person} and generate an AI-powered briefing.
            </p>
          </div>
          <button
            onClick={handleStartResearch}
            disabled={researchLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Sparkles size={15} />
            {researchLoading ? "Starting…" : "Prepare briefing"}
          </button>
        </div>
      )}

      {/* Research progress */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Researching {meeting.company_or_person}…</p>
            <p className="text-xs text-blue-600 mt-0.5">Searching news, announcements, and developments. This takes about 30–60 seconds.</p>
          </div>
        </div>
      )}

      {/* Research failed */}
      {jobStatus === "failed" && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Research failed</p>
              <p className="text-xs text-red-600 mt-0.5">{meeting.research_job?.error_message || "An error occurred."}</p>
            </div>
          </div>
          <button
            onClick={handleStartResearch}
            disabled={researchLoading}
            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {(["overview", "findings", "briefing", "post-meeting"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              if (t === "findings" && findings.length === 0) handleLoadFindings();
              else if (t === "post-meeting" && !postMeeting) handleLoadPostMeeting();
              else setTab(t);
            }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "briefing" && <span className="inline-flex items-center gap-1.5"><FileText size={13} />Briefing</span>}
            {t === "findings" && <span className="inline-flex items-center gap-1.5"><Target size={13} />Research</span>}
            {t === "overview" && <span className="inline-flex items-center gap-1.5"><Clock size={13} />Overview</span>}
            {t === "post-meeting" && <span className="inline-flex items-center gap-1.5"><Sparkles size={13} />Post-Meeting</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Company / Person</p>
            <p className="text-sm text-gray-900">{meeting.company_or_person}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Objective</p>
            <p className="text-sm text-gray-900">{meeting.objective}</p>
          </div>
          {meeting.context && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Context</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.context}</p>
            </div>
          )}
        </div>
      )}

      {tab === "findings" && (
        <ResearchFindingsList findings={findings} loading={findings.length === 0} />
      )}

      {tab === "briefing" && meeting.briefing && (
        <BriefingView briefing={meeting.briefing} />
      )}

      {tab === "post-meeting" && postMeeting && (
        <PostMeetingView content={postMeeting.content} />
      )}

      {tab === "post-meeting" && !postMeeting && (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <Sparkles className="mx-auto mb-3 text-gray-300" size={36} />
          <p className="text-sm font-medium text-gray-700 mb-1">No post-meeting intelligence yet</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Use the MeetBrief Chrome extension to record your meeting. After it ends, the extension will generate AI-powered summaries, action items, and a follow-up email draft.
          </p>
        </div>
      )}
    </div>
  );
}
