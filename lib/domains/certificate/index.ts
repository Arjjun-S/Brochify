import type { OverlayItem, OverlayTextAlign } from "@/lib/domains/brochure";
import { normalizeFontFamilyValue } from "@/lib/domains/brochure";

export const CERTIFICATE_PAGE_WIDTH = 1400;
export const CERTIFICATE_PAGE_HEIGHT = 990;

export const CERTIFICATE_PLACEHOLDERS = [
  "{{salutation}}",
  "{{name}}",
  "{{year}}",
  "{{date}}",
  "{{organization}}",
  "{{certificate_id}}",
  "{{verification_url}}",
  "{{gender}}",
  "{{prize}}",
  "{{event}}",
] as const;

export type CertificateTemplateName = "srm" | "beige" | "tan";
export type CertificateType = "workshop" | "hackathon" | "symposium" | "custom";

export type CertificateSignature = {
  name: string;
  designation: string;
};

export type CertificateTemplateInput = {
  certificateType: CertificateType;
  organizationName: string;
  collegeName: string;
  departmentName: string;
  eventName: string;
  certificateTitle: string;
  issueDate: string;
  bodyText: string;
  signatures: CertificateSignature[];
  logos: string[];
  signatureImage: string | null;
  footerLogos: string[];
};

export type CertificateEditorState = {
  templateInput: CertificateTemplateInput;
  overlayItems: OverlayItem[];
  template: string;
  background: {
    borderColor: string;
    backgroundImage: string;
  };
  customSignatures?: Array<{
    name: string;
    designation: string;
    src: string;
  }>;
};

export type CertificateStudentRow = {
  serialNo: string;
  salutation: string;
  name: string;
  year: string;
  gender: "Mr" | "Ms";
  prize: string;
  event: string;
  date: string;
  organization: string;
  certificateId?: string;
  verificationUrl?: string;
};

const DEFAULT_SIGNATURES: CertificateSignature[] = [
  { name: "Dr. M. Aruna", designation: "Convenor" },
  { name: "Dr. G. Niranjana", designation: "Professor & Head" },
  { name: "Dr. M. Pushpalatha", designation: "Associate Chairperson" },
];

const DEFAULT_BODY_TEXT =
  "{{salutation}} {{name}} from {{year}} has secured {{prize}} in {{event}} held on {{date}} organized by {{organization}}.";

const INTERNAL_ORGANIZATION_NAME = "SRM Institute of Science and Technology";
const INTERNAL_SCHOOL_NAME = "School of Computing";
const INTERNAL_DEPARTMENT_NAME = "Department of Computing Technologies";

export function getCertificateBodyTextForType(type: CertificateType): string {
  if (type === "workshop") {
    return "{{salutation}} {{name}} has successfully participated in {{event}} held on {{date}}.";
  }

  if (type === "hackathon") {
    return "{{salutation}} {{name}} has secured {{prize}} in {{event}} conducted on {{date}}.";
  }

  if (type === "symposium") {
    return "{{salutation}} {{name}} has presented at {{event}} on {{date}}.";
  }

  return DEFAULT_BODY_TEXT;
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createTextOverlay(options: {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight?: number;
  align?: OverlayTextAlign;
  color?: string;
  fontFamily?: string;
}): OverlayItem {
  return {
    id: createId("certificate-text"),
    type: "text",
    page: 1,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    rotation: 0,
    text: options.text,
    fontFamily: normalizeFontFamilyValue(options.fontFamily),
    fontSize: options.fontSize,
    fontWeight: options.fontWeight ?? 600,
    color: options.color ?? "#0f172a",
    align: options.align ?? "center",
    backgroundColor: "transparent",
  };
}

function createImageOverlay(options: {
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}): OverlayItem {
  return {
    id: createId("certificate-image"),
    type: "image",
    page: 1,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    rotation: 0,
    src: options.src,
    name: options.name,
    borderRadius: options.borderRadius ?? 0,
  };
}

function createSignatureBlock(signature: CertificateSignature, index: number): OverlayItem[] {
  const blockWidth = 240;
  const gutter = 60;
  const totalWidth = blockWidth * 3 + gutter * 2;
  const left = (CERTIFICATE_PAGE_WIDTH - totalWidth) / 2;
  const x = left + index * (blockWidth + gutter);

  return [
    createTextOverlay({
      text: "____________________",
      x,
      y: 558,
      width: blockWidth,
      height: 28,
      fontSize: 18,
      fontWeight: 700,
      align: "center",
      color: "#0f172a",
      fontFamily: '"Times New Roman", Times, serif',
    }),
    createTextOverlay({
      text: signature.name,
      x,
      y: 586,
      width: blockWidth,
      height: 28,
      fontSize: 17,
      fontWeight: 700,
      align: "center",
      color: "#0f172a",
      fontFamily: '"Times New Roman", Times, serif',
    }),
    createTextOverlay({
      text: signature.designation,
      x,
      y: 612,
      width: blockWidth,
      height: 28,
      fontSize: 15,
      fontWeight: 600,
      align: "center",
      color: "#334155",
      fontFamily: '"Times New Roman", Times, serif',
    }),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSignature(value: unknown): CertificateSignature | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const designation = typeof value.designation === "string" ? value.designation.trim() : "";

  if (!name && !designation) {
    return null;
  }

  return {
    name: name || "Signature",
    designation: designation || "Designation",
  };
}

function normalizeDataUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export function createDefaultCertificateTemplateInput(): CertificateTemplateInput {
  return {
    certificateType: "custom",
    organizationName: INTERNAL_ORGANIZATION_NAME,
    collegeName: INTERNAL_SCHOOL_NAME,
    departmentName: INTERNAL_DEPARTMENT_NAME,
    eventName: "Poster Presentation",
    certificateTitle: "Certificate of Appreciation",
    issueDate: new Date().toISOString().slice(0, 10),
    bodyText: DEFAULT_BODY_TEXT,
    signatures: [...DEFAULT_SIGNATURES],
    logos: [],
    signatureImage: null,
    footerLogos: [],
  };
}

export function normalizeCertificateTemplateInput(input: unknown): CertificateTemplateInput {
  const fallback = createDefaultCertificateTemplateInput();

  if (!isRecord(input)) {
    return fallback;
  }

  const signatures = Array.isArray(input.signatures)
    ? input.signatures
        .map((item) => normalizeSignature(item))
        .filter((item): item is CertificateSignature => Boolean(item))
    : fallback.signatures;

  return {
    certificateType:
      input.certificateType === "workshop" ||
      input.certificateType === "hackathon" ||
      input.certificateType === "symposium" ||
      input.certificateType === "custom"
        ? input.certificateType
        : fallback.certificateType,
    organizationName:
      typeof input.organizationName === "string" && input.organizationName.trim().length > 0
        ? input.organizationName.trim()
        : fallback.organizationName,
    collegeName:
      typeof input.collegeName === "string" && input.collegeName.trim().length > 0
        ? input.collegeName.trim()
        : fallback.collegeName,
    departmentName:
      typeof input.departmentName === "string" && input.departmentName.trim().length > 0
        ? input.departmentName.trim()
        : fallback.departmentName,
    eventName:
      typeof input.eventName === "string" && input.eventName.trim().length > 0
        ? input.eventName.trim()
        : fallback.eventName,
    certificateTitle:
      typeof input.certificateTitle === "string" && input.certificateTitle.trim().length > 0
        ? input.certificateTitle.trim()
        : fallback.certificateTitle,
    issueDate:
      typeof input.issueDate === "string" && input.issueDate.trim().length > 0
        ? input.issueDate.trim()
        : fallback.issueDate,
    bodyText:
      typeof input.bodyText === "string" && input.bodyText.trim().length > 0
        ? input.bodyText.trim()
        : fallback.bodyText,
    signatures: signatures.length > 0 ? signatures.slice(0, 5) : fallback.signatures,
    logos: normalizeDataUrlList(input.logos).slice(0, 6),
    signatureImage:
      typeof input.signatureImage === "string" && input.signatureImage.trim().length > 0
        ? input.signatureImage.trim()
        : null,
    footerLogos: normalizeDataUrlList(input.footerLogos).slice(0, 8),
  };
}

export function createCertificateOverlayLayout(
  templateInput: CertificateTemplateInput,
  template: string = "template1",
): OverlayItem[] {
  const overlays: OverlayItem[] = [];

  // 1. Institution Name (Static TextBox)
  overlays.push(
    createTextOverlay({
      text: "SRM Institute of Science and Technology",
      x: 200,
      y: 120,
      width: 1000,
      height: 40,
      fontSize: 28,
      fontWeight: 700,
      align: "center",
      color: "#0f172a",
      fontFamily: '"Times New Roman", Times, serif',
    })
  );

  // 2. Title (Static TextBox)
  overlays.push(
    createTextOverlay({
      text: "CERTIFICATE OF PARTICIPATION",
      x: 200,
      y: 220,
      width: 1000,
      height: 50,
      fontSize: 38,
      fontWeight: 700,
      align: "center",
      color: "#1e3a8a",
      fontFamily: '"Times New Roman", Times, serif',
    })
  );

  // 3. Main Body TextBox (BrochiTextBox)
  const defaultBody = "This is to certify that {salutation} {name} of {year} has secured {prize} in {event} held on {date}.";
  const mockPreview = "This is to certify that Mr Student of 2026 has secured First Place in Web Dev Hackathon held on 29 June 2026.";
  const mainBodyOverlay = createTextOverlay({
    text: mockPreview,
    x: 200,
    y: 380,
    width: 1000,
    height: 160,
    fontSize: 22,
    fontWeight: 500,
    align: "center",
    color: "#334155",
    fontFamily: '"Times New Roman", Times, serif',
  });
  (mainBodyOverlay as any).name = "brochitextbox";
  (mainBodyOverlay as any).originalText = defaultBody;
  overlays.push(mainBodyOverlay);

  // 4. QR Placeholder Entity
  overlays.push({
    id: createId("qr-placeholder"),
    type: "shape",
    page: 1,
    x: 1100,
    y: 700,
    width: 150,
    height: 150,
    rotation: 0,
    shape: "rectangle",
    fill: "rgba(148, 163, 184, 0.05)",
    stroke: "#94a3b8",
    strokeWidth: 2,
    opacity: 1,
    name: "qr-placeholder",
  } as any);

  return overlays;
}

export function createEmptyCertificateEditorState(): CertificateEditorState {
  const templateInput = createDefaultCertificateTemplateInput();
  const defaultBg = "https://res.cloudinary.com/duftjklnm/image/upload/v1777743759/brochify/certificate/template1.png";
  return {
    templateInput,
    overlayItems: createCertificateOverlayLayout(templateInput, "srm"),
    template: "template1",
    background: {
      borderColor: "#1e3a8a",
      backgroundImage: defaultBg,
    },
    customSignatures: [],
  };
}

function normalizeOverlayItem(item: unknown): OverlayItem | null {
  if (!isRecord(item)) {
    return null;
  }

  if (item.type === "group" || item.name === "qr-box" || item.name === "image-box") {
    if (item.name === "qr-box") {
      return {
        id: typeof item.id === "string" ? item.id : createId("certificate-qr-box"),
        type: "shape",
        page: 1,
        x: typeof item.left === "number" ? item.left : (typeof item.x === "number" ? item.x : 0),
        y: typeof item.top === "number" ? item.top : (typeof item.y === "number" ? item.y : 0),
        width: typeof item.width === "number" ? item.width : 150,
        height: typeof item.height === "number" ? item.height : 150,
        rotation: typeof item.angle === "number" ? item.angle : (typeof item.rotation === "number" ? item.rotation : 0),
        shape: "rectangle",
        fill: "rgba(241, 245, 249, 0.3)",
        stroke: "#cbd5e1",
        strokeWidth: 2,
        opacity: 1,
        name: "qr-box"
      } as any;
    }
    if (item.name === "image-box") {
      return {
        id: typeof item.id === "string" ? item.id : createId("certificate-image-box"),
        type: "image",
        page: 1,
        x: typeof item.left === "number" ? item.left : (typeof item.x === "number" ? item.x : 0),
        y: typeof item.top === "number" ? item.top : (typeof item.y === "number" ? item.y : 0),
        width: typeof item.width === "number" ? item.width : 150,
        height: typeof item.height === "number" ? item.height : 150,
        rotation: typeof item.angle === "number" ? item.angle : (typeof item.rotation === "number" ? item.rotation : 0),
        src: typeof item.assignedLogo === "string" ? item.assignedLogo : (typeof item.src === "string" ? item.src : ""),
        name: "image-box",
        borderRadius: 8,
        assignedLogo: typeof item.assignedLogo === "string" ? item.assignedLogo : undefined
      } as any;
    }
  }

  if (item.type === "text" || item.type === "textbox") {
    return {
      id: typeof item.id === "string" ? item.id : createId("certificate-text"),
      type: "text",
      page: 1,
      x: typeof item.left === "number" ? item.left : (typeof item.x === "number" ? item.x : 0),
      y: typeof item.top === "number" ? item.top : (typeof item.y === "number" ? item.y : 0),
      width: typeof item.width === "number" ? item.width * (typeof item.scaleX === "number" ? item.scaleX : 1) : 200,
      height: typeof item.height === "number" ? item.height * (typeof item.scaleY === "number" ? item.scaleY : 1) : 40,
      rotation: typeof item.angle === "number" ? item.angle : (typeof item.rotation === "number" ? item.rotation : 0),
      text: typeof item.text === "string" ? item.text : "",
      fontFamily: normalizeFontFamilyValue(typeof item.fontFamily === "string" ? item.fontFamily : undefined),
      fontSize: typeof item.fontSize === "number" ? item.fontSize : 18,
      fontWeight: typeof item.fontWeight === "number" ? item.fontWeight : 600,
      fontStyle: item.fontStyle === "italic" ? "italic" : "normal",
      textDecoration: item.textDecoration === "underline" ? "underline" : "none",
      color: typeof item.color === "string" ? item.color : "#0f172a",
      align:
        item.align === "left" || item.align === "right" || item.align === "justify" || item.align === "center"
          ? item.align
          : "center",
      backgroundColor: typeof item.backgroundColor === "string" ? item.backgroundColor : "transparent",
      name: typeof (item as any).name === "string" ? (item as any).name : undefined,
      originalText: typeof (item as any).originalText === "string" ? (item as any).originalText : undefined,
    } as any;
  }

  if (item.type === "image") {
    return {
      id: typeof item.id === "string" ? item.id : createId("certificate-image"),
      type: "image",
      page: 1,
      x: typeof item.left === "number" ? item.left : (typeof item.x === "number" ? item.x : 0),
      y: typeof item.top === "number" ? item.top : (typeof item.y === "number" ? item.y : 0),
      width: typeof item.width === "number" ? item.width * (typeof item.scaleX === "number" ? item.scaleX : 1) : 120,
      height: typeof item.height === "number" ? item.height * (typeof item.scaleY === "number" ? item.scaleY : 1) : 80,
      rotation: typeof item.angle === "number" ? item.angle : (typeof item.rotation === "number" ? item.rotation : 0),
      src: typeof item.src === "string" ? item.src : "",
      name: typeof item.name === "string" ? item.name : "asset",
      borderRadius: typeof item.borderRadius === "number" ? item.borderRadius : 0,
      originalSrc: typeof (item as any).originalSrc === "string" ? (item as any).originalSrc : undefined,
    };
  }

  if (item.type === "shape" || item.type === "rect" || item.type === "circle" || item.type === "triangle" || item.type === "line") {
    return {
      id: typeof item.id === "string" ? item.id : createId("certificate-shape"),
      type: "shape",
      page: 1,
      x: typeof item.left === "number" ? item.left : (typeof item.x === "number" ? item.x : 0),
      y: typeof item.top === "number" ? item.top : (typeof item.y === "number" ? item.y : 0),
      width: typeof item.width === "number" ? item.width * (typeof item.scaleX === "number" ? item.scaleX : 1) : 120,
      height: typeof item.height === "number" ? item.height * (typeof item.scaleY === "number" ? item.scaleY : 1) : 80,
      rotation: typeof item.angle === "number" ? item.angle : (typeof item.rotation === "number" ? item.rotation : 0),
      shape: item.shape === "circle" || item.type === "circle" ? "circle" : "rectangle",
      fill: typeof item.fill === "string" ? item.fill : "rgba(14,165,233,0.14)",
      stroke: typeof item.stroke === "string" ? item.stroke : "#0369a1",
      strokeWidth: typeof item.strokeWidth === "number" ? item.strokeWidth : 2,
      opacity: typeof item.opacity === "number" ? item.opacity : 1,
      name: typeof (item as any).name === "string" ? (item as any).name : undefined,
    } as any;
  }

  return null;
}

export function normalizeCertificateEditorState(input: unknown): CertificateEditorState {
  const fallback = createEmptyCertificateEditorState();
  const defaultBg = "https://res.cloudinary.com/duftjklnm/image/upload/v1777743759/brochify/certificate/template1.png";

  if (!isRecord(input)) {
    return fallback;
  }

  const templateInput = normalizeCertificateTemplateInput(input.templateInput);
  const template = typeof input.template === "string" ? input.template : "template1";
  const overlayItems = Array.isArray(input.overlayItems)
    ? input.overlayItems
        .map((item) => normalizeOverlayItem(item))
        .filter((item): item is OverlayItem => Boolean(item))
    : createCertificateOverlayLayout(templateInput, "srm");

  const background = isRecord(input.background)
    ? {
        borderColor:
          typeof input.background.borderColor === "string" && input.background.borderColor.trim().length > 0
            ? input.background.borderColor
            : fallback.background.borderColor,
        backgroundImage:
          typeof input.background.backgroundImage === "string" && input.background.backgroundImage.trim().length > 0
            ? input.background.backgroundImage
            : defaultBg,
      }
    : {
        borderColor: fallback.background.borderColor,
        backgroundImage: defaultBg,
      };

  const customSignatures = Array.isArray(input.customSignatures)
    ? input.customSignatures
        .map((sig) => {
          if (!isRecord(sig)) return null;
          return {
            name: typeof sig.name === "string" ? sig.name : "",
            designation: typeof sig.designation === "string" ? sig.designation : "",
            src: typeof sig.src === "string" ? sig.src : "",
          };
        })
        .filter((s): s is { name: string; designation: string; src: string; } => Boolean(s))
    : [];

  return {
    templateInput,
    overlayItems: overlayItems.length > 0 ? overlayItems : createCertificateOverlayLayout(templateInput, "srm"),
    template,
    background,
    customSignatures,
  };
}

export function mapGenderToHonorific(value: unknown): "Mr" | "Ms" {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (!normalized) {
    return "Mr";
  }

  if (normalized === "f" || normalized === "female" || normalized === "woman" || normalized === "girl" || normalized === "ms") {
    return "Ms";
  }

  return "Mr";
}

export function normalizeSalutation(value: unknown, fallback: "Mr" | "Ms" = "Mr"): string {
  const normalized = `${value ?? ""}`.trim();
  if (!normalized) {
    return fallback;
  }

  return normalized;
}

export function mapPrizeLabel(value: unknown): string {
  const normalized = `${value ?? ""}`.trim().toLowerCase();

  if (!normalized || normalized === "null" || normalized === "na" || normalized === "n/a" || normalized === "participation") {
    return "Participation";
  }

  if (normalized === "1" || normalized === "first" || normalized === "first place") {
    return "First Place";
  }

  if (normalized === "2" || normalized === "second" || normalized === "second place") {
    return "Second Place";
  }

  if (normalized === "3" || normalized === "third" || normalized === "third place") {
    return "Third Place";
  }

  return "Participation";
}

export function normalizeCertificateStudentRows(
  rows: Array<Record<string, unknown>>,
  defaults: { eventName: string; issueDate: string },
): CertificateStudentRow[] {
  const normalizeKey = (key: string): string =>
    key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const readByAliases = (row: Record<string, unknown>, aliases: string[]): unknown => {
    const byNormalizedKey = new Map<string, unknown>();
    for (const [key, value] of Object.entries(row)) {
      byNormalizedKey.set(normalizeKey(key), value);
    }

    for (const alias of aliases) {
      const normalizedAlias = normalizeKey(alias);
      if (byNormalizedKey.has(normalizedAlias)) {
        return byNormalizedKey.get(normalizedAlias);
      }
    }

    return undefined;
  };

  return rows
    .map((row, index) => {
      const serialCandidate = `${
        readByAliases(row, ["s.no", "sno", "serialNo", "serial", "id", "s_no", "rollNo"]) ??
        index + 1
      }`.trim();
      const name = `${readByAliases(row, ["name", "studentName", "participantName"]) ?? ""}`.trim();
      if (!name) {
        return null;
      }
      const gender = mapGenderToHonorific(readByAliases(row, ["gender", "sex"]));
      const salutation = normalizeSalutation(
        readByAliases(row, ["salutation", "title", "honorific"]),
        gender,
      );

      return {
        serialNo: serialCandidate || String(index + 1),
        salutation,
        name,
        year: `${readByAliases(row, ["year", "class", "semester", "batch"]) ?? ""}`.trim(),
        gender,
        prize: mapPrizeLabel(readByAliases(row, ["prize", "position", "rank"])),
        event:
          `${readByAliases(row, ["event", "eventName", "competition"]) ?? defaults.eventName}`.trim() ||
          defaults.eventName,
        date:
          `${readByAliases(row, ["date", "issueDate", "awardedOn"]) ?? defaults.issueDate}`.trim() ||
          defaults.issueDate,
        organization:
          `${readByAliases(row, ["organization", "organisation", "college", "institution"]) ?? ""}`.trim(),
      };
    })
    .filter((item): item is CertificateStudentRow => Boolean(item));
}

export function applyCertificatePlaceholders(
  text: string,
  student: Pick<
    CertificateStudentRow,
    "salutation" | "name" | "year" | "gender" | "prize" | "event" | "date" | "organization"
  > & {
    certificateId?: string;
    verificationUrl?: string;
  },
): string {
  return text
    // Single braces
    .replace(/\{\s*salutation\s*\}/gi, student.salutation)
    .replace(/\{\s*name\s*\}/gi, student.name)
    .replace(/\{\s*year\s*\}/gi, student.year)
    .replace(/\{\s*gender\s*\}/gi, student.gender)
    .replace(/\{\s*prize\s*\}/gi, student.prize)
    .replace(/\{\s*event\s*\}/gi, student.event)
    .replace(/\{\s*date\s*\}/gi, student.date)
    .replace(/\{\s*organization\s*\}/gi, student.organization)
    .replace(/\{\s*certificate_id\s*\}/gi, student.certificateId ?? "")
    .replace(/\{\s*verification_url\s*\}/gi, student.verificationUrl ?? "")
    // Double braces
    .replace(/\{\{\s*salutation\s*\}\}/gi, student.salutation)
    .replace(/\{\{\s*name\s*\}\}/gi, student.name)
    .replace(/\{\{\s*year\s*\}\}/gi, student.year)
    .replace(/\{\{\s*gender\s*\}\}/gi, student.gender)
    .replace(/\{\{\s*prize\s*\}\}/gi, student.prize)
    .replace(/\{\{\s*event\s*\}\}/gi, student.event)
    .replace(/\{\{\s*date\s*\}\}/gi, student.date)
    .replace(/\{\{\s*organization\s*\}\}/gi, student.organization)
    .replace(/\{\{\s*certificate_id\s*\}\}/gi, student.certificateId ?? "")
    .replace(/\{\{\s*verification_url\s*\}\}/gi, student.verificationUrl ?? "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTextAlignmentCss(align: OverlayTextAlign): string {
  if (align === "left" || align === "right" || align === "justify") {
    return align;
  }
  return "center";
}

function getItemLayerOrder(item: any): number {
  if (item.name === "qr-placeholder" || item.name === "qr-box") return 5;
  if (item.name === "signature") return 4;
  if (item.name === "image-box") return 1;
  if (item.type === "image") return 2;
  if (item.type === "text") return 3;
  return 0;
}

export function renderCertificateHtmlForStudent(
  state: CertificateEditorState,
  student: CertificateStudentRow,
): string {
  const overlayHtml = [...state.overlayItems]
    .sort((a, b) => getItemLayerOrder(a) - getItemLayerOrder(b))
    .map((item) => {
      const baseStyle = [
        `position:absolute`,
        `left:${item.x}px`,
        `top:${item.y}px`,
        `width:${item.width}px`,
        `height:${item.height}px`,
        `transform:rotate(${item.rotation}deg)`,
        `transform-origin:top left`,
      ].join(";");

      if (item.name === "qr-placeholder" || item.name === "qr-box") {
        if (student.verificationUrl) {
          return `<div style="${baseStyle};text-align:center;font-family:Arial,sans-serif;color:#334155;overflow:hidden;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=4&data=${encodeURIComponent(student.verificationUrl)}" alt="Verification QR code" style="width:100%;height:calc(100% - 14px);object-fit:contain;display:block;margin:0 auto;" />
            <div style="font-size:8px;line-height:1.2;word-break:break-all;">${escapeHtml(student.certificateId ?? "Verify")}</div>
          </div>`;
        } else {
          return `<div style="${baseStyle};border:2px dashed #94a3b8;background:rgba(148,163,184,0.05);display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:14px;color:#64748b;font-weight:bold;">QR</div>`;
        }
      }

      if (item.type === "text") {
        const pattern = (item as any).originalText || item.text;
        const text = applyCertificatePlaceholders(pattern, student);
        return `<div style="${baseStyle};font-family:${escapeHtml(item.fontFamily)};font-size:${item.fontSize}px;font-weight:${item.fontWeight};font-style:${escapeHtml(item.fontStyle || "normal")};text-decoration:${escapeHtml(item.textDecoration || "none")};color:${escapeHtml(item.color)};text-align:${getTextAlignmentCss(item.align)};white-space:pre-wrap;line-height:1.6;overflow:hidden;">${escapeHtml(text)}</div>`;
      }

      if (item.type === "image") {
        if (item.name === "image-box") {
          if (item.src) {
            return `<div style="${baseStyle};overflow:hidden;border-radius:${item.borderRadius}px;border:2px dashed #cbd5e1;background:rgba(241,245,249,0.3);"><img src="${escapeHtml(
              item.src,
            )}" alt="Inserted Logo" style="width:100%;height:100%;object-fit:cover;" /></div>`;
          } else {
            return `<div style="${baseStyle};border:2px dashed #cbd5e1;background:rgba(241,245,249,0.3);border-radius:${item.borderRadius}px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><svg style="width:48px;height:48px;fill:#cbd5e1" viewBox="0 0 24 24"><path d="M2 19h20V5H2v14zm2-12h16v10H4V7zm4 8l3-4 2 3 3-5 4 6H8z"/></svg></div>`;
          }
        }
        return `<div style="${baseStyle};overflow:hidden;border-radius:${item.borderRadius}px;"><img src="${escapeHtml(
          item.src,
        )}" alt="${escapeHtml(item.name)}" style="width:100%;height:100%;object-fit:contain;" /></div>`;
      }

      return `<div style="${baseStyle};background:${escapeHtml(item.fill)};border:${item.strokeWidth}px solid ${escapeHtml(item.stroke)};opacity:${item.opacity};${
        item.shape === "circle" ? "border-radius:9999px" : "border-radius:8px"
      };"></div>`;
    })
    .join("");

  return `
    <div class="certificate-page" style="position:relative;width:${CERTIFICATE_PAGE_WIDTH}px;height:${CERTIFICATE_PAGE_HEIGHT}px;background-image:url('${state.background.backgroundImage}');background-position:center;background-size:cover;background-color:#ffffff;border:none;box-sizing:border-box;overflow:hidden;">
      ${overlayHtml}
    </div>
  `;
}

export function getCertificateDownloadFileName(
  serialNo: string | null | undefined,
  studentName: string,
  index: number,
  extension: "pdf" | "png" | "jpg",
): string {
  const serialText = `${serialNo ?? ""}`.trim();
  const cleanName = studentName
    .trim()
    .replace(/[^a-zA-Z0-9\s_]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 30);

  if (serialText) {
    const paddedSerial = /^\d+$/.test(serialText)
      ? String(Number(serialText)).padStart(3, "0")
      : serialText.slice(0, 10);
    return `${paddedSerial}_${cleanName}.${extension}`;
  }

  const paddedIndex = String(index + 1).padStart(3, "0");
  return `serialNo_${paddedIndex}.${extension}`;
}
