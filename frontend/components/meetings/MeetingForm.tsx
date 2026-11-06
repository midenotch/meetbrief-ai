"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMeeting } from "@/lib/api";
import type { MeetingType } from "@/types";
import { MEETING_TYPE_LABELS } from "@/types";
import { toast } from "sonner";

const MEETING_TYPES = Object.entries(MEETING_TYPE_LABELS) as [MeetingType, string][];

export function MeetingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company_or_person: "",
    meeting_date: "",
    meeting_time: "",
    meeting_type: "sales_call" as MeetingType,
    objective: "",
    context: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const meeting_date = new Date(
        `${form.meeting_date}T${form.meeting_time || "09:00"}`
      ).toISOString();

      const meeting = await createMeeting({
        title: form.title,
        company_or_person: form.company_or_person,
        meeting_date,
        meeting_type: form.meeting_type,
        objective: form.objective,
        context: form.context || undefined,
      });

      toast.success("Meeting created.");
      router.push(`/meetings/${meeting.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Meeting title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Intro call with Acme Corp"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
        />
      </div>

      {/* Company / Person */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Company or person <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.company_or_person}
          onChange={(e) => set("company_or_person", e.target.value)}
          placeholder="e.g. Acme Corp or John Smith"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">
          Used to research recent news and developments.
        </p>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            required
            min={today}
            value={form.meeting_date}
            onChange={(e) => set("meeting_date", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
          <input
            type="time"
            value={form.meeting_time}
            onChange={(e) => set("meeting_time", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Meeting type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Meeting type <span className="text-red-400">*</span>
        </label>
        <select
          required
          value={form.meeting_type}
          onChange={(e) => set("meeting_type", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white transition-all"
        >
          {MEETING_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Objective */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Objective <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          rows={3}
          value={form.objective}
          onChange={(e) => set("objective", e.target.value)}
          placeholder="What do you want to achieve in this meeting?"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
        />
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Additional context{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.context}
          onChange={(e) => set("context", e.target.value)}
          placeholder="Any relevant background, prior interactions, or specific topics to cover."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating…" : "Create meeting"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
