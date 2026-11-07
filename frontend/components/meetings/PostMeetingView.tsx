"use client";

import { useState } from "react";
import { CheckSquare, HelpCircle, Mail, ArrowRight, AlertCircle, Copy, Check } from "lucide-react";
import type { PostMeetingContent } from "@/lib/api";

interface Props {
  content: PostMeetingContent;
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        {Icon && <Icon size={13} />}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function PostMeetingView({ content }: Props) {
  const [copied, setCopied] = useState(false);

  const priorityColor = (p?: string) => {
    if (p === "high") return "bg-red-50 text-red-700";
    if (p === "low") return "bg-green-50 text-green-700";
    return "bg-amber-50 text-amber-700";
  };

  async function copyEmail() {
    const subject = content.follow_up_email?.subject || "";
    const body = content.follow_up_email?.body || "";
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {content.executive_summary && (
        <Section title="Meeting Summary">
          <p className="text-sm text-gray-700 leading-relaxed">{content.executive_summary}</p>
          {content.meeting_effectiveness && (
            <p className="text-xs text-gray-500 mt-2 italic">{content.meeting_effectiveness}</p>
          )}
        </Section>
      )}

      {/* Key Decisions */}
      {(content.key_decisions?.length ?? 0) > 0 && (
        <Section title="Key Decisions" icon={CheckSquare}>
          <ul className="space-y-2">
            {content.key_decisions!.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-gray-300 flex-shrink-0 mt-0.5">▸</span>
                <span className="text-gray-800">
                  {typeof d === "string" ? d : (
                    <>
                      <span className="font-medium">{d.decision}</span>
                      {d.owner && <span className="text-gray-500 ml-1">· {d.owner}</span>}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Action Items */}
      {(content.action_items?.length ?? 0) > 0 && (
        <Section title="Action Items" icon={CheckSquare}>
          <div className="space-y-2">
            {content.action_items!.map((a, i) => {
              const item = typeof a === "string" ? { task: a, priority: "medium" } : a;
              return (
                <div key={i} className="flex gap-3 items-start py-2 border-b border-gray-50 last:border-0">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 uppercase ${priorityColor(item.priority)}`}>
                    {(item.priority || "med").slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{item.task}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.owner && `Owner: ${item.owner}`}
                      {item.owner && item.deadline && " · "}
                      {item.deadline && `Due: ${item.deadline}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Unresolved Questions */}
      {(content.unresolved_questions?.length ?? 0) > 0 && (
        <Section title="Unresolved Questions" icon={HelpCircle}>
          <ul className="space-y-2">
            {content.unresolved_questions!.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-amber-400 flex-shrink-0 mt-0.5">?</span>
                <span className="text-gray-700">{typeof q === "string" ? q : q.question}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Briefing comparison */}
      {content.briefing_comparison?.anticipated_vs_actual && (
        <Section title="vs. Pre-Meeting Briefing">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {content.briefing_comparison.anticipated_vs_actual}
          </p>
          {(content.briefing_comparison.surprises?.length ?? 0) > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-400 mb-1">Surprises</p>
              <ul className="space-y-1">
                {content.briefing_comparison.surprises!.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                    <AlertCircle size={11} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Next Steps */}
      {(content.next_steps?.length ?? 0) > 0 && (
        <Section title="Recommended Next Steps" icon={ArrowRight}>
          <ul className="space-y-1.5">
            {content.next_steps!.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-blue-400 flex-shrink-0 font-medium">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Follow-up Email */}
      {content.follow_up_email?.body && (
        <Section title="Follow-up Email Draft" icon={Mail}>
          {content.follow_up_email.subject && (
            <p className="text-xs font-semibold text-gray-600 mb-2 pb-2 border-b border-gray-100">
              Subject: {content.follow_up_email.subject}
            </p>
          )}
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
            {content.follow_up_email.body}
          </pre>
          <button
            onClick={copyEmail}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy email"}
          </button>
        </Section>
      )}
    </div>
  );
}
