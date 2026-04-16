"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FolderKanban,
  Home,
  LayoutTemplate,
  LogOut,
  PlusCircle,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import GuidedFlowPanel from "@/components/studio/editor/GuidedFlowPanel";
import {
  BrochureData,
  createEmptyBrochureData,
  normalizeBrochureData,
  setValueAtPath,
} from "@/lib/domains/brochure";
import { generateBrochureData } from "@/lib/services/ai/openrouterClient";
import { cn } from "@/lib/ui/cn";
import type {
  BrochureRecord,
  BrochureStatus,
  EditorState,
  SessionUser,
} from "@/lib/server/types";

type DashboardWorkspaceProps = {
  user: SessionUser;
};

type AdminOption = {
  id: number;
  username: string;
};

type DateFilter = "all" | "7" | "30" | "90";

type ActiveModal = "create" | "details" | null;

type PreviewStyle = {
  shellGradient: string;
  headerBg: string;
  headerText: string;
  accent: string;
};

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

const previewStyles: Record<string, PreviewStyle> = {
  whiteBlue: {
    shellGradient: "linear-gradient(135deg, #e6f0ff 0%, #f7fbff 50%, #dbeafe 100%)",
    headerBg: "#0b4da2",
    headerText: "#ffffff",
    accent: "#1d4ed8",
  },
  beigeDust: {
    shellGradient: "linear-gradient(135deg, #f8eedf 0%, #fff8ed 50%, #f4e2c9 100%)",
    headerBg: "#c29d6d",
    headerText: "#2d1f12",
    accent: "#8a5a1f",
  },
  softBlue: {
    shellGradient: "linear-gradient(135deg, #eaf2ff 0%, #ffffff 55%, #dbeafe 100%)",
    headerBg: "#1e3a8a",
    headerText: "#ffffff",
    accent: "#1d4ed8",
  },
  tealGloss: {
    shellGradient: "linear-gradient(135deg, #e5f8f6 0%, #ffffff 52%, #d6f0eb 100%)",
    headerBg: "#2b8a82",
    headerText: "#ffffff",
    accent: "#0f766e",
  },
  yellowDust: {
    shellGradient: "linear-gradient(135deg, #fff8d8 0%, #fffef2 50%, #fde68a 100%)",
    headerBg: "#d4b423",
    headerText: "#1f2937",
    accent: "#a16207",
  },
};

function formatRelativeTime(dateIso: string): string {
  const date = new Date(dateIso);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "just now";
  }
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))} min ago`;
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}h ago`;
  }
  if (diff < 7 * day) {
    return `${Math.max(1, Math.floor(diff / day))}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toFilterTimestamp(dateIso: string): number {
  const timestamp = new Date(dateIso).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function resolvePreviewImage(brochure: BrochureRecord): string | null {
  const imageCandidate = brochure.content?.brochureData?.eventImage;
  if (typeof imageCandidate !== "string") {
    return null;
  }
  const trimmed = imageCandidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toSnippet(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function buildEnhancePrompt(data: BrochureData): string {
  return [
    "Enhance this brochure JSON while preserving keys and schema.",
    "Keep academic/professional tone and improve clarity.",
    "Return only JSON.",
    "",
    JSON.stringify(data, null, 2),
  ].join("\n");
}

function BrochureMiniPreview({ brochure }: { brochure: BrochureRecord }) {
  const template = brochure.content?.template ?? "whiteBlue";
  const style = previewStyles[template] ?? previewStyles.whiteBlue;
  const brochureData = brochure.content?.brochureData;

  const eventTitle = toSnippet(
    brochureData?.eventTitle,
    brochure.title,
  );
  const department = toSnippet(
    brochureData?.department,
    "Department",
  );
  const dates = toSnippet(
    brochureData?.dates,
    "Dates not set",
  );
  const aboutText = toSnippet(
    brochureData?.aboutCollege,
    brochure.description,
  );
  const highlights = toSnippet(
    brochureData?.programHighlightsText,
    "Program highlights",
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:•|-|\*)\s?/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 2);

  const previewImage = resolvePreviewImage(brochure);

  return (
    <div
      className="relative h-44 overflow-hidden border-b border-slate-200"
      style={{ background: style.shellGradient }}
    >
      <div className="absolute inset-3 overflow-hidden rounded-xl border border-white/80 bg-white/85 shadow-sm">
        <div
          className="flex h-8 items-center px-2"
          style={{ backgroundColor: style.headerBg, color: style.headerText }}
        >
          <p className="line-clamp-1 text-[9px] font-black uppercase tracking-[0.12em]">
            {department}
          </p>
        </div>

        <div className="grid h-[calc(100%-2rem)] grid-cols-[1.1fr_0.9fr] gap-2 px-2 py-2">
          <div className="space-y-1">
            <p className="line-clamp-2 text-[10px] font-black leading-tight text-slate-900">
              {eventTitle}
            </p>
            <p className="line-clamp-4 text-[8px] leading-tight text-slate-600">
              {aboutText}
            </p>
          </div>

          <div className="space-y-1">
            <p
              className="line-clamp-2 rounded-md px-1.5 py-1 text-[7px] font-bold"
              style={{ backgroundColor: `${style.accent}1A`, color: style.accent }}
            >
              {dates}
            </p>
            <ul className="space-y-1">
              {highlights.map((line) => (
                <li key={line} className="line-clamp-1 text-[7px] text-slate-700">
                  • {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="absolute bottom-4 right-4 h-16 w-24 overflow-hidden rounded-md border border-white/90 shadow-sm">
          <Image src={previewImage} alt={`${brochure.title} preview`} fill className="object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}

export default function DashboardWorkspace({ user }: DashboardWorkspaceProps) {
  const router = useRouter();
  const [brochures, setBrochures] = useState<BrochureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingBrochureId, setDeletingBrochureId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | BrochureStatus>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [creatingBrochure, setCreatingBrochure] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [detailBrochureId, setDetailBrochureId] = useState<number | null>(null);
  const [detailEditorState, setDetailEditorState] = useState<EditorState | null>(null);
  const [detailBrochureData, setDetailBrochureData] = useState<BrochureData>(
    createEmptyBrochureData(),
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailEnhancing, setDetailEnhancing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const detailBusy = detailLoading || detailSaving || detailEnhancing;

  const dashboardHomeHref =
    user.role === "admin" ? "/admin/dashboard" : "/faculty/dashboard";

  const loadBrochures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/brochure", { cache: "no-store" });
      const data = (await response.json()) as {
        brochures?: BrochureRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load brochures.");
      }

      setBrochures(data.brochures || []);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load brochures.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrochures();
  }, [loadBrochures]);

  const loadAdmins = useCallback(async () => {
    if (user.role !== "faculty") {
      return;
    }

    setLoadingAdmins(true);

    try {
      const response = await fetch("/api/users/admins", { cache: "no-store" });
      const data = (await response.json()) as {
        admins?: AdminOption[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load admins.");
      }

      const nextAdmins = data.admins || [];
      setAdmins(nextAdmins);
      if (nextAdmins.length > 0 && !assignedAdminId) {
        setAssignedAdminId(String(nextAdmins[0].id));
      }
    } catch (adminError) {
      const message =
        adminError instanceof Error
          ? adminError.message
          : "Failed to load admins.";
      setCreateError(message);
    } finally {
      setLoadingAdmins(false);
    }
  }, [assignedAdminId, user.role]);

  useEffect(() => {
    if (user.role !== "faculty") {
      return;
    }
    if (admins.length > 0 || loadingAdmins) {
      return;
    }

    void loadAdmins();
  }, [admins.length, loadAdmins, loadingAdmins, user.role]);

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!creatingBrochure && !detailBusy) {
          setActiveModal(null);
        }
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [activeModal, creatingBrochure, detailBusy]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const handleDeleteBrochure = async (brochureId: number) => {
    if (user.role !== "faculty") return;
    const shouldDelete = window.confirm("Delete this brochure permanently?");
    if (!shouldDelete) return;

    setDeletingBrochureId(brochureId);
    setError(null);

    try {
      const response = await fetch(`/api/brochure/${brochureId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete brochure.");
      }

      setBrochures((prev) =>
        prev.filter((brochure) => brochure.id !== brochureId),
      );
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete brochure.";
      setError(message);
    } finally {
      setDeletingBrochureId(null);
    }
  };

  const resetCreateState = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateError(null);
    if (admins.length > 0) {
      setAssignedAdminId(String(admins[0].id));
    }
  };

  const resetDetailsState = () => {
    setDetailBrochureId(null);
    setDetailEditorState(null);
    setDetailBrochureData(createEmptyBrochureData());
    setDetailError(null);
    setDetailLoading(false);
    setDetailSaving(false);
    setDetailEnhancing(false);
  };

  const openCreateModal = () => {
    if (user.role !== "faculty") {
      return;
    }

    resetCreateState();
    setActiveModal("create");

    if (admins.length === 0 && !loadingAdmins) {
      void loadAdmins();
    }
  };

  const closeModal = () => {
    if (creatingBrochure || detailBusy) {
      return;
    }

    setActiveModal(null);
    resetCreateState();
    resetDetailsState();
  };

  const loadBrochureForDetails = useCallback(async (brochureId: number) => {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/brochure/${brochureId}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        brochure?: BrochureRecord;
        error?: string;
      };

      if (!response.ok || !data.brochure) {
        throw new Error(data.error || "Failed to load brochure details.");
      }

      setDetailEditorState(data.brochure.content);
      setDetailBrochureData(
        normalizeBrochureData(
          data.brochure.content?.brochureData as unknown as Record<
            string,
            unknown
          >,
        ),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load brochure details.";
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openDetailsModal = useCallback(
    async (brochureId: number) => {
      setDetailBrochureId(brochureId);
      setActiveModal("details");
      await loadBrochures();
      await loadBrochureForDetails(brochureId);
    },
    [loadBrochureForDetails, loadBrochures],
  );

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user.role !== "faculty") return;

    setCreatingBrochure(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/brochure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          description: createDescription,
          assignedAdminId: Number(assignedAdminId),
        }),
      });

      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to create brochure.");
      }

      setDetailBrochureId(data.id);
      setActiveModal("details");
      await loadBrochureForDetails(data.id);
      await loadBrochures();
      resetCreateState();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to create brochure.";
      setCreateError(message);
    } finally {
      setCreatingBrochure(false);
    }
  };

  const handleDetailFieldChange = useCallback((path: string, value: unknown) => {
    setDetailBrochureData((prev) => {
      const normalizedValue =
        path === "registration.notes" && typeof value === "string"
          ? value
              .split(/\r?\n/)
              .map((line) => line.replace(/^\s*(?:•|-|\*)\s?/, "").trim())
              .filter((line) => line.length > 0)
          : path === "programHighlightsText" && typeof value === "string"
            ? value
                .split(/\r?\n/)
                .map((line) => line.replace(/^\s*(?:•|-|\*)\s?/, "").trim())
                .filter((line) => line.length > 0)
                .join("\n")
            : value;

      return setValueAtPath(
        prev as unknown as Record<string, unknown>,
        path,
        normalizedValue,
      ) as BrochureData;
    });
  }, []);

  const handleDetailEnhance = async () => {
    setDetailEnhancing(true);
    setDetailError(null);

    try {
      const result = await generateBrochureData(
        buildEnhancePrompt(detailBrochureData),
      );
      if (!result?.data || typeof result.data !== "object") {
        throw new Error("AI returned invalid brochure content.");
      }

      setDetailBrochureData(
        normalizeBrochureData(result.data as Record<string, unknown>),
      );
    } catch (enhanceError) {
      const message =
        enhanceError instanceof Error
          ? enhanceError.message
          : "AI enhancement failed.";
      setDetailError(message);
    } finally {
      setDetailEnhancing(false);
    }
  };

  const handleOpenEditor = async () => {
    if (!detailEditorState || !detailBrochureId) {
      setDetailError("Brochure details are not ready yet.");
      return;
    }

    setDetailSaving(true);
    setDetailError(null);

    try {
      const nextContent: EditorState = {
        ...detailEditorState,
        brochureData: detailBrochureData,
      };

      const response = await fetch(`/api/brochure/${detailBrochureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Failed to save detailed input.");
      }

      setActiveModal(null);
      resetDetailsState();
      router.replace(`/studio?brochureId=${detailBrochureId}&animate=1`);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save detailed input.";
      setDetailError(message);
      setDetailSaving(false);
    }
  };

  const filteredBrochures = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();
    const now = Date.now();
    const dateLimit =
      dateFilter === "all"
        ? null
        : now - Number(dateFilter) * 24 * 60 * 60 * 1000;

    return [...brochures]
      .sort(
        (left, right) =>
          toFilterTimestamp(right.updatedAt || right.createdAt) -
          toFilterTimestamp(left.updatedAt || left.createdAt),
      )
      .filter((brochure) => {
        if (
          normalizedQuery.length > 0 &&
          !brochure.title.toLowerCase().includes(normalizedQuery)
        ) {
          return false;
        }

        if (typeFilter !== "all" && brochure.status !== typeFilter) {
          return false;
        }

        if (dateLimit !== null) {
          const editedTime = toFilterTimestamp(
            brochure.updatedAt || brochure.createdAt,
          );
          if (editedTime < dateLimit) {
            return false;
          }
        }

        return true;
      });
  }, [brochures, dateFilter, searchText, typeFilter]);

  const adminStats = useMemo(() => {
    const verified = brochures.filter(
      (brochure) => brochure.status === "approved",
    ).length;
    const pending = brochures.filter(
      (brochure) => brochure.status === "pending",
    ).length;

    return {
      verified,
      pending,
      total: brochures.length,
    };
  }, [brochures]);

  const brochureSectionTitle =
    user.role === "admin" ? "Projects" : "My Brochures";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white/85 p-6 backdrop-blur-lg lg:flex">
        <Link href={dashboardHomeHref} className="mb-8 flex items-center gap-3">
          <Image
            src="/icon-logo.png"
            alt="Brochify Icon"
            width={38}
            height={38}
            className="h-9 w-9 object-contain"
            priority
          />
          <Image
            src="/text-logo.png"
            alt="Brochify Wordmark"
            width={158}
            height={34}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="space-y-1.5">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={user.role !== "faculty"}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition",
              user.role === "faculty"
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-[0_16px_28px_-18px_rgba(99,102,241,0.8)] hover:brightness-105"
                : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400",
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Create
          </button>

          <Link
            href={dashboardHomeHref}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          <a
            href="#brochure-grid"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <FolderKanban className="h-4 w-4" />
            {user.role === "faculty" ? "My Brochures" : "Projects"}
          </a>

          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-400"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>

          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-400"
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </button>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      <div className="flex-1 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-lg md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                {user.role === "admin" ? "Admin Dashboard" : "Faculty Dashboard"}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Start creating your next brochure
              </h1>
              <p className="mt-1 text-sm text-slate-600">Signed in as {user.username}</p>
            </div>

            {user.role === "faculty" && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-800"
              >
                <PlusCircle className="h-4 w-4" />
                Create
              </button>
            )}
          </div>
        </header>

        <section className="space-y-6 px-6 py-8 md:px-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by title"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-primary/40"
                />
              </label>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as "all" | BrochureStatus)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary/40"
              >
                {statusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary/40"
              >
                {dateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              {filteredBrochures.length} results in {brochureSectionTitle.toLowerCase()}
            </p>
          </div>

          {user.role === "admin" && (
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Verified
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-3xl font-black text-emerald-800">{adminStats.verified}</p>
                  <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                </div>
              </article>

              <article className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  Pending
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-3xl font-black text-amber-800">{adminStats.pending}</p>
                  <Clock3 className="h-6 w-6 text-amber-700" />
                </div>
              </article>

              <article className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                  Created Using Brochify
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-3xl font-black text-indigo-800">{adminStats.total}</p>
                  <FileCheck2 className="h-6 w-6 text-indigo-700" />
                </div>
              </article>
            </div>
          )}

          <section
            id="brochure-grid"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Recent Brochures
              </h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {filteredBrochures.length} items
              </span>
            </div>

            {loading ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading brochures...
              </p>
            ) : error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : filteredBrochures.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No brochures match your filters.
              </p>
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
                      transition={{
                        duration: 0.28,
                        delay: Math.min(index * 0.05, 0.25),
                      }}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <BrochureMiniPreview brochure={brochure} />

                      <div className="space-y-3 p-4">
                        <h3 className="line-clamp-2 text-lg font-black text-slate-900">
                          {brochure.title}
                        </h3>

                        {brochure.description.trim().length > 0 && (
                          <p className="line-clamp-2 text-sm text-slate-600">
                            {brochure.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Last edited {formatRelativeTime(brochure.updatedAt || brochure.createdAt)}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em]",
                              statusBadgeClassMap[brochure.status],
                            )}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {user.role === "faculty" && brochure.status === "draft" ? (
                            <button
                              type="button"
                              onClick={() => void openDetailsModal(brochure.id)}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                            >
                              Continue Setup
                            </button>
                          ) : (
                            <Link
                              href={openStudioHref}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                            >
                              Open
                            </Link>
                          )}

                          {user.role === "faculty" && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteBrochure(brochure.id)}
                              disabled={deletingBrochureId === brochure.id}
                              className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingBrochureId === brochure.id ? "Deleting" : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>

      <AnimatePresence>
        {activeModal !== null && user.role === "faculty" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              {activeModal === "create" && (
                <>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">
                      Create Brochure
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-slate-700">Title</span>
                      <input
                        value={createTitle}
                        onChange={(event) => setCreateTitle(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary/40"
                        required
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-slate-700">Description</span>
                      <textarea
                        value={createDescription}
                        onChange={(event) => setCreateDescription(event.target.value)}
                        className="h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary/40"
                        required
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-slate-700">Select Admin</span>
                      <select
                        value={assignedAdminId}
                        onChange={(event) => setAssignedAdminId(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-primary/40"
                        required
                        disabled={loadingAdmins || admins.length === 0}
                      >
                        {admins.length === 0 ? (
                          <option value="">No admins available</option>
                        ) : null}
                        {admins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.username}
                          </option>
                        ))}
                      </select>
                    </label>

                    {createError && (
                      <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {createError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingBrochure || admins.length === 0 || !assignedAdminId}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {creatingBrochure ? "Creating..." : "Continue"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeModal === "details" && (
                <>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">
                      Brochure Details
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {detailError && (
                    <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {detailError}
                    </p>
                  )}

                  {detailLoading ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Loading detailed form...
                    </p>
                  ) : (
                    <div className="max-h-[70vh] overflow-y-auto rounded-3xl">
                      <GuidedFlowPanel
                        data={detailBrochureData}
                        onFieldChange={handleDetailFieldChange}
                        onEnhance={handleDetailEnhance}
                        onCreate={handleOpenEditor}
                        isBusy={detailBusy}
                        fullPage
                        createActionLabel={detailSaving ? "Saving..." : "Open Editor"}
                      />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
