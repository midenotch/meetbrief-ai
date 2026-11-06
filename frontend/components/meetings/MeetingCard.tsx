"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { MeetingWithResearch } from "@/types";
import { MEETING_TYPE_LABELS } from "@/types";
import { formatMeetingDate } from "@/lib/utils";
import { isPast } from "date-fns";

interface MeetingCardProps {
  meeting: MeetingWithResearch;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const jobStatus = meeting.research_job?.status;
  const hasBriefing = !!meeting.briefing;
  const isInPast = isPast(new Date(meeting.meeting_date));

  function ResearchStatus() {
    if (hasBriefing) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <CheckCircle2 size={11} />
          Briefing ready
        </span>
      );
    }
    if (jobStatus === "running" || jobStatus === "pending") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
          <Loader2 size={11} className="animate-spin" />
          Researching…
        </span>
      );
    }
    if (jobStatus === "failed") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
          <XCircle size={11} />
          Research failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Clock size={11} />
        No briefing yet
      </span>
    );
  }

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Date block */}
        <div className={`flex-shrink-0 w-10 text-center ${isInPast ? "opacity-50" : ""}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase leading-none">
            {new Date(meeting.meeting_date).toLocaleString("en", { month: "short" })}
          </p>
          <p className="text-xl font-bold text-gray-900 leading-tight">
            {new Date(meeting.meeting_date).getDate()}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={11} />
              {formatMeetingDate(meeting.meeting_date)}
            </span>
            <ResearchStatus />
          </div>
        </div>
      </div>

      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 ml-2 transition-colors"
      />
    </Link>
  );
}
