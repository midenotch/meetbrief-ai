"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Search } from "lucide-react";
import { getMeetings } from "@/lib/api";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import type { MeetingWithResearch } from "@/types";
import { toast } from "sonner";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingWithResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMeetings()
      .then(setMeetings)
      .catch(() => toast.error("Failed to load meetings"))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = meetings.filter(
    (m) =>
      m.status === "upcoming" &&
      new Date(m.meeting_date) >= new Date() &&
      m.company_or_person.toLowerCase().includes(search.toLowerCase())
  );

  const past = meetings.filter(
    (m) =>
      (m.status !== "upcoming" || new Date(m.meeting_date) < new Date()) &&
      m.company_or_person.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          New meeting
        </Link>
      </div>

      {/* Search */}
      {meetings.length > 0 && (
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      )}

      {/* Empty state */}
      {meetings.length === 0 && (
        <div className="text-center py-24 border border-dashed border-gray-200 rounded-xl bg-white">
          <Calendar className="mx-auto mb-3 text-gray-300" size={40} />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No meetings yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first meeting to generate an AI briefing.
          </p>
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            New meeting
          </Link>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Past
          </h2>
          <div className="space-y-2">
            {past.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
