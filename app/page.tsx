"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageOne from "@/components/Brochure/PageOne";
import PageTwo from "@/components/Brochure/PageTwo";
import GuidedFlowPanel from "@/components/Editor/GuidedFlowPanel";
import CanvasSidebar from "@/components/Editor/CanvasSidebar";
import LoadingOverlay from "@/components/Layout/LoadingOverlay";
import DevLogs from "@/components/Editor/DevLogs";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Circle,
  Download,
  Layout,
  Sparkles,
  Square,
  Trash2,
  Type,
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
} from "@/lib/brochure";
import { generateBrochureData } from "@/lib/openrouter";
import { LoadingTask } from "@/lib/loadingManager";

const PAGE_WIDTH = 983;
const PAGE_HEIGHT = 680;
const PAGE_GAP = 24;

const builtinLogos: Array<{ id: string; name: string; src: string }> = [
  { id: "srm", name: "SRM Institute of Tech", src: "/logos/srm.svg" },
  { id: "ieee", name: "IEEE Student Branch", src: "/logos/ieee.svg" },
  { id: "ctech", name: "Dept. of C. Tech", src: "/logos/ctech.svg" },
  { id: "naac", name: "NAAC Accredited", src: "/logos/naac.svg" },
];

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
  const [previewScale, setPreviewScale] = useState(1);
  const [projectReady, setProjectReady] = useState(false);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);

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
      let styles = "";
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            styles += rule.cssText;
          }
        } catch {
          // ignore stylesheet access errors for cross-origin rules
        }
      }

      const pages = element.querySelectorAll(".brochure-page");
      let pagesHtml = "";
      pages.forEach((page) => {
        pagesHtml += page.outerHTML;
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
          </style>
        </head>
        <body style="background: white; margin: 0; padding: 0;">
          <div style="display: flex; flex-direction: column;">
            ${pagesHtml}
          </div>
        </body>
        </html>
      `;

      const response = await fetch("/api/generate-pdf", {
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
    setBrochureData((prev) => setValueAtPath(prev, path, value));
  }, []);

  const toggleLogo = (id: string) => {
    setSelectedLogos((prev) =>
      prev.includes(id) ? prev.filter((logoId) => logoId !== id) : [...prev, id],
    );
  };

  const handleSegmentMove = (id: string, position: SegmentPosition) => {
    setSegmentPositions((prev) => ({
      ...prev,
      [id]: position,
    }));
  };

  const updateOverlayItem = (id: string, patch: Partial<OverlayItem>) => {
    setOverlayItems((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...patch } as OverlayItem) : item)),
    );
  };

  const addTextOverlay = () => {
    const nextItem = createTextOverlay(activePage);
    setOverlayItems((prev) => [...prev, nextItem]);
    setSelectedOverlayId(nextItem.id);
  };

  const addShapeOverlay = (shape: "rectangle" | "circle") => {
    const nextItem = createShapeOverlay(activePage, shape);
    setOverlayItems((prev) => [...prev, nextItem]);
    setSelectedOverlayId(nextItem.id);
  };

  const addImageOverlayFromAsset = (assetId: string) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const nextItem = createImageOverlay(activePage, asset);
    setOverlayItems((prev) => [...prev, nextItem]);
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
    setOverlayItems((prev) => [...prev, nextItem]);
    setSelectedOverlayId(nextItem.id);
  };

  const removeSelectedOverlay = () => {
    if (!selectedOverlayId) return;
    setOverlayItems((prev) => prev.filter((item) => item.id !== selectedOverlayId));
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
      setBrochureData(normalizeBrochureData(result.data as Record<string, unknown>));
      setProjectReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enhancement failed";
      alert(message);
    } finally {
      setLoadingTask("idle");
      setLoadingMessage("");
    }
  };

  const previewHeight = (PAGE_HEIGHT * 2 + PAGE_GAP) * previewScale;
  const previewWidth = PAGE_WIDTH * previewScale;

  if (!mounted) return null;

  return (
    <main className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 px-8 lg:px-10 flex items-center justify-between shrink-0 z-[100] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(0,71,171,0.5)] transition-transform group-hover:rotate-6">
              <Layout className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">
                BROCHIFY<span className="text-primary not-italic">.</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Guided Brochure Studio
              </p>
            </div>
          </div>
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
          />

          <div className="flex-1 bg-[#F0F4F8] p-4 overflow-y-auto h-full flex flex-col items-center relative group scroll-smooth">
            <div className="absolute inset-0 opacity-[0.2] pointer-events-none bg-[radial-gradient(#0047AB_1px,transparent_1px)] [background-size:20px_20px]"></div>

            <div className="sticky top-0 z-30 w-full max-w-[1240px] px-2 pb-4 pt-1">
              <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <div className="mr-2 flex items-center gap-2 rounded-full bg-slate-100 p-1">
                  {[1, 2].map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setActivePage(pageNumber as 1 | 2)}
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
                const localX = (event.clientX - rect.left) / previewScale;
                const localY = (event.clientY - rect.top) / previewScale;
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
                    style={{ width: PAGE_WIDTH, transform: `scale(${previewScale})` }}
                  >
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
                      canvasScale={previewScale}
                    />
                    <div style={{ height: PAGE_GAP }} />
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
                      canvasScale={previewScale}
                    />
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
