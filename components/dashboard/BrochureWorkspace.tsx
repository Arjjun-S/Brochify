"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  CalendarDays,
  FileBadge2,
  LogOut,
  MoonStar,
  Palette,
  PlusCircle,
  Search,
  Settings2,
  SunMedium,
  Trash2,
  ChevronRight,
  AlignLeft,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/ui/cn";
import { useThemePreference } from "./useThemePreference";
import { SelectBox } from "@/components/ui/SelectBox";
import { Logo } from "@/components/ui/Logo";
import { CANVAS_PRESETS, type BrochureType } from "@/features/editor/types";
import type { BrochureRecord, BrochureStatus, SessionUser } from "@/lib/server/types";

type BrochureStatusFilter = "all" | BrochureStatus;
type DateFilter = "all" | "7" | "30" | "90";

const statusBadgeClassMap: Record<BrochureStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-700",
  pending: "border-amber-300 bg-amber-100 text-amber-700",
  approved: "border-emerald-300 bg-emerald-100 text-emerald-700",
  rejected: "border-rose-300 bg-rose-100 text-rose-700",
};

const statusFilterOptions: Array<{ label: string; value: "all" | BrochureStatus }> = [
  { label: "All Types", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const dateFilterOptions: Array<{ label: string; value: DateFilter }> = [
  { label: "Date Modified", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

function formatRelativeTime(dateIso: string): string {
  const date = new Date(dateIso);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} min ago`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}h ago`;
  if (diff < 7 * day) return `${Math.max(1, Math.floor(diff / day))}d ago`;

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toFilterTimestamp(dateIso: string): number {
  const timestamp = new Date(dateIso).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

type BrochureWorkspaceProps = {
  user: SessionUser;
};

export default function BrochureWorkspace({ user }: BrochureWorkspaceProps) {
  const router = useRouter();
  const { isDark, theme, setTheme } = useThemePreference();
  const [brochures, setBrochures] = useState<BrochureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingBrochureId, setDeletingBrochureId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<BrochureStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const [profileOpen, setProfileOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingType, setCreatingType] = useState<BrochureType | null>(null);

  const loadBrochures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/brochure", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { brochures?: BrochureRecord[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to load brochures.");
      setBrochures(data.brochures || []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load brochures.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBrochures(); }, [loadBrochures]);

  const handleDeleteBrochure = async (brochureId: number) => {
    const shouldDelete = window.confirm("Delete this brochure permanently?");
    if (!shouldDelete) return;
    setDeletingBrochureId(brochureId);
    setError(null);
    try {
      const response = await fetch(`/api/brochure/${brochureId}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to delete brochure.");
      setBrochures((prev) => prev.filter((b) => b.id !== brochureId));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete brochure.";
      setError(message);
    } finally {
      setDeletingBrochureId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const handleCreateDesign = async (type: BrochureType) => {
    setCreatingType(type);
    setError(null);
    try {
      const preset = CANVAS_PRESETS[type];
      const response = await fetch("/api/design-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Untitled ${preset.label}`,
          json: "",
          width: preset.width,
          height: preset.height,
        }),
      });
      const data = (await response.json()) as { data?: { id: number }; error?: string };
      if (!response.ok || !data.data?.id) throw new Error(data.error || "Failed to create project.");
      router.push(`/editor/${data.data.id}?type=${type}`);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create project.";
      setError(message);
      setCreatingType(null);
    }
  };

  const filteredBrochures = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();
    const now = Date.now();
    const dateLimit = dateFilter === "all" ? null : now - Number(dateFilter) * 24 * 60 * 60 * 1000;

    return [...brochures]
      .sort(
        (left, right) =>
          toFilterTimestamp(right.updatedAt || right.createdAt) -
          toFilterTimestamp(left.updatedAt || left.createdAt),
      )
      .filter((brochure) => {
        if (normalizedQuery.length > 0 && !brochure.title.toLowerCase().includes(normalizedQuery)) return false;
        if (typeFilter !== "all" && brochure.status !== typeFilter) return false;
        if (dateLimit !== null) {
          const editedTime = toFilterTimestamp(brochure.updatedAt || brochure.createdAt);
          if (editedTime < dateLimit) return false;
        }
        return true;
      });
  }, [brochures, dateFilter, searchText, typeFilter]);

  return (
    <main className={cn(
      "min-h-screen transition-colors duration-300",
      isDark
        ? "bg-gradient-to-br from-[#0B0F1A] via-[#0f172a] to-[#111827] text-[#E5E7EB]"
        : "bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 text-slate-900",
    )}>
      {/* Top Header with Logo */}
      <header className={cn(
        "sticky top-0 z-30 border-b px-6 py-4 backdrop-blur-lg transition-colors duration-300",
        isDark ? "border-slate-700 bg-[#111827]/80" : "border-slate-200 bg-white/80",
      )}>
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/faculty/modules" className="cursor-pointer">
            <Logo appearance={isDark ? "dark" : "light"} />
          </Link>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* Switch Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSwitchOpen(!switchOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                )}
                title="Switch to another section"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Switch
              </button>

              <AnimatePresence>
                {switchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute right-0 top-full mt-2 w-56 rounded-2xl border shadow-xl",
                      isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
                    )}
                  >
                    <p className={cn(
                      "px-4 py-2 text-xs font-black uppercase tracking-[0.14em]",
                      isDark ? "text-slate-400" : "text-slate-500",
                    )}>
                      Switch to
                    </p>
                    <Link
                      href="/faculty/certificate"
                      onClick={() => setSwitchOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition border-t",
                        isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <FileBadge2 className="h-4 w-4" />
                      Certificate Generator
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "rounded-xl border p-2.5 transition",
                isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
              )}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black uppercase",
                  isDark ? "bg-indigo-600 text-white" : "bg-slate-900 text-white",
                )}>
                  {user.username.slice(0, 1)}
                </div>
                {user.username}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute right-0 top-full mt-2 w-48 rounded-2xl border shadow-xl",
                      isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
                    )}
                  >
                    <Link
                      href="/faculty/settings?from=faculty/brochure"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition rounded-t-2xl",
                        isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Settings2 className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); void handleLogout(); }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition rounded-b-2xl border-t",
                        isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8 md:px-10">
        {/* Create Button Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={cn("text-3xl font-black tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>Workspace</h1>
            <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-600")}>Manage and create your brochures and flyers.</p>
          </div>
          <div className="relative z-20">
            <button
              type="button"
              onClick={() => setCreateOpen(!createOpen)}
              className="inline-flex w-full md:w-auto items-center justify-between gap-3 rounded-2xl px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-105 shadow-[0_8px_20px_-8px_rgba(0,42,130,0.5)] bg-gradient-to-r from-[#002A82] to-[#001850]"
            >
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New
              </span>
              <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", createOpen && "rotate-90")} />
            </button>

            <AnimatePresence>
              {createOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "absolute right-0 top-full mt-3 w-64 rounded-3xl border p-2 shadow-2xl",
                    isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
                  )}
                >
                  <button
                    type="button"
                    disabled={creatingType !== null}
                    onClick={() => { setCreateOpen(false); void handleCreateDesign("trifold"); }}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-2xl p-3 transition text-left",
                      creatingType === "trifold" ? "opacity-60 cursor-wait" : "",
                      isDark ? "hover:bg-slate-800" : "hover:bg-slate-50",
                    )}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isDark ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                      <AlignLeft className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", isDark ? "text-slate-200" : "text-slate-800")}>
                        {creatingType === "trifold" ? "Creating..." : "Trifold Brochure"}
                      </p>
                      <p className={cn("mt-0.5 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>Standard 3-panel folded design</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={creatingType !== null}
                    onClick={() => { setCreateOpen(false); void handleCreateDesign("poster"); }}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-2xl p-3 transition text-left",
                      creatingType === "poster" ? "opacity-60 cursor-wait" : "",
                      isDark ? "hover:bg-slate-800" : "hover:bg-slate-50",
                    )}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isDark ? "bg-fuchsia-900/50 text-fuchsia-400" : "bg-fuchsia-50 text-fuchsia-600")}>
                      <Square className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", isDark ? "text-slate-200" : "text-slate-800")}>
                        {creatingType === "poster" ? "Creating..." : "Poster / Flyer"}
                      </p>
                      <p className={cn("mt-0.5 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>Single page portrait layout</p>
                    </div>
                  </button>
                  <Link
                    href="/faculty/design/create"
                    onClick={() => setCreateOpen(false)}
                    className={cn(
                      "flex items-start gap-4 rounded-2xl p-3 transition",
                      isDark ? "hover:bg-slate-800" : "hover:bg-slate-50",
                    )}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isDark ? "bg-violet-900/50 text-violet-400" : "bg-violet-50 text-violet-600")}>
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", isDark ? "text-slate-200" : "text-slate-800")}>Canvas Editor</p>
                      <p className={cn("mt-0.5 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>Free-form design with Fabric.js</p>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search and Filters */}
        <section className={cn(
          "mb-6 rounded-3xl border p-5 shadow-sm",
          isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
        )}>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by title"
                className={cn(
                  "w-full rounded-2xl border py-2.5 pl-10 pr-3 text-sm outline-none transition",
                  isDark ? "border-slate-700 bg-slate-900 text-slate-200 focus:border-indigo-500" : "border-slate-200 bg-white text-slate-700 focus:border-indigo-400",
                )}
              />
            </label>

            <SelectBox
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as BrochureStatusFilter)}
              options={statusFilterOptions}
              className={cn(
                isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
              )}
            />

            <SelectBox
              value={dateFilter}
              onChange={(val) => setDateFilter(val as DateFilter)}
              options={dateFilterOptions}
              className={cn(
                isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
              )}
            />
          </div>

          <p className={cn("mt-3 text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
            {filteredBrochures.length} results in recent brochures
          </p>
        </section>

        {/* Recent Brochures List */}
        <section className={cn(
          "rounded-3xl border p-6 shadow-sm",
          isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
        )}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>Recent Brochures</h2>
            <span className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              isDark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600",
            )}>
              {filteredBrochures.length} items
            </span>
          </div>

          {loading ? (
            <p className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              isDark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600",
            )}>Loading brochures...</p>
          ) : error ? (
            <p className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              isDark ? "border-rose-700 bg-rose-950 text-rose-400" : "border-rose-200 bg-rose-50 text-rose-700",
            )}>{error}</p>
          ) : filteredBrochures.length === 0 ? (
            <p className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              isDark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600",
            )}>No brochures found. Click Create to add one.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBrochures.map((brochure, index) => {
                const openStudioHref = `/studio?brochureId=${brochure.id}`;
                const statusLabel = brochure.status.charAt(0).toUpperCase() + brochure.status.slice(1);

                return (
                  <motion.article
                    key={brochure.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.25) }}
                    className={cn(
                      "group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                      isDark ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800" : "border-slate-200 bg-white hover:border-indigo-200",
                    )}
                  >
                    {/* Inner glowing effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-white/5 pointer-events-none" />

                    <div className="relative p-5">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300",
                          isDark ? "bg-indigo-900/50 text-indigo-400 group-hover:bg-indigo-900" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                        )}>
                          {brochure.title.toLowerCase().includes("flyer") || brochure.title.toLowerCase().includes("poster") ? (
                            <Square className="h-6 w-6" />
                          ) : (
                            <AlignLeft className="h-6 w-6" />
                          )}
                        </div>
                        <span className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm",
                          statusBadgeClassMap[brochure.status],
                        )}>
                          {statusLabel}
                        </span>
                      </div>

                      <h3 className={cn("mb-2 text-lg font-bold tracking-tight line-clamp-1", isDark ? "text-slate-100" : "text-slate-900")}>
                        {brochure.title}
                      </h3>
                      
                      {brochure.description.trim().length > 0 ? (
                        <p className={cn("mb-4 line-clamp-2 text-sm leading-relaxed min-h-[40px]", isDark ? "text-slate-400" : "text-slate-500")}>
                          {brochure.description}
                        </p>
                      ) : (
                        <p className={cn("mb-4 text-sm italic min-h-[40px]", isDark ? "text-slate-500" : "text-slate-400")}>
                          No description provided
                        </p>
                      )}

                      <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-4 w-4 opacity-70" />
                        Edited {formatRelativeTime(brochure.updatedAt || brochure.createdAt)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={openStudioHref}
                          className={cn(
                            "flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                            isDark 
                              ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                          )}
                        >
                          Open in Studio
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDeleteBrochure(brochure.id)}
                          disabled={deletingBrochureId === brochure.id}
                          className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded-xl border p-2.5 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50",
                            isDark 
                              ? "border-slate-600 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400" 
                              : "border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          )}
                          title="Delete brochure"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}