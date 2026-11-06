"use client";

import { ExternalLink, TrendingUp, Users, MessageSquare, AlertTriangle, Lightbulb, Target, BookOpen } from "lucide-react";
import type { Briefing } from "@/types";
import { formatShortDate } from "@/lib/utils";

interface Props {
  briefing: Briefing;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function BriefingView({ briefing }: Props) {
  const c = briefing.content;

  const confidenceStyles = {
    high: "bg-emerald-50 text-emerald-700 border-emerald-100",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    low: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className="space-y-4">
      {/* Executive snapshot */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Executive Snapshot
          </h3>
          {c.confidence_level && (
            <span
              className={`text-xs px-2 py-0.5 rounded border font-medium ${
                confidenceStyles[c.confidence_level]
              }`}
            >
              {c.confidence_level} confidence
            </span>
          )}
        </div>
        <p className="text-white text-sm leading-relaxed">{c.executive_snapshot}</p>
      </div>

      {/* Key developments */}
      {c.key_developments?.length > 0 && (
        <Section icon={TrendingUp} title="Key Developments">
          <div className="space-y-3">
            {c.key_developments.map((d, i) => (
              <div key={i} className="border-l-2 border-gray-100 pl-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{d.title}</p>
                  {d.category && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
                      {d.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{d.summary}</p>
                {d.significance && (
                  <p className="text-xs text-gray-400 mt-1 italic">{d.significance}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {d.published_date && (
                    <span className="text-xs text-gray-400">{formatShortDate(d.published_date)}</span>
                  )}
                  {d.source_url && (
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                    >
                      Source <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key people */}
        {c.key_people?.length > 0 && (
          <Section icon={Users} title="Key People">
            <div className="space-y-3">
              {c.key_people.map((p, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.role}</p>
                  {p.relevance && (
                    <p className="text-xs text-gray-600 mt-0.5">{p.relevance}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Meeting strategy */}
        {c.meeting_strategy && (
          <Section icon={Target} title="Meeting Strategy">
            <p className="text-sm text-gray-700 leading-relaxed">{c.meeting_strategy}</p>
          </Section>
        )}
      </div>

      {/* Company insights */}
      {c.company_insights && (
        <Section icon={BookOpen} title="Company Insights">
          <p className="text-sm text-gray-700 leading-relaxed">{c.company_insights}</p>
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Discussion points */}
        {c.discussion_points?.length > 0 && (
          <Section icon={MessageSquare} title="Discussion Points">
            <BulletList items={c.discussion_points} />
          </Section>
        )}

        {/* Suggested questions */}
        {c.suggested_questions?.length > 0 && (
          <Section icon={MessageSquare} title="Suggested Questions">
            <BulletList items={c.suggested_questions} />
          </Section>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opportunities */}
        {c.opportunities?.length > 0 && (
          <Section icon={Lightbulb} title="Opportunities">
            <BulletList items={c.opportunities} />
          </Section>
        )}

        {/* Risks */}
        {c.risks?.length > 0 && (
          <Section icon={AlertTriangle} title="Risks & Watch Points">
            <BulletList items={c.risks} />
          </Section>
        )}
      </div>

      {/* Sources */}
      {c.sources?.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Sources ({c.sources.length})
          </h3>
          <div className="space-y-2">
            {c.sources.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-gray-300">{i + 1}.</span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                >
                  {s.title || s.url}
                </a>
                {s.source_name && <span className="flex-shrink-0">— {s.source_name}</span>}
                {s.published_date && (
                  <span className="flex-shrink-0 text-gray-400">
                    {formatShortDate(s.published_date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pt-2">
        Generated {new Date(briefing.created_at).toLocaleDateString()} ·{" "}
        {briefing.model_used ?? "Claude"}
        {briefing.tokens_used ? ` · ${briefing.tokens_used.toLocaleString()} tokens` : ""}
      </p>
    </div>
  );
}
