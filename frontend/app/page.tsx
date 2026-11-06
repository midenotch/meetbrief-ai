import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Search,
  FileText,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/meetings");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">MeetBrief</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-white bg-gray-900 px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-6">
          <Sparkles size={11} />
          AI-powered meeting intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
          Walk into every meeting
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
            fully prepared
          </span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          MeetBrief researches the company or person you're meeting, finds what's happened in the last 30 days, and generates a concise briefing — before you walk in the door.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            Start for free
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Hero mockup */}
        <div className="mt-16 mx-auto max-w-4xl bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left shadow-sm">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Executive Snapshot</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">
              Stripe recently closed a $694M secondary share sale at a $91.5B valuation, signalling strong investor confidence ahead of a potential IPO. The company processed over $1 trillion in total payment volume in 2024 and has been aggressively expanding its financial infrastructure suite beyond payments into lending and embedded finance.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {["3 key developments", "5 discussion points", "8 suggested questions"].map((item) => (
                <div key={item} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-gray-500">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Three steps from meeting creation to full briefing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Clock,
                title: "Add your meeting",
                desc: "Enter the company or person you're meeting, the date, your objective and meeting type.",
              },
              {
                step: "02",
                icon: Search,
                title: "We research for you",
                desc: "Our AI searches news, funding announcements, product launches, leadership changes and more from the last 30 days.",
              },
              {
                step: "03",
                icon: FileText,
                title: "Get your briefing",
                desc: "Receive a structured briefing with key developments, suggested questions, risks, opportunities and meeting strategy.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-gray-300">{step}</span>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon size={15} className="text-gray-600" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to prepare</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            MeetBrief doesn't just summarise — it gives you the strategic context to have better conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Real-time research", desc: "Pulls from live news sources, not cached databases. Always up to date." },
            { icon: Shield, title: "Source-backed facts", desc: "Every claim is linked to its source URL. No hallucinated statistics." },
            { icon: Sparkles, title: "AI-synthesised briefings", desc: "Claude synthesises findings into an actionable, meeting-specific briefing." },
            { icon: Search, title: "30-day research window", desc: "Automatically scoped to what's happened in the 30 days before your meeting." },
            { icon: FileText, title: "Structured output", desc: "Executive snapshot, key people, discussion points, risks, questions and strategy." },
            { icon: CheckCircle2, title: "Multiple meeting types", desc: "Tailored for sales calls, partnerships, investments, interviews and more." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={14} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Never walk into a meeting unprepared again
          </h2>
          <p className="text-gray-500 mb-8">
            Create your first meeting briefing in under a minute.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            Get started for free
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">M</span>
            </div>
            <span className="text-xs text-gray-400">MeetBrief AI</span>
          </div>
          <p className="text-xs text-gray-400">Built for the MSME Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
