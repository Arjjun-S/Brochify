"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBadge2,
  FileCheck2,
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
  createCertificateOverlayLayout,
  createDefaultCertificateTemplateInput,
  normalizeCertificateTemplateInput,
  type CertificateTemplateInput,
} from "@/lib/domains/certificate";
import { cn } from "@/lib/ui/cn";
import type { CertificateRecord, CertificateStatus, SessionUser } from "@/lib/server/types";

type FacultyCertificateWorkspaceProps = {
  user: SessionUser;
};

type AdminOption = {
  id: number;
  username: string;
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
  const [logoDataUrls, setLogoDataUrls] = useState<string[]>([]);
  const [signatureImageDataUrl, setSignatureImageDataUrl] = useState<string | null>(null);
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const dashboardHomeHref = "/faculty/dashboard";
  const settingsHref = "/faculty/settings";
  const modulesHref = "/faculty/modules";

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

  const resetCreateForm = () => {
    setEventName("");
    setIssueDate(new Date().toISOString().slice(0, 10));
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
        eventName,
        issueDate,
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white/85 p-6 backdrop-blur-lg lg:flex">
        <Link href={dashboardHomeHref} className="mb-8 flex items-center gap-3">
          <Image src="/icon-logo.png" alt="Brochify Icon" width={38} height={38} className="h-9 w-9 object-contain" priority />
          <Image src="/text-logo.png" alt="Brochify Wordmark" width={158} height={34} className="h-8 w-auto object-contain" priority />
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

          <Link href={dashboardHomeHref} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <Home className="h-4 w-4" />
            Home
          </Link>

          <Link href={dashboardHomeHref} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <FolderKanban className="h-4 w-4" />
            My Brochures
          </Link>

          <Link href="/faculty/certificates" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <FileBadge2 className="h-4 w-4" />
            Certificates
          </Link>

          <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-400">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>

          <Link href={settingsHref} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <Settings2 className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <button type="button" onClick={() => void fetch("/api/auth/logout", { method: "POST" }).then(() => router.replace("/login"))} className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      <div className="flex-1 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-lg md:px-10">
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

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as "all" | UiStatus)}
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Upload Logo(s) (PNG only)</span>
                  <input type="file" accept="image/png,.png" multiple onChange={async (event) => { const nextUrls = await filesToDataUrls(event.currentTarget.files, 6); setLogoDataUrls(nextUrls); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  <p className="text-xs text-slate-500">Selected logos: {logoDataUrls.length}</p>
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Upload Signature Image(s) (PNG)</span>
                  <input type="file" accept="image/png,.png" multiple onChange={async (event) => { const urls = await filesToDataUrls(event.currentTarget.files, 3); setSignatureImageDataUrl(urls[0] || null); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  <p className="text-xs text-slate-500">{signatureImageDataUrl ? "Signature image uploaded" : "Optional PNG signature upload"}</p>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">Select Admin Reviewer</span>
                <select value={assignedAdminId} onChange={(event) => setAssignedAdminId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required disabled={loadingAdmins || admins.length === 0}>
                  {admins.length === 0 ? <option value="">No admins available</option> : null}
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.username}</option>
                  ))}
                </select>
              </label>

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
