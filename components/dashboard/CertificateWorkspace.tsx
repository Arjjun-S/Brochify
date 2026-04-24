"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, FileBadge2, PlusCircle, Search, Trash2, X } from "lucide-react";
import {
  createCertificateOverlayLayout,
  createDefaultCertificateTemplateInput,
  normalizeCertificateTemplateInput,
  type CertificateTemplateInput,
} from "@/lib/domains/certificate";
import { cn } from "@/lib/ui/cn";
import type { CertificateRecord, CertificateStatus, SessionUser } from "@/lib/server/types";

type CertificateWorkspaceProps = {
  user: SessionUser;
};

type AdminOption = {
  id: number;
  username: string;
};

type ActiveModal = "create" | null;

const statusBadgeClassMap: Record<CertificateStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-700",
  pending: "border-amber-300 bg-amber-100 text-amber-700",
  approved: "border-emerald-300 bg-emerald-100 text-emerald-700",
  rejected: "border-rose-300 bg-rose-100 text-rose-700",
};

const statusFilterOptions: Array<{ label: string; value: "all" | CertificateStatus }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files: FileList | null, maxCount: number): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const selected = Array.from(files)
    .filter((file) => file.type === "image/png" || file.name.toLowerCase().endsWith(".png"))
    .slice(0, maxCount);

  return Promise.all(selected.map((file) => fileToDataUrl(file)));
}

export default function CertificateWorkspace({ user }: CertificateWorkspaceProps) {
  const router = useRouter();

  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CertificateStatus>("all");

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
  const [deletingCertificateId, setDeletingCertificateId] = useState<number | null>(null);

  const moduleHref = user.role === "admin" ? "/admin/modules" : "/faculty/modules";

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/certificate", { cache: "no-store" });
      const data = (await response.json()) as {
        certificates?: CertificateRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load certificates.");
      }

      setCertificates(data.certificates || []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load certificates.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

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
    } catch (loadAdminsError) {
      const message = loadAdminsError instanceof Error ? loadAdminsError.message : "Failed to load admins.";
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
    if (user.role !== "faculty") {
      return;
    }

    resetCreateForm();
    setActiveModal("create");

    if (admins.length === 0 && !loadingAdmins) {
      void loadAdmins();
    }
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

    if (user.role !== "faculty") {
      return;
    }

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
    } catch (createCertificateError) {
      const message =
        createCertificateError instanceof Error
          ? createCertificateError.message
          : "Failed to create certificate template.";
      setCreateError(message);
      setCreating(false);
    }
  };

  const handleDeleteCertificate = async (certificateId: number) => {
    if (user.role !== "faculty") {
      return;
    }

    const shouldDelete = window.confirm("Delete this certificate template permanently?");
    if (!shouldDelete) {
      return;
    }

    setDeletingCertificateId(certificateId);
    setError(null);

    try {
      const response = await fetch(`/api/certificate/${certificateId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete certificate.");
      }

      setCertificates((prev) => prev.filter((item) => item.id !== certificateId));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete certificate.";
      setError(message);
    } finally {
      setDeletingCertificateId(null);
    }
  };

  const filteredCertificates = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();

    return certificates.filter((certificate) => {
      if (
        normalizedQuery.length > 0 &&
        !certificate.title.toLowerCase().includes(normalizedQuery) &&
        !certificate.content.templateInput.eventName.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      if (statusFilter !== "all" && certificate.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [certificates, searchText, statusFilter]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-100 px-6 py-8 md:px-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Certificate Generator</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Certificate Generator
              </h1>
              <p className="mt-2 text-sm text-slate-600 md:text-base">
                Build template, design in editor, submit for approval, and bulk export certificates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={moduleHref}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to Modules
              </Link>

              {user.role === "faculty" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Template
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by title or event"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CertificateStatus)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">{filteredCertificates.length} templates</p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading certificates...</p>
          ) : error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : filteredCertificates.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No certificate templates found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCertificates.map((certificate) => {
                const statusLabel =
                  certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1);

                return (
                  <article key={certificate.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-amber-100 p-4">
                      <p className="line-clamp-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        {certificate.content.templateInput.eventName}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-900">
                        {certificate.title}
                      </h3>
                    </div>

                    <div className="space-y-3 p-4">
                      <p className="line-clamp-2 text-sm text-slate-600">{certificate.description}</p>

                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Last edited {formatRelativeTime(certificate.updatedAt || certificate.createdAt)}
                        </span>

                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                            statusBadgeClassMap[certificate.status],
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/certificate?certificateId=${certificate.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                        >
                          <FileBadge2 className="h-3.5 w-3.5" />
                          Open Editor
                        </Link>

                        {user.role === "faculty" && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteCertificate(certificate.id)}
                            disabled={deletingCertificateId === certificate.id}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingCertificateId === certificate.id ? "Deleting" : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {activeModal === "create" && user.role === "faculty" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Create Certificate Template</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Event Name</span>
                  <input
                    value={eventName}
                    onChange={(event) => setEventName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    required
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Event Date</span>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(event) => setIssueDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Upload Logo(s) (PNG only)</span>
                  <input
                    type="file"
                    accept="image/png,.png"
                    multiple
                    onChange={async (event) => {
                      const nextUrls = await filesToDataUrls(event.currentTarget.files, 6);
                      setLogoDataUrls(nextUrls);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <p className="text-xs text-slate-500">Selected logos: {logoDataUrls.length}</p>
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-semibold text-slate-700">Upload Signature Image(s) (PNG)</span>
                  <input
                    type="file"
                    accept="image/png,.png"
                    multiple
                    onChange={async (event) => {
                      const urls = await filesToDataUrls(event.currentTarget.files, 3);
                      setSignatureImageDataUrl(urls[0] || null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    {signatureImageDataUrl ? "Signature image uploaded" : "Optional PNG signature upload"}
                  </p>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">Select Admin Reviewer</span>
                <select
                  value={assignedAdminId}
                  onChange={(event) => setAssignedAdminId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  required
                  disabled={loadingAdmins || admins.length === 0}
                >
                  {admins.length === 0 ? <option value="">No admins available</option> : null}
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
              </label>

              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                The certificate header, body text, and placeholders are handled internally by Brochify.
              </p>

              {createError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {createError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || admins.length === 0 || !assignedAdminId}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {creating ? "Creating..." : "Open Certificate Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
