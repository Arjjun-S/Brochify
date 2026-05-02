"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileBadge2,
  FolderKanban,
  Home,
  LayoutTemplate,
  LogOut,
  PlusCircle,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import {
  type CertificateType,
  createCertificateOverlayLayout,
  createDefaultCertificateTemplateInput,
  getCertificateBodyTextForType,
  normalizeCertificateTemplateInput,
  type CertificateTemplateInput,
} from "@/lib/domains/certificate";
import { SelectBox } from "@/components/ui/SelectBox";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/ui/cn";
import { resolveLogoBackNavigation } from "@/lib/ui/logoBackNavigation";
import type { CertificateRecord, SessionUser } from "@/lib/server/types";
import { useThemePreference } from "./useThemePreference";

type FacultyCertificateWorkspaceProps = {
  user: SessionUser;
};

type AdminOption = {
  id: number;
  username: string;
};

type LogoAsset = {
  id: string;
  name: string;
  src: string;
};

type DateFilter = "all" | "7" | "30" | "90";

type ActiveModal = "create" | null;

type UiStatus = "draft" | "completed";

const statusBadgeClassMap: Record<UiStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-700",
  completed: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

const statusFilterOptions: Array<{ label: string; value: "all" | UiStatus }> = [
  { label: "All Types", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Completed", value: "completed" },
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

async function filesToDataUrls(files: FileList | null, maxCount: number): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const selected = Array.from(files)
    .filter((file) => file.type === "image/png" || file.name.toLowerCase().endsWith(".png"))
    .slice(0, maxCount);

  return Promise.all(
    selected.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function getUiStatus(record: CertificateRecord): UiStatus {
  return record.status === "draft" ? "draft" : "completed";
}

export default function FacultyCertificateWorkspace({ user }: FacultyCertificateWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useThemePreference();

  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCertificateId, setDeletingCertificateId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | UiStatus>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [eventName, setEventName] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [certificateType, setCertificateType] = useState<CertificateType>("workshop");
  const [availableLogos, setAvailableLogos] = useState<LogoAsset[]>([]);
  const [logoSearch, setLogoSearch] = useState("");
  const [logoDataUrls, setLogoDataUrls] = useState<string[]>([]);
  const [signatureImageDataUrl, setSignatureImageDataUrl] = useState<string | null>(null);
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const dashboardHomeHref = "/faculty/brochure";
  const settingsHref = "/faculty/settings";
  const logoBackHref = resolveLogoBackNavigation(pathname || "/faculty/certificate", user.role);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/certificate", { cache: "no-store" });
      const data = (await response.json()) as { certificates?: CertificateRecord[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load certificates.");
      }

      setCertificates(data.certificates || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);

    try {
      const response = await fetch("/api/users/admins", { cache: "no-store" });
      const data = (await response.json()) as { admins?: AdminOption[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load admins.");
      }

      const nextAdmins = data.admins || [];
      setAdmins(nextAdmins);
      if (nextAdmins.length > 0 && !assignedAdminId) {
        setAssignedAdminId(String(nextAdmins[0].id));
      }
    } catch (loadAdminsError) {
      setCreateError(loadAdminsError instanceof Error ? loadAdminsError.message : "Failed to load admins.");
    } finally {
      setLoadingAdmins(false);
    }
  }, [assignedAdminId]);

  useEffect(() => {
    if (activeModal === "create" && admins.length === 0 && !loadingAdmins) {
      void loadAdmins();
    }
  }, [activeModal, admins.length, loadAdmins, loadingAdmins]);

  useEffect(() => {
    if (activeModal !== "create") {
      return;
    }

    let mounted = true;
    const loadLogos = async () => {
      try {
        const response = await fetch("/api/logos", { cache: "no-store" });
        const data = (await response.json()) as { logos?: LogoAsset[] };
        if (!mounted || !response.ok) {
          return;
        }
        setAvailableLogos(Array.isArray(data.logos) ? data.logos : []);
      } catch {
        if (mounted) {
          setAvailableLogos([]);
        }
      }
    };

    void loadLogos();
    return () => {
      mounted = false;
    };
  }, [activeModal]);

  const resetCreateForm = () => {
    setEventName("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setCertificateType("workshop");
    setLogoSearch("");
    setLogoDataUrls([]);
    setSignatureImageDataUrl(null);
    setCreateError(null);
    if (admins.length > 0) {
      setAssignedAdminId(String(admins[0].id));
    }
  };

  const openCreateModal = () => {
    resetCreateForm();
    setActiveModal("create");
  };

  const closeModal = () => {
    if (creating) {
      return;
    }

    setActiveModal(null);
    resetCreateForm();
  };

  const handleCreateCertificate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const hiddenTemplateInput = createDefaultCertificateTemplateInput();
      const templateInput: CertificateTemplateInput = normalizeCertificateTemplateInput({
        ...hiddenTemplateInput,
        certificateType,
        eventName,
        issueDate,
        bodyText: getCertificateBodyTextForType(certificateType),
        logos: logoDataUrls,
        signatureImage: signatureImageDataUrl,
      });

      const content = {
        templateInput,
        overlayItems: createCertificateOverlayLayout(templateInput, "srm"),
        template: "srm",
        background: {
          borderColor: "#1e3a8a",
          backgroundImage: "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(241,245,249,1) 100%)",
        },
      };

      const response = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${hiddenTemplateInput.certificateTitle} - ${eventName}`,
          description: `${hiddenTemplateInput.organizationName} | ${hiddenTemplateInput.departmentName}`,
          assignedAdminId: Number(assignedAdminId),
          content,
        }),
      });

      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to create certificate template.");
      }

      setActiveModal(null);
      router.replace(`/certificate?certificateId=${data.id}`);
    } catch (createErrorResponse) {
      setCreateError(createErrorResponse instanceof Error ? createErrorResponse.message : "Failed to create certificate template.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCertificate = async (certificateId: number) => {
    const shouldDelete = window.confirm("Delete this certificate template permanently?");
    if (!shouldDelete) {
      return;
    }

    setDeletingCertificateId(certificateId);
    setError(null);

    try {
      const response = await fetch(`/api/certificate/${certificateId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete certificate.");
      }

      setCertificates((prev) => prev.filter((item) => item.id !== certificateId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete certificate.");
    } finally {
      setDeletingCertificateId(null);
    }
  };

  const filteredCertificates = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();
    const now = Date.now();
    const dateLimit =
      dateFilter === "all" ? null : now - Number(dateFilter) * 24 * 60 * 60 * 1000;

    return [...certificates]
      .sort(
        (left, right) =>
          toFilterTimestamp(right.updatedAt || right.createdAt) -
          toFilterTimestamp(left.updatedAt || left.createdAt),
      )
      .filter((certificate) => {
        if (normalizedQuery.length > 0) {
          const eventName = certificate.content.templateInput.eventName.toLowerCase();
          if (!certificate.title.toLowerCase().includes(normalizedQuery) && !eventName.includes(normalizedQuery)) {
            return false;
          }
        }

        const uiStatus = getUiStatus(certificate);
        if (typeFilter !== "all" && uiStatus !== typeFilter) {
          return false;
        }

        if (dateLimit !== null) {
          const editedTime = toFilterTimestamp(certificate.updatedAt || certificate.createdAt);
          if (editedTime < dateLimit) {
            return false;
          }
        }

        return true;
      });
  }, [certificates, dateFilter, searchText, typeFilter]);

  const filteredLogoOptions = useMemo(() => {
    const query = logoSearch.trim().toLowerCase();
    if (!query) {
      return availableLogos;
    }

    return availableLogos.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [availableLogos, logoSearch]);

  const toggleLogoSelection = useCallback((logoSrc: string) => {
    setLogoDataUrls((prev) => {
      if (prev.includes(logoSrc)) {
        return prev.filter((src) => src !== logoSrc);
      }

      if (prev.length >= 6) {
        return prev;
      }

      return [...prev, logoSrc];
    });
  }, []);

  const moveSelectedLogo = useCallback((index: number, direction: -1 | 1) => {
    setLogoDataUrls((prev) => {
      const nextIndex = index + direction;
      if (index < 0 || index >= prev.length || nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const copy = [...prev];
      const current = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = current;
      return copy;
    });
  }, []);

  return (
    <main className={cn(
      "min-h-screen transition-colors duration-300",
      isDark
        ? "bg-gradient-to-br from-[#0B0F1A] via-[#0f172a] to-[#111827] text-[#E5E7EB]"
        : "bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 text-slate-900",
    )}>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r p-6 backdrop-blur-lg transition-colors duration-300 lg:flex",
        isDark ? "border-slate-700 bg-[#111827]/85" : "border-slate-200 bg-white/85",
      )}>
        <Link href={logoBackHref} className="mb-8 flex items-center gap-3">
          <Logo appearance={isDark ? "dark" : "light"} iconClassName="h-9 w-9" textClassName="text-lg" />
        </Link>

        <nav className="space-y-1.5">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-left text-sm font-bold text-white shadow-[0_16px_28px_-18px_rgba(99,102,241,0.8)] transition hover:brightness-105"
          >
            <PlusCircle className="h-4 w-4" />
            Create
          </button>

          <Link href={dashboardHomeHref} className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isDark
              ? "text-slate-300 hover:bg-slate-800 hover:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}>
            <Home className="h-4 w-4" />
            Home
          </Link>

          <Link href={dashboardHomeHref} className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isDark
              ? "text-slate-300 hover:bg-slate-800 hover:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}>
            <FolderKanban className="h-4 w-4" />
            My Brochures
          </Link>

          <Link href="/faculty/certificate" className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isDark
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-900",
          )}>
            <FileBadge2 className="h-4 w-4" />
            Certificates
          </Link>

          <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-400">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>

          <Link href={settingsHref} className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isDark
              ? "text-slate-300 hover:bg-slate-800 hover:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}>
            <Settings2 className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <button type="button" onClick={() => void fetch("/api/auth/logout", { method: "POST" }).then(() => router.replace("/login"))} className={cn(
          "mt-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
          isDark
            ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        )}>
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      <div className="flex-1 lg:pl-72">
        <header className={cn(
          "sticky top-0 z-30 border-b px-6 py-5 backdrop-blur-lg transition-colors duration-300 md:px-10",
          isDark ? "border-slate-700 bg-[#111827]/80" : "border-slate-200 bg-white/80",
        )}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">
                <FileBadge2 className="h-3.5 w-3.5" />
                Faculty Certificates
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Start creating your next brochure</h1>
              <p className="mt-1 text-sm text-slate-600">Signed in as {user.username}</p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Create
            </button>
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

              <SelectBox
                value={typeFilter}
                onChange={(val) => setTypeFilter(val as "all" | UiStatus)}
                options={statusFilterOptions}
                className="!bg-white !text-slate-700 !border-slate-200"
              />

              <SelectBox
                value={dateFilter}
                onChange={(val) => setDateFilter(val as DateFilter)}
                options={dateFilterOptions}
                className="!bg-white !text-slate-700 !border-slate-200"
              />
            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">{filteredCertificates.length} results in certificates</p>
          </div>

          <section id="brochure-grid" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Recent Certificates</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {filteredCertificates.length} items
              </span>
            </div>

            {loading ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading certificates...</p>
            ) : error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            ) : filteredCertificates.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No certificates match your filters.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCertificates.map((certificate) => {
                  const uiStatus = getUiStatus(certificate);
                  const actionLabel = uiStatus === "draft" ? "Continue Editing" : "Open";
                  const openHref = `/certificate?certificateId=${certificate.id}`;

                  return (
                    <article key={certificate.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-100 p-4">
                        <p className="line-clamp-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          {certificate.content.templateInput.eventName}
                        </p>
                        <h3 className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-900">{certificate.title}</h3>
                      </div>

                      <div className="space-y-3 p-4">
                        <p className="line-clamp-2 text-sm text-slate-600">{certificate.description}</p>

                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Last edited {formatRelativeTime(certificate.updatedAt || certificate.createdAt)}
                          </span>

                          <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]", statusBadgeClassMap[uiStatus])}>
                            {uiStatus === "draft" ? "Draft" : "Completed"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Link href={openHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100">
                            <FileBadge2 className="h-3.5 w-3.5" />
                            {actionLabel}
                          </Link>

                          <button
                            type="button"
                            onClick={() => void handleDeleteCertificate(certificate.id)}
                            disabled={deletingCertificateId === certificate.id}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingCertificateId === certificate.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>

      {activeModal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) { closeModal(); } }}>
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Create Certificate Template</h3>
              <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Event Name</span>
                  <input value={eventName} onChange={(event) => setEventName(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Event Date</span>
                  <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">Certificate Type</span>
                <div className="block">
                  <SelectBox
                    value={certificateType}
                    onChange={(val) => setCertificateType(val as CertificateType)}
                    options={[
                      { label: "Workshop", value: "workshop" },
                      { label: "Hackathon", value: "hackathon" },
                      { label: "Symposium", value: "symposium" },
                      { label: "Custom", value: "custom" },
                    ]}
                    className="!bg-white !text-slate-700 !border-slate-200"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Template sentence will auto-adapt based on the selected type.
                </p>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Upload Logo(s) (PNG only)</span>
                  <input type="file" accept="image/png,.png" multiple onChange={async (event) => { const nextUrls = await filesToDataUrls(event.currentTarget.files, 6); setLogoDataUrls((prev) => [...prev, ...nextUrls].slice(0, 6)); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  <p className="text-xs text-slate-500">Selected logos: {logoDataUrls.length}</p>
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Upload Signature Image(s) (PNG)</span>
                  <input type="file" accept="image/png,.png" multiple onChange={async (event) => { const urls = await filesToDataUrls(event.currentTarget.files, 3); setSignatureImageDataUrl(urls[0] || null); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  <p className="text-xs text-slate-500">{signatureImageDataUrl ? "Signature image uploaded" : "Optional PNG signature upload"}</p>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">Select from existing logos</p>
                <input
                  value={logoSearch}
                  onChange={(event) => setLogoSearch(event.target.value)}
                  placeholder="Search available logos"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <div className="mt-3 grid max-h-44 grid-cols-2 gap-2 overflow-y-auto">
                  {filteredLogoOptions.map((logo) => {
                    const selected = logoDataUrls.includes(logo.src);
                    return (
                      <button
                        key={logo.id}
                        type="button"
                        onClick={() => toggleLogoSelection(logo.src)}
                        className={cn(
                          "rounded-xl border p-2 text-left transition",
                          selected
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <div className="relative h-10 w-full overflow-hidden rounded-md border border-slate-100 bg-white">
                          <Image src={logo.src} alt={logo.name} fill className="object-contain p-1" unoptimized />
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-700">{logo.name}</p>
                      </button>
                    );
                  })}
                </div>

                {logoDataUrls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Selected order (top row)</p>
                    {logoDataUrls.map((src, index) => (
                      <div key={`${src}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                        <div className="relative h-8 w-16 overflow-hidden rounded border border-slate-100 bg-slate-50">
                          <Image src={src} alt={`Selected logo ${index + 1}`} fill className="object-contain p-1" unoptimized />
                        </div>
                        <p className="flex-1 truncate text-xs text-slate-600">Logo {index + 1}</p>
                        <button type="button" onClick={() => moveSelectedLogo(index, -1)} className="rounded border border-slate-200 px-2 py-1 text-xs">Up</button>
                        <button type="button" onClick={() => moveSelectedLogo(index, 1)} className="rounded border border-slate-200 px-2 py-1 text-xs">Down</button>
                        <button
                          type="button"
                          onClick={() => setLogoDataUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                          className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">Select Admin Reviewer</span>
                <SelectBox 
                  value={assignedAdminId} 
                  onChange={setAssignedAdminId} 
                  options={
                    admins.length > 0 
                      ? admins.map(a => ({ label: a.username, value: String(a.id) })) 
                      : [{ label: "No admins available", value: "" }]
                  }
                  className="!bg-white !text-slate-700 !border-slate-200" 
                  disabled={loadingAdmins || admins.length === 0} 
                />
              </div>

              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">The certificate header, body text, and placeholders are handled internally by Brochify.</p>

              {createError && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{createError}</p>}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={creating || admins.length === 0 || !assignedAdminId} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">{creating ? "Creating..." : "Open Certificate Editor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
