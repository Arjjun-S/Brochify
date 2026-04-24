"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, FileBadge2, LayoutTemplate, LogOut } from "lucide-react";

type ModuleSelectionWorkspaceProps = {
  role: "admin" | "faculty";
  username: string;
};

export default function ModuleSelectionWorkspace({ role, username }: ModuleSelectionWorkspaceProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const brochureHref = role === "admin" ? "/admin/dashboard" : "/faculty/dashboard";
  const certificateHref = role === "admin" ? "/admin/certificates" : "/faculty/certificates";

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_44%,#f4f7ff_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.14),transparent_36%),linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.92))]" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_78%_22%,rgba(139,92,246,0.16),transparent_38%),linear-gradient(225deg,rgba(245,243,255,0.95),rgba(255,255,255,0.92))]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(129,140,248,0.75),transparent)] shadow-[0_0_26px_rgba(129,140,248,0.65)]" />

      <header className="relative z-20 flex h-20 items-center justify-between px-6 md:px-10">
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-slate-300 hover:shadow-md disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Signing Out" : "Logout"}
        </button>

        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 shadow-sm backdrop-blur-xl">
          <Image src="/icon-logo.png" alt="Brochify" width={24} height={24} className="h-6 w-6" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Brochify</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-2 shadow-sm backdrop-blur-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-black uppercase text-white">
            {username.slice(0, 1)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Profile</p>
            <p className="text-xs font-semibold text-slate-700">{username}</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-2">
        <Link
          href={brochureHref}
          className="group relative flex min-h-[calc(50vh)] flex-col justify-between overflow-hidden p-8 transition duration-300 hover:scale-[1.01] lg:min-h-[calc(100vh-5rem)]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,246,255,0.92),rgba(255,255,255,0.94))]" />
          <div className="absolute left-10 top-16 h-24 w-24 rounded-3xl bg-sky-300/35 blur-3xl transition group-hover:scale-110" />
          <div className="absolute bottom-20 right-14 h-32 w-32 rounded-full bg-sky-200/30 blur-3xl transition group-hover:scale-110" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-700 shadow-sm backdrop-blur">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Brochure Builder
            </div>
            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-6xl">Brochify</h1>
            <p className="mt-3 text-base font-semibold text-slate-600">Design stunning brochures in minutes</p>
            <p className="mt-6 max-w-md text-2xl font-black uppercase leading-tight tracking-[0.08em] text-slate-900 md:text-4xl">
              CREATE. DESIGN. IMPRESS.
            </p>
          </div>

          <div className="relative z-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-700">
            Open Brochure Studio
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href={certificateHref}
          className="group relative flex min-h-[calc(50vh)] flex-col justify-between overflow-hidden p-8 transition duration-300 hover:scale-[1.01] lg:min-h-[calc(100vh-5rem)]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,243,255,0.92),rgba(255,255,255,0.94))]" />
          <div className="absolute left-14 top-20 h-24 w-24 rounded-3xl bg-violet-300/35 blur-3xl transition group-hover:scale-110" />
          <div className="absolute bottom-24 right-16 h-32 w-32 rounded-full bg-violet-200/35 blur-3xl transition group-hover:scale-110" />

          <div className="absolute left-0 top-0 bottom-0 w-px bg-[linear-gradient(180deg,transparent,rgba(168,85,247,0.65),transparent)] shadow-[0_0_22px_rgba(168,85,247,0.55)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 shadow-sm backdrop-blur">
              <FileBadge2 className="h-3.5 w-3.5" />
              Certificate Builder
            </div>
            <h2 className="mt-6 text-5xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-6xl">Certificates</h2>
            <p className="mt-3 text-base font-semibold text-slate-600">Craft professional certificates instantly</p>
            <p className="mt-6 max-w-md text-2xl font-black uppercase leading-tight tracking-[0.08em] text-slate-900 md:text-4xl">
              REWARD. RECOGNIZE. CELEBRATE.
            </p>
          </div>

          <div className="relative z-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-700">
            Open Certificate Studio
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </section>
    </main>
  );
}
