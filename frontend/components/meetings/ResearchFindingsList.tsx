"use client";

import { ExternalLink } from "lucide-react";
import type { ResearchFinding } from "@/types";
import { formatShortDate } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  news: "bg-blue-50 text-blue-700",
  funding: "bg-green-50 text-green-700",
  product: "bg-purple-50 text-purple-700",
  leadership: "bg-orange-50 text-orange-700",
  partnership: "bg-cyan-50 text-cyan-700",
  acquisition: "bg-pink-50 text-pink-700",
  default: "bg-gray-100 text-gray-600",
};

interface Props {
  findings: ResearchFinding[];
  loading: boolean;
}

export function ResearchFindingsList({ findings, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">
        No research findings available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-4">
        {findings.length} source{findings.length !== 1 ? "s" : ""} found
      </p>
      {findings.map((f) => (
        <div
          key={f.id}
          className="bg-white border border-gray-100 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-medium text-gray-900 leading-snug">{f.title}</h4>
            {f.category && (
              <span
                className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-medium ${
                  CATEGORY_COLORS[f.category] ?? CATEGORY_COLORS.default
                }`}
              >
                {f.category}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{f.content}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {f.source_name && <span>{f.source_name}</span>}
              {f.published_date && (
                <span>{formatShortDate(f.published_date)}</span>
              )}
            </div>
            {f.source_url && (
              <a
                href={f.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Source
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
