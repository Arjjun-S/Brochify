"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import PageOne from "@/components/studio/canvas/PageOne";
import PageTwo from "@/components/studio/canvas/PageTwo";
import PosterPage from "@/components/studio/canvas/PosterPage";
import GuidedFlowPanel from "@/components/studio/editor/GuidedFlowPanel";
import CanvasSidebar from "@/components/studio/editor/CanvasSidebar";
import LoadingOverlay from "@/components/shared/feedback/LoadingOverlay";
import DevLogs from "@/components/studio/editor/DevLogs";
import { cn } from "@/lib/ui/cn";
import { resolveLogoBackNavigation } from "@/lib/ui/logoBackNavigation";
import {
  Activity,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Circle,
  Download,
  Redo2,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  ChevronRight,
} from "lucide-react";
import {
  BRAND_ASSET_STORAGE_KEY,
  BrandAsset,
  BrochureData,
  createAssetIdentity,
  createEmptyBrochureData,
  createImageOverlay,
  createShapeOverlay,
  createTextOverlay,
  FONT_OPTIONS,
  FONT_PRELOAD_STYLESHEET_HREF,
  getFontStylesheetHref,
  normalizeBrochureData,
  normalizeFontFamilyValue,
  OverlayItem,
  parseTagInput,
  SegmentPosition,
  setValueAtPath,
  TextOverlayItem,
} from "@/lib/domains/brochure";
import { generateBrochureData } from "@/lib/services/ai/openrouterClient";
import { LoadingTask } from "@/lib/system/loading/loadingTaskManager";
import { LIMITS } from "@/lib/system/content/limits";
import type { BrochureTemplate } from "@/components/studio/editor/CanvasSidebar";
import type { BrochureRecord, BrochureStatus, SessionUser } from "@/lib/server/types";
import { SelectBox } from "@/components/ui/SelectBox";
import { Logo } from "@/components/ui/Logo";

const getPageDimensions = (t: BrochureTemplate) => t === "posterFlyer" ? { width: 794, height: 1123, count: 1 } : { width: 983, height: 680, count: 2 };
const PAGE_GAP = 24;
const PAGE_TYPING_TARGET_MS = 5000;
const COLUMN_TYPING_TARGET_MS = Math.round(PAGE_TYPING_TARGET_MS / 3);

const NON_TEXT_SEGMENT_IDS = new Set(["p1-image", "p1-logos", "p1-qr-code", "p1-qr-link"]);
const loadedFontStylesheetHrefs = new Set<string>();

function ensureFontStylesheet(href: string): void {
  if (!href || typeof document === "undefined") {
    return;
  }

  if (loadedFontStylesheetHrefs.has(href)) {
    return;
  }

  const existing = document.querySelector(`link[data-font-href="${href}"]`) as HTMLLinkElement | null;
  if (existing) {
    loadedFontStylesheetHrefs.add(href);
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.fontHref = href;
  document.head.appendChild(link);
  loadedFontStylesheetHrefs.add(href);
}

function ensureFontFamilyLoaded(fontFamily: string): void {
  const href = getFontStylesheetHref(fontFamily);
  if (!href) {
    return;
  }

  ensureFontStylesheet(href);
}

const builtinLogos: Array<{ id: string; name: string; src: string }> = [
  { id: "ieeetems", name: "IEEE (TEMS)", src: "/logos/ieeetems.png" },
  { id: "ctech", name: "CTECH", src: "/logos/ctech.jpeg" },
  { id: "ieee", name: "IEEE", src: "/logos/ieee.png" },
  { id: "srm", name: "SRM", src: "/logos/srm.svg" },
  { id: "iicm", name: "Institute of Innovation Council", src: "/logos/iicm.png" },
  { id: "soct", name: "School of Computing", src: "/logos/soct.jpeg" },
];

type Palette = {
  primary: string;
  secondary: string;
  primaryText: string;
  surface: string;
  surfaceBorder: string;
  strongSurface?: string;
  accent: string;
  mutedText: string;
};

const TEMPLATE_THEMES: Record<BrochureTemplate, { pageStyle: CSSProperties; palette: Palette }> = {
  whiteBlue: {
    pageStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 18%, rgba(128, 220, 242, 0.16) 0, transparent 36%), radial-gradient(circle at 82% 12%, rgba(11, 77, 162, 0.18) 0, transparent 42%), linear-gradient(180deg, #ffffff 0%, #eef4ff 100%)",
    },
    palette: {
      primary: "#0b4da2",
      secondary: "#5fa8ff",
      primaryText: "#ffffff",
      surface: "#f9fbff",
      surfaceBorder: "#d9e3f5",
      strongSurface: "#0f59b8",
      accent: "#facc15",
      mutedText: "#64748b",
    },
  },
  beigeDust: {
    pageStyle: {
      backgroundImage:
        "radial-gradient(rgba(120, 94, 60, 0.14) 1px, transparent 1.2px), linear-gradient(180deg, #fdf6ea 0%, #f5e9d7 100%)",
      backgroundSize: "18px 18px, 100% 100%",
      backgroundColor: "#f5e9d7",
    },
    palette: {
      primary: "#c29d6d",
      secondary: "#e6c89c",
      primaryText: "#2d1f12",
      surface: "#f9f2e6",
      strongSurface: "#e8dcc5",
      surfaceBorder: "#e6d6c2",
      accent: "#8a5a1f",
      mutedText: "#5c4a38",
    },
  },
  softBlue: {
    pageStyle: {
      backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f4f9ff 100%)",
      backgroundColor: "#f4f9ff",
    },
    palette: {
      primary: "#1e3a8a",
      secondary: "#93c5fd",
      primaryText: "#0f172a",
      surface: "#ffffff",
      strongSurface: "#eef5ff",
      surfaceBorder: "#dbeafe",
      accent: "#0f172a",
      mutedText: "#1f2937",
    },
  },
  tealGloss: {
    pageStyle: {
      backgroundImage:
        "radial-gradient(circle at 20% 16%, rgba(74, 164, 154, 0.16) 0, transparent 34%), radial-gradient(circle at 84% 14%, rgba(167, 224, 216, 0.2) 0, transparent 42%), linear-gradient(180deg, #ffffff 0%, #f2fcfb 100%)",
      backgroundColor: "#ffffff",
    },
    palette: {
      primary: "#2b8a82",
      secondary: "#a8ddd7",
      primaryText: "#ffffff",
      surface: "#ffffff",
      strongSurface: "#329890",
      surfaceBorder: "#d7efeb",
      accent: "#1f6f69",
      mutedText: "#4d706c",
    },
  },
  yellowDust: {
    pageStyle: {
      backgroundImage:
        "radial-gradient(circle at 24% 18%, rgba(244, 214, 102, 0.2) 0, transparent 36%), radial-gradient(circle at 82% 14%, rgba(252, 235, 150, 0.26) 0, transparent 40%), linear-gradient(180deg, #ffffff 0%, #fffcec 100%)",
      backgroundColor: "#ffffff",
    },
    palette: {
      primary: "#d4b423",
      secondary: "#f8e78f",
      primaryText: "#1f2937",
      surface: "#ffffff",
      strongSurface: "#fdf2b8",
      surfaceBorder: "#f1e2a1",
      accent: "#8a6a0f",
      mutedText: "#5f5640",
    },
  },
  posterFlyer: {
    pageStyle: {
      backgroundImage: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)",
      backgroundColor: "#1e1b4b",
    },
    palette: {
      primary: "#4f46e5",
      secondary: "#818cf8",
      primaryText: "#ffffff",
      surface: "#1e1b4b",
      strongSurface: "#312e81",
      surfaceBorder: "#4338ca",
      accent: "#facc15",
      mutedText: "#94a3b8",
    },
  },
};

type EditorSnapshot = {
  brochureData: BrochureData;
  selectedLogos: string[];
  segmentPositions: Record<string, SegmentPosition>;
  overlayItems: OverlayItem[];
  template: BrochureTemplate;
  hiddenSegments: string[];
  formLineStyles: Record<string, FormLineStyle>;
};

type SelectedCanvasElement =
  | { kind: "overlay"; id: string; page: 1 | 2 }
  | { kind: "segment"; id: string; page: 1 | 2 }
  | null;

type CanvasTextStylePatch = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  align?: TextOverlayItem["align"];
  fontWeight?: number;
};

type FormLineStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  align?: TextOverlayItem["align"];
};

const DEFAULT_FORM_LINE_STYLES: Record<string, FormLineStyle> = {
  "registration.notes": { fontSize: 13 },
};

type BrochureStudioPageProps = {
  brochure: BrochureRecord;
  session: SessionUser;
  autoAnimate?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createDefaultSnapshot(): EditorSnapshot {
  return {
    brochureData: createEmptyBrochureData(),
    selectedLogos: ["srm", "ieee", "ctech"],
    segmentPositions: {},
    overlayItems: [],
    template: "whiteBlue",
    hiddenSegments: [],
    formLineStyles: { ...DEFAULT_FORM_LINE_STYLES },
  };
}

function normalizeSnapshotFromContent(content: BrochureRecord["content"]): EditorSnapshot {
  const fallback = createDefaultSnapshot();
  if (!content) {
    return fallback;
  }

  const template =
    typeof content.template === "string" && content.template in TEMPLATE_THEMES ? content.template : fallback.template;

  const segmentPositions = isRecord(content.segmentPositions)
    ? (content.segmentPositions as Record<string, SegmentPosition>)
    : fallback.segmentPositions;

  const overlayItems = Array.isArray(content.overlayItems)
    ? (content.overlayItems as OverlayItem[]).map((item) => {
        if (item.type !== "text") {
          return item;
        }

        return {
          ...item,
          fontFamily: normalizeFontFamilyValue(item.fontFamily),
        };
      })
    : fallback.overlayItems;

  const selectedLogos = Array.isArray(content.selectedLogos)
    ? content.selectedLogos.filter((item): item is string => typeof item === "string")
    : fallback.selectedLogos;

  const hiddenSegments = Array.isArray(content.hiddenSegments)
    ? content.hiddenSegments.filter((item): item is string => typeof item === "string")
    : fallback.hiddenSegments;

  const formLineStyles = isRecord(content.formLineStyles)
    ? Object.entries(content.formLineStyles).reduce<Record<string, FormLineStyle>>((acc, [key, value]) => {
        if (!isRecord(value)) {
          return acc;
        }

        acc[key] = {
          ...(typeof value.fontFamily === "string" ? { fontFamily: normalizeFontFamilyValue(value.fontFamily) } : {}),
          ...(typeof value.fontSize === "number" ? { fontSize: value.fontSize } : {}),
          ...(typeof value.color === "string" ? { color: value.color } : {}),
          ...(value.align === "left" || value.align === "center" || value.align === "right" || value.align === "justify"
            ? { align: value.align }
            : {}),
        };

        return acc;
      }, { ...DEFAULT_FORM_LINE_STYLES })
    : fallback.formLineStyles;

  return {
    brochureData: normalizeBrochureData(content.brochureData as unknown as Record<string, unknown>),
    selectedLogos: selectedLogos.length > 0 ? selectedLogos : fallback.selectedLogos,
    segmentPositions,
    overlayItems,
    template,
    hiddenSegments,
    formLineStyles,
  };
}

type SelectedTextTarget =
  | {
      kind: "overlay";
      id: string;
      fontFamily: string;
      fontSize: number;
      color: string;
      align: TextOverlayItem["align"];
      fontWeight: number;
    }
  | {
      kind: "form-line";
      key: string;
      fontFamily: string;
      fontSize: number;
      color: string;
      align: TextOverlayItem["align"];
    };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type EnhanceSectionTarget = {
  key: "aboutCollege" | "aboutSchool" | "aboutDepartment" | "aboutFdp";
  label: string;
  minWords: number;
  maxWords: number;
};

const ENHANCE_SECTION_TARGETS: EnhanceSectionTarget[] = [
  { key: "aboutCollege", label: "aboutCollege", minWords: 85, maxWords: LIMITS.aboutCollege },
  { key: "aboutSchool", label: "aboutSchool", minWords: 55, maxWords: LIMITS.aboutSchool },
  { key: "aboutDepartment", label: "aboutDepartment", minWords: 70, maxWords: LIMITS.aboutDepartment },
  { key: "aboutFdp", label: "aboutFdp", minWords: 55, maxWords: LIMITS.aboutFDP },
];

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0).length;
}

function getUnderfilledSections(data: BrochureData): EnhanceSectionTarget[] {
  return ENHANCE_SECTION_TARGETS.filter((target) => countWords(data[target.key] ?? "") < target.minWords);
}

function buildEnhancePrompt(data: BrochureData): string {
  const sectionLimits = ENHANCE_SECTION_TARGETS.map(
    (target) => `- ${target.label}: ${target.minWords}-${target.maxWords} words`,
  ).join("\n");

  const currentSectionCounts = ENHANCE_SECTION_TARGETS.map(
    (target) => `- ${target.label}: currently ${countWords(data[target.key] ?? "")} words`,
  ).join("\n");

  return [
    "Enhance the following brochure JSON while preserving factual fields and schema structure.",
    "Improve clarity, professionalism, and academic tone.",
    "Expand underfilled body sections to meet these layout word ranges:",
    sectionLimits,
    "Do not exceed the max words for each section and keep arrays/keys intact.",
    "Return only JSON matching the same schema.",
    "",
    "Current section counts:",
    currentSectionCounts,
    "",
    JSON.stringify(data, null, 2),
  ].join("\n");
}

function buildLengthRefinementPrompt(data: BrochureData, underfilledSections: EnhanceSectionTarget[]): string {
  const sections = underfilledSections
    .map(
      (target) =>
        `- ${target.label}: currently ${countWords(data[target.key] ?? "")} words; rewrite to ${target.minWords}-${target.maxWords} words`,
    )
    .join("\n");

  return [
    "Refine only the underfilled sections below and keep all other values unchanged.",
    "Preserve factual details and JSON schema keys exactly.",
    "Underfilled sections to expand:",
    sections,
    "Return only JSON.",
    "",
    JSON.stringify(data, null, 2),
  ].join("\n");
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getValueFromPath(source: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let cursor: unknown = source;

  for (const key of keys) {
    if (cursor == null) return undefined;

    if (Array.isArray(cursor)) {
      const index = Number(key);
      if (!Number.isInteger(index)) return undefined;
      cursor = cursor[index];
      continue;
    }

    if (typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }

  return cursor;
}

function createTypingSeedData(data: BrochureData): BrochureData {
  const visit = (value: unknown): unknown => {
    if (typeof value === "string") return "";
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      const next: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        next[key] = visit(nested);
      }
      return next;
    }
    return value;
  };

  return visit(structuredClone(data)) as BrochureData;
}

type TypingStage = {
  page: 1 | 2;
  column: 1 | 2 | 3;
  durationMs: number;
  paths: string[];
};

function uniquePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  return paths.filter((path) => {
    if (!path || seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

function buildTypingPlan(data: BrochureData): TypingStage[] {
  const pageOneColumnOne: string[] = [
    "headings.chiefPatrons",
    "headings.patrons",
    "headings.convener",
    "headings.coConvener",
    "headings.advisoryCommittee",
    "headings.organizingCommittee",
  ];

  for (let index = 0; index < data.committee.length; index += 1) {
    pageOneColumnOne.push(`committee.${index}.name`);
    pageOneColumnOne.push(`committee.${index}.role`);
  }

  const pageOneColumnTwo: string[] = [
    "headings.registrationDetail",
    "headings.registrationFee",
    "templateText.p1_ieeeMemberLabel",
    "registration.ieeePrice",
    "templateText.p1_nonIeeeMemberLabel",
    "registration.nonIeeePrice",
    "templateText.p1_refundableNote",
    "headings.registrationNote",
  ];

  for (let index = 0; index < data.registration.notes.length; index += 1) {
    pageOneColumnTwo.push(`registration.notes.${index}`);
  }

  pageOneColumnTwo.push(
    "googleForm",
    "headings.accountDetail",
    "templateText.p1_bankNameLabel",
    "accountDetails.bankName",
    "templateText.p1_accountNoLabel",
    "accountDetails.accountNo",
    "templateText.p1_accountNameLabel",
    "accountDetails.accountName",
    "templateText.p1_ifscLabel",
    "accountDetails.ifscCode",
    "templateText.p1_contactLabel",
    "contact.name",
    "contact.mobile",
  );

  const pageOneColumnThree: string[] = [
    "headings.sponsoredBy",
    "eventTitle",
    "dates",
    "headings.organizedBy",
    "department",
    "templateText.p1_institutionName",
  ];

  const pageTwoColumnOne: string[] = [
    "headings.aboutCollege",
    "aboutCollege",
    "headings.aboutSchool",
    "aboutSchool",
  ];

  const pageTwoColumnTwo: string[] = [
    "headings.aboutDepartment",
    "aboutDepartment",
    "headings.aboutFdp",
    "aboutFdp",
    "headings.programHighlights",
    "programHighlightsText",
  ];

  const pageTwoColumnThree: string[] = [
    "headings.topics",
    "templateText.p2_tableDateLabel",
    "templateText.p2_tableSessionLabel",
  ];

  for (let index = 0; index < data.topics.length; index += 1) {
    pageTwoColumnThree.push(`topics.${index}.date`);
    pageTwoColumnThree.push(`topics.${index}.afternoon`);
  }

  pageTwoColumnThree.push("headings.speakers");
  for (let index = 0; index < data.speakers.length; index += 1) {
    pageTwoColumnThree.push(`speakers.${index}.name`);
    pageTwoColumnThree.push(`speakers.${index}.role`);
    pageTwoColumnThree.push(`speakers.${index}.org`);
  }

  return [
    { page: 1, column: 1, durationMs: COLUMN_TYPING_TARGET_MS, paths: uniquePaths(pageOneColumnOne) },
    { page: 1, column: 2, durationMs: COLUMN_TYPING_TARGET_MS, paths: uniquePaths(pageOneColumnTwo) },
    { page: 1, column: 3, durationMs: COLUMN_TYPING_TARGET_MS, paths: uniquePaths(pageOneColumnThree) },
    { page: 2, column: 1, durationMs: COLUMN_TYPING_TARGET_MS, paths: uniquePaths(pageTwoColumnOne) },
    { page: 2, column: 2, durationMs: COLUMN_TYPING_TARGET_MS, paths: uniquePaths(pageTwoColumnTwo) },
    { page: 2, column: 3, durationMs: COLUMN_TYPING_TARGET_MS, paths: uniquePaths(pageTwoColumnThree) },
  ];
}

export default function BrochureStudioPage({ brochure, session, autoAnimate = false }: BrochureStudioPageProps) {
  const pathname = usePathname();
  const initialSnapshot = useMemo(() => normalizeSnapshotFromContent(brochure.content), [brochure.content]);

  const [brochureData, setBrochureData] = useState<BrochureData>(() => initialSnapshot.brochureData);
  const [selectedLogos, setSelectedLogos] = useState<string[]>(() => initialSnapshot.selectedLogos);
  const [loadingTask, setLoadingTask] = useState<LoadingTask>("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showDevLogs, setShowDevLogs] = useState(false);
  const [segmentPositions, setSegmentPositions] = useState<Record<string, SegmentPosition>>(() => initialSnapshot.segmentPositions);
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>(() => initialSnapshot.overlayItems);
  const [selectedElement, setSelectedElement] = useState<SelectedCanvasElement>(null);
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [previewScale, setPreviewScale] = useState(1); // auto scale from viewport
  const [zoomFactor, setZoomFactor] = useState(0.9); // user-controlled multiplier (start at 90%)
  const [projectReady, setProjectReady] = useState(true);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [template, setTemplate] = useState<BrochureTemplate>(() => initialSnapshot.template);
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hiddenSegments, setHiddenSegments] = useState<string[]>(() => initialSnapshot.hiddenSegments);
  const [formLineStyles, setFormLineStyles] = useState<Record<string, FormLineStyle>>(() => initialSnapshot.formLineStyles);
  const [selectedFormLineKey, setSelectedFormLineKey] = useState<string | null>(null);
  const [editingFormLineKey, setEditingFormLineKey] = useState<string | null>(null);
  const [typingBrochureData, setTypingBrochureData] = useState<BrochureData | null>(null);
  const [animationPhase, setAnimationPhase] = useState<"idle" | "preview" | "typing">("idle");
  const [activeTypingPath, setActiveTypingPath] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<BrochureStatus>(brochure.status);
  const [rejectionReason, setRejectionReason] = useState<string | null>(brochure.rejectionReason);
  const [workflowBusyState, setWorkflowBusyState] = useState<"idle" | "saving" | "submitting" | "approving" | "rejecting">("idle");
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const pageOneRef = useRef<HTMLDivElement | null>(null);
  const pageTwoRef = useRef<HTMLDivElement | null>(null);
  const historyIndexRef = useRef(-1);
  const latestRef = useRef<EditorSnapshot | null>(null);
  const currentStateRef = useRef<EditorSnapshot>({
    brochureData,
    selectedLogos,
    segmentPositions,
    overlayItems,
    template,
    hiddenSegments,
    formLineStyles,
  });
  const historyInteractionRef = useRef<{ active: boolean; changed: boolean }>({ active: false, changed: false });
  const historyInitializedRef = useRef(false);
  const typingRunRef = useRef(0);
  const autoAnimateRef = useRef(false);
  const animationPhaseRef = useRef<"idle" | "preview" | "typing">(animationPhase);

  const isLoading = loadingTask !== "idle";
  const isTypingAnimationActive = animationPhase === "typing";
  const isWorkflowBusy = workflowBusyState !== "idle";
  const dashboardHref = resolveLogoBackNavigation(pathname || "/studio", session.role);
  const canvasBrochureData = typingBrochureData ?? brochureData;

  const stopTypingAnimation = useCallback(() => {
    typingRunRef.current += 1;
    setAnimationPhase("idle");
    setTypingBrochureData(null);
    setActiveTypingPath(null);
  }, []);

  useEffect(() => {
    animationPhaseRef.current = animationPhase;
  }, [animationPhase]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(BRAND_ASSET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as BrandAsset[];
      if (Array.isArray(parsed)) {
        setAssets(parsed);
      }
    } catch {
      setAssets([]);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(BRAND_ASSET_STORAGE_KEY, JSON.stringify(assets));
  }, [assets, mounted]);

  useEffect(() => {
    const node = previewViewportRef.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width: pageWidth } = getPageDimensions(template);
      const nextScale = Math.min(1.1, Math.max(0.7, (entry.contentRect.width - 24) / pageWidth));
      setPreviewScale(nextScale);
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [template]);

  const normalizeSnapshot = useCallback((snapshot?: Partial<EditorSnapshot> | null): EditorSnapshot | null => {
    if (!snapshot || !snapshot.brochureData) {
      return null;
    }

    const fallback = latestRef.current ?? currentStateRef.current;
    return {
      brochureData: snapshot.brochureData,
      selectedLogos: Array.isArray(snapshot.selectedLogos) ? snapshot.selectedLogos : fallback.selectedLogos,
      segmentPositions:
        snapshot.segmentPositions && typeof snapshot.segmentPositions === "object"
          ? snapshot.segmentPositions
          : fallback.segmentPositions,
      overlayItems: Array.isArray(snapshot.overlayItems) ? snapshot.overlayItems : fallback.overlayItems,
      template: snapshot.template ?? fallback.template,
      hiddenSegments: Array.isArray(snapshot.hiddenSegments) ? snapshot.hiddenSegments : fallback.hiddenSegments,
      formLineStyles:
        snapshot.formLineStyles && typeof snapshot.formLineStyles === "object"
          ? snapshot.formLineStyles
          : fallback.formLineStyles,
    };
  }, []);

  useEffect(() => {
    const current: EditorSnapshot = {
      brochureData,
      selectedLogos,
      segmentPositions,
      overlayItems,
      template,
      hiddenSegments,
      formLineStyles,
    };

    currentStateRef.current = current;
    latestRef.current = current;

    if (!historyInitializedRef.current) {
      setHistory([current]);
      setHistoryIndex(0);
      historyIndexRef.current = 0;
      historyInitializedRef.current = true;
    }
  }, [brochureData, selectedLogos, segmentPositions, overlayItems, template, hiddenSegments, formLineStyles]);

  const pushHistorySnapshot = useCallback(
    (snapshot: Partial<EditorSnapshot> | null | undefined) => {
      const validSnapshot = normalizeSnapshot(snapshot);
      if (!validSnapshot) return;

      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndexRef.current + 1);
        const next = [...truncated, validSnapshot];
        historyIndexRef.current = next.length - 1;
        setHistoryIndex(historyIndexRef.current);
        return next;
      });
      latestRef.current = validSnapshot;
    },
    [normalizeSnapshot],
  );

  const pushWith = useCallback(
    (partial: Partial<EditorSnapshot>) => {
      const base = latestRef.current ?? currentStateRef.current;
      pushHistorySnapshot({ ...base, ...partial });
    },
    [pushHistorySnapshot],
  );

  const beginCanvasInteraction = useCallback(() => {
    if (!historyInteractionRef.current.active) {
      historyInteractionRef.current.active = true;
      historyInteractionRef.current.changed = false;
    }
  }, []);

  const endCanvasInteraction = useCallback(() => {
    if (!historyInteractionRef.current.active) return;

    const shouldPushHistory = historyInteractionRef.current.changed;
    historyInteractionRef.current.active = false;
    historyInteractionRef.current.changed = false;

    if (!shouldPushHistory) return;

    window.requestAnimationFrame(() => {
      pushWith({});
    });
  }, [pushWith]);

  const applySnapshot = useCallback(
    (snapshot: EditorSnapshot | null | undefined) => {
      const validSnapshot = normalizeSnapshot(snapshot);
      if (!validSnapshot) {
        return;
      }

      latestRef.current = validSnapshot;
      setBrochureData(validSnapshot.brochureData);
      setSelectedLogos(validSnapshot.selectedLogos);
      setSegmentPositions(validSnapshot.segmentPositions);
      setOverlayItems(validSnapshot.overlayItems);
      setTemplate(validSnapshot.template);
      setHiddenSegments(validSnapshot.hiddenSegments ?? []);
      setFormLineStyles(validSnapshot.formLineStyles ?? {});
    },
    [normalizeSnapshot],
  );

  const undo = useCallback(() => {
    if (animationPhaseRef.current !== "idle") {
      stopTypingAnimation();
    }

    if (historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    const snapshot = history[nextIndex];
    if (!snapshot?.brochureData) return;

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    applySnapshot(snapshot);
    setSelectedElement(null);
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  }, [applySnapshot, history, stopTypingAnimation]);

  const redo = useCallback(() => {
    if (animationPhaseRef.current !== "idle") {
      stopTypingAnimation();
    }

    if (historyIndexRef.current >= history.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    const snapshot = history[nextIndex];
    if (!snapshot?.brochureData) return;

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    applySnapshot(snapshot);
    setSelectedElement(null);
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  }, [applySnapshot, history, stopTypingAnimation]);

  useEffect(() => {
    const handleHistoryHotkeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.closest("[contenteditable='true']") !== null ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (isTypingTarget) return;

      const isMetaCommand = event.metaKey || event.ctrlKey;
      if (!isMetaCommand || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleHistoryHotkeys);
    return () => window.removeEventListener("keydown", handleHistoryHotkeys);
  }, [undo, redo]);

  const selectedOverlayId = selectedElement?.kind === "overlay" ? selectedElement.id : null;
  const selectedSegmentId = selectedElement?.kind === "segment" ? selectedElement.id : null;

  const selectedOverlay = useMemo(
    () => overlayItems.find((item) => item.id === selectedOverlayId) ?? null,
    [overlayItems, selectedOverlayId],
  );

  const selectedTextTarget = useMemo<SelectedTextTarget | null>(() => {
    if (selectedOverlay?.type === "text") {
      return {
        kind: "overlay" as const,
        id: selectedOverlay.id,
        fontFamily: normalizeFontFamilyValue(selectedOverlay.fontFamily),
        fontSize: selectedOverlay.fontSize,
        color: selectedOverlay.color,
        align: selectedOverlay.align,
        fontWeight: selectedOverlay.fontWeight,
      };
    }

    if (selectedSegmentId && selectedFormLineKey && !NON_TEXT_SEGMENT_IDS.has(selectedSegmentId)) {
      const lineStyle = formLineStyles[selectedFormLineKey] ?? {};
      return {
        kind: "form-line" as const,
        key: selectedFormLineKey,
        fontFamily: normalizeFontFamilyValue(lineStyle.fontFamily),
        fontSize: lineStyle.fontSize ?? 16,
        color: lineStyle.color ?? "#0f172a",
        align: lineStyle.align ?? "left",
      };
    }

    return null;
  }, [selectedOverlay, selectedSegmentId, selectedFormLineKey, formLineStyles]);

  useEffect(() => {
    ensureFontStylesheet(FONT_PRELOAD_STYLESHEET_HREF);
  }, []);

  useEffect(() => {
    const usedFonts = new Set<string>();

    for (const item of overlayItems) {
      if (item.type === "text") {
        usedFonts.add(normalizeFontFamilyValue(item.fontFamily));
      }
    }

    for (const style of Object.values(formLineStyles)) {
      if (style.fontFamily) {
        usedFonts.add(normalizeFontFamilyValue(style.fontFamily));
      }
    }

    if (selectedTextTarget) {
      usedFonts.add(normalizeFontFamilyValue(selectedTextTarget.fontFamily));
    }

    usedFonts.forEach((fontFamily) => ensureFontFamilyLoaded(fontFamily));
  }, [overlayItems, formLineStyles, selectedTextTarget]);

  const logoOptions = useMemo(() => builtinLogos, []);

  const logoCatalog = useMemo(
    () => Object.fromEntries(logoOptions.map((logo) => [logo.id, logo.src])),
    [logoOptions],
  );

  useEffect(() => {
    if (selectedElement) {
      setActivePage(selectedElement.page);
    }
  }, [selectedElement]);

  const buildEditorStatePayload = useCallback((): EditorSnapshot => {
    return {
      brochureData,
      selectedLogos,
      segmentPositions,
      overlayItems,
      template,
      hiddenSegments,
      formLineStyles,
    };
  }, [brochureData, selectedLogos, segmentPositions, overlayItems, template, hiddenSegments, formLineStyles]);

  const saveEditorState = useCallback(
    async (snapshot: EditorSnapshot) => {
      const response = await fetch(`/api/brochure/${brochure.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: snapshot }),
      });

      const data = (await response.json()) as { brochure?: BrochureRecord; error?: string };
      if (!response.ok || !data.brochure) {
        throw new Error(data.error || "Failed to save brochure state.");
      }

      setReviewStatus(data.brochure.status);
      setRejectionReason(data.brochure.rejectionReason);
      return data.brochure;
    },
    [brochure.id],
  );

  const handleSaveDraft = async () => {
    const snapshot = buildEditorStatePayload();
    setWorkflowBusyState("saving");
    setWorkflowError(null);
    setWorkflowMessage(null);

    try {
      await saveEditorState(snapshot);
      setWorkflowMessage("Latest editor state saved.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save brochure state.";
      setWorkflowError(message);
    } finally {
      setWorkflowBusyState("idle");
    }
  };

  const handleSubmitForReview = async () => {
    const snapshot = buildEditorStatePayload();
    setWorkflowBusyState("submitting");
    setWorkflowError(null);
    setWorkflowMessage(null);

    try {
      // Requirement: always persist the latest canvas state before submit.
      await saveEditorState(snapshot);

      const response = await fetch(`/api/brochure/${brochure.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: snapshot }),
      });

      const data = (await response.json()) as { brochure?: BrochureRecord; error?: string };
      if (!response.ok || !data.brochure) {
        throw new Error(data.error || "Failed to submit brochure for review.");
      }

      setReviewStatus(data.brochure.status);
      setRejectionReason(data.brochure.rejectionReason);
      setWorkflowMessage("Brochure submitted for admin review.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to submit brochure for review.";
      setWorkflowError(message);
    } finally {
      setWorkflowBusyState("idle");
    }
  };

  const handleAdminDecision = async (decision: "approved" | "rejected") => {
    const rejectionReasonValue =
      decision === "rejected"
        ? window.prompt("Enter rejection reason")?.trim() || ""
        : "";

    if (decision === "rejected" && !rejectionReasonValue) {
      setWorkflowError("Rejection reason is required.");
      return;
    }

    const snapshot = buildEditorStatePayload();
    setWorkflowBusyState(decision === "approved" ? "approving" : "rejecting");
    setWorkflowError(null);
    setWorkflowMessage(null);

    try {
      await saveEditorState(snapshot);

      const endpoint = decision === "approved"
        ? `/api/brochure/${brochure.id}/approve`
        : `/api/brochure/${brochure.id}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: snapshot,
          rejectionReason: decision === "rejected" ? rejectionReasonValue : null,
        }),
      });

      const data = (await response.json()) as { brochure?: BrochureRecord; error?: string };
      if (!response.ok || !data.brochure) {
        throw new Error(data.error || "Failed to update review decision.");
      }

      setReviewStatus(data.brochure.status);
      setRejectionReason(data.brochure.rejectionReason);
      setWorkflowMessage(decision === "approved" ? "Brochure approved." : "Brochure rejected.");
    } catch (decisionError) {
      const message = decisionError instanceof Error ? decisionError.message : "Failed to update review decision.";
      setWorkflowError(message);
    } finally {
      setWorkflowBusyState("idle");
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("brochure-preview");
    if (!element) {
      return;
    }

    setLoadingTask("exporting");
    setLoadingMessage("Preparing final PDF export...");

    try {
      // Collect all styles, including Tailwind layers, by cloning <style> and <link rel="stylesheet"> content
      let styles = "";
      document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
        if (node.tagName.toLowerCase() === "style") {
          styles += (node as HTMLStyleElement).innerHTML;
        } else {
          const sheet = (node as HTMLLinkElement).sheet as CSSStyleSheet | null;
          if (!sheet) return;
          try {
            const rules = Array.from(sheet.cssRules);
            for (const rule of rules) styles += rule.cssText;
          } catch {
            // skip cross-origin styles
          }
        }
      });

      const exportCleanupCss = `
        .brochure-overlay-layer { pointer-events: none !important; }
        .overlay-item::after,
        .overlay-resize-handle,
        .segment-resize-handle { display: none !important; box-shadow: none !important; border: none !important; }
        .segment-surface { outline: none !important; box-shadow: none !important; }
        .overlay-textbox { outline: none !important; }
        .editable-inline, .editable-block { outline: none !important; box-shadow: none !important; background: transparent !important; }
      `;

      styles += exportCleanupCss;

      const origin = window.location.origin;
      const pages = element.querySelectorAll(".brochure-page, .brochure-page-poster");
      let pagesHtml = "";
      pages.forEach((page) => {
        const clone = page.cloneNode(true) as HTMLElement;
        clone.style.transform = "none";
        clone.style.transformOrigin = "top left";
        clone.style.boxShadow = "none";
        clone.style.margin = "0";
        clone.style.border = "none";
        clone.querySelectorAll("img").forEach((node) => {
          const img = node as HTMLImageElement;
          const src = img.getAttribute("src");
          if (!src || src.startsWith("data:")) return;
          img.setAttribute("src", new URL(src, origin).href);
        });
        clone.querySelectorAll(".overlay-item").forEach((node) => {
          (node as HTMLElement).style.transform = (node as HTMLElement).style.transform || "";
          (node as HTMLElement).style.opacity = "1";
        });
        pagesHtml += clone.outerHTML;
      });

      const isPoster = template === "posterFlyer";

      const html = `
        <html>
        <head>
          <style>
            ${styles}
            .brochure-page, .brochure-page-poster {
              box-shadow: none !important;
              transform: none !important;
              margin: 0 !important;
              border: none !important;
            }
            body {
              background: white;
            }
          </style>
        </head>
        <body style="background: white; margin: 0; padding: 0;">
          <div style="display: flex; flex-direction: column;">
            ${pagesHtml}
          </div>
        </body>
        </html>
      `;

      const response = await fetch("/api/v1/brochure/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          css: styles,
          watermarkText: reviewStatus === "approved" ? null : "Made with Brochify - Not Approved",
          template,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${isPoster ? "poster" : "brochure"}-${Date.now()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Error generating PDF: ${message}`);
    } finally {
      setLoadingTask("idle");
      setLoadingMessage("");
    }
  };

  const handleFieldChange = useCallback((path: string, value: unknown) => {
    if (animationPhaseRef.current !== "idle") {
      stopTypingAnimation();
    }

    setBrochureData((prev) => {
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

      const currentValue = getValueFromPath(prev as unknown as Record<string, unknown>, path);
      const noChange =
        Array.isArray(currentValue) && Array.isArray(normalizedValue)
          ? JSON.stringify(currentValue) === JSON.stringify(normalizedValue)
          : Object.is(currentValue, normalizedValue);

      if (noChange) {
        return prev;
      }

      const next = setValueAtPath(prev, path, normalizedValue);
      pushWith({ brochureData: next });
      return next;
    });
  }, [pushWith, stopTypingAnimation]);

  const toggleLogo = (id: string) => {
    setSelectedLogos((prev) => {
      const next = prev.includes(id) ? prev.filter((logoId) => logoId !== id) : [...prev, id];
      pushWith({ selectedLogos: next });
      return next;
    });
  };

  const reorderLogos = useCallback((nextOrder: string[]) => {
    setSelectedLogos((prev) => {
      const validIds = new Set(builtinLogos.map((logo) => logo.id));
      const sanitized = nextOrder.filter((id) => validIds.has(id));
      if (sanitized.length === 0) return prev;

      const prevSet = new Set(prev);
      const kept = sanitized.filter((id) => prevSet.has(id));
      const appended = prev.filter((id) => !kept.includes(id));
      const next = [...kept, ...appended];

      if (JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }

      pushWith({ selectedLogos: next });
      return next;
    });
  }, [pushWith]);

  const handleSegmentMove = useCallback((id: string, position: SegmentPosition) => {
    setSegmentPositions((prev) => {
      const previousPosition = prev[id];
      if (JSON.stringify(previousPosition ?? {}) === JSON.stringify(position)) {
        return prev;
      }

      const next = {
        ...prev,
        [id]: position,
      };

      if (historyInteractionRef.current.active) {
        historyInteractionRef.current.changed = true;
        latestRef.current = {
          ...(latestRef.current ?? {
            brochureData,
            selectedLogos,
            segmentPositions: prev,
            overlayItems,
            template,
            hiddenSegments,
            formLineStyles,
          }),
          segmentPositions: next,
        };
      } else {
        pushWith({ segmentPositions: next });
      }

      return next;
    });
  }, [brochureData, formLineStyles, hiddenSegments, overlayItems, pushWith, selectedLogos, template]);

  const updateOverlayItem = (id: string, patch: Partial<OverlayItem>) => {
    setOverlayItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.id === id);
      if (itemIndex < 0) return prev;

      const currentItem = prev[itemIndex];
      const hasChange = Object.entries(patch).some(([key, value]) => {
        return (currentItem as Record<string, unknown>)[key] !== value;
      });

      if (!hasChange) return prev;

      const next = [...prev];
      next[itemIndex] = { ...currentItem, ...patch } as OverlayItem;

      if (historyInteractionRef.current.active) {
        historyInteractionRef.current.changed = true;
        latestRef.current = {
          ...(latestRef.current ?? {
            brochureData,
            selectedLogos,
            segmentPositions,
            overlayItems: prev,
            template,
            hiddenSegments,
            formLineStyles,
          }),
          overlayItems: next,
        };
      } else {
        pushWith({ overlayItems: next });
      }

      return next;
    });
  };

  const addTextOverlay = () => {
    const nextItem = createTextOverlay(activePage);
    setOverlayItems((prev) => {
      const next = [...prev, nextItem];
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedElement({ kind: "overlay", id: nextItem.id, page: nextItem.page });
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  };

  const addShapeOverlay = (shape: "rectangle" | "circle") => {
    const nextItem = createShapeOverlay(activePage, shape);
    setOverlayItems((prev) => {
      const next = [...prev, nextItem];
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedElement({ kind: "overlay", id: nextItem.id, page: nextItem.page });
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  };

  const handleChangeTemplate = (next: BrochureTemplate) => {
    setTemplate((prev) => {
      if (prev === next) return prev;
      pushWith({ template: next });
      return next;
    });
  };

  const addImageOverlayFromAsset = (assetId: string) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const nextItem = createImageOverlay(activePage, asset);
    setOverlayItems((prev) => {
      const next = [...prev, nextItem];
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedElement({ kind: "overlay", id: nextItem.id, page: nextItem.page });
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  };

  const addImageOverlayAtPoint = (
    assetId: string,
    page: 1 | 2,
    position: { x: number; y: number },
  ) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const { width: pageWidth, height: pageHeight } = getPageDimensions(template);
    const x = Math.max(0, Math.min(pageWidth - 180, position.x));
    const y = Math.max(0, Math.min(pageHeight - 120, position.y));
    const nextItem = createImageOverlay(page, asset, { x, y });
    setOverlayItems((prev) => {
      const next = [...prev, nextItem];
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedElement({ kind: "overlay", id: nextItem.id, page: nextItem.page });
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  };

  const deleteSegment = (id: string) => {
    setHiddenSegments((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      pushWith({ hiddenSegments: next });
      return next;
    });
  };

  const updateSelectedTextStyle = (patch: CanvasTextStylePatch) => {
    if (!selectedTextTarget) return;

    if (typeof patch.fontFamily === "string") {
      ensureFontFamilyLoaded(normalizeFontFamilyValue(patch.fontFamily));
    }

    if (selectedTextTarget.kind === "overlay") {
      const normalizedOverlayPatch: Partial<TextOverlayItem> = {
        ...patch,
        ...(typeof patch.fontFamily === "string"
          ? { fontFamily: normalizeFontFamilyValue(patch.fontFamily) }
          : {}),
      };
      updateOverlayItem(selectedTextTarget.id, normalizedOverlayPatch);
      return;
    }

    const nextPatch: FormLineStyle = {
      ...(typeof patch.fontFamily === "string" ? { fontFamily: normalizeFontFamilyValue(patch.fontFamily) } : {}),
      ...(typeof patch.fontSize === "number" ? { fontSize: patch.fontSize } : {}),
      ...(typeof patch.color === "string" ? { color: patch.color } : {}),
      ...(patch.align ? { align: patch.align } : {}),
    };

    setFormLineStyles((prev) => {
      const next = {
        ...prev,
        [selectedTextTarget.key]: {
          ...(prev[selectedTextTarget.key] ?? {}),
          ...nextPatch,
        },
      };
      pushWith({ formLineStyles: next });
      return next;
    });
  };

  const removeSelectedElement = () => {
    if (!selectedElement) return;

    if (selectedElement.kind === "overlay") {
      setOverlayItems((prev) => {
        const next = prev.filter((item) => item.id !== selectedElement.id);
        pushWith({ overlayItems: next });
        return next;
      });
      setSelectedElement(null);
      setSelectedFormLineKey(null);
      setEditingFormLineKey(null);
      return;
    }

    deleteSegment(selectedElement.id);
    setSelectedElement(null);
    setSelectedFormLineKey(null);
    setEditingFormLineKey(null);
  };

  const handleUploadAssets = async (files: FileList | null, tagsInput: string) => {
    if (!files || files.length === 0) return;
    setLoadingTask("uploading");
    setLoadingMessage("Placing image on canvas...");

    try {
      const tags = parseTagInput(tagsInput);
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          const identity = createAssetIdentity(file.name, tags, dataUrl);

          const nextAsset: BrandAsset = {
            id: identity.id,
            name: file.name,
            kind: file.type.includes("svg") || file.name.toLowerCase().includes("logo") ? "logo" : "image",
            mimeType: file.type,
            dataUrl,
            tags,
            slug: identity.slug,
            fingerprint: identity.fingerprint,
            searchIndex: identity.searchIndex,
            createdAt: new Date().toISOString(),
          };
          return nextAsset;
        }),
      );

      setAssets((prev) => {
        const merged = [...prev];
        for (const asset of uploads) {
          const existingIndex = merged.findIndex((item) => item.id === asset.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = asset;
          } else {
            merged.unshift(asset);
          }
        }
        return merged;
      });

      let updatedOverlays: OverlayItem[] = [];
      setOverlayItems((prev) => {
        const baseSize = 220;
        const { width: pageWidth, height: pageHeight } = getPageDimensions(template);
        const startX = Math.max(24, (pageWidth - baseSize) / 2);
        const startY = Math.max(24, (pageHeight - baseSize) / 2);
        const next = [...prev];

        uploads.forEach((asset, index) => {
          const offset = index * 18;
          const imageOverlay = createImageOverlay(activePage, asset, {
            x: startX + offset,
            y: startY + offset,
          });

          next.push({
            ...imageOverlay,
            width: baseSize,
            height: baseSize,
            borderRadius: 0,
          });
        });

        updatedOverlays = next;
        return next;
      });

      if (updatedOverlays.length) {
        pushWith({ overlayItems: updatedOverlays });
      }
    } finally {
      setLoadingTask("idle");
      setLoadingMessage("");
    }
  };

  useEffect(() => {
    return () => {
      typingRunRef.current += 1;
    };
  }, []);

  const runTypingAnimation = useCallback(
    async (target: BrochureData, options?: { previewDelayMs?: number }) => {
      const runId = typingRunRef.current + 1;
      typingRunRef.current = runId;

      const previewDelayMs = Math.max(0, options?.previewDelayMs ?? 0);
      if (previewDelayMs > 0) {
        setAnimationPhase("preview");
        setTypingBrochureData(target);
        setActiveTypingPath(null);
        await waitFor(previewDelayMs);
        if (runId !== typingRunRef.current) return;
      }

      setAnimationPhase("typing");
      const seed = createTypingSeedData(target);
      setTypingBrochureData(seed);
      await waitFor(50);
      if (runId !== typingRunRef.current) return;

      const typingPlan = buildTypingPlan(target);
      const source = target as unknown as Record<string, unknown>;

      for (const stage of typingPlan) {
        if (runId !== typingRunRef.current) return;

        const stageStart = performance.now();
        const stageEntries = stage.paths
          .map((path) => {
            const fullValue = getValueFromPath(source, path);
            if (typeof fullValue !== "string") return null;
            if (!fullValue.length) return null;
            const weight = Math.max(6, Math.min(220, fullValue.length));
            return { path, value: fullValue, weight };
          })
          .filter((entry): entry is { path: string; value: string; weight: number } => entry !== null);

        if (!stageEntries.length) {
          await waitFor(stage.durationMs);
          continue;
        }

        let remainingWeight = stageEntries.reduce((sum, entry) => sum + entry.weight, 0);

        for (let index = 0; index < stageEntries.length; index += 1) {
          if (runId !== typingRunRef.current) return;

          const entry = stageEntries[index];
          setActiveTypingPath(entry.path);

          const elapsed = performance.now() - stageStart;
          const remainingStageMs = Math.max(0, stage.durationMs - elapsed);
          const isLastEntry = index === stageEntries.length - 1;
          const pathBudgetMs = isLastEntry
            ? remainingStageMs
            : Math.max(0, (remainingStageMs * entry.weight) / Math.max(1, remainingWeight));

          const stepCount = Math.max(2, Math.min(10, Math.ceil(entry.value.length / 28)));
          const stepDelayMs = Math.max(0, Math.floor(pathBudgetMs / stepCount));

          for (let step = 1; step <= stepCount; step += 1) {
            if (runId !== typingRunRef.current) return;

            const cursor = Math.min(
              entry.value.length,
              Math.max(1, Math.round((entry.value.length * step) / stepCount)),
            );

            setTypingBrochureData((prev) => {
              const base = (prev ?? seed) as unknown as Record<string, unknown>;
              return setValueAtPath(base, entry.path, entry.value.slice(0, cursor)) as BrochureData;
            });

            if (stepDelayMs > 0) {
              await waitFor(stepDelayMs);
            }
          }

          remainingWeight = Math.max(0, remainingWeight - entry.weight);
        }

        const stageElapsed = performance.now() - stageStart;
        const stageRemainder = stage.durationMs - stageElapsed;
        if (stageRemainder > 0) {
          await waitFor(stageRemainder);
        }
      }

      if (runId !== typingRunRef.current) return;
      setAnimationPhase("idle");
      setTypingBrochureData(null);
      setActiveTypingPath(null);
    },
    [],
  );

  useEffect(() => {
    if (!autoAnimate || !mounted || autoAnimateRef.current) {
      return;
    }

    autoAnimateRef.current = true;
    void runTypingAnimation(brochureData, { previewDelayMs: 120 });
  }, [autoAnimate, brochureData, mounted, runTypingAnimation]);

  const handleCreateBrochure = () => {
    setLoadingTask("building");
    setLoadingMessage("Building brochure with AI reveal animation...");
    setProjectReady(true);

    void runTypingAnimation(brochureData, { previewDelayMs: 0 });

    window.setTimeout(() => {
      setLoadingTask("idle");
      setLoadingMessage("");
    }, 420);
  };

  const handleEnhanceWithAI = async () => {
    setLoadingTask("enhancing");
    setLoadingMessage("Enhancing your content with AI quality improvements...");

    try {
      const prompt = buildEnhancePrompt(brochureData);
      const firstPass = await generateBrochureData(prompt);
      if (!firstPass?.data || typeof firstPass.data !== "object") {
        console.warn("Enhance with AI received missing or invalid payload, using current brochure data as fallback.");
      }

      let enhanced = normalizeBrochureData(
        (firstPass?.data && typeof firstPass.data === "object"
          ? (firstPass.data as Record<string, unknown>)
          : (brochureData as unknown as Record<string, unknown>)),
      );

      const underfilled = getUnderfilledSections(enhanced);
      const assistantMessage = firstPass.rawMessage?.content;
      if (underfilled.length > 0 && typeof assistantMessage === "string" && assistantMessage.trim()) {
        const refinementPrompt = buildLengthRefinementPrompt(enhanced, underfilled);
        const refinementHistory = [
          { role: "user", content: prompt },
          {
            role: "assistant",
            content: assistantMessage,
            reasoning_details: firstPass.rawMessage?.reasoning_details,
          },
        ];

        try {
          const secondPass = await generateBrochureData(refinementPrompt, refinementHistory);
          enhanced = normalizeBrochureData(secondPass.data as Record<string, unknown>);
        } catch {
          // Keep first pass content if refinement cannot be completed.
        }
      }

      stopTypingAnimation();
      setBrochureData(enhanced);
      pushWith({ brochureData: enhanced });
      setProjectReady(true);
      setLoadingTask("idle");
      setLoadingMessage("");
      void runTypingAnimation(enhanced, { previewDelayMs: 1200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enhancement failed";
      alert(message);
    } finally {
      setLoadingTask("idle");
      setLoadingMessage("");
    }
  };

  const effectiveScale = Math.min(1.35, Math.max(0.4, previewScale * zoomFactor));
  const { width: pageWidth, height: pageHeight, count: pageCount } = getPageDimensions(template);
  const previewHeight = (pageHeight * pageCount + (pageCount === 2 ? PAGE_GAP : 0)) * effectiveScale;
  const previewWidth = pageWidth * effectiveScale;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  if (!mounted) return null;

  const scrollToPage = (page: 1 | 2) => {
    setActivePage(page);
    const target = page === 1 ? pageOneRef.current : pageTwoRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const adjustZoom = (delta: number) => {
    setZoomFactor((prev) => Math.min(2, Math.max(0.5, Number((prev + delta).toFixed(2)))));
  };

  const handleCanvasInteractionStart = () => {
    beginCanvasInteraction();
    setEditingFormLineKey(null);
  };

  const handleCanvasInteractionEnd = () => {
    endCanvasInteraction();
  };

  const handleBeginEditLine = (lineKey: string, segmentId: string | null) => {
    setSelectedFormLineKey(lineKey);
    setEditingFormLineKey(lineKey);

    if (!segmentId) return;
    const page = segmentId.startsWith("p2-") ? 2 : 1;
    setSelectedElement({ kind: "segment", id: segmentId, page });
  };

  const handleEndEditLine = () => {
    setEditingFormLineKey(null);
  };

  return (
    <main className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 px-8 lg:px-10 flex items-center justify-between shrink-0 z-[100] shadow-sm">
        <Link href={dashboardHref} className="flex items-center gap-3 group">
          <Logo appearance="light" />
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
              reviewStatus === "approved"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : reviewStatus === "rejected"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : reviewStatus === "pending"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-300 bg-slate-100 text-slate-700",
            )}
          >
            {reviewStatus}
          </span>

          <button
            onClick={() => void handleSaveDraft()}
            disabled={isWorkflowBusy}
            className="rounded-[14px] border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {workflowBusyState === "saving" ? "Saving..." : "Save"}
          </button>

          {session.role === "faculty" && (
            <button
              onClick={() => void handleSubmitForReview()}
              disabled={isWorkflowBusy}
              className="rounded-[14px] border border-sky-300 bg-sky-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {workflowBusyState === "submitting" ? "Submitting..." : "Submit for Review"}
            </button>
          )}

          {session.role === "admin" && (
            <>
              <button
                onClick={() => void handleAdminDecision("approved")}
                disabled={isWorkflowBusy}
                className="rounded-[14px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {workflowBusyState === "approving" ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={() => void handleAdminDecision("rejected")}
                disabled={isWorkflowBusy}
                className="rounded-[14px] border border-rose-300 bg-rose-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {workflowBusyState === "rejecting" ? "Rejecting..." : "Reject"}
              </button>
            </>
          )}

          <button
            onClick={() => setShowDevLogs(!showDevLogs)}
            className={cn(
              "p-3 rounded-xl transition-all border",
              showDevLogs
                ? "bg-primary/10 border-primary text-primary"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300",
            )}
            title="Inspect Telemetry"
          >
            <Activity className="w-5 h-5" />
          </button>

          {projectReady && (
            <button
              onClick={handleDownload}
              disabled={isWorkflowBusy}
              className="flex items-center gap-3 px-7 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all shadow-[0_14px_30px_-14px_rgba(111,82,255,0.6)] bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#c084fc] text-white hover:brightness-105"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </header>

      {(workflowError || workflowMessage) && (
        <div className="border-b border-slate-200 bg-white px-8 py-2 text-sm">
          {workflowError && <p className="text-rose-700">{workflowError}</p>}
          {!workflowError && workflowMessage && <p className="text-emerald-700">{workflowMessage}</p>}
        </div>
      )}

      {session.role === "faculty" && reviewStatus === "rejected" && rejectionReason && (
        <div className="border-b border-rose-200 bg-rose-50 px-8 py-3 text-sm text-rose-800">
          <p className="font-semibold uppercase tracking-[0.12em]">Rejection Reason</p>
          <p className="mt-1">{rejectionReason}</p>
        </div>
      )}

      {!projectReady ? (
        <section className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#e0edff_0%,#f7fbff_48%,#ecf3fa_100%)] p-6 sm:p-10">
          <div className="mx-auto w-full max-w-6xl">
            <GuidedFlowPanel
              data={brochureData}
              onFieldChange={handleFieldChange}
              onEnhance={handleEnhanceWithAI}
              onCreate={handleCreateBrochure}
              isBusy={isLoading}
              fullPage
            />
          </div>
        </section>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {showDevLogs && (
            <div className="absolute right-0 top-0 bottom-0 w-1/3 z-[200] overflow-hidden animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
              <DevLogs />
              <button
                onClick={() => setShowDevLogs(false)}
                className="absolute left-0 top-1/2 -translate-x-full bg-slate-900 border border-white/10 p-2 rounded-l-lg text-white/50 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <CanvasSidebar
            logoOptions={logoOptions}
            selectedLogos={selectedLogos}
            onToggleLogo={toggleLogo}
            onReorderLogos={reorderLogos}
            onUploadAssets={handleUploadAssets}
            isBusy={isLoading}
            template={template}
            onChangeTemplate={handleChangeTemplate}
          />

          <div className="flex-1 bg-[#F0F4F8] p-4 overflow-x-auto overflow-y-auto h-full flex flex-col items-center relative group scroll-smooth">
            <div
              className="absolute inset-0 opacity-[0.2] pointer-events-none [background-size:20px_20px]"
              style={{ backgroundImage: `radial-gradient(${TEMPLATE_THEMES[template].palette.primary}_1px,transparent_1px)` }}
            ></div>

            <div className="sticky top-0 z-30 w-full max-w-[1240px] px-2 pb-4 pt-1">
              <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <div className="mr-2 flex items-center gap-2 rounded-full bg-slate-100 p-1">
                  {[1, 2].map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => scrollToPage(pageNumber as 1 | 2)}
                      className={cn(
                        "rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        activePage === pageNumber
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      Page {pageNumber}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => adjustZoom(-0.05)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold hover:border-slate-300"
                    title="Zoom out"
                  >
                    -
                  </button>
                  <span className="min-w-[62px] text-center font-semibold">{Math.round(effectiveScale * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => adjustZoom(0.05)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold hover:border-slate-300"
                    title="Zoom in"
                  >
                    +
                  </button>
                  <input
                    type="range"
                    min={50}
                    max={140}
                    step={1}
                    value={Math.round(effectiveScale * 100)}
                    onChange={(event) => {
                      const percent = Number(event.target.value) || 100;
                      const base = previewScale || 1;
                      const nextZoom = percent / (base * 100);
                      setZoomFactor(Math.min(2, Math.max(0.5, nextZoom)));
                    }}
                    className="w-24"
                    aria-label="Zoom"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition-colors",
                      canUndo ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed",
                    )}
                    title="Undo"
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition-colors",
                      canRedo ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed",
                    )}
                    title="Redo"
                  >
                    <Redo2 className="h-4 w-4" />
                    Redo
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addTextOverlay}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/15"
                >
                  <Type className="h-4 w-4" />
                  Add Text
                </button>
                <button
                  type="button"
                  onClick={() => addShapeOverlay("rectangle")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Square className="h-4 w-4" />
                  Rectangle
                </button>
                <button
                  type="button"
                  onClick={() => addShapeOverlay("circle")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Circle className="h-4 w-4" />
                  Circle
                </button>

                {animationPhase !== "idle" && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                      animationPhase === "preview"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-sky-50 text-sky-700 border border-sky-200",
                    )}
                  >
                    {animationPhase === "preview" ? "AI Preview Ready" : "AI Typing Animation"}
                  </span>
                )}

                {selectedTextTarget && (
                  <>
                    <SelectBox
                      value={selectedTextTarget.fontFamily}
                      onChange={(val) => updateSelectedTextStyle({ fontFamily: val })}
                      options={FONT_OPTIONS.map((font) => ({
                        label: font.label,
                        value: font.value,
                        style: { fontFamily: font.value }
                      }))}
                      className="!bg-white !text-slate-700 !border-slate-200 !rounded-full !h-10 !px-4 !py-2 !text-sm !w-44"
                    />
                    <input
                      type="number"
                      min={12}
                      max={120}
                      value={selectedTextTarget.fontSize}
                      onChange={(event) => updateSelectedTextStyle({ fontSize: Number(event.target.value) || 16 })}
                      className="w-20 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
                    />
                    <input
                      type="color"
                      value={selectedTextTarget.color}
                      onChange={(event) => updateSelectedTextStyle({ color: event.target.value })}
                      className="h-10 w-12 rounded-full border border-slate-200 bg-white px-1"
                    />
                    {selectedTextTarget.kind === "overlay" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedTextStyle({
                            fontWeight: selectedTextTarget.fontWeight >= 700 ? 500 : 700,
                          })
                        }
                        className={cn(
                          "rounded-full border border-slate-200 bg-white p-2 transition-colors",
                          selectedTextTarget.fontWeight >= 700
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                        )}
                        title="Toggle bold"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                      {[
                        { value: "left", icon: AlignLeft },
                        { value: "center", icon: AlignCenter },
                        { value: "right", icon: AlignRight },
                        { value: "justify", icon: AlignJustify },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateSelectedTextStyle({ align: option.value as TextOverlayItem["align"] })}
                            className={cn(
                              "rounded-full p-2 transition-colors",
                              selectedTextTarget.align === option.value
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {selectedOverlay?.type === "shape" && (
                  <>
                    <input
                      type="color"
                      value={selectedOverlay.fill.startsWith("#") ? selectedOverlay.fill : "#60a5fa"}
                      onChange={(event) =>
                        updateOverlayItem(selectedOverlay.id, { fill: event.target.value })
                      }
                      className="h-10 w-12 rounded-full border border-slate-200 bg-white px-1"
                    />
                    <input
                      type="color"
                      value={selectedOverlay.stroke}
                      onChange={(event) =>
                        updateOverlayItem(selectedOverlay.id, { stroke: event.target.value })
                      }
                      className="h-10 w-12 rounded-full border border-slate-200 bg-white px-1"
                    />
                  </>
                )}

                {selectedElement && (
                  <button
                    type="button"
                    onClick={removeSelectedElement}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-300/60 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                )}

                {!selectedElement && (
                  <p className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Edit in place, free drag, and resize from corners
                  </p>
                )}
              </div>
            </div>

            <div
              ref={previewViewportRef}
              className={cn(
                "w-full flex flex-col items-center gap-10 py-4 relative z-10",
                isTypingAnimationActive && "pointer-events-none select-none",
              )}
              onFocusCapture={(event) => {
                const target = event.target as HTMLElement;
                const lineNode = target.closest("[data-form-line-key]") as HTMLElement | null;
                const lineKey = lineNode?.getAttribute("data-form-line-key");
                if (!lineKey) return;

                setSelectedFormLineKey(lineKey);

                const segmentHost = target.closest(".segment-shell") as HTMLElement | null;
                const segmentId = segmentHost?.dataset.segmentId;
                if (!segmentId) return;

                const page = segmentId.startsWith("p2-") ? 2 : 1;
                setSelectedElement({ kind: "segment", id: segmentId, page });
              }}
              onPointerDownCapture={(event) => {
                const target = event.target as HTMLElement;
                const lineNode = target.closest("[data-form-line-key]") as HTMLElement | null;
                const lineKey = lineNode?.getAttribute("data-form-line-key");
                if (lineKey) {
                  setSelectedFormLineKey(lineKey);

                  const segmentHost = lineNode?.closest(".segment-shell") as HTMLElement | null;
                  const segmentId = segmentHost?.dataset.segmentId;
                  if (segmentId) {
                    const page = segmentId.startsWith("p2-") ? 2 : 1;
                    setSelectedElement({ kind: "segment", id: segmentId, page });
                  }
                  return;
                }

                if (target.closest(".overlay-item")) {
                  setSelectedFormLineKey(null);
                  setEditingFormLineKey(null);
                  return;
                }

                if (target.closest(".segment-shell")) {
                  setSelectedFormLineKey(null);
                  setEditingFormLineKey(null);
                  return;
                }

                setSelectedElement(null);
                setSelectedFormLineKey(null);
                setEditingFormLineKey(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(event) => {
                event.preventDefault();
                const assetId = event.dataTransfer.getData("application/x-brochify-asset-id");
                if (!assetId) return;

                const wrapper = event.currentTarget.querySelector("#brochure-preview") as HTMLElement | null;
                if (!wrapper) {
                  addImageOverlayFromAsset(assetId);
                  return;
                }

                const rect = wrapper.getBoundingClientRect();
                const localX = (event.clientX - rect.left) / effectiveScale;
                const localY = (event.clientY - rect.top) / effectiveScale;
                const { height: pageHeight, count: pageCount } = getPageDimensions(template);
                const page = pageCount === 2 && localY > pageHeight + PAGE_GAP / 2 ? 2 : 1;
                const yInPage = page === 2 ? localY - (pageHeight + PAGE_GAP) : localY;

                setActivePage(page);
                addImageOverlayAtPoint(assetId, page, { x: localX - 90, y: yInPage - 60 });
              }}
            >
              <div className="preview-shell">
                <div
                  className="relative"
                  style={{ width: previewWidth, height: previewHeight }}
                >
                  <div
                    id="brochure-preview"
                    className="preview-stage"
                    style={{ width: getPageDimensions(template).width, transform: `scale(${effectiveScale})`, transformOrigin: "top left" }}
                  >
                    <div ref={pageOneRef}>
                      {template === "posterFlyer" ? (
                        <PosterPage
                          data={canvasBrochureData}
                          selectedLogos={selectedLogos}
                          onEdit={(path, value) => handleFieldChange(path, value)}
                          activeTypingPath={activeTypingPath}
                          segmentPositions={segmentPositions}
                          onSegmentMove={handleSegmentMove}
                          onSegmentInteractionStart={handleCanvasInteractionStart}
                          onSegmentInteractionEnd={handleCanvasInteractionEnd}
                          selectedSegmentId={selectedSegmentId}
                          onSelectSegment={(id) => {
                            setSelectedElement({ kind: "segment", id, page: 1 });
                            setSelectedFormLineKey(null);
                            setEditingFormLineKey(null);
                          }}
                          overlayItems={overlayItems.filter((item) => item.page === 1)}
                          selectedOverlayId={selectedOverlayId}
                          onSelectOverlay={(id) => {
                            setSelectedElement(id ? { kind: "overlay", id, page: 1 } : null);
                            setSelectedFormLineKey(null);
                            setEditingFormLineKey(null);
                          }}
                          onUpdateOverlay={updateOverlayItem}
                          onOverlayInteractionStart={handleCanvasInteractionStart}
                          onOverlayInteractionEnd={handleCanvasInteractionEnd}
                          logoCatalog={logoCatalog}
                          canvasScale={effectiveScale}
                          pageStyle={TEMPLATE_THEMES[template].pageStyle}
                          palette={TEMPLATE_THEMES[template].palette}
                          hiddenSegments={hiddenSegments}
                          formLineStyles={formLineStyles}
                          activeEditingLineKey={editingFormLineKey}
                          onBeginEditLine={handleBeginEditLine}
                          onEndEditLine={handleEndEditLine}
                        />
                      ) : (
                        <PageOne
                          data={canvasBrochureData}
                          selectedLogos={selectedLogos}
                          onEdit={(path, value) => handleFieldChange(path, value)}
                          activeTypingPath={activeTypingPath}
                          segmentPositions={segmentPositions}
                          onSegmentMove={handleSegmentMove}
                          onSegmentInteractionStart={handleCanvasInteractionStart}
                          onSegmentInteractionEnd={handleCanvasInteractionEnd}
                          selectedSegmentId={selectedSegmentId}
                          onSelectSegment={(id) => {
                            setSelectedElement({ kind: "segment", id, page: 1 });
                            setSelectedFormLineKey(null);
                            setEditingFormLineKey(null);
                          }}
                          overlayItems={overlayItems.filter((item) => item.page === 1)}
                          selectedOverlayId={selectedOverlayId}
                          onSelectOverlay={(id) => {
                            setSelectedElement(id ? { kind: "overlay", id, page: 1 } : null);
                            setSelectedFormLineKey(null);
                            setEditingFormLineKey(null);
                          }}
                          onUpdateOverlay={updateOverlayItem}
                          onOverlayInteractionStart={handleCanvasInteractionStart}
                          onOverlayInteractionEnd={handleCanvasInteractionEnd}
                          logoCatalog={logoCatalog}
                          canvasScale={effectiveScale}
                          pageStyle={TEMPLATE_THEMES[template].pageStyle}
                          palette={TEMPLATE_THEMES[template].palette}
                          hiddenSegments={hiddenSegments}
                          formLineStyles={formLineStyles}
                          activeEditingLineKey={editingFormLineKey}
                          onBeginEditLine={handleBeginEditLine}
                          onEndEditLine={handleEndEditLine}
                        />
                      )}
                    </div>
                    {template !== "posterFlyer" && (
                      <>
                        <div style={{ height: PAGE_GAP }} />
                        <div ref={pageTwoRef}>
                          <PageTwo
                            data={canvasBrochureData}
                            selectedLogos={selectedLogos}
                            onEdit={(path, value) => handleFieldChange(path, value)}
                            activeTypingPath={activeTypingPath}
                            segmentPositions={segmentPositions}
                            onSegmentMove={handleSegmentMove}
                            onSegmentInteractionStart={handleCanvasInteractionStart}
                            onSegmentInteractionEnd={handleCanvasInteractionEnd}
                            selectedSegmentId={selectedSegmentId}
                            onSelectSegment={(id) => {
                              setSelectedElement({ kind: "segment", id, page: 2 });
                              setSelectedFormLineKey(null);
                              setEditingFormLineKey(null);
                            }}
                            overlayItems={overlayItems.filter((item) => item.page === 2)}
                            selectedOverlayId={selectedOverlayId}
                            onSelectOverlay={(id) => {
                              setSelectedElement(id ? { kind: "overlay", id, page: 2 } : null);
                              setSelectedFormLineKey(null);
                              setEditingFormLineKey(null);
                            }}
                            onUpdateOverlay={updateOverlayItem}
                            onOverlayInteractionStart={handleCanvasInteractionStart}
                            onOverlayInteractionEnd={handleCanvasInteractionEnd}
                            canvasScale={effectiveScale}
                            pageStyle={TEMPLATE_THEMES[template].pageStyle}
                            palette={TEMPLATE_THEMES[template].palette}
                            hiddenSegments={hiddenSegments}
                            formLineStyles={formLineStyles}
                            activeEditingLineKey={editingFormLineKey}
                            onBeginEditLine={handleBeginEditLine}
                            onEndEditLine={handleEndEditLine}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoadingOverlay
        isVisible={isLoading}
        message={loadingMessage}
        task={loadingTask}
      />
    </main>
  );
}
