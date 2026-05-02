import type { OverlayItem, OverlayTextAlign } from "@/lib/domains/brochure";
import { normalizeFontFamilyValue } from "@/lib/domains/brochure";

export const CERTIFICATE_PAGE_WIDTH = 983;
export const CERTIFICATE_PAGE_HEIGHT = 680;

export const CERTIFICATE_PLACEHOLDERS = ["{{name}}", "{{gender}}", "{{prize}}", "{{event}}", "{{date}}"] as const;

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
  template: CertificateTemplateName;
  background: {
    borderColor: string;
    backgroundImage: string;
  };
};

export type CertificateStudentRow = {
  serialNo: string;
  name: string;
  year: string;
  gender: "Mr" | "Ms";
  prize: string;
  event: string;
  date: string;
};

const DEFAULT_SIGNATURES: CertificateSignature[] = [
  { name: "Dr. M. Aruna", designation: "Convenor" },
  { name: "Dr. G. Niranjana", designation: "Professor & Head" },
  { name: "Dr. M. Pushpalatha", designation: "Associate Chairperson" },
];

const DEFAULT_BODY_TEXT =
  "{{gender}} {{name}} from {{year}} has secured {{prize}} in {{event}} held on {{date}} organized by the Department of Computing Technologies, School of Computing, S.R.M. Institute of Science and Technology, Kattankulathur, Chennai, Tamil Nadu.";

const INTERNAL_ORGANIZATION_NAME = "SRM Institute of Science and Technology";
const INTERNAL_SCHOOL_NAME = "School of Computing";
const INTERNAL_DEPARTMENT_NAME = "Department of Computing Technologies";

export function getCertificateBodyTextForType(type: CertificateType): string {
  if (type === "workshop") {
    return "{{gender}} {{name}} has successfully participated in {{event}} held on {{date}}.";
  }

  if (type === "hackathon") {
    return "{{gender}} {{name}} has secured {{prize}} in {{event}} conducted on {{date}}.";
  }

  if (type === "symposium") {
    return "{{gender}} {{name}} has presented at {{event}} on {{date}}.";
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
  template: CertificateTemplateName = "srm",
): OverlayItem[] {
  const overlays: OverlayItem[] = [];

  const palette =
    template === "beige"
      ? {
          title: "#8a5a1f",
          accent: "#4a3423",
          body: "#3d2a1c",
          border: "#9a6b3a",
          surface: "#fff7eb",
          background: "linear-gradient(145deg, rgba(255,247,235,1) 0%, rgba(239,222,197,1) 100%)",
        }
      : template === "tan"
        ? {
            title: "#6b4e24",
            accent: "#35261b",
            body: "#2f241a",
            border: "#8a6638",
            surface: "#fff8ef",
            background: "linear-gradient(145deg, rgba(255,248,239,1) 0%, rgba(245,220,188,1) 100%)",
          }
        : {
            title: "#7f1d1d",
            accent: "#0f172a",
            body: "#111827",
            border: "#1e3a8a",
            surface: "#ffffff",
            background: "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(241,245,249,1) 100%)",
          };

  const topLogos = templateInput.logos.slice(0, 6);
  const logoWidth = 98;
  const logoHeight = 68;
  const logoGap = 14;
  const topRowWidth = topLogos.length * logoWidth + Math.max(0, topLogos.length - 1) * logoGap;
  const topRowStartX = Math.max(20, (CERTIFICATE_PAGE_WIDTH - topRowWidth) / 2);

  topLogos.forEach((logo, index) => {
    overlays.push(
      createImageOverlay({
        src: logo,
        name: `logo-${index + 1}`,
        x: topRowStartX + index * (logoWidth + logoGap),
        y: 28,
        width: logoWidth,
        height: logoHeight,
        borderRadius: 2,
      }),
    );
  });

  overlays.push(
    createTextOverlay({
      text: templateInput.organizationName.toUpperCase(),
      x: 90,
      y: 118,
      width: 803,
      height: 42,
      fontSize: 36,
      fontWeight: 600,
      align: "center",
      color: palette.accent,
      fontFamily: '"Times New Roman", Times, serif',
    }),
  );

  overlays.push(
    createTextOverlay({
      text: templateInput.collegeName,
      x: 130,
      y: 165,
      width: 723,
      height: 28,
      fontSize: 22,
      fontWeight: 700,
      align: "center",
      color: palette.accent,
      fontFamily: '"Times New Roman", Times, serif',
    }),
  );

  overlays.push(
    createTextOverlay({
      text: templateInput.departmentName,
      x: 130,
      y: 195,
      width: 723,
      height: 28,
      fontSize: 22,
      fontWeight: 700,
      align: "center",
      color: palette.accent,
      fontFamily: '"Times New Roman", Times, serif',
    }),
  );

  overlays.push(
    createTextOverlay({
      text: templateInput.certificateTitle.toUpperCase(),
      x: 120,
      y: 242,
      width: 743,
      height: 56,
      fontSize: 44,
      fontWeight: 700,
      align: "center",
      color: "#6b4f2a",
      fontFamily: '"Times New Roman", Times, serif',
    }),
  );

  overlays.push(
    createTextOverlay({
      text: "{{name}}",
      x: 150,
      y: 320,
      width: 683,
      height: 54,
      fontSize: 40,
      fontWeight: 600,
      align: "center",
      color: palette.title,
      fontFamily: '"Lobster", cursive',
    }),
  );

  overlays.push(
    createTextOverlay({
      text: templateInput.bodyText,
      x: 110,
      y: 398,
      width: 763,
      height: 118,
      fontSize: 22,
      fontWeight: 500,
      align: "center",
      color: palette.body,
      fontFamily: '"Times New Roman", Times, serif',
    }),
  );

  const signatures = templateInput.signatures.slice(0, 3);
  signatures.forEach((signature, index) => {
    overlays.push(...createSignatureBlock(signature, index));
  });

  if (templateInput.signatureImage) {
    overlays.push(
      createImageOverlay({
        src: templateInput.signatureImage,
        name: "signature-image",
        x: CERTIFICATE_PAGE_WIDTH / 2 - 82,
        y: 508,
        width: 164,
        height: 48,
        borderRadius: 0,
      }),
    );
  }

  const footerLogos = templateInput.footerLogos.slice(0, 6);
  footerLogos.forEach((logo, index) => {
    overlays.push(
      createImageOverlay({
        src: logo,
        name: `footer-logo-${index + 1}`,
        x: 38 + index * 80,
        y: 642,
        width: 66,
        height: 30,
        borderRadius: 0,
      }),
    );
  });

  return overlays;
}

export function createEmptyCertificateEditorState(): CertificateEditorState {
  const templateInput = createDefaultCertificateTemplateInput();
  return {
    templateInput,
    overlayItems: createCertificateOverlayLayout(templateInput, "srm"),
    template: "srm",
    background: {
      borderColor: "#1e3a8a",
      backgroundImage: "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(241,245,249,1) 100%)",
    },
  };
}

function normalizeOverlayItem(item: unknown): OverlayItem | null {
  if (!isRecord(item)) {
    return null;
  }

  if (item.type === "text") {
    return {
      id: typeof item.id === "string" ? item.id : createId("certificate-text"),
      type: "text",
      page: 1,
      x: typeof item.x === "number" ? item.x : 0,
      y: typeof item.y === "number" ? item.y : 0,
      width: typeof item.width === "number" ? item.width : 200,
      height: typeof item.height === "number" ? item.height : 40,
      rotation: typeof item.rotation === "number" ? item.rotation : 0,
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
    };
  }

  if (item.type === "image") {
    return {
      id: typeof item.id === "string" ? item.id : createId("certificate-image"),
      type: "image",
      page: 1,
      x: typeof item.x === "number" ? item.x : 0,
      y: typeof item.y === "number" ? item.y : 0,
      width: typeof item.width === "number" ? item.width : 120,
      height: typeof item.height === "number" ? item.height : 80,
      rotation: typeof item.rotation === "number" ? item.rotation : 0,
      src: typeof item.src === "string" ? item.src : "",
      name: typeof item.name === "string" ? item.name : "asset",
      borderRadius: typeof item.borderRadius === "number" ? item.borderRadius : 0,
    };
  }

  if (item.type === "shape") {
    return {
      id: typeof item.id === "string" ? item.id : createId("certificate-shape"),
      type: "shape",
      page: 1,
      x: typeof item.x === "number" ? item.x : 0,
      y: typeof item.y === "number" ? item.y : 0,
      width: typeof item.width === "number" ? item.width : 120,
      height: typeof item.height === "number" ? item.height : 80,
      rotation: typeof item.rotation === "number" ? item.rotation : 0,
      shape: item.shape === "circle" ? "circle" : "rectangle",
      fill: typeof item.fill === "string" ? item.fill : "rgba(14,165,233,0.14)",
      stroke: typeof item.stroke === "string" ? item.stroke : "#0369a1",
      strokeWidth: typeof item.strokeWidth === "number" ? item.strokeWidth : 2,
      opacity: typeof item.opacity === "number" ? item.opacity : 1,
    };
  }

  return null;
}

export function normalizeCertificateEditorState(input: unknown): CertificateEditorState {
  const fallback = createEmptyCertificateEditorState();

  if (!isRecord(input)) {
    return fallback;
  }

  const templateInput = normalizeCertificateTemplateInput(input.templateInput);
  const template: CertificateTemplateName = input.template === "beige" || input.template === "tan" ? input.template : "srm";
  const overlayItems = Array.isArray(input.overlayItems)
    ? input.overlayItems
        .map((item) => normalizeOverlayItem(item))
        .filter((item): item is OverlayItem => Boolean(item))
    : createCertificateOverlayLayout(templateInput, template);

  const background = isRecord(input.background)
    ? {
        borderColor:
          typeof input.background.borderColor === "string" && input.background.borderColor.trim().length > 0
            ? input.background.borderColor
            : fallback.background.borderColor,
        backgroundImage:
          typeof input.background.backgroundImage === "string" && input.background.backgroundImage.trim().length > 0
            ? input.background.backgroundImage
            : fallback.background.backgroundImage,
      }
    : fallback.background;

  return {
    templateInput,
    overlayItems: overlayItems.length > 0 ? overlayItems : createCertificateOverlayLayout(templateInput, template),
    template,
    background,
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

      return {
        serialNo: serialCandidate || String(index + 1),
        name,
        year: `${readByAliases(row, ["year", "class", "semester", "batch"]) ?? ""}`.trim(),
        gender: mapGenderToHonorific(readByAliases(row, ["gender", "sex"])),
        prize: mapPrizeLabel(readByAliases(row, ["prize", "position", "rank"])),
        event:
          `${readByAliases(row, ["event", "eventName", "competition"]) ?? defaults.eventName}`.trim() ||
          defaults.eventName,
        date:
          `${readByAliases(row, ["date", "issueDate", "awardedOn"]) ?? defaults.issueDate}`.trim() ||
          defaults.issueDate,
      };
    })
    .filter((item): item is CertificateStudentRow => Boolean(item));
}

export function applyCertificatePlaceholders(
  text: string,
  student: Pick<CertificateStudentRow, "name" | "gender" | "prize" | "event" | "date">,
): string {
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, student.name)
    .replace(/\{\{\s*gender\s*\}\}/gi, student.gender)
    .replace(/\{\{\s*prize\s*\}\}/gi, student.prize)
    .replace(/\{\{\s*event\s*\}\}/gi, student.event)
    .replace(/\{\{\s*date\s*\}\}/gi, student.date);
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

export function renderCertificateHtmlForStudent(
  state: CertificateEditorState,
  student: CertificateStudentRow,
): string {
  const overlayHtml = state.overlayItems
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

      if (item.type === "text") {
        const text = applyCertificatePlaceholders(item.text, student);
        return `<div style="${baseStyle};font-family:${escapeHtml(item.fontFamily)};font-size:${item.fontSize}px;font-weight:${item.fontWeight};font-style:${escapeHtml(item.fontStyle || "normal")};text-decoration:${escapeHtml(item.textDecoration || "none")};color:${escapeHtml(item.color)};text-align:${getTextAlignmentCss(item.align)};white-space:pre-wrap;line-height:1.6;overflow:hidden;">${escapeHtml(text)}</div>`;
      }

      if (item.type === "image") {
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
    <div class="certificate-page" style="position:relative;width:${CERTIFICATE_PAGE_WIDTH}px;height:${CERTIFICATE_PAGE_HEIGHT}px;background-image:${state.background.backgroundImage};background-color:#ffffff;border:6px solid ${state.background.borderColor};box-sizing:border-box;overflow:hidden;">
      ${overlayHtml}
    </div>
  `;
}

export function getCertificateDownloadFileName(
  serialNo: string | null | undefined,
  index: number,
  extension: "pdf" | "png" | "jpg",
): string {
  const serialText = `${serialNo ?? ""}`.trim();

  let suffix = "";
  if (/^\d+$/.test(serialText)) {
    suffix = String(Number(serialText)).padStart(2, "0");
  } else if (serialText) {
    suffix = serialText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24);
  }

  if (!suffix) {
    suffix = String(index + 1).padStart(2, "0");
  }

  return `serialNo_${suffix}.${extension}`;
}
