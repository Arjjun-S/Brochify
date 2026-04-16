import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  CheckCheck,
  FileDown,
  MousePointerSquareDashed,
  Sparkles,
  Workflow,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession, homeRouteForRole } from "@/lib/server/auth";

const featureItems = [
  {
    title: "AI Brochure Generation",
    description: "Create complete brochure drafts from your event details in seconds.",
    icon: Bot,
  },
  {
    title: "Drag & Edit Design",
    description: "Move sections freely, tune typography, and customize layout with precision.",
    icon: MousePointerSquareDashed,
  },
  {
    title: "Approval Workflow",
    description: "Built for Faculty to Admin submission with clear pending and review status.",
    icon: Workflow,
  },
  {
    title: "PDF Export with Watermark",
    description: "Generate polished PDFs instantly with workflow-aware watermark control.",
    icon: FileDown,
  },
];

const workflowSteps = [
  "Create brochure",
  "Fill details",
  "Design with AI",
  "Submit for approval",
  "Download final PDF",
];

const previewCards = [
  { title: "AI Workshop Flyer", tag: "Faculty Program" },
  { title: "Department Conference", tag: "Academic Event" },
  { title: "Innovation Bootcamp", tag: "Student Initiative" },
  { title: "Research Colloquium", tag: "School of Computing" },
  { title: "Industry Connect Series", tag: "Placement Cell" },
  { title: "Tech Symposium 2026", tag: "Annual Event" },
];

export default async function RootEntryPage() {
  const session = await getServerSession();
  if (session) {
    redirect(homeRouteForRole(session.role));
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-4 pt-7 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon-logo.png" alt="Brochify Icon" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <Image src="/text-logo.png" alt="Brochify Wordmark" width={176} height={40} className="h-9 w-auto object-contain" priority />
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
        >
          Login
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Brochify - Brochure Generator
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-black leading-tight text-slate-950 md:text-6xl">
              Design Professional Brochures in Minutes
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-slate-600 md:text-xl">
              Create, edit, and generate AI-powered brochures with ease. Built for faculty and institutions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.9)] transition hover:bg-slate-800"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.15em] text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Try Demo
            </Link>
          </div>

          <p className="text-pretty text-2xl font-black text-transparent md:text-3xl bg-gradient-to-r from-indigo-600 via-primary to-secondary bg-clip-text">
            From idea to brochure — instantly.
          </p>
        </div>

        <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-slate-100 p-6 shadow-[0_36px_70px_-46px_rgba(30,64,175,0.7)]">
          <div className="rounded-3xl border border-white/80 bg-white/80 p-6 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">How It Works</p>
            <ol className="mt-5 space-y-4">
              {workflowSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-black text-indigo-700">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-6 md:px-10">
        <div className="rounded-[30px] border border-slate-200 bg-white/85 p-8 shadow-sm backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <CheckCheck className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Built for Real Brochure Workflows</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
                  <div className="mb-3 inline-flex rounded-xl bg-indigo-100 p-2 text-indigo-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-14 pt-8 md:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Preview</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Sample Brochure Concepts</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previewCards.map((card, index) => (
            <article key={card.title} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div
                className="h-36 w-full border-b border-slate-200"
                style={{
                  backgroundImage:
                    index % 2 === 0
                      ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.08), rgba(59,130,246,0.16))"
                      : "linear-gradient(135deg, rgba(147,197,253,0.28), rgba(125,211,252,0.16), rgba(129,140,248,0.2))",
                }}
              />
              <div className="space-y-1 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{card.tag}</p>
                <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white/70 py-6 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 md:px-10">
          <p className="text-sm font-semibold text-slate-600">Brochify</p>
          <p className="text-xs text-slate-500">AI brochure workflow for faculty and admin teams.</p>
        </div>
      </footer>
    </main>
  );
}
