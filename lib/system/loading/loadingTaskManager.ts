export type LoadingTask =
  | "idle"
  | "drafting"
  | "enhancing"
  | "building"
  | "uploading"
  | "exporting";

export type LoadingTaskMeta = {
  title: string;
  subtitle: string;
  accent: string;
  pulse: string;
};

const TASK_META: Record<Exclude<LoadingTask, "idle">, LoadingTaskMeta> = {
  drafting: {
    title: "Drafting Brochure Content",
    subtitle: "Composing structured sections from your inputs.",
    accent: "#2563eb",
    pulse: "from-blue-500/30 to-cyan-400/20",
  },
  enhancing: {
    title: "Enhancing With AI",
    subtitle: "Refining tone, clarity, and professional density.",
    accent: "#0ea5e9",
    pulse: "from-cyan-500/30 to-sky-400/20",
  },
  building: {
    title: "Building Brochure",
    subtitle: "Applying your template and layout composition.",
    accent: "#1d4ed8",
    pulse: "from-indigo-500/30 to-blue-400/20",
  },
  uploading: {
    title: "Uploading Assets",
    subtitle: "Optimizing media and creating search identities.",
    accent: "#0891b2",
    pulse: "from-teal-500/30 to-cyan-400/20",
  },
  exporting: {
    title: "Exporting PDF",
    subtitle: "Rendering print-ready brochure pages.",
    accent: "#1e40af",
    pulse: "from-blue-500/35 to-indigo-400/20",
  },
};

export function getLoadingTaskMeta(task: LoadingTask): LoadingTaskMeta | null {
  if (task === "idle") return null;
  return TASK_META[task];
}
