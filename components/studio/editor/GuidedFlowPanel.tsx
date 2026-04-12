"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Wand2,
} from "lucide-react";
import { BrochureData } from "@/lib/domains/brochure";
import { cn } from "@/lib/ui/cn";

type GuidedFlowPanelProps = {
  data: BrochureData;
  onFieldChange: (path: string, value: unknown) => void;
  onEnhance: () => Promise<void>;
  onCreate: () => void;
  isBusy: boolean;
  fullPage?: boolean;
  createActionLabel?: string;
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
  const [year, month, day] = value?.split("-") ?? [];
  if (!year || !month || !day) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseDateParts(value: string) {
  const [year = "", month = "", day = ""] = value ? value.split("-") : ["", "", ""];
  return { year, month, day };
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
  const months: SelectOption[] = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];
  const currentYear = new Date().getFullYear();
  const years: SelectOption[] = Array.from({ length: 7 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: String(year), label: String(year) };
  });
  const [{ year, month, day }, setParts] = useState(() => parseDateParts(value));

  useEffect(() => {
    setParts(parseDateParts(value));
  }, [value]);

  const dayOptions: SelectOption[] = Array.from({ length: 31 }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return { value: d, label: d };
  });

  const update = (next: Partial<{ year: string; month: string; day: string }>) => {
    const merged = { year, month, day, ...next };
    setParts(merged);
    if (merged.year && merged.month && merged.day) {
      onChange(`${merged.year}-${merged.month}-${merged.day}`);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <CustomSelect value={day} options={dayOptions} onChange={(nextDay) => update({ day: nextDay })} />
      <CustomSelect value={month} options={months} onChange={(nextMonth) => update({ month: nextMonth })} />
      <CustomSelect value={year} options={years} onChange={(nextYear) => update({ year: nextYear })} />
    </div>
  );
}

function TimePicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [hour = "09", minute = "00"] = value.split(":");
  const hours: SelectOption[] = Array.from({ length: 12 }, (_, idx) => {
    const h = String(idx + 1).padStart(2, "0");
    return { value: h, label: h };
  });
  const minutes: SelectOption[] = ["00", "15", "30", "45"].map((m) => ({ value: m, label: m }));
  const period = Number(hour) >= 12 ? "PM" : "AM";
  const displayHour = String(((Number(hour) + 11) % 12) + 1).padStart(2, "0");

  const update = (h12: string, m: string, p: string) => {
    const hourNum = Number(h12);
    if (!Number.isFinite(hourNum) || !m) return;
    const twentyFour = p === "PM" ? (hourNum % 12) + 12 : hourNum % 12;
    onChange(`${String(twentyFour).padStart(2, "0")}:${m}`);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <CustomSelect value={displayHour} options={hours} onChange={(next) => update(next, minute, period)} />
      <CustomSelect value={minute} options={minutes} onChange={(next) => update(displayHour, next, period)} />
      <CustomSelect
        value={period}
        options={[{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }]}
        onChange={(next) => update(displayHour, minute, next)}
      />
    </div>
  );
}

export default function GuidedFlowPanel({
  data,
  onFieldChange,
  onEnhance,
  onCreate,
  isBusy,
  fullPage = false,
  createActionLabel = "Build Brochure",
}: GuidedFlowPanelProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("16:00");
  const [sessionPreset, setSessionPreset] = useState(SESSION_WINDOWS[0].value);

  const headings = data.headings;

  const sessionWindow = `${startTime} - ${endTime}`;

  const applySessionPreset = (value: string) => {
    setSessionPreset(value);
    const [from, to] = value.split("-").map((part) => part.trim());
    if (from) setStartTime(from);
    if (to) setEndTime(to);
  };

  useEffect(() => {
    const from = formatDateLabel(startDate);
    const to = formatDateLabel(endDate);
    const dateText = to ? `${from} - ${to}` : from;
    const composed = `${dateText}${dateText ? " | " : ""}${sessionWindow}`;
    onFieldChange("dates", composed.trim());
  }, [endDate, onFieldChange, sessionWindow, startDate]);

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
      title: "Headings",
      subtitle: "Rename the main brochure section titles.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(headings).map(([key, value]) => (
            <Field key={key} label={key.replace(/([A-Z])/g, " $1").trim()}>
              <input
                className={inputClassName}
                value={value}
                onChange={(e) => {
                  onFieldChange(`headings.${key}`, e.target.value);
                }}
              />
            </Field>
          ))}
        </div>
      ),
    },
    {
      title: "Registration",
      subtitle: "Add fee, notes, account and contact details.",
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
          <Field label="Registration Deadline">
            <input className={inputClassName} value={data.registration.deadline} onChange={(e) => onFieldChange("registration.deadline", e.target.value)} />
          </Field>
          <Field label="Registration URL">
            <input className={inputClassName} value={data.googleForm} onChange={(e) => onFieldChange("googleForm", e.target.value)} />
          </Field>

          {[0, 1, 2, 3].map((index) => (
            <Field key={index} label={`Registration Note ${index + 1}`}>
              <textarea className={areaClassName} value={data.registration.notes[index] || ""} onChange={(e) => onFieldChange(`registration.notes.${index}`, e.target.value)} />
            </Field>
          ))}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Account Details</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Bank Name">
                <input className={inputClassName} value={data.accountDetails.bankName} onChange={(e) => onFieldChange("accountDetails.bankName", e.target.value)} />
              </Field>
              <Field label="Account Number">
                <input className={inputClassName} value={data.accountDetails.accountNo} onChange={(e) => onFieldChange("accountDetails.accountNo", e.target.value)} />
              </Field>
              <Field label="Account Name">
                <input className={inputClassName} value={data.accountDetails.accountName} onChange={(e) => onFieldChange("accountDetails.accountName", e.target.value)} />
              </Field>
              <Field label="Account Type">
                <input className={inputClassName} value={data.accountDetails.accountType} onChange={(e) => onFieldChange("accountDetails.accountType", e.target.value)} />
              </Field>
              <Field label="Branch">
                <input className={inputClassName} value={data.accountDetails.branch} onChange={(e) => onFieldChange("accountDetails.branch", e.target.value)} />
              </Field>
              <Field label="IFSC">
                <input className={inputClassName} value={data.accountDetails.ifscCode} onChange={(e) => onFieldChange("accountDetails.ifscCode", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact Name">
              <input className={inputClassName} value={data.contact.name} onChange={(e) => onFieldChange("contact.name", e.target.value)} />
            </Field>
            <Field label="Contact Mobile">
              <input className={inputClassName} value={data.contact.mobile} onChange={(e) => onFieldChange("contact.mobile", e.target.value)} />
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: "Committee",
      subtitle: "Capture patron, advisory and organizing teams.",
      content: (
        <div className="space-y-3">
          {data.committee.map((member, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Member {index + 1}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input className={inputClassName} value={member.name} onChange={(e) => onFieldChange(`committee.${index}.name`, e.target.value)} />
                </Field>
                <Field label="Role">
                  <input className={inputClassName} value={member.role} onChange={(e) => onFieldChange(`committee.${index}.role`, e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
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
          <Field label="About School">
            <textarea className={areaClassName} value={data.aboutSchool} onChange={(e) => onFieldChange("aboutSchool", e.target.value)} />
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
      title: "Topics & Speakers",
      subtitle: "Define the complete agenda and speaker list.",
      content: (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Daily Topics</p>
            <div className="space-y-3">
              {data.topics.map((topic, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-black text-slate-500">Day {index + 1}</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Date">
                      <input className={inputClassName} value={topic.date} onChange={(e) => onFieldChange(`topics.${index}.date`, e.target.value)} />
                    </Field>
                    <Field label="Forenoon">
                      <input className={inputClassName} value={topic.forenoon} onChange={(e) => onFieldChange(`topics.${index}.forenoon`, e.target.value)} />
                    </Field>
                    <Field label="Afternoon">
                      <input className={inputClassName} value={topic.afternoon} onChange={(e) => onFieldChange(`topics.${index}.afternoon`, e.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Speakers</p>
            <div className="space-y-3">
              {data.speakers.map((speaker, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-black text-slate-500">Speaker {index + 1}</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Name">
                      <input className={inputClassName} value={speaker.name} onChange={(e) => onFieldChange(`speakers.${index}.name`, e.target.value)} />
                    </Field>
                    <Field label="Role">
                      <input className={inputClassName} value={speaker.role} onChange={(e) => onFieldChange(`speakers.${index}.role`, e.target.value)} />
                    </Field>
                    <Field label="Organization">
                      <input className={inputClassName} value={speaker.org} onChange={(e) => onFieldChange(`speakers.${index}.org`, e.target.value)} />
                    </Field>
                  </div>
                </div>
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
                  {createActionLabel}
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
