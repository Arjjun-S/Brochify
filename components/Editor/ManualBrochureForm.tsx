"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { BrochureData, CommitteeMember, Speaker, Topic } from "@/lib/brochure";
import { cn } from "@/lib/utils";

type ManualBrochureFormProps = {
  data: BrochureData;
  onChange: (path: string, value: unknown) => void;
  selectedLogos: string[];
  onToggleLogo: (id: string) => void;
};

const availableLogos = [
  { id: "srm", name: "SRM Institute of Tech" },
  { id: "ieee", name: "IEEE Student Branch" },
  { id: "ctech", name: "Dept. of C. Tech" },
  { id: "naac", name: "NAAC Accredited" },
];

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary/60 focus:bg-white/8 focus:ring-4 focus:ring-primary/10";

const textAreaClassName = `${inputClassName} min-h-[88px] resize-y`;

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.6)]">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/8 pb-3">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.26em] text-white">{title}</h3>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function ArrayToolbar({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/20"
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 transition-colors hover:bg-red-500/20"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Remove
    </button>
  );
}

export default function ManualBrochureForm({
  data,
  onChange,
  selectedLogos,
  onToggleLogo,
}: ManualBrochureFormProps) {
  const updateArray = <T,>(path: string, nextValue: T[]) => {
    onChange(path, nextValue);
  };

  const addCommittee = () => {
    updateArray<CommitteeMember>("committee", [
      ...data.committee,
      { name: "", role: "" },
    ]);
  };

  const addTopic = () => {
    updateArray<Topic>("topics", [
      ...data.topics,
      { date: "", forenoon: "", afternoon: "" },
    ]);
  };

  const addSpeaker = () => {
    updateArray<Speaker>("speakers", [
      ...data.speakers,
      { name: "", role: "", org: "" },
    ]);
  };

  const addNote = () => {
    updateArray<string>("registration.notes", [...data.registration.notes, ""]);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/8 px-6 py-5">
        <h2 className="text-sm font-black uppercase tracking-[0.28em] text-white">Manual Builder</h2>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
          Fill every brochure segment manually. This editor writes directly into the same preview used by the AI workflow.
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-hide">
        <Section title="Identity" subtitle="Core event, department, and visual brand details.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Event Title">
              <input className={inputClassName} value={data.eventTitle} onChange={(e) => onChange("eventTitle", e.target.value)} />
            </Field>
            <Field label="Dates">
              <input className={inputClassName} value={data.dates} onChange={(e) => onChange("dates", e.target.value)} />
            </Field>
          </div>
          <Field label="Department">
            <input className={inputClassName} value={data.department} onChange={(e) => onChange("department", e.target.value)} />
          </Field>
          <Field label="Registration URL">
            <input className={inputClassName} value={data.googleForm} onChange={(e) => onChange("googleForm", e.target.value)} />
          </Field>
          <Field label="Event Image URL">
            <input className={inputClassName} value={data.eventImage ?? ""} onChange={(e) => onChange("eventImage", e.target.value)} placeholder="https://..." />
          </Field>
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Logos</span>
            <div className="grid grid-cols-2 gap-3">
              {availableLogos.map((logo) => {
                const active = selectedLogos.includes(logo.id);
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => onToggleLogo(logo.id)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-xs font-bold transition-all",
                      active
                        ? "border-primary bg-primary/15 text-white shadow-[0_12px_30px_-16px_rgba(0,71,171,0.8)]"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-primary/30 hover:bg-white/[0.06]",
                    )}
                  >
                    {logo.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Registration" subtitle="Fees, notes, account details, and primary contact information.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="IEEE Fee">
              <input className={inputClassName} value={data.registration.ieeePrice} onChange={(e) => onChange("registration.ieeePrice", e.target.value)} />
            </Field>
            <Field label="Non-IEEE Fee">
              <input className={inputClassName} value={data.registration.nonIeeePrice} onChange={(e) => onChange("registration.nonIeeePrice", e.target.value)} />
            </Field>
            <Field label="Deadline">
              <input className={inputClassName} value={data.registration.deadline} onChange={(e) => onChange("registration.deadline", e.target.value)} />
            </Field>
          </div>
          <ArrayToolbar label="Registration Notes" onAdd={addNote} />
          {data.registration.notes.map((note, index) => (
            <div key={`note-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Note {index + 1}</span>
                <RemoveButton
                  onClick={() => updateArray<string>("registration.notes", data.registration.notes.filter((_, currentIndex) => currentIndex !== index))}
                />
              </div>
              <textarea className={textAreaClassName} value={note} onChange={(e) => onChange(`registration.notes.${index}`, e.target.value)} />
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact Name">
              <input className={inputClassName} value={data.contact.name} onChange={(e) => onChange("contact.name", e.target.value)} />
            </Field>
            <Field label="Contact Mobile">
              <input className={inputClassName} value={data.contact.mobile} onChange={(e) => onChange("contact.mobile", e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bank Name">
              <input className={inputClassName} value={data.accountDetails.bankName} onChange={(e) => onChange("accountDetails.bankName", e.target.value)} />
            </Field>
            <Field label="Account Number">
              <input className={inputClassName} value={data.accountDetails.accountNo} onChange={(e) => onChange("accountDetails.accountNo", e.target.value)} />
            </Field>
            <Field label="Account Name">
              <input className={inputClassName} value={data.accountDetails.accountName} onChange={(e) => onChange("accountDetails.accountName", e.target.value)} />
            </Field>
            <Field label="Account Type">
              <input className={inputClassName} value={data.accountDetails.accountType} onChange={(e) => onChange("accountDetails.accountType", e.target.value)} />
            </Field>
            <Field label="Branch">
              <input className={inputClassName} value={data.accountDetails.branch} onChange={(e) => onChange("accountDetails.branch", e.target.value)} />
            </Field>
            <Field label="IFSC Code">
              <input className={inputClassName} value={data.accountDetails.ifscCode} onChange={(e) => onChange("accountDetails.ifscCode", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Narrative" subtitle="Long-form brochure sections shown across page two.">
          <Field label="About College">
            <textarea className={textAreaClassName} value={data.aboutCollege} onChange={(e) => onChange("aboutCollege", e.target.value)} />
          </Field>
          <Field label="About School">
            <textarea className={textAreaClassName} value={data.aboutSchool} onChange={(e) => onChange("aboutSchool", e.target.value)} />
          </Field>
          <Field label="About Department">
            <textarea className={textAreaClassName} value={data.aboutDepartment} onChange={(e) => onChange("aboutDepartment", e.target.value)} />
          </Field>
          <Field label="About FDP">
            <textarea className={textAreaClassName} value={data.aboutFdp} onChange={(e) => onChange("aboutFdp", e.target.value)} />
          </Field>
        </Section>

        <Section title="Committee" subtitle="Leaders, advisors, and organizers shown on page one.">
          <ArrayToolbar label="Committee Members" onAdd={addCommittee} />
          {data.committee.map((member, index) => (
            <div key={`committee-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Member {index + 1}</span>
                <RemoveButton
                  onClick={() => updateArray<CommitteeMember>("committee", data.committee.filter((_, currentIndex) => currentIndex !== index))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input className={inputClassName} value={member.name} onChange={(e) => onChange(`committee.${index}.name`, e.target.value)} />
                </Field>
                <Field label="Role">
                  <input className={inputClassName} value={member.role} onChange={(e) => onChange(`committee.${index}.role`, e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Schedule" subtitle="Daily sessions and speaker lineup for the second page.">
          <ArrayToolbar label="Topics" onAdd={addTopic} />
          {data.topics.map((topic, index) => (
            <div key={`topic-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Topic {index + 1}</span>
                <RemoveButton onClick={() => updateArray<Topic>("topics", data.topics.filter((_, currentIndex) => currentIndex !== index))} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Date">
                  <input className={inputClassName} value={topic.date} onChange={(e) => onChange(`topics.${index}.date`, e.target.value)} />
                </Field>
                <Field label="Forenoon">
                  <textarea className={textAreaClassName} value={topic.forenoon} onChange={(e) => onChange(`topics.${index}.forenoon`, e.target.value)} />
                </Field>
                <Field label="Afternoon">
                  <textarea className={textAreaClassName} value={topic.afternoon} onChange={(e) => onChange(`topics.${index}.afternoon`, e.target.value)} />
                </Field>
              </div>
            </div>
          ))}

          <ArrayToolbar label="Speakers" onAdd={addSpeaker} />
          {data.speakers.map((speaker, index) => (
            <div key={`speaker-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Speaker {index + 1}</span>
                <RemoveButton onClick={() => updateArray<Speaker>("speakers", data.speakers.filter((_, currentIndex) => currentIndex !== index))} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Name">
                  <input className={inputClassName} value={speaker.name} onChange={(e) => onChange(`speakers.${index}.name`, e.target.value)} />
                </Field>
                <Field label="Role">
                  <input className={inputClassName} value={speaker.role} onChange={(e) => onChange(`speakers.${index}.role`, e.target.value)} />
                </Field>
                <Field label="Organization">
                  <input className={inputClassName} value={speaker.org} onChange={(e) => onChange(`speakers.${index}.org`, e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}