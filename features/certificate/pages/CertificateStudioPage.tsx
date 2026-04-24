"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  FileUp,
  Italic,
  PlusCircle,
  Redo2,
  Save,
  ShieldCheck,
  Trash2,
  Underline,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrochureOverlay from "@/components/studio/canvas/BrochureOverlay";
import {
  FONT_OPTIONS,
  createImageOverlay,
  createTextOverlay,
  normalizeFontFamilyValue,
  type OverlayItem,
  type TextOverlayItem,
} from "@/lib/domains/brochure";
import {
  CERTIFICATE_PAGE_HEIGHT,
  CERTIFICATE_PAGE_WIDTH,
  createCertificateOverlayLayout,
  type CertificateTemplateName,
  type CertificateEditorState,
  type CertificateTemplateInput,
} from "@/lib/domains/certificate";
import { cn } from "@/lib/ui/cn";
import type { CertificateRecord, CertificateStatus, SessionUser } from "@/lib/server/types";

type CertificateStudioPageProps = {
  session: SessionUser;
  certificate: CertificateRecord;
};

type WorkflowBusyState = "idle" | "saving" | "submitting" | "approving" | "rejecting";
type CertificateType = "workshop" | "hackathon" | "event";

type CustomField = {
  id: string;
  label: string;
  value: string;
};

type LogoAsset = {
  id: string;
  name: string;
  src: string;
};

type Snapshot = {
  overlayItems: OverlayItem[];
  template: CertificateTemplateName;
  background: CertificateEditorState["background"];
  selectedOverlayId: string | null;
};

function getStatusBadgeClass(status: CertificateStatus): string {
  if (status === "approved") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-amber-300 bg-amber-50 text-amber-700";
  if (status === "rejected") return "border-rose-300 bg-rose-50 text-rose-700";
  return "border-slate-300 bg-slate-100 text-slate-700";
}

function cloneSnapshotValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getTemplateBackground(template: CertificateTemplateName): CertificateEditorState["background"] {
  if (template === "beige") {
    return {
      borderColor: "#9a6b3a",
      backgroundImage: "linear-gradient(145deg, rgba(255,247,235,1) 0%, rgba(239,222,197,1) 100%)",
    };
  }

  if (template === "tan") {
    return {
      borderColor: "#8a6638",
      backgroundImage: "linear-gradient(145deg, rgba(255,248,239,1) 0%, rgba(245,220,188,1) 100%)",
    };
  }

  return {
    borderColor: "#1e3a8a",
    backgroundImage: "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(241,245,249,1) 100%)",
  };
}

export default function CertificateStudioPage({ session, certificate }: CertificateStudioPageProps) {
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>(certificate.content.overlayItems);
  const [templateInput, setTemplateInput] = useState<CertificateTemplateInput>(certificate.content.templateInput);
  const [template, setTemplate] = useState<CertificateTemplateName>(certificate.content.template || "srm");
  const [background, setBackground] = useState(certificate.content.background);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<CertificateStatus>(certificate.status);
  const [rejectionReason, setRejectionReason] = useState<string | null>(certificate.rejectionReason);

  const [workflowBusyState, setWorkflowBusyState] = useState<WorkflowBusyState>("idle");
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const [logoAssets, setLogoAssets] = useState<LogoAsset[]>([]);
  const [logoSearch, setLogoSearch] = useState("");

  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const [certificateType, setCertificateType] = useState<CertificateType>("workshop");
  const [formValues, setFormValues] = useState({
    instructorName: "",
    duration: "",
    topic: "",
    teamName: "",
    position: "Winner",
    problemStatement: "",
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [logosOpen, setLogosOpen] = useState(true);
  const [elementsOpen, setElementsOpen] = useState(true);

  const panStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const undoStackRef = useRef<Snapshot[]>([]);
  const redoStackRef = useRef<Snapshot[]>([]);

  const dashboardHref = session.role === "admin" ? "/admin/certificates" : "/faculty/certificates";
  const moduleHref = session.role === "admin" ? "/admin/modules" : "/faculty/modules";

  const selectedOverlay = useMemo(() => {
    return overlayItems.find((item) => item.id === selectedOverlayId) ?? null;
  }, [overlayItems, selectedOverlayId]);

  const selectedTextOverlay = selectedOverlay?.type === "text" ? selectedOverlay : null;

  const filteredLogos = useMemo(() => {
    const query = logoSearch.trim().toLowerCase();
    if (!query) {
      return logoAssets;
    }

    return logoAssets.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [logoAssets, logoSearch]);

  const isWorkflowBusy = workflowBusyState !== "idle";

  useEffect(() => {
    let isMounted = true;

    const loadLogos = async () => {
      try {
        const response = await fetch("/api/logos", { cache: "no-store" });
        const data = (await response.json()) as { logos?: LogoAsset[] };
        if (!response.ok) {
          return;
        }

        if (!isMounted) {
          return;
        }

        setLogoAssets(Array.isArray(data.logos) ? data.logos : []);
      } catch {
        if (isMounted) {
          setLogoAssets([]);
        }
      }
    };

    void loadLogos();

    return () => {
      isMounted = false;
    };
  }, []);

  const captureSnapshot = useCallback((): Snapshot => {
    return {
      overlayItems: cloneSnapshotValue(overlayItems),
      template,
      background: cloneSnapshotValue(background),
      selectedOverlayId,
    };
  }, [background, overlayItems, selectedOverlayId, template]);

  const restoreSnapshot = useCallback((snapshot: Snapshot) => {
    setOverlayItems(cloneSnapshotValue(snapshot.overlayItems));
    setTemplate(snapshot.template);
    setBackground(cloneSnapshotValue(snapshot.background));
    setSelectedOverlayId(snapshot.selectedOverlayId);
  }, []);

  const runWithUndo = useCallback(
    (apply: () => void) => {
      undoStackRef.current.push(captureSnapshot());
      if (undoStackRef.current.length > 100) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      apply();
    },
    [captureSnapshot],
  );

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) {
      return;
    }

    redoStackRef.current.push(captureSnapshot());
    restoreSnapshot(previous);
  }, [captureSnapshot, restoreSnapshot]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) {
      return;
    }

    undoStackRef.current.push(captureSnapshot());
    restoreSnapshot(next);
  }, [captureSnapshot, restoreSnapshot]);

  const updateOverlay = useCallback(
    (id: string, patch: Partial<OverlayItem>) => {
      runWithUndo(() => {
        setOverlayItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) {
              return item;
            }

            return {
              ...item,
              ...patch,
            } as OverlayItem;
          }),
        );
      });
    },
    [runWithUndo],
  );

  const applyTemplate = useCallback(
    (nextTemplate: CertificateTemplateName) => {
      runWithUndo(() => {
        setTemplate(nextTemplate);
        setBackground(getTemplateBackground(nextTemplate));
        setOverlayItems(createCertificateOverlayLayout(templateInput, nextTemplate));
        setSelectedOverlayId(null);
      });
    },
    [runWithUndo, templateInput],
  );

  const addTextOverlay = () => {
    runWithUndo(() => {
      const next = {
        ...createTextOverlay(1),
        text: "Edit text",
        x: 120,
        y: 120,
        width: 260,
        height: 72,
        fontSize: 34,
        fontWeight: 700,
        align: "center" as const,
      };

      setOverlayItems((prev) => [...prev, next]);
      setSelectedOverlayId(next.id);
    });
  };

  const addImageOverlayFromFile = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    const reader = new FileReader();

    await new Promise<void>((resolve, reject) => {
      reader.onload = () => {
        runWithUndo(() => {
          const dataUrl = String(reader.result || "");
          const next = createImageOverlay(1, { name: file.name, dataUrl }, { x: 110, y: 120 });
          setOverlayItems((prev) => [...prev, next]);
          setSelectedOverlayId(next.id);
        });
        resolve();
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const addLogoToCanvas = (logo: LogoAsset) => {
    runWithUndo(() => {
      const next = createImageOverlay(1, { name: logo.name, dataUrl: logo.src }, { x: 90, y: 90 });
      setOverlayItems((prev) => [...prev, next]);
      setSelectedOverlayId(next.id);
    });
  };

  const removeSelectedOverlay = () => {
    if (!selectedOverlayId) {
      return;
    }

    runWithUndo(() => {
      setOverlayItems((prev) => prev.filter((item) => item.id !== selectedOverlayId));
      setSelectedOverlayId(null);
    });
  };

  const buildPayload = useCallback((): CertificateEditorState => {
    return {
      templateInput,
      overlayItems,
      template,
      background,
    };
  }, [background, overlayItems, template, templateInput]);

  const saveEditorState = useCallback(
    async (payload: CertificateEditorState) => {
      const response = await fetch(`/api/certificate/${certificate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload }),
      });

      const data = (await response.json()) as { certificate?: CertificateRecord; error?: string };

      if (!response.ok || !data.certificate) {
        throw new Error(data.error || "Failed to save certificate state.");
      }

      setReviewStatus(data.certificate.status);
      setRejectionReason(data.certificate.rejectionReason);
      return data.certificate;
    },
    [certificate.id],
  );

  const handleSave = async () => {
    setWorkflowBusyState("saving");
    setWorkflowError(null);
    setWorkflowMessage(null);

    try {
      await saveEditorState(buildPayload());
      setWorkflowMessage("Certificate template saved.");
    } catch (saveError) {
      setWorkflowError(saveError instanceof Error ? saveError.message : "Failed to save certificate template.");
    } finally {
      setWorkflowBusyState("idle");
    }
  };

  const handleSubmitForReview = async () => {
    setWorkflowBusyState("submitting");
    setWorkflowError(null);
    setWorkflowMessage(null);

    try {
      const snapshot = buildPayload();
      await saveEditorState(snapshot);

      const response = await fetch(`/api/certificate/${certificate.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: snapshot }),
      });

      const data = (await response.json()) as { certificate?: CertificateRecord; error?: string };

      if (!response.ok || !data.certificate) {
        throw new Error(data.error || "Failed to submit certificate.");
      }

      setReviewStatus(data.certificate.status);
      setRejectionReason(data.certificate.rejectionReason);
      setWorkflowMessage("Certificate submitted for admin review.");
    } catch (submitError) {
      setWorkflowError(submitError instanceof Error ? submitError.message : "Failed to submit certificate.");
    } finally {
      setWorkflowBusyState("idle");
    }
  };

  const handleAdminDecision = async (decision: "approved" | "rejected") => {
    const rejectionReasonValue = decision === "rejected" ? window.prompt("Enter rejection reason")?.trim() || "" : "";

    if (decision === "rejected" && !rejectionReasonValue) {
      setWorkflowError("Rejection reason is required.");
      return;
    }

    setWorkflowBusyState(decision === "approved" ? "approving" : "rejecting");
    setWorkflowError(null);
    setWorkflowMessage(null);

    try {
      const snapshot = buildPayload();
      await saveEditorState(snapshot);

      const endpoint =
        decision === "approved"
          ? `/api/certificate/${certificate.id}/approve`
          : `/api/certificate/${certificate.id}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: snapshot,
          rejectionReason: decision === "rejected" ? rejectionReasonValue : null,
        }),
      });

      const data = (await response.json()) as { certificate?: CertificateRecord; error?: string };

      if (!response.ok || !data.certificate) {
        throw new Error(data.error || "Failed to update certificate status.");
      }

      setReviewStatus(data.certificate.status);
      setRejectionReason(data.certificate.rejectionReason);
      setWorkflowMessage(decision === "approved" ? "Certificate approved." : "Certificate rejected.");
    } catch (decisionError) {
      setWorkflowError(decisionError instanceof Error ? decisionError.message : "Failed to update status.");
    } finally {
      setWorkflowBusyState("idle");
    }
  };

  const applyTextStyle = (patch: Partial<TextOverlayItem>) => {
    if (!selectedTextOverlay) {
      return;
    }

    updateOverlay(selectedTextOverlay.id, patch as Partial<OverlayItem>);
  };

  const beginPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: canvasOffset.x,
      originY: canvasOffset.y,
    };
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = panStateRef.current;
    if (!state) {
      return;
    }

    setCanvasOffset({
      x: state.originX + (event.clientX - state.startX),
      y: state.originY + (event.clientY - state.startY),
    });
  };

  const endPan = () => {
    panStateRef.current = null;
  };

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_12%,#e0edff_0%,#f8fbff_46%,#edf4fb_100%)] text-slate-900">
      <header className="flex h-20 items-center justify-between border-b border-white/70 bg-white/60 px-6 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <Link href={dashboardHref} className="flex items-center gap-3">
            <Image src="/icon-logo.png" alt="Brochify" width={34} height={34} className="h-8 w-8" />
            <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">Certificate Studio</span>
          </Link>

          <Link
            href={moduleHref}
            className="rounded-full border border-slate-300/80 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 backdrop-blur hover:bg-white"
          >
            Modules
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]",
              getStatusBadgeClass(reviewStatus),
            )}
          >
            {reviewStatus}
          </span>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isWorkflowBusy}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:shadow-md disabled:opacity-70"
          >
            <Save className="h-3.5 w-3.5" />
            {workflowBusyState === "saving" ? "Saving..." : "Save"}
          </button>

          {session.role === "faculty" && (
            <button
              type="button"
              onClick={() => void handleSubmitForReview()}
              disabled={isWorkflowBusy}
              className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-sky-700 transition hover:shadow-md disabled:opacity-70"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {workflowBusyState === "submitting" ? "Submitting..." : "Submit"}
            </button>
          )}

          {session.role === "admin" && (
            <>
              <button
                type="button"
                onClick={() => void handleAdminDecision("approved")}
                disabled={isWorkflowBusy}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 transition hover:shadow-md disabled:opacity-70"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {workflowBusyState === "approving" ? "Approving..." : "Approve"}
              </button>

              <button
                type="button"
                onClick={() => void handleAdminDecision("rejected")}
                disabled={isWorkflowBusy}
                className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-rose-700 transition hover:shadow-md disabled:opacity-70"
              >
                <XCircle className="h-3.5 w-3.5" />
                {workflowBusyState === "rejecting" ? "Rejecting..." : "Reject"}
              </button>
            </>
          )}
        </div>
      </header>

      {(workflowError || workflowMessage) && (
        <div className="border-b border-white/70 bg-white/60 px-6 py-2 text-sm backdrop-blur-xl">
          {workflowError ? <p className="text-rose-700">{workflowError}</p> : null}
          {!workflowError && workflowMessage ? <p className="text-emerald-700">{workflowMessage}</p> : null}
        </div>
      )}

      {session.role === "faculty" && reviewStatus === "rejected" && rejectionReason && (
        <div className="border-b border-rose-200 bg-rose-50/80 px-6 py-2 text-sm text-rose-700">
          <p className="font-semibold uppercase tracking-[0.12em]">Rejection Reason</p>
          <p>{rejectionReason}</p>
        </div>
      )}

      <div className="grid h-[calc(100vh-80px)] grid-cols-1 xl:grid-cols-[320px_1fr]">
        <aside className="border-r border-white/70 bg-white/50 p-4 backdrop-blur-xl xl:overflow-y-auto">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Certificate Type</p>
            <select
              value={certificateType}
              onChange={(event) => setCertificateType(event.target.value as CertificateType)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="workshop">Workshop</option>
              <option value="hackathon">Hackathon</option>
              <option value="event">Event</option>
            </select>

            <div className="mt-3 space-y-2">
              {certificateType === "workshop" && (
                <>
                  <input
                    value={formValues.instructorName}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, instructorName: event.target.value }))}
                    placeholder="Instructor Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={formValues.duration}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, duration: event.target.value }))}
                    placeholder="Duration"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={formValues.topic}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, topic: event.target.value }))}
                    placeholder="Topic"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </>
              )}

              {certificateType === "hackathon" && (
                <>
                  <input
                    value={formValues.teamName}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, teamName: event.target.value }))}
                    placeholder="Team Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <select
                    value={formValues.position}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, position: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option>Winner</option>
                    <option>Runner</option>
                  </select>
                  <textarea
                    value={formValues.problemStatement}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, problemStatement: event.target.value }))}
                    placeholder="Problem Statement"
                    className="min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </>
              )}

              {certificateType === "event" && (
                <>
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        value={field.label}
                        onChange={(event) =>
                          setCustomFields((prev) =>
                            prev.map((item) => (item.id === field.id ? { ...item, label: event.target.value } : item)),
                          )
                        }
                        placeholder="Field"
                        className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        value={field.value}
                        onChange={(event) =>
                          setCustomFields((prev) =>
                            prev.map((item) => (item.id === field.id ? { ...item, value: event.target.value } : item)),
                          )
                        }
                        placeholder="Value"
                        className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomFields((prev) => prev.filter((item) => item.id !== field.id))}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCustomFields((prev) => [
                        ...prev,
                        { id: `f-${Math.random().toString(36).slice(2, 8)}`, label: "", value: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Field
                  </button>
                </>
              )}
            </div>
          </div>

          <section className="mt-4 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
            <button
              type="button"
              onClick={() => setTemplatesOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Templates</h2>
              {templatesOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {templatesOpen && (
              <div className="mt-3 grid gap-2">
                {([
                  { id: "srm", label: "SRM Classic", note: "Default official style" },
                  { id: "beige", label: "Beige Formal", note: "Warm formal tone" },
                  { id: "tan", label: "Tan Heritage", note: "Classic paper style" },
                ] as const).map((item) => {
                  const selected = template === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => applyTemplate(item.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        selected
                          ? "border-slate-900 bg-slate-100 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.9)]"
                          : "border-slate-200 bg-white hover:border-slate-400",
                      )}
                    >
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.note}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-4 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
            <button
              type="button"
              onClick={() => setLogosOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Logos</h2>
              {logosOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {logosOpen && (
              <>
                <input
                  value={logoSearch}
                  onChange={(event) => setLogoSearch(event.target.value)}
                  placeholder="Search logos"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />

                <div className="mt-3 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto">
                  {filteredLogos.map((logo) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => addLogoToCanvas(logo)}
                      className="group rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-primary/40 hover:shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]"
                    >
                      <div className="relative h-12 w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                        <Image src={logo.src} alt={logo.name} fill className="object-contain p-1" unoptimized />
                      </div>
                      <p className="mt-1 truncate text-[11px] font-semibold text-slate-700">{logo.name}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="mt-4 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
            <button
              type="button"
              onClick={() => setElementsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Elements</h2>
              {elementsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {elementsOpen && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addTextOverlay}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:shadow-md"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Text
                </button>

                <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:shadow-md">
                  <FileUp className="h-3.5 w-3.5" />
                  Image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={async (event) => {
                      await addImageOverlayFromFile(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </section>
        </aside>

        <section
          className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.22),rgba(226,232,240,0.45),rgba(248,250,252,0.95))]"
          onPointerDown={beginPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          onLostPointerCapture={endPan}
          onWheel={(event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.05 : 0.05;
            setCanvasScale((prev) => Math.max(0.55, Math.min(1.8, prev + delta)));
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-[24px] border border-white/75 bg-white/75 px-4 py-3 shadow-[0_24px_45px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
              <button
                type="button"
                onClick={undo}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md"
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md"
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={removeSelectedOverlay}
                disabled={!selectedOverlayId}
                className="rounded-full border border-rose-300 bg-rose-50 p-2 text-rose-700 transition hover:shadow-md disabled:opacity-60"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <select
                value={selectedTextOverlay?.fontFamily || FONT_OPTIONS[0].value}
                onChange={(event) => applyTextStyle({ fontFamily: normalizeFontFamilyValue(event.target.value) })}
                disabled={!selectedTextOverlay}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={10}
                max={120}
                value={selectedTextOverlay?.fontSize ?? 28}
                onChange={(event) => applyTextStyle({ fontSize: Number(event.target.value) || 28 })}
                disabled={!selectedTextOverlay}
                className="w-16 rounded-full border border-slate-200 bg-white px-2 py-2 text-xs"
              />

              <button
                type="button"
                onClick={() => applyTextStyle({ fontWeight: (selectedTextOverlay?.fontWeight ?? 500) >= 700 ? 500 : 700 })}
                disabled={!selectedTextOverlay}
                className={cn(
                  "rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md disabled:opacity-60",
                  (selectedTextOverlay?.fontWeight ?? 500) >= 700 && "bg-slate-900 text-white",
                )}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => applyTextStyle({ fontStyle: selectedTextOverlay?.fontStyle === "italic" ? "normal" : "italic" } as Partial<TextOverlayItem>)}
                disabled={!selectedTextOverlay}
                className={cn(
                  "rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md disabled:opacity-60",
                  selectedTextOverlay?.fontStyle === "italic" && "bg-slate-900 text-white",
                )}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTextStyle({
                    textDecoration: selectedTextOverlay?.textDecoration === "underline" ? "none" : "underline",
                  } as Partial<TextOverlayItem>)
                }
                disabled={!selectedTextOverlay}
                className={cn(
                  "rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md disabled:opacity-60",
                  selectedTextOverlay?.textDecoration === "underline" && "bg-slate-900 text-white",
                )}
              >
                <Underline className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => applyTextStyle({ align: "left" })}
                  disabled={!selectedTextOverlay}
                  className={cn(
                    "rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50",
                    selectedTextOverlay?.align === "left" && "bg-slate-900 text-white",
                  )}
                >
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextStyle({ align: "center" })}
                  disabled={!selectedTextOverlay}
                  className={cn(
                    "rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50",
                    selectedTextOverlay?.align === "center" && "bg-slate-900 text-white",
                  )}
                >
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTextStyle({ align: "right" })}
                  disabled={!selectedTextOverlay}
                  className={cn(
                    "rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50",
                    selectedTextOverlay?.align === "right" && "bg-slate-900 text-white",
                  )}
                >
                  <AlignRight className="h-4 w-4" />
                </button>
              </div>

              <input
                type="color"
                value={selectedTextOverlay?.color || "#0f172a"}
                onChange={(event) => applyTextStyle({ color: event.target.value })}
                disabled={!selectedTextOverlay}
                className="h-10 w-12 rounded-full border border-slate-200 bg-white p-1"
              />

              <div className="ml-2 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => setCanvasScale((prev) => Math.max(0.55, prev - 0.05))}
                  className="text-sm font-bold text-slate-700"
                >
                  -
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-slate-600">{Math.round(canvasScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setCanvasScale((prev) => Math.min(1.8, prev + 0.05))}
                  className="text-sm font-bold text-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-4 pb-4 pt-24">
            <div
              className="relative rounded-xl transition"
              style={{
                width: CERTIFICATE_PAGE_WIDTH,
                height: CERTIFICATE_PAGE_HEIGHT,
                transform: `translate3d(${canvasOffset.x}px, ${canvasOffset.y}px, 0) scale(${canvasScale})`,
                transformOrigin: "center center",
              }}
            >
              <div
                id="certificate-preview"
                className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-[0_35px_80px_-38px_rgba(15,23,42,0.7)]"
                style={{
                  border: `6px solid ${background.borderColor}`,
                  backgroundImage: background.backgroundImage,
                }}
              >
                <div className="pointer-events-none absolute inset-[14px] rounded-sm border-2 border-slate-200" />
                <div className="pointer-events-none absolute left-0 top-0 h-16 w-56 bg-gradient-to-br from-amber-200/40 via-amber-100/10 to-transparent" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-56 bg-gradient-to-tl from-blue-200/45 via-blue-100/10 to-transparent" />

                <BrochureOverlay
                  items={overlayItems}
                  selectedId={selectedOverlayId}
                  onSelect={setSelectedOverlayId}
                  onUpdate={updateOverlay}
                  canvasScale={canvasScale}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
