"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock3,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import { BrandAsset, BrochureData } from "@/lib/brochure";
import { cn } from "@/lib/utils";

type LogoOption = {
  id: string;
  name: string;
  src: string;
  custom?: boolean;
};

type GuidedFlowPanelProps = {
  data: BrochureData;
  onFieldChange: (path: string, value: unknown) => void;
  onEnhance: () => Promise<void>;
  onCreate: () => void;
  isBusy: boolean;
  logoOptions: LogoOption[];
  selectedLogos: string[];
  onToggleLogo: (id: string) => void;
  assets: BrandAsset[];
  onUploadAssets: (files: FileList | null, tagsInput: string) => Promise<void>;
  onDeleteAsset: (id: string) => void;
  onInsertAssetAsOverlay: (id: string) => void;
  fullPage?: boolean;
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary/60 focus:ring-4 focus:ring-primary/10";

const areaClassName = `${inputClassName} min-h-[96px] resize-y`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

type SelectOption = { label: string; value: string };

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: "Department of Computational Design", label: "Department of Computational Design" },
  { value: "Department of Computer Science and Engineering", label: "Department of Computer Science and Engineering" },
  { value: "Department of Information Technology", label: "Department of Information Technology" },
  { value: "Department of Electronics and Communication", label: "Department of Electronics and Communication" },
  { value: "School of Computing", label: "School of Computing" },
];

const SESSION_WINDOWS: SelectOption[] = [
  { value: "09:30 - 16:00", label: "9:30 AM - 4:00 PM" },
  { value: "10:00 - 17:00", label: "10:00 AM - 5:00 PM" },
  { value: "08:30 - 15:30", label: "8:30 AM - 3:30 PM" },
];

function formatDateLabel(value: string): string {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const activeLabel = options.find((option) => option.value === value)?.label ?? "Choose";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40"
      >
        <span>{activeLabel}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                option.value === value
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DatePicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
      <Calendar className="h-4 w-4 text-slate-400" />
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
      />
    </label>
  );
}

function TimePicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
      <Clock3 className="h-4 w-4 text-slate-400" />
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
      />
    </label>
  );
}

export default function GuidedFlowPanel({
  data,
  onFieldChange,
  onEnhance,
  onCreate,
  isBusy,
  logoOptions,
  selectedLogos,
  onToggleLogo,
  assets,
  onUploadAssets,
  onDeleteAsset,
  onInsertAssetAsOverlay,
  fullPage = false,
}: GuidedFlowPanelProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTagsInput, setAssetTagsInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("16:00");
  const [sessionPreset, setSessionPreset] = useState(SESSION_WINDOWS[0].value);

  const sessionWindow = `${startTime} - ${endTime}`;

  const applySessionPreset = (value: string) => {
    setSessionPreset(value);
    const [from, to] = value.split("-").map((part) => part.trim());
    if (from) setStartTime(from);
    if (to) setEndTime(to);
  };

  useEffect(() => {
    const from = formatDateLabel(startDate);
    const to = endDate ? formatDateLabel(endDate) : "";
    const dateText = endDate ? `${from} - ${to}` : from;
    const composed = `${dateText}${dateText ? " | " : ""}${sessionWindow}`;
    onFieldChange("dates", composed.trim());
  }, [endDate, onFieldChange, sessionWindow, startDate]);

  const filteredAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) => asset.searchIndex.includes(query));
  }, [assets, assetSearch]);

  const steps = [
    {
      title: "Event Basics",
      subtitle: "Set the core event identity first.",
      content: (
        <div className="space-y-4">
          <Field label="Event Title">
            <input className={inputClassName} value={data.eventTitle} onChange={(e) => onFieldChange("eventTitle", e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Department">
              <CustomSelect value={data.department} options={DEPARTMENT_OPTIONS} onChange={(value) => onFieldChange("department", value)} />
            </Field>
            <Field label="Session Window">
              <CustomSelect value={sessionPreset} options={SESSION_WINDOWS} onChange={applySessionPreset} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start Date">
              <DatePicker value={startDate} onChange={setStartDate} />
            </Field>
            <Field label="End Date">
              <DatePicker value={endDate} onChange={setEndDate} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start Time">
              <TimePicker value={startTime} onChange={setStartTime} />
            </Field>
            <Field label="End Time">
              <TimePicker value={endTime} onChange={setEndTime} />
            </Field>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
            Final date string preview: {data.dates}
          </div>
        </div>
      ),
    },
    {
      title: "Registration",
      subtitle: "Add fee and enrollment details.",
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="IEEE Fee">
              <input className={inputClassName} value={data.registration.ieeePrice} onChange={(e) => onFieldChange("registration.ieeePrice", e.target.value)} />
            </Field>
            <Field label="Non-IEEE Fee">
              <input className={inputClassName} value={data.registration.nonIeeePrice} onChange={(e) => onFieldChange("registration.nonIeeePrice", e.target.value)} />
            </Field>
          </div>
          <Field label="Registration URL">
            <input className={inputClassName} value={data.googleForm} onChange={(e) => onFieldChange("googleForm", e.target.value)} />
          </Field>
          <Field label="Registration Note 1">
            <textarea className={areaClassName} value={data.registration.notes[0] || ""} onChange={(e) => onFieldChange("registration.notes.0", e.target.value)} />
          </Field>
        </div>
      ),
    },
    {
      title: "Content",
      subtitle: "Fill narrative sections in sequence.",
      content: (
        <div className="space-y-4">
          <Field label="About College">
            <textarea className={areaClassName} value={data.aboutCollege} onChange={(e) => onFieldChange("aboutCollege", e.target.value)} />
          </Field>
          <Field label="About Department">
            <textarea className={areaClassName} value={data.aboutDepartment} onChange={(e) => onFieldChange("aboutDepartment", e.target.value)} />
          </Field>
          <Field label="About FDP">
            <textarea className={areaClassName} value={data.aboutFdp} onChange={(e) => onFieldChange("aboutFdp", e.target.value)} />
          </Field>
        </div>
      ),
    },
    {
      title: "Brand Assets",
      subtitle: "Upload logos and searchable assets for reuse.",
      content: (
        <div className="space-y-4">
          <Field label="Upload Logos / Images">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="block w-full cursor-pointer text-xs text-slate-500"
                onChange={async (event) => {
                  await onUploadAssets(event.target.files, assetTagsInput);
                  event.currentTarget.value = "";
                }}
              />
              <input
                className={inputClassName}
                placeholder="Tags for all selected files, e.g. university logo dark"
                value={assetTagsInput}
                onChange={(event) => setAssetTagsInput(event.target.value)}
              />
              <p className="text-xs text-slate-500">Files are indexed with slug + fingerprint for precise search and re-use.</p>
            </div>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
                placeholder="Search assets by name, slug, tags, fingerprint"
                value={assetSearch}
                onChange={(event) => setAssetSearch(event.target.value)}
              />
            </div>

            <div className="max-h-64 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{asset.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{asset.slug}</p>
                      <p className="mt-1 text-[10px] text-slate-600">ID: {asset.fingerprint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAsset(asset.id)}
                      className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20"
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
                      className="h-10 w-10 rounded-lg border border-white/10 object-contain bg-white/90"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => onInsertAssetAsOverlay(asset.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Add To Canvas
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLogo(asset.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]",
                        selectedLogos.includes(asset.id)
                          ? "border-sky-300/30 bg-sky-500/15 text-sky-100"
                          : "border-slate-300 bg-white text-slate-600",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Use As Logo
                    </button>
                  </div>
                </div>
              ))}
              {filteredAssets.length === 0 && (
                <p className="text-center text-xs text-slate-500">No assets found for this query.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Logos</span>
            <div className="grid grid-cols-2 gap-2">
              {logoOptions.map((logo) => (
                <button
                  key={logo.id}
                  type="button"
                  onClick={() => onToggleLogo(logo.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors",
                    selectedLogos.includes(logo.id)
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary/25",
                  )}
                >
                  {logo.name}
                  {logo.custom && <span className="ml-2 text-[10px] text-sky-300">custom</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ] as const;

  if (!started) {
    return (
      <div className={cn("flex h-full flex-col justify-center px-8 py-10", fullPage ? "text-slate-900" : "bg-slate-950 text-white") }>
        <div className={cn(
          "rounded-[34px] p-8 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.25)]",
          fullPage ? "border border-slate-200 bg-white" : "border border-white/10 bg-white/[0.03]",
        )}>
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-primary">Modern Guided Builder</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Create A Brochure In A Focused Flow</h2>
          <p className={cn("mt-4 text-sm leading-relaxed", fullPage ? "text-slate-600" : "text-slate-400")}>
            We will collect details step-by-step, let you optionally enhance with AI, then generate the final brochure using your chosen template.
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-[0_20px_36px_-16px_rgba(0,71,171,0.9)] transition-transform hover:-translate-y-0.5"
          >
            <Wand2 className="h-4 w-4" />
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-full flex-col overflow-hidden rounded-[32px] border shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)]",
      fullPage ? "border-slate-200 bg-white text-slate-900" : "bg-slate-950 text-white border-white/8",
    )}>
      <div className={cn("px-6 py-4", fullPage ? "border-b border-slate-200" : "border-b border-white/8")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.26em]", fullPage ? "text-slate-400" : "text-slate-500")}>Step {step + 1} / {steps.length}</p>
            <h3 className="mt-1 text-lg font-black tracking-tight">{steps[step].title}</h3>
            <p className={cn("mt-1 text-xs", fullPage ? "text-slate-500" : "text-slate-400")}>{steps[step].subtitle}</p>
          </div>
          <div className={cn("h-2 w-28 overflow-hidden rounded-full", fullPage ? "bg-slate-200" : "bg-white/10")}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 scrollbar-hide bg-gradient-to-b from-white to-slate-50">
        {steps[step].content}
      </div>

      <div className={cn("px-6 py-4", fullPage ? "border-t border-slate-200 bg-white" : "border-t border-white/8")}>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || isBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-40",
              fullPage
                ? "border-slate-200 bg-white text-slate-600"
                : "border-white/12 bg-white/[0.03] text-slate-300",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCreate}
                  disabled={isBusy}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50",
                    fullPage
                      ? "border-slate-200 bg-white text-slate-700"
                      : "border-white/12 bg-white/[0.04] text-white",
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Build Brochure
                </button>
                <button
                  type="button"
                  onClick={onEnhance}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  Enhance With AI
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
