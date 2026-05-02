"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Palette, PlusCircle } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { useThemePreference } from "@/components/dashboard/useThemePreference";
import { Logo } from "@/components/ui/Logo";

export default function FacultyDesignCreatePage() {
  const router = useRouter();
  const { isDark, theme, setTheme } = useThemePreference();
  const [name, setName] = useState("");
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(1200);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: "Poster (A4)", w: 794, h: 1123 },
    { label: "Brochure", w: 983, h: 680 },
    { label: "Social Media", w: 1080, h: 1080 },
    { label: "Presentation", w: 1920, h: 1080 },
    { label: "Custom", w: width, h: height },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/design-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Untitled project", json: "", width, height }),
      });
      const data = (await response.json()) as { data?: { id: number }; error?: string };
      if (!response.ok || !data.data?.id) throw new Error(data.error || "Failed to create project.");
      router.replace(`/editor/${data.data.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create project.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <main className={cn(
      "min-h-screen transition-colors duration-300",
      isDark ? "bg-gradient-to-br from-[#0B0F1A] via-[#0f172a] to-[#111827] text-[#E5E7EB]" : "bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 text-slate-900",
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b px-6 py-4 backdrop-blur-lg transition-colors duration-300",
        isDark ? "border-slate-700 bg-[#111827]/80" : "border-slate-200 bg-white/80",
      )}>
        <div className="flex items-center justify-between gap-4">
          <Link href="/faculty/brochure" className="flex items-center gap-3">
            <Logo appearance={isDark ? "dark" : "light"} />
          </Link>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "rounded-xl border p-2.5 transition",
              isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
            )}
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M12 6.75a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-violet-700">
              <Palette className="h-3.5 w-3.5" />
              Canvas Editor
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create Design Project</h1>
            <p className="mt-1 text-sm text-slate-600">Set up your canvas dimensions and start designing.</p>
          </div>
          <Link
            href="/faculty/brochure"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
        </div>

        <section className={cn(
          "rounded-3xl border p-6 shadow-sm",
          isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
        )}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-1">
              <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Project Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled project"
                className={cn(
                  "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition",
                  isDark ? "border-slate-700 bg-slate-900 text-slate-200 focus:border-indigo-500" : "border-slate-200 bg-white text-slate-700 focus:border-indigo-400",
                )}
              />
            </label>

            <div className="space-y-2">
              <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Canvas Size</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presets.slice(0, -1).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => { setWidth(preset.w); setHeight(preset.h); }}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition",
                      width === preset.w && height === preset.h
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : isDark
                          ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {preset.label}
                    <span className="block text-[10px] opacity-70">{preset.w} x {preset.h}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <label className="flex-1 space-y-1">
                  <span className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Width (px)</span>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value) || 900)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                      isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700",
                    )}
                  />
                </label>
                <label className="flex-1 space-y-1">
                  <span className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Height (px)</span>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value) || 1200)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                      isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700",
                    )}
                  />
                </label>
              </div>
            </div>

            {error && (
              <p className={cn(
                "rounded-2xl border px-3 py-2 text-sm",
                isDark ? "border-rose-700 bg-rose-950 text-rose-400" : "border-rose-200 bg-rose-50 text-rose-700",
              )}>
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition shadow-[0_8px_20px_-8px_rgba(139,92,246,0.5)] bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-105",
                  submitting ? "opacity-60 cursor-not-allowed" : "",
                )}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "Creating..." : "Open Editor"}
              </button>
              <Link
                href="/faculty/brochure"
                className={cn(
                  "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
                  isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100",
                )}
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
