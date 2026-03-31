"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import PageOne from "@/components/studio/canvas/PageOne";
import PageTwo from "@/components/studio/canvas/PageTwo";
import GuidedFlowPanel from "@/components/studio/editor/GuidedFlowPanel";
import CanvasSidebar from "@/components/studio/editor/CanvasSidebar";
import LoadingOverlay from "@/components/shared/feedback/LoadingOverlay";
import DevLogs from "@/components/studio/editor/DevLogs";
import { cn } from "@/lib/ui/cn";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
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
  normalizeBrochureData,
  OverlayItem,
  parseTagInput,
  SegmentPosition,
  setValueAtPath,
  TextOverlayItem,
} from "@/lib/domains/brochure";
import { generateBrochureData } from "@/lib/services/ai/openrouterClient";
import { LoadingTask } from "@/lib/system/loading/loadingTaskManager";
import type { BrochureTemplate } from "@/components/studio/editor/CanvasSidebar";

const PAGE_WIDTH = 983;
const PAGE_HEIGHT = 680;
const PAGE_GAP = 24;

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
      primary: "#f7eedf",
      secondary: "#e6c89c",
      primaryText: "#2d1f12",
      surface: "#f7eedf",
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
      primary: "#3f8bff",
      secondary: "#a3d7ff",
      primaryText: "#ffffff",
      surface: "#ffffff",
      surfaceBorder: "#dbeafe",
      accent: "#facc15",
      mutedText: "#6b7280",
    },
  },
};

type EditorSnapshot = {
  brochureData: BrochureData;
  selectedLogos: string[];
  segmentPositions: Record<string, SegmentPosition>;
  overlayItems: OverlayItem[];
  template: BrochureTemplate;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildEnhancePrompt(data: BrochureData): string {
  return `Enhance the following brochure JSON while preserving factual fields and structure. Improve writing quality, clarity, and professionalism. Return only JSON matching the same schema.\n\n${JSON.stringify(data, null, 2)}`;
}

export default function Dashboard() {
  const [brochureData, setBrochureData] = useState<BrochureData>(createEmptyBrochureData());
  const [selectedLogos, setSelectedLogos] = useState<string[]>(["srm", "ieee", "ctech"]);
  const [loadingTask, setLoadingTask] = useState<LoadingTask>("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showDevLogs, setShowDevLogs] = useState(false);
  const [segmentPositions, setSegmentPositions] = useState<Record<string, SegmentPosition>>({});
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [previewScale, setPreviewScale] = useState(1); // auto scale from viewport
  const [zoomFactor, setZoomFactor] = useState(1); // user-controlled multiplier
  const [projectReady, setProjectReady] = useState(false);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [template, setTemplate] = useState<BrochureTemplate>("whiteBlue");
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const pageOneRef = useRef<HTMLDivElement | null>(null);
  const pageTwoRef = useRef<HTMLDivElement | null>(null);
  const historyIndexRef = useRef(-1);
  const latestRef = useRef<EditorSnapshot | null>(null);

  const isLoading = loadingTask !== "idle";

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
      const nextScale = Math.min(1, Math.max(0.52, (entry.contentRect.width - 24) / PAGE_WIDTH));
      setPreviewScale(nextScale);
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    latestRef.current = { brochureData, selectedLogos, segmentPositions, overlayItems, template };
  }, [brochureData, selectedLogos, segmentPositions, overlayItems, template]);

  useEffect(() => {
    const initial: EditorSnapshot = {
      brochureData,
      selectedLogos,
      segmentPositions,
      overlayItems,
      template,
    };
    setHistory([initial]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
    latestRef.current = initial;
  }, []);

  const pushHistorySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndexRef.current + 1);
      const next = [...truncated, snapshot];
      historyIndexRef.current = next.length - 1;
      setHistoryIndex(historyIndexRef.current);
      return next;
    });
    latestRef.current = snapshot;
  }, []);

  const pushWith = useCallback(
    (partial: Partial<EditorSnapshot>) => {
      const base =
        latestRef.current ?? ({ brochureData, selectedLogos, segmentPositions, overlayItems, template } as EditorSnapshot);
      pushHistorySnapshot({ ...base, ...partial });
    },
    [],
  );

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    latestRef.current = snapshot;
    setBrochureData(snapshot.brochureData);
    setSelectedLogos(snapshot.selectedLogos);
    setSegmentPositions(snapshot.segmentPositions);
    setOverlayItems(snapshot.overlayItems);
    setTemplate(snapshot.template);
  }, []);

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    const snapshot = history[nextIndex];
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    applySnapshot(snapshot);
  };

  const redo = () => {
    if (historyIndexRef.current >= history.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    const snapshot = history[nextIndex];
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    applySnapshot(snapshot);
  };

  const selectedOverlay = useMemo(
    () => overlayItems.find((item) => item.id === selectedOverlayId) ?? null,
    [overlayItems, selectedOverlayId],
  );

  const logoOptions = useMemo(() => {
    const custom = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      src: asset.dataUrl,
      custom: true,
    }));
    return [...builtinLogos, ...custom];
  }, [assets]);

  const logoCatalog = useMemo(
    () => Object.fromEntries(logoOptions.map((logo) => [logo.id, logo.src])),
    [logoOptions],
  );

  useEffect(() => {
    if (selectedOverlay) {
      setActivePage(selectedOverlay.page);
    }
  }, [selectedOverlay]);

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
        .overlay-item-toolbar,
        .overlay-resize-handle,
        .segment-handle { display: none !important; box-shadow: none !important; border: none !important; }
        .overlay-textbox { outline: none !important; }
        .editable-inline, .editable-block { outline: none !important; box-shadow: none !important; background: transparent !important; }
      `;

      styles += exportCleanupCss;

      const origin = window.location.origin;
      const pages = element.querySelectorAll(".brochure-page");
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

      const html = `
        <html>
        <head>
          <style>
            ${styles}
            .brochure-page {
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
        body: JSON.stringify({ html, css: styles }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `brochure-${Date.now()}.pdf`;
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
    setBrochureData((prev) => {
      const next = setValueAtPath(prev, path, value);
      pushWith({ brochureData: next });
      return next;
    });
  }, [pushWith]);

  const toggleLogo = (id: string) => {
    setSelectedLogos((prev) => {
      const next = prev.includes(id) ? prev.filter((logoId) => logoId !== id) : [...prev, id];
      pushWith({ selectedLogos: next });
      return next;
    });
  };

  const handleSegmentMove = (id: string, position: SegmentPosition) => {
    setSegmentPositions((prev) => {
      const next = {
        ...prev,
        [id]: position,
      };
      pushWith({ segmentPositions: next });
      return next;
    });
  };

  const updateOverlayItem = (id: string, patch: Partial<OverlayItem>) => {
    setOverlayItems((prev) => {
      const next = prev.map((item) => (item.id === id ? ({ ...item, ...patch } as OverlayItem) : item));
      pushWith({ overlayItems: next });
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
    setSelectedOverlayId(nextItem.id);
  };

  const addShapeOverlay = (shape: "rectangle" | "circle") => {
    const nextItem = createShapeOverlay(activePage, shape);
    setOverlayItems((prev) => {
      const next = [...prev, nextItem];
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedOverlayId(nextItem.id);
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
    setSelectedOverlayId(nextItem.id);
  };

  const addImageOverlayAtPoint = (
    assetId: string,
    page: 1 | 2,
    position: { x: number; y: number },
  ) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const x = Math.max(0, Math.min(PAGE_WIDTH - 180, position.x));
    const y = Math.max(0, Math.min(PAGE_HEIGHT - 120, position.y));
    const nextItem = createImageOverlay(page, asset, { x, y });
    setOverlayItems((prev) => {
      const next = [...prev, nextItem];
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedOverlayId(nextItem.id);
  };

  const removeSelectedOverlay = () => {
    if (!selectedOverlayId) return;
    setOverlayItems((prev) => {
      const next = prev.filter((item) => item.id !== selectedOverlayId);
      pushWith({ overlayItems: next });
      return next;
    });
    setSelectedOverlayId(null);
  };

  const handleUploadAssets = async (files: FileList | null, tagsInput: string) => {
    if (!files || files.length === 0) return;
    setLoadingTask("uploading");
    setLoadingMessage("Uploading and indexing assets...");

    try {
      const tags = parseTagInput(tagsInput);
      const incoming = await Promise.all(
        Array.from(files).map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          const identity = createAssetIdentity(file.name, tags, dataUrl);

          const nextAsset: BrandAsset = {
            id: identity.id,
            name: file.name,
            kind:
              file.type.includes("svg") || file.name.toLowerCase().includes("logo")
                ? "logo"
                : "image",
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
        for (const asset of incoming) {
          const existingIndex = merged.findIndex((item) => item.id === asset.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = asset;
          } else {
            merged.unshift(asset);
          }
        }
        return merged;
      });
    } finally {
      setLoadingTask("idle");
      setLoadingMessage("");
    }
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    setSelectedLogos((prev) => prev.filter((logoId) => logoId !== id));
  };

  const handleCreateBrochure = () => {
    setLoadingTask("building");
    setLoadingMessage("Building brochure from your guided inputs...");
    setProjectReady(true);
    window.setTimeout(() => {
      setLoadingTask("idle");
      setLoadingMessage("");
    }, 850);
  };

  const handleEnhanceWithAI = async () => {
    setLoadingTask("enhancing");
    setLoadingMessage("Enhancing your content with AI quality improvements...");

    try {
      const prompt = buildEnhancePrompt(brochureData);
      const result = await generateBrochureData(prompt);
      const enhanced = normalizeBrochureData(result.data as Record<string, unknown>);
      setBrochureData(enhanced);
      pushWith({ brochureData: enhanced });
      setProjectReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enhancement failed";
      alert(message);
    } finally {
      setLoadingTask("idle");
      setLoadingMessage("");
    }
  };

  const effectiveScale = Math.min(1.35, Math.max(0.4, previewScale * zoomFactor));
  const previewHeight = (PAGE_HEIGHT * 2 + PAGE_GAP) * effectiveScale;
  const previewWidth = PAGE_WIDTH * effectiveScale;
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

  return (
    <main className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 px-8 lg:px-10 flex items-center justify-between shrink-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3 group cursor-pointer">
          <img src="/icon-logo.png" alt="Studio Icon" className="h-10 w-10 object-contain drop-shadow-sm" />
          <img src="/text-logo.png" alt="Studio Wordmark" className="h-10 w-auto object-contain drop-shadow-sm" />
        </div>

        <div className="flex items-center gap-4">
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
              className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-7 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </header>

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
            <div className="absolute right-0 top-0 bottom-0 w-1/3 z-[200] animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
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
            assets={assets}
            logoOptions={logoOptions}
            selectedLogos={selectedLogos}
            onToggleLogo={toggleLogo}
            onUploadAssets={handleUploadAssets}
            onDeleteAsset={handleDeleteAsset}
            onInsertAssetAsOverlay={addImageOverlayFromAsset}
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

                {selectedOverlay?.type === "text" && (
                  <>
                    <select
                      value={selectedOverlay.fontFamily}
                      onChange={(event) =>
                        updateOverlayItem(
                          selectedOverlay.id,
                          { fontFamily: event.target.value } as Partial<TextOverlayItem>,
                        )
                      }
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={12}
                      max={120}
                      value={selectedOverlay.fontSize}
                      onChange={(event) =>
                        updateOverlayItem(
                          selectedOverlay.id,
                          { fontSize: Number(event.target.value) || 16 } as Partial<TextOverlayItem>,
                        )
                      }
                      className="w-20 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
                    />
                    <input
                      type="color"
                      value={selectedOverlay.color}
                      onChange={(event) =>
                        updateOverlayItem(
                          selectedOverlay.id,
                          { color: event.target.value } as Partial<TextOverlayItem>,
                        )
                      }
                      className="h-10 w-12 rounded-full border border-slate-200 bg-white px-1"
                    />
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                      {[
                        { value: "left", icon: AlignLeft },
                        { value: "center", icon: AlignCenter },
                        { value: "right", icon: AlignRight },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateOverlayItem(
                                selectedOverlay.id,
                                {
                                  align: option.value as TextOverlayItem["align"],
                                } as Partial<TextOverlayItem>,
                              )
                            }
                            className={cn(
                              "rounded-full p-2 transition-colors",
                              selectedOverlay.align === option.value
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

                {selectedOverlay && (
                  <button
                    type="button"
                    onClick={removeSelectedOverlay}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-300/60 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}

                {!selectedOverlay && (
                  <p className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Edit in place, free drag, and resize from corners
                  </p>
                )}
              </div>
            </div>

            <div
              ref={previewViewportRef}
              className="w-full flex flex-col items-center gap-10 py-4 relative z-10"
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
                const page = localY > PAGE_HEIGHT + PAGE_GAP / 2 ? 2 : 1;
                const yInPage = page === 2 ? localY - (PAGE_HEIGHT + PAGE_GAP) : localY;

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
                    style={{ width: PAGE_WIDTH, transform: `scale(${effectiveScale})`, transformOrigin: "top left" }}
                  >
                    <div ref={pageOneRef}>
                      <PageOne
                        data={brochureData}
                        selectedLogos={selectedLogos}
                        onEdit={(path, value) => handleFieldChange(path, value)}
                        segmentPositions={segmentPositions}
                        onSegmentMove={handleSegmentMove}
                        overlayItems={overlayItems.filter((item) => item.page === 1)}
                        selectedOverlayId={selectedOverlayId}
                        onSelectOverlay={setSelectedOverlayId}
                        onUpdateOverlay={updateOverlayItem}
                        logoCatalog={logoCatalog}
                        canvasScale={effectiveScale}
                        pageStyle={TEMPLATE_THEMES[template].pageStyle}
                        palette={TEMPLATE_THEMES[template].palette}
                      />
                    </div>
                    <div style={{ height: PAGE_GAP }} />
                    <div ref={pageTwoRef}>
                      <PageTwo
                        data={brochureData}
                        selectedLogos={selectedLogos}
                        onEdit={(path, value) => handleFieldChange(path, value)}
                        segmentPositions={segmentPositions}
                        onSegmentMove={handleSegmentMove}
                        overlayItems={overlayItems.filter((item) => item.page === 2)}
                        selectedOverlayId={selectedOverlayId}
                        onSelectOverlay={setSelectedOverlayId}
                        onUpdateOverlay={updateOverlayItem}
                        canvasScale={effectiveScale}
                        pageStyle={TEMPLATE_THEMES[template].pageStyle}
                        palette={TEMPLATE_THEMES[template].palette}
                      />
                    </div>
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
