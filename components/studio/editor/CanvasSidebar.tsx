"use client";

import React, { useMemo, useRef, useState } from "react";
import { Search, UploadCloud } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export type BrochureTemplate = "whiteBlue" | "beigeDust" | "softBlue" | "tealGloss" | "yellowDust";

type LogoOption = {
  id: string;
  name: string;
  src: string;
  custom?: boolean;
};

type CanvasSidebarProps = {
  logoOptions: LogoOption[];
  selectedLogos: string[];
  onToggleLogo: (id: string) => void;
  onReorderLogos: (nextOrder: string[]) => void;
  onUploadAssets: (files: FileList | null, tagsInput: string) => Promise<void>;
  isBusy: boolean;
  template: BrochureTemplate;
  onChangeTemplate: (template: BrochureTemplate) => void;
};

export default function CanvasSidebar({
  logoOptions,
  selectedLogos,
  onToggleLogo,
  onReorderLogos,
  onUploadAssets,
  isBusy,
  template,
  onChangeTemplate,
}: CanvasSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoQuery, setLogoQuery] = useState("");
  const [dragLogoId, setDragLogoId] = useState<string | null>(null);

  const filteredLogos = useMemo(() => {
    const normalized = logoQuery.trim().toLowerCase();
    if (!normalized) return logoOptions;
    return logoOptions.filter((logo) => logo.name.toLowerCase().includes(normalized));
  }, [logoOptions, logoQuery]);

  const selectedLogoCards = useMemo(
    () => selectedLogos
      .map((id) => logoOptions.find((logo) => logo.id === id))
      .filter((logo): logo is LogoOption => Boolean(logo)),
    [selectedLogos, logoOptions],
  );

  const reorderLogos = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const from = selectedLogos.indexOf(draggedId);
    const to = selectedLogos.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...selectedLogos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorderLogos(next);
  };

  const templateCards = [
    {
      id: "whiteBlue" as BrochureTemplate,
      label: "White / Blue",
      stops: ["#f9fbff", "#0f59b8", "#f9fbff"],
    },
    {
      id: "beigeDust" as BrochureTemplate,
      label: "Beige Dust",
      stops: ["#f9f2e6", "#c29d6d", "#f9f2e6"],
    },
    {
      id: "softBlue" as BrochureTemplate,
      label: "White + Mist",
      stops: ["#ffffff", "#eef5ff", "#ffffff"],
    },
    {
      id: "tealGloss" as BrochureTemplate,
      label: "Teal Gloss",
      stops: ["#ffffff", "#329890", "#ffffff"],
    },
    {
      id: "yellowDust" as BrochureTemplate,
      label: "Yellow Dust",
      stops: ["#ffffff", "#fdf2b8", "#ffffff"],
    },
  ];

  return (
    <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur-xl h-full flex flex-col">
      <div className="px-4 pt-5 pb-2">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Assets Studio</h3>
      </div>

      <div className="p-4 border-b border-slate-200 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Templates</p>
        <div className="flex items-start gap-4 overflow-x-auto pb-1">
          {templateCards.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChangeTemplate(option.id)}
              className={cn(
                "flex flex-col items-center gap-2 px-1 py-1 text-xs font-bold transition-colors min-w-[110px] bg-transparent",
                template === option.id ? "text-primary" : "text-slate-600 hover:text-primary",
              )}
            >
              <span className="h-20 w-24 overflow-hidden flex border border-slate-200/60 shadow-sm" aria-hidden>
                {option.stops.map((stop, idx) => (
                  <span key={idx} className="flex-1" style={{ background: stop }} />
                ))}
              </span>
              <span className="leading-tight text-[12px]">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Logos</p>

        <div className="relative">
          <input
            value={logoQuery}
            onChange={(event) => setLogoQuery(event.target.value)}
            placeholder="Search logos (SRM, IEEE...)"
            className="w-full rounded-full border border-white/30 bg-white/25 backdrop-blur-xl px-4 py-2 pr-11 text-sm text-slate-800 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.45)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <Search className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
          {filteredLogos.map((logo) => (
            <button
              key={logo.id}
              type="button"
              onClick={() => onToggleLogo(logo.id)}
              className={cn(
                "rounded-full border px-3 py-2 text-center text-xs font-bold transition-all",
                selectedLogos.includes(logo.id)
                  ? "border-[#a855f7]/50 bg-gradient-to-r from-[#ff8bd5] via-[#b069ff] to-[#6f52ff] text-white shadow-[0_12px_24px_-10px_rgba(111,82,255,0.55)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary/25",
              )}
            >
              {logo.name}
              {logo.custom && <span className="ml-2 text-[10px] text-sky-500">custom</span>}
            </button>
          ))}
          {filteredLogos.length === 0 && (
            <div className="col-span-2 text-center text-[11px] text-slate-500 py-2 border border-dashed border-slate-200 rounded-lg">
              No logos match that search.
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logo Order (Left to Right)</p>
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {selectedLogoCards.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-500">
                Select logos above to arrange order.
              </div>
            )}
            {selectedLogoCards.map((logo) => (
              <div
                key={logo.id}
                draggable
                onDragStart={(event) => {
                  setDragLogoId(logo.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", logo.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const droppedId = event.dataTransfer.getData("text/plain") || dragLogoId;
                  if (!droppedId) return;
                  reorderLogos(droppedId, logo.id);
                  setDragLogoId(null);
                }}
                onDragEnd={() => setDragLogoId(null)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold",
                  dragLogoId === logo.id
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-slate-200 bg-white text-slate-700",
                )}
              >
                <span className="truncate">{logo.name}</span>
                <span className="text-[10px] font-black tracking-wider text-slate-400">DRAG</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div
          className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/70 backdrop-blur-lg p-6 text-center text-sm text-slate-600 cursor-pointer shadow-sm hover:border-primary/40 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] text-white flex items-center justify-center text-lg font-black shadow-lg">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="font-semibold">Upload image or logo</div>
          <div className="text-[12px] text-slate-500 mt-1">PNG, JPG, SVG, PDF up to 25MB</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          disabled={isBusy}
          className="hidden"
          onChange={async (event) => {
            const files = event.currentTarget.files;
            await onUploadAssets(files, "");
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </div>
    </aside>
  );
}
