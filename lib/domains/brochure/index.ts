export type CommitteeMember = {
  name: string;
  role: string;
};

export type Topic = {
  date: string;
  forenoon: string;
  afternoon: string;
};

export type Speaker = {
  name: string;
  role: string;
  org: string;
};

export type BrochureHeadings = {
  chiefPatrons: string;
  patrons: string;
  convener: string;
  coConvener: string;
  advisoryCommittee: string;
  organizingCommittee: string;
  registrationDetail: string;
  registrationFee: string;
  registrationNote: string;
  accountDetail: string;
  sponsoredBy: string;
  organizedBy: string;
  aboutCollege: string;
  aboutSchool: string;
  aboutDepartment: string;
  aboutFdp: string;
  programHighlights: string;
  topics: string;
  speakers: string;
};

export type BrochureData = {
  eventTitle: string;
  department: string;
  dates: string;
  googleForm: string;
  eventImage?: string;
  templateText: Record<string, string>;
  headings: BrochureHeadings;
  committee: CommitteeMember[];
  registration: {
    ieeePrice: string;
    nonIeeePrice: string;
    deadline: string;
    notes: string[];
  };
  accountDetails: {
    bankName: string;
    accountNo: string;
    accountName: string;
    accountType: string;
    branch: string;
    ifscCode: string;
  };
  aboutCollege: string;
  aboutSchool: string;
  aboutDepartment: string;
  aboutFdp: string;
  topics: Topic[];
  speakers: Speaker[];
  contact: {
    name: string;
    mobile: string;
  };
};

export type SegmentPosition = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: OverlayTextAlign;
};

export type OverlayTextAlign = "left" | "center" | "right";

export type TextEntity = {
  id: string;
  text: string;
  position: { x: number; y: number };
  style: {
    fontSize: number;
    color: string;
    align: OverlayTextAlign;
  };
  isEditing: boolean;
};

type OverlayBase = {
  id: string;
  page: 1 | 2;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type TextOverlayItem = OverlayBase & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: OverlayTextAlign;
  backgroundColor: string;
};

export type ShapeOverlayItem = OverlayBase & {
  type: "shape";
  shape: "rectangle" | "circle";
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

export type ImageOverlayItem = OverlayBase & {
  type: "image";
  src: string;
  name: string;
  borderRadius: number;
};

export type OverlayItem = TextOverlayItem | ShapeOverlayItem | ImageOverlayItem;

export type BrandAsset = {
  id: string;
  name: string;
  kind: "logo" | "image";
  mimeType: string;
  dataUrl: string;
  tags: string[];
  slug: string;
  fingerprint: string;
  searchIndex: string;
  createdAt: string;
};

export const FONT_OPTIONS = [
  { label: "Inter", value: "var(--font-inter)" },
  { label: "Manrope", value: "var(--font-manrope)" },
  { label: "DM Sans", value: "var(--font-dm-sans)" },
  { label: "Space Grotesk", value: "var(--font-space-grotesk)" },
  { label: "Plus Jakarta Sans", value: "var(--font-plus-jakarta)" },
  { label: "Sora", value: "var(--font-sora)" },
  { label: "Poppins", value: "var(--font-poppins)" },
  { label: "IBM Plex Sans", value: "var(--font-ibm-plex-sans)" },
  { label: "Bebas Neue", value: "var(--font-bebas-neue)" },
  { label: "Playfair Display", value: "var(--font-playfair-display)" },
  { label: "Cormorant Garamond", value: "var(--font-cormorant-garamond)" },
  { label: "Fraunces", value: "var(--font-fraunces)" },
  { label: "Libre Baskerville", value: "var(--font-libre-baskerville)" },
] as const;

const makeId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_HEADINGS: BrochureHeadings = {
  chiefPatrons: "CHIEF PATRONS",
  patrons: "PATRONS",
  convener: "CONVENER",
  coConvener: "CO-CONVENER",
  advisoryCommittee: "ACADEMIC ADVISORY COMMITTEE",
  organizingCommittee: "ORGANIZING COMMITTEE",
  registrationDetail: "REGISTRATION DETAIL",
  registrationFee: "Registration Fee:",
  registrationNote: "Note:",
  accountDetail: "ACCOUNT DETAIL",
  sponsoredBy: "IEEE Madras Section Sponsored",
  organizedBy: "Organized by",
  aboutCollege: "About SRM",
  aboutSchool: "About the School",
  aboutDepartment: "About Department",
  aboutFdp: "About the FDP",
  programHighlights: "Program Highlights:",
  topics: "Topics to be covered",
  speakers: "Eminent Speakers",
};

const DEFAULT_TEMPLATE_TEXT: Record<string, string> = {
  p1_ieeeMemberLabel: "IEEE Member",
  p1_nonIeeeMemberLabel: "Non IEEE Member",
  p1_refundableNote: "(Rs. 250 refundable upon IEEE Membership enrollment)",
  p1_bankNameLabel: "Bank Name",
  p1_accountNoLabel: "Acc No",
  p1_accountNameLabel: "Acc Name",
  p1_ifscLabel: "IFSC Code",
  p1_contactLabel: "Contact",
  p1_institutionName: "SRM Institute of Science and Technology",
  p2_dayLabel: "Day",
  p2_tableDateLabel: "Date",
  p2_tableSessionLabel: "Forenoon / Afternoon Session",
  p2_footerLeft: "MADE WITH BROCHIFY",
  p2_footerRight: "SRM-KTR",
};

export function createEmptyBrochureData(): BrochureData {
  return {
    eventTitle: "Faculty Development Program on AI Systems Design",
    department: "Department of Computational Design",
    dates: "23rd-27th March 2026",
    googleForm: "https://forms.google.com/registration-link",
    eventImage: "",
    templateText: { ...DEFAULT_TEMPLATE_TEXT },
    headings: DEFAULT_HEADINGS,
    committee: [
      { name: "Dr. N. Raman", role: "Chief Patron" },
      { name: "Dr. S. Meena", role: "Patron" },
      { name: "Prof. K. Arjun", role: "Convener" },
      { name: "Prof. T. Deepa", role: "Co-Convener" },
      { name: "Prof. V. Karthik", role: "Advisory Committee Member" },
      { name: "Prof. P. Harini", role: "Organizing Committee Member" },
    ],
    registration: {
      ieeePrice: "750",
      nonIeeePrice: "1000",
      deadline: "20th March 2026",
      notes: [
        "Registration confirmation will be sent by email.",
        "Sessions run from 9:30 AM to 4:00 PM each day.",
        "Participation certificates will be issued after completion.",
        "Participants are encouraged to bring laptops for workshops.",
      ],
    },
    accountDetails: {
      bankName: "Indian Bank",
      accountNo: "7111751848",
      accountName: "C TECH ASSOCIATION",
      accountType: "Savings",
      branch: "Kattankulathur",
      ifscCode: "IDIB000S181",
    },
    aboutCollege:
      "SRM Institute of Science and Technology is a multidisciplinary research university known for academic rigor, innovation, and industry integration. Its ecosystem combines advanced laboratories, international collaborations, entrepreneurial culture, and a strong emphasis on experiential learning. The institution consistently nurtures technically proficient graduates through interdisciplinary exposure, applied research, and structured faculty development initiatives.",
    aboutSchool:
      "The School of Computing brings together future-facing programs in software systems, artificial intelligence, data science, and digital product engineering. It promotes collaborative learning, applied research, and strong industry engagement through a curriculum aligned with modern computing practice.",
    aboutDepartment:
      "The Department of Computational Design focuses on intelligent systems, interface design, software platforms, and emerging digital workflows. It supports research-led teaching, design thinking, and advanced technical problem solving through active project-based learning.",
    aboutFdp:
      "This FDP is designed to strengthen faculty capability in AI-enabled product thinking, modern interface systems, and practical educational adoption. It combines lectures, demonstrations, and hands-on sessions to help participants translate ideas into impactful academic and industry-aligned outcomes.",
    topics: [
      {
        date: "Day 1",
        forenoon: "Foundations of AI Product Systems",
        afternoon: "Prompt Engineering for Structured Outputs",
      },
      {
        date: "Day 2",
        forenoon: "Designing Modern Educational Interfaces",
        afternoon: "Scalable Workflow Automation",
      },
      {
        date: "Day 3",
        forenoon: "Visual Communication for Technical Programs",
        afternoon: "Hands-on Brochure Design Systems",
      },
      {
        date: "Day 4",
        forenoon: "AI-Assisted Content Pipelines",
        afternoon: "Human-in-the-Loop Quality Review",
      },
      {
        date: "Day 5",
        forenoon: "Deployment, Evaluation, and Adoption",
        afternoon: "Open Clinic and Faculty Showcase",
      },
    ],
    speakers: [
      { name: "Dr. A. Suresh", role: "Professor", org: "SRM IST" },
      { name: "Dr. R. Kavya", role: "Lead Researcher", org: "AI Systems Lab" },
      { name: "Ms. N. Priya", role: "Design Director", org: "Studio North" },
      { name: "Mr. J. Vikram", role: "Product Architect", org: "Launch Stack" },
    ],
    contact: {
      name: "Prof. K. Arjun",
      mobile: "9999999999",
    },
  };
}

export function normalizeBrochureData(
  input?: Partial<BrochureData> | Record<string, unknown> | null,
): BrochureData {
  const defaults = createEmptyBrochureData();
  const source = (input ?? {}) as Partial<BrochureData>;

  return {
    ...defaults,
    ...source,
    templateText: {
      ...DEFAULT_TEMPLATE_TEXT,
      ...(isObjectNode(source.templateText)
        ? Object.fromEntries(
            Object.entries(source.templateText).map(([key, value]) => [key, `${value ?? ""}`]),
          )
        : {}),
    },
    headings: {
      ...DEFAULT_HEADINGS,
      ...(source.headings ?? {}),
    },
    registration: {
      ...defaults.registration,
      ...(source.registration ?? {}),
      notes:
        Array.isArray(source.registration?.notes) ?
          source.registration?.notes.map((note) => `${note ?? ""}`)
        : defaults.registration.notes,
    },
    accountDetails: {
      ...defaults.accountDetails,
      ...(source.accountDetails ?? {}),
    },
    committee:
      Array.isArray(source.committee) ?
        source.committee.map((member) => ({
          name: `${member?.name ?? ""}`,
          role: `${member?.role ?? ""}`,
        }))
      : defaults.committee,
    topics:
      Array.isArray(source.topics) ?
        source.topics.map((topic) => ({
          date: `${topic?.date ?? ""}`,
          forenoon: `${topic?.forenoon ?? ""}`,
          afternoon: `${topic?.afternoon ?? ""}`,
        }))
      : defaults.topics,
    speakers:
      Array.isArray(source.speakers) ?
        source.speakers.map((speaker) => ({
          name: `${speaker?.name ?? ""}`,
          role: `${speaker?.role ?? ""}`,
          org: `${speaker?.org ?? ""}`,
        }))
      : defaults.speakers,
    contact: {
      ...defaults.contact,
      ...(source.contact ?? {}),
    },
  };
}

function isIndexKey(key: string): boolean {
  return /^\d+$/.test(key);
}

function isObjectNode(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function setValueAtPath<T extends Record<string, unknown>>(
  source: T,
  path: string,
  value: unknown,
): T {
  const clone = structuredClone(source) as T;
  const keys = path.split(".");
  let cursor: Record<string, unknown> | unknown[] = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const nextIsIndex = isIndexKey(keys[index + 1]);

    if (Array.isArray(cursor)) {
      const currentIndex = Number(key);
      if (!Number.isInteger(currentIndex)) {
        return source;
      }

      const existing = cursor[currentIndex];
      if (!Array.isArray(existing) && !isObjectNode(existing)) {
        cursor[currentIndex] = nextIsIndex ? [] : {};
      }
      cursor = cursor[currentIndex] as Record<string, unknown> | unknown[];
      continue;
    }

    const existing = cursor[key];
    if (!Array.isArray(existing) && !isObjectNode(existing)) {
      cursor[key] = nextIsIndex ? [] : {};
    }
    cursor = cursor[key] as Record<string, unknown> | unknown[];
  }

  const leaf = keys[keys.length - 1];

  if (Array.isArray(cursor)) {
    const currentIndex = Number(leaf);
    if (!Number.isInteger(currentIndex)) {
      return source;
    }
    cursor[currentIndex] = value;
  } else {
    cursor[leaf] = value;
  }

  return clone;
}

export function createTextOverlay(page: 1 | 2): TextOverlayItem {
  return {
    id: makeId("text"),
    type: "text",
    page,
    x: 40,
    y: 36,
    width: 220,
    height: 88,
    rotation: 0,
    text: "Double-click to edit text",
    fontFamily: FONT_OPTIONS[3].value,
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
    align: "left",
    backgroundColor: "transparent",
  };
}

export function createShapeOverlay(
  page: 1 | 2,
  shape: ShapeOverlayItem["shape"],
): ShapeOverlayItem {
  return {
    id: makeId(shape),
    type: "shape",
    shape,
    page,
    x: 48,
    y: 48,
    width: shape === "circle" ? 120 : 180,
    height: 120,
    rotation: 0,
    fill:
      shape === "circle" ? "rgba(59,130,246,0.18)" : "rgba(14,165,233,0.14)",
    stroke: shape === "circle" ? "#1d4ed8" : "#0369a1",
    strokeWidth: 2,
    opacity: 1,
  };
}

function normalizeToken(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function createAssetIdentity(
  fileName: string,
  tags: string[] = [],
  dataUrl: string,
): Pick<BrandAsset, "id" | "slug" | "fingerprint" | "searchIndex"> {
  const base = normalizeToken(fileName.replace(/\.[^.]+$/, "")) || "asset";
  const normalizedTags = tags.map(normalizeToken).filter(Boolean);
  const fingerprint = toHash(
    `${fileName}:${dataUrl.slice(0, 120)}:${dataUrl.length}`,
  );
  const id = `${base}-${fingerprint.slice(0, 8)}`;
  const slug = `${base}-${fingerprint.slice(0, 6)}`;
  const searchIndex = [base, slug, fingerprint, ...normalizedTags].join(" ");

  return { id, slug, fingerprint, searchIndex };
}

export function parseTagInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/g)
    .map((item) => normalizeToken(item))
    .filter(Boolean);
}

export function createImageOverlay(
  page: 1 | 2,
  asset: Pick<BrandAsset, "name" | "dataUrl">,
  position?: { x: number; y: number },
): ImageOverlayItem {
  const x = position?.x ?? 54;
  const y = position?.y ?? 44;

  return {
    id: makeId("image"),
    type: "image",
    page,
    x,
    y,
    width: 180,
    height: 120,
    rotation: 0,
    src: asset.dataUrl,
    name: asset.name,
    borderRadius: 16,
  };
}

export const BRAND_ASSET_STORAGE_KEY = "brochify.brandAssets.v1";
