"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import Papa from "papaparse";
import { readSheet } from "read-excel-file/browser";
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
  getCertificateBodyTextForType,
  normalizeCertificateStudentRows,
  type CertificateType,
  type CertificateTemplateName,
  type CertificateEditorState,
  type CertificateTemplateInput,
} from "@/lib/domains/certificate";
import { cn } from "@/lib/ui/cn";
import { resolveLogoBackNavigation } from "@/lib/ui/logoBackNavigation";
import type { CertificateRecord, CertificateStatus, SessionUser } from "@/lib/server/types";

type CertificateStudioPageProps = {
  session: SessionUser;
  certificate: CertificateRecord;
};

type WorkflowBusyState = "idle" | "saving" | "submitting" | "approving" | "rejecting";
type LogoAsset = {
  id: string;
  name: string;
  src: string;
};

type BulkRowRecord = Record<string, unknown>;

type BulkValidationIssue = {
  row: number;
  field: string;
  message: string;
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
  const pathname = usePathname();
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

  const [canvasScale, setCanvasScale] = useState(0.9);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const [showSetupForm, setShowSetupForm] = useState(session.role === "faculty");
  const [certificateType, setCertificateType] = useState<CertificateType>(
    certificate.content.templateInput.certificateType || "workshop",
  );
  const [setupLogoSearch, setSetupLogoSearch] = useState("");
  const [selectedLogoUrls, setSelectedLogoUrls] = useState<string[]>(
    certificate.content.templateInput.logos || [],
  );

  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [elementsOpen, setElementsOpen] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(true);

  const [bulkRows, setBulkRows] = useState<BulkRowRecord[]>([]);
  const [bulkIssues, setBulkIssues] = useState<BulkValidationIssue[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgressMessage, setBulkProgressMessage] = useState<string | null>(null);
  const [previewStudentIndex, setPreviewStudentIndex] = useState<number | null>(null);

  const panStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const undoStackRef = useRef<Snapshot[]>([]);
  const redoStackRef = useRef<Snapshot[]>([]);

  const dashboardHref = resolveLogoBackNavigation(pathname || "/certificate", session.role);
  const moduleHref = session.role === "admin" ? "/admin/modules" : "/faculty/modules";

  const selectedOverlay = useMemo(() => {
    return overlayItems.find((item) => item.id === selectedOverlayId) ?? null;
  }, [overlayItems, selectedOverlayId]);

  const selectedTextOverlay = selectedOverlay?.type === "text" ? selectedOverlay : null;
  const isAdminReadOnly = session.role === "admin";

  const isWorkflowBusy = workflowBusyState !== "idle";

  const setupLogoOptions = useMemo(() => {
    const query = setupLogoSearch.trim().toLowerCase();
    if (!query) {
      return logoAssets;
    }
    return logoAssets.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [logoAssets, setupLogoSearch]);

  const normalizedBulkStudents = useMemo(
    () =>
      normalizeCertificateStudentRows(bulkRows as Array<Record<string, unknown>>, {
        eventName: templateInput.eventName,
        issueDate: templateInput.issueDate,
      }),
    [bulkRows, templateInput.eventName, templateInput.issueDate],
  );

  const previewOverlayItems = useMemo(() => {
    if (previewStudentIndex === null || normalizedBulkStudents.length === 0) {
      return overlayItems;
    }

    const student = normalizedBulkStudents[Math.min(previewStudentIndex, normalizedBulkStudents.length - 1)];
    return overlayItems.map((item) => {
      if (item.type !== "text") {
        return item;
      }

      return {
        ...item,
        text: item.text
          .replace(/\{\{\s*name\s*\}\}/gi, student.name)
          .replace(/\{\{\s*gender\s*\}\}/gi, student.gender)
          .replace(/\{\{\s*prize\s*\}\}/gi, student.prize)
          .replace(/\{\{\s*event\s*\}\}/gi, student.event)
          .replace(/\{\{\s*date\s*\}\}/gi, student.date),
      } as OverlayItem;
    });
  }, [normalizedBulkStudents, overlayItems, previewStudentIndex]);

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

  const toggleSetupLogo = useCallback((logoSrc: string) => {
    setSelectedLogoUrls((prev) => {
      if (prev.includes(logoSrc)) {
        return prev.filter((src) => src !== logoSrc);
      }
      if (prev.length >= 6) {
        return prev;
      }
      return [...prev, logoSrc];
    });
  }, []);

  const reorderSetupLogo = useCallback((index: number, direction: -1 | 1) => {
    setSelectedLogoUrls((prev) => {
      const nextIndex = index + direction;
      if (index < 0 || index >= prev.length || nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const current = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = current;
      return next;
    });
  }, []);

  const validateBulkRows = useCallback((rows: BulkRowRecord[]) => {
    const issues: BulkValidationIssue[] = [];

    rows.forEach((row, index) => {
      const name = `${row.name ?? row.studentName ?? ""}`.trim();
      const gender = `${row.gender ?? ""}`.trim();
      const prize = `${row.prize ?? ""}`.trim();

      if (!name) {
        issues.push({ row: index + 1, field: "name", message: "Name is required" });
      }

      if (gender && gender !== "Mr" && gender !== "Ms") {
        issues.push({ row: index + 1, field: "gender", message: "Gender must be Mr or Ms" });
      }

      if (prize && prize !== "1" && prize !== "2" && prize !== "3" && prize.toLowerCase() !== "null") {
        issues.push({ row: index + 1, field: "prize", message: "Prize must be 1, 2, 3, or null" });
      }
    });

    setBulkIssues(issues);
  }, []);

  const parseBulkFile = useCallback(async (file: File) => {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".json")) {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const rows = Array.isArray(parsed) ? (parsed.filter((entry) => typeof entry === "object" && entry !== null) as BulkRowRecord[]) : [];
      setBulkRows(rows);
      validateBulkRows(rows);
      return;
    }

    if (lowerName.endsWith(".csv")) {
      const raw = await file.text();
      const result = Papa.parse<BulkRowRecord>(raw, { header: true, skipEmptyLines: true });
      const rows = (result.data || []) as BulkRowRecord[];
      setBulkRows(rows);
      validateBulkRows(rows);
      return;
    }

    if (lowerName.endsWith(".xlsx")) {
      const matrix = await readSheet(file);

      if (matrix.length === 0) {
        setBulkRows([]);
        validateBulkRows([]);
        return;
      }

      const [headerRow, ...dataRows] = matrix;
      const seenHeaders = new Map<string, number>();
      const headers = headerRow.map((cell, index) => {
        const base = `${cell ?? ""}`.trim() || `column_${index + 1}`;
        const count = (seenHeaders.get(base) || 0) + 1;
        seenHeaders.set(base, count);
        return count > 1 ? `${base}_${count}` : base;
      });

      const rows = dataRows
        .filter((row) => row.some((cell) => `${cell ?? ""}`.trim() !== ""))
        .map((row) => {
          const record: BulkRowRecord = {};
          headers.forEach((header, index) => {
            const cell = row[index];
            record[header] = cell instanceof Date ? cell.toISOString().slice(0, 10) : (cell ?? "");
          });
          return record;
        });

      setBulkRows(rows);
      validateBulkRows(rows);
      return;
    }

    throw new Error("Unsupported file format. Use CSV, XLSX, or JSON.");
  }, [validateBulkRows]);

  const triggerBulkGeneration = useCallback(async () => {
    if (bulkRows.length === 0) {
      setWorkflowError("Upload certificate data before generating ZIP.");
      return;
    }

    if (bulkIssues.length > 0) {
      setWorkflowError("Fix highlighted bulk data issues before generation.");
      return;
    }

    setBulkLoading(true);
    setBulkProgressMessage("Generating certificates...");
    setWorkflowError(null);

    try {
      const response = await fetch(`/api/certificate/${certificate.id}/bulk-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf", rows: bulkRows }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Bulk generation failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-batch-${certificate.id}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setWorkflowMessage("Bulk ZIP generated successfully.");
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Bulk generation failed.");
    } finally {
      setBulkLoading(false);
      setBulkProgressMessage(null);
    }
  }, [bulkIssues.length, bulkRows, certificate.id]);

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

  const applySetupForm = useCallback(() => {
    runWithUndo(() => {
      const nextTemplateInput: CertificateTemplateInput = {
        ...templateInput,
        certificateType,
        bodyText: getCertificateBodyTextForType(certificateType),
        logos: selectedLogoUrls.slice(0, 6),
      };
      setTemplateInput(nextTemplateInput);
      setOverlayItems(createCertificateOverlayLayout(nextTemplateInput, template));
      setSelectedOverlayId(null);
    });
    setShowSetupForm(false);
  }, [certificateType, selectedLogoUrls, runWithUndo, template, templateInput]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta || isAdminReadOnly) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        undo();
        return;
      }

      if (key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAdminReadOnly, redo, undo]);

  const updateOverlay = useCallback(
    (id: string, patch: Partial<OverlayItem>) => {
      if (isAdminReadOnly) {
        return;
      }

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
    [isAdminReadOnly, runWithUndo],
  );

  const applyTemplate = useCallback(
    (nextTemplate: CertificateTemplateName) => {
      if (isAdminReadOnly) {
        return;
      }

      runWithUndo(() => {
        setTemplate(nextTemplate);
        setBackground(getTemplateBackground(nextTemplate));
        setOverlayItems(createCertificateOverlayLayout(templateInput, nextTemplate));
        setSelectedOverlayId(null);
      });
    },
    [isAdminReadOnly, runWithUndo, templateInput],
  );

  const addTextOverlay = () => {
    if (isAdminReadOnly) {
      return;
    }

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
    if (isAdminReadOnly) {
      return;
    }

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

  const removeSelectedOverlay = () => {
    if (isAdminReadOnly) {
      return;
    }

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

  const showEditorSidebar = !isAdminReadOnly;

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_12%,#e0edff_0%,#f8fbff_46%,#edf4fb_100%)] text-slate-900">
      <header className={cn(
        "flex h-20 items-center border-b border-white/70 bg-white/60 px-6 backdrop-blur-xl md:px-8",
        isAdminReadOnly ? "justify-center" : "justify-between",
      )}>
        {!isAdminReadOnly ? (
          <>
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
                disabled={isWorkflowBusy || isAdminReadOnly}
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
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
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
          </div>
        )}
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

      <div className={cn("grid h-[calc(100vh-80px)] grid-cols-1", showEditorSidebar && "xl:grid-cols-[320px_1fr]")}>
        {showEditorSidebar && <aside className="border-r border-white/70 bg-white/50 p-4 backdrop-blur-xl xl:overflow-y-auto">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Certificate Setup</p>
            <p className="mt-2 text-xs text-slate-600">
              Type: <span className="font-semibold capitalize">{certificateType}</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Logos selected: <span className="font-semibold">{selectedLogoUrls.length}</span>
            </p>
            <button
              type="button"
              onClick={() => setShowSetupForm(true)}
              disabled={isAdminReadOnly}
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 disabled:opacity-60"
            >
              Configure Form
            </button>
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
                  disabled={isAdminReadOnly}
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
                    disabled={isAdminReadOnly}
                    className="hidden"
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      await addImageOverlayFromFile(input.files);
                      input.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </section>

          {session.role === "faculty" && (
            <section className="mt-4 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setBulkOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Bulk Certificates</h2>
                {bulkOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>

              {bulkOpen && (
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Upload CSV, XLSX, or JSON</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.json"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        try {
                          await parseBulkFile(file);
                          setWorkflowMessage("Bulk data imported successfully.");
                          setWorkflowError(null);
                        } catch (error) {
                          setWorkflowError(error instanceof Error ? error.message : "Failed to parse upload.");
                        } finally {
                          input.value = "";
                        }
                      }}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Expected format: s.no, name, year, gender, prize</p>
                  </label>

                  {bulkRows.length > 0 && (
                    <div className="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-2 py-1 text-left">s.no</th>
                            <th className="px-2 py-1 text-left">name</th>
                            <th className="px-2 py-1 text-left">gender</th>
                            <th className="px-2 py-1 text-left">prize</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.slice(0, 10).map((row, index) => (
                            <tr key={`row-${index}`} className="border-t border-slate-100">
                              <td className="px-2 py-1">{`${row["s.no"] ?? row.sno ?? index + 1}`}</td>
                              <td className="px-2 py-1">{`${row.name ?? ""}`}</td>
                              <td className="px-2 py-1">{`${row.gender ?? ""}`}</td>
                              <td className="px-2 py-1">{`${row.prize ?? ""}`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {bulkIssues.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-[11px] text-rose-700">
                      {bulkIssues.slice(0, 4).map((issue, index) => (
                        <p key={`issue-${index}`}>Row {issue.row}: {issue.field} - {issue.message}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewStudentIndex(0)}
                      disabled={normalizedBulkStudents.length === 0}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      Preview First Certificate
                    </button>
                    <button
                      type="button"
                      onClick={triggerBulkGeneration}
                      disabled={bulkLoading || normalizedBulkStudents.length === 0}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      Generate All Certificates
                    </button>
                    <button
                      type="button"
                      onClick={triggerBulkGeneration}
                      disabled={bulkLoading || normalizedBulkStudents.length === 0}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      Download ZIP
                    </button>
                  </div>

                  {bulkProgressMessage && <p className="text-xs text-slate-600">{bulkProgressMessage}</p>}
                </div>
              )}
            </section>
          )}
        </aside>}

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
          {showSetupForm && session.role === "faculty" && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
              <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Initial Form</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Certificate Configuration</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSetupForm(false)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-slate-700">Certificate Type</span>
                    <select
                      value={certificateType}
                      onChange={(event) => setCertificateType(event.target.value as CertificateType)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="symposium">Symposium</option>
                      <option value="custom">Custom</option>
                    </select>
                    <p className="text-xs text-slate-500">Sentence structure auto-updates internally.</p>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-slate-700">Upload Logo(s)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                      multiple
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const files = input.files;
                        if (!files || files.length === 0) return;
                        const urls = await Promise.all(
                          Array.from(files)
                            .slice(0, 6)
                            .map(
                              (file) =>
                                new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.onload = () => resolve(String(reader.result || ""));
                                  reader.onerror = () => reject(reader.error);
                                  reader.readAsDataURL(file);
                                }),
                            ),
                        );
                        setSelectedLogoUrls((prev) => [...prev, ...urls].slice(0, 6));
                        input.value = "";
                      }}
                    />
                  </label>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <input
                    value={setupLogoSearch}
                    onChange={(event) => setSetupLogoSearch(event.target.value)}
                    placeholder="Search logos"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <div className="mt-2 grid max-h-36 grid-cols-3 gap-2 overflow-y-auto">
                    {setupLogoOptions.map((logo) => {
                      const selected = selectedLogoUrls.includes(logo.src);
                      return (
                        <button
                          key={logo.id}
                          type="button"
                          onClick={() => toggleSetupLogo(logo.src)}
                          className={cn(
                            "rounded-lg border p-1",
                            selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white",
                          )}
                        >
                          <div className="relative h-10 w-full overflow-hidden rounded border border-slate-100 bg-white">
                            <Image src={logo.src} alt={logo.name} fill className="object-contain p-1" unoptimized />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedLogoUrls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedLogoUrls.map((src, index) => (
                        <div key={`${src}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2">
                          <div className="relative h-8 w-14 overflow-hidden rounded border border-slate-100 bg-slate-50">
                            <Image src={src} alt={`Selected logo ${index + 1}`} fill className="object-contain p-1" unoptimized />
                          </div>
                          <p className="flex-1 text-xs text-slate-600">Top row logo {index + 1}</p>
                          <button type="button" onClick={() => reorderSetupLogo(index, -1)} className="rounded border border-slate-200 px-2 py-1 text-xs">Up</button>
                          <button type="button" onClick={() => reorderSetupLogo(index, 1)} className="rounded border border-slate-200 px-2 py-1 text-xs">Down</button>
                          <button type="button" onClick={() => setSelectedLogoUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index))} className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowSetupForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                  <button type="button" onClick={applySetupForm} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Apply Setup</button>
                </div>
              </div>
            </div>
          )}

          {!isAdminReadOnly && <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-[24px] border border-white/75 bg-white/75 px-4 py-3 shadow-[0_24px_45px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
              <button
                type="button"
                onClick={undo}
                disabled={isAdminReadOnly}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md disabled:opacity-60"
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={isAdminReadOnly}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:shadow-md disabled:opacity-60"
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={removeSelectedOverlay}
                disabled={!selectedOverlayId || isAdminReadOnly}
                className="rounded-full border border-rose-300 bg-rose-50 p-2 text-rose-700 transition hover:shadow-md disabled:opacity-60"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <select
                value={selectedTextOverlay?.fontFamily || FONT_OPTIONS[0].value}
                onChange={(event) => applyTextStyle({ fontFamily: normalizeFontFamilyValue(event.target.value) })}
                disabled={!selectedTextOverlay || isAdminReadOnly}
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
                disabled={!selectedTextOverlay || isAdminReadOnly}
                className="w-16 rounded-full border border-slate-200 bg-white px-2 py-2 text-xs"
              />

              <button
                type="button"
                onClick={() => applyTextStyle({ fontWeight: (selectedTextOverlay?.fontWeight ?? 500) >= 700 ? 500 : 700 })}
                disabled={!selectedTextOverlay || isAdminReadOnly}
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
                disabled={!selectedTextOverlay || isAdminReadOnly}
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
                disabled={!selectedTextOverlay || isAdminReadOnly}
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
                  disabled={!selectedTextOverlay || isAdminReadOnly}
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
                  disabled={!selectedTextOverlay || isAdminReadOnly}
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
                  disabled={!selectedTextOverlay || isAdminReadOnly}
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
                disabled={!selectedTextOverlay || isAdminReadOnly}
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
          </div>}

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
                  items={previewOverlayItems}
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
