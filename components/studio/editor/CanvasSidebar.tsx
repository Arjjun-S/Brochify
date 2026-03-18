"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus, Search, Trash2, UploadCloud } from "lucide-react";
import { BrandAsset } from "@/lib/domains/brochure";
import { cn } from "@/lib/ui/cn";

type LogoOption = {
  id: string;
  name: string;
  src: string;
  custom?: boolean;
};

type CanvasSidebarProps = {
  assets: BrandAsset[];
  logoOptions: LogoOption[];
  selectedLogos: string[];
  onToggleLogo: (id: string) => void;
  onUploadAssets: (files: FileList | null, tagsInput: string) => Promise<void>;
  onDeleteAsset: (id: string) => void;
  onInsertAssetAsOverlay: (id: string) => void;
  isBusy: boolean;
};

export default function CanvasSidebar({
  assets,
  logoOptions,
  selectedLogos,
  onToggleLogo,
  onUploadAssets,
  onDeleteAsset,
  onInsertAssetAsOverlay,
  isBusy,
}: CanvasSidebarProps) {
  const [query, setQuery] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assets;
    return assets.filter((asset) => asset.searchIndex.includes(normalized));
  }, [assets, query]);

  return (
    <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur-xl h-full flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-slate-200">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Assets Studio</p>
        <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">Logos, Photos, Elements</h3>
      </div>

      <div className="p-4 border-b border-slate-200 space-y-3">
        <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-2">
            <UploadCloud className="h-4 w-4" />
            Upload files for drag-drop
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={isBusy}
            className="block w-full cursor-pointer text-xs text-slate-600"
            onChange={async (event) => {
              await onUploadAssets(event.target.files, tagsInput);
              event.currentTarget.value = "";
            }}
          />
        </label>

        <input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="Tags for upload batch"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
        />

        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slug, tags"
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="p-4 border-b border-slate-200">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Active Logos</p>
        <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto">
          {logoOptions.map((logo) => (
            <button
              key={logo.id}
              type="button"
              onClick={() => onToggleLogo(logo.id)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors",
                selectedLogos.includes(logo.id)
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary/25",
              )}
            >
              {logo.name}
              {logo.custom && <span className="ml-2 text-[10px] text-sky-500">custom</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-brochify-asset-id", asset.id);
              event.dataTransfer.effectAllowed = "copy";
            }}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing"
            title="Drag into canvas to place"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{asset.name}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500 truncate">{asset.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteAsset(asset.id)}
                className="rounded-full border border-red-300/40 bg-red-50 p-1.5 text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Image
                src={asset.dataUrl}
                alt={asset.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg border border-slate-200 object-contain bg-white"
                unoptimized
              />
              <button
                type="button"
                onClick={() => onInsertAssetAsOverlay(asset.id)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
        ))}

        {filteredAssets.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            No assets found. Upload files to start building your library.
          </div>
        )}
      </div>
    </aside>
  );
}
