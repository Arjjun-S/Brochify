"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { useThemePreference } from "@/components/dashboard/useThemePreference";
import {
  createCertificateOverlayLayout,
  createDefaultCertificateTemplateInput,
  normalizeCertificateTemplateInput,
  type CertificateTemplateInput,
  type CertificateType,
  getCertificateBodyTextForType,
} from "@/lib/domains/certificate";
import { SelectBox } from "@/components/ui/SelectBox";
import { Logo } from "@/components/ui/Logo";

type AdminOption = {
  id: number;
  username: string;
};

async function filesToDataUrls(files: FileList | null, maxCount: number): Promise<string[]> {
  if (!files || files.length === 0) return [];
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

export default function FacultyCertificateCreatePage() {
  const router = useRouter();
  const { isDark, theme, setTheme } = useThemePreference();
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [eventName, setEventName] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [certificateType, setCertificateType] = useState<CertificateType>("workshop");
  const [logoDataUrls, setLogoDataUrls] = useState<string[]>([]);
  const [signatureImageDataUrl, setSignatureImageDataUrl] = useState<string | null>(null);
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAdmins = async () => {
      setLoadingAdmins(true);
      try {
        const response = await fetch("/api/users/admins", { cache: "no-store" });
        const data = (await response.json()) as { admins?: AdminOption[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Failed to load admins.");
        const nextAdmins = data.admins || [];
        setAdmins(nextAdmins);
        if (nextAdmins.length > 0) setAssignedAdminId(String(nextAdmins[0].id));
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load admins.";
        setError(message);
      } finally {
        setLoadingAdmins(false);
      }
    };
    void loadAdmins();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignedAdminId) return;
    setSubmitting(true);
    setError(null);

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
      if (!response.ok || !data.id) throw new Error(data.error || "Failed to create certificate.");
      router.replace(`/certificate?certificateId=${data.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create certificate.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <main className={cn(
      "min-h-screen transition-colors duration-300",
      isDark ? "bg-gradient-to-br from-[#0B0F1A] via-[#0f172a] to-[#111827] text-[#E5E7EB]" : "bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-100 text-slate-900",
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b px-6 py-4 backdrop-blur-lg transition-colors duration-300",
        isDark ? "border-slate-700 bg-[#111827]/80" : "border-slate-200 bg-white/80",
      )}>
        <div className="flex items-center justify-between gap-4">
          <Link href="/faculty/certificate" className="flex items-center gap-3">
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

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">
              <PlusCircle className="h-3.5 w-3.5" />
              New Certificate
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create Certificate</h1>
            <p className="mt-1 text-sm text-slate-600">Fill in the details below to create your certificate template.</p>
          </div>
          <Link
            href="/faculty/certificate"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
        </div>

        {/* Create Form */}
        <section className={cn(
          "rounded-3xl border p-6 shadow-sm",
          isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
        )}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Event Name</span>
                <input
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                  placeholder="Enter event name"
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition",
                    isDark ? "border-slate-700 bg-slate-900 text-slate-200 focus:border-indigo-500" : "border-slate-200 bg-white text-slate-700 focus:border-indigo-400",
                  )}
                  required
                />
              </label>

              <label className="block space-y-1">
                <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Event Date</span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition",
                    isDark ? "border-slate-700 bg-slate-900 text-slate-200 focus:border-indigo-500" : "border-slate-200 bg-white text-slate-700 focus:border-indigo-400",
                  )}
                  required
                />
              </label>
            </div>

            <div className="block space-y-1">
              <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Certificate Type</span>
              <SelectBox
                value={certificateType}
                onChange={(val) => setCertificateType(val as CertificateType)}
                options={[
                  { label: "Workshop", value: "workshop" },
                  { label: "Hackathon", value: "hackathon" },
                  { label: "Symposium", value: "symposium" },
                  { label: "Custom", value: "custom" },
                ]}
                className={cn(
                  isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Upload Logo(s) (PNG only)</span>
                <input
                  type="file"
                  accept="image/png,.png"
                  multiple
                  onChange={async (event) => {
                    const nextUrls = await filesToDataUrls(event.currentTarget.files, 6);
                    setLogoDataUrls((prev) => [...prev, ...nextUrls].slice(0, 6));
                  }}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition",
                    isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700",
                  )}
                />
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>Selected logos: {logoDataUrls.length}</p>
              </label>

              <label className="block space-y-1">
                <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Upload Signature (PNG)</span>
                <input
                  type="file"
                  accept="image/png,.png"
                  onChange={async (event) => {
                    const urls = await filesToDataUrls(event.currentTarget.files, 1);
                    setSignatureImageDataUrl(urls[0] || null);
                  }}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition",
                    isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700",
                  )}
                />
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                  {signatureImageDataUrl ? "Signature uploaded" : "Optional PNG signature"}
                </p>
              </label>
            </div>

            <div className="block space-y-1">
              <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Select Admin Reviewer</span>
              <SelectBox
                value={assignedAdminId}
                onChange={setAssignedAdminId}
                options={
                  loadingAdmins 
                    ? [{ label: "Loading admins...", value: "__loading__" }]
                    : admins.length > 0
                      ? admins.map(a => ({ label: a.username, value: String(a.id) }))
                      : [{ label: "No admins available", value: "__none__" }]
                }
                className={cn(
                  isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
                disabled={loadingAdmins || admins.length === 0}
              />
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
                disabled={submitting || admins.length === 0 || !assignedAdminId}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition shadow-[0_8px_20px_-8px_rgba(70,46,147,0.5)]",
                  submitting ? "opacity-60 cursor-not-allowed" : "",
                )}
                style={{ backgroundColor: "#462E93" }}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "Creating..." : "Open Certificate Editor"}
              </button>
              <Link
                href="/faculty/certificate"
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