import type { BrochureRecord, EditorState } from "@/lib/server/types";

type DesignTemplateSeed = {
  json: string;
  width: number;
  height: number;
  name?: string | null;
};

type BridgeResult = {
  json: string;
  width: number;
  height: number;
  name: string;
};

type Palette = {
  page: string;
  header: string;
  headerText: string;
  sectionTitle: string;
  bodyText: string;
  panel: string;
};

const templatePalette: Record<EditorState["template"], Palette> = {
  whiteBlue: {
    page: "#f7fbff",
    header: "#0b4da2",
    headerText: "#ffffff",
    sectionTitle: "#0b4da2",
    bodyText: "#0f172a",
    panel: "#e6f0ff",
  },
  beigeDust: {
    page: "#fff8ee",
    header: "#b7814a",
    headerText: "#ffffff",
    sectionTitle: "#915b2c",
    bodyText: "#3f2a1c",
    panel: "#f4e6d7",
  },
  softBlue: {
    page: "#f4f8ff",
    header: "#23418f",
    headerText: "#ffffff",
    sectionTitle: "#23418f",
    bodyText: "#0f172a",
    panel: "#e8f0ff",
  },
  tealGloss: {
    page: "#f3fcfb",
    header: "#0f766e",
    headerText: "#ffffff",
    sectionTitle: "#0f766e",
    bodyText: "#0f172a",
    panel: "#dcf7f3",
  },
  yellowDust: {
    page: "#fffef4",
    header: "#b98b0d",
    headerText: "#ffffff",
    sectionTitle: "#936b00",
    bodyText: "#1f2937",
    panel: "#fff5cc",
  },
  posterFlyer: {
    page: "#1e1b4b",
    header: "#4338ca",
    headerText: "#ffffff",
    sectionTitle: "#c7d2fe",
    bodyText: "#e2e8f0",
    panel: "#312e81",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

function toMultilineList(values: string[]): string {
  return values.filter((item) => item.trim().length > 0).join("\n");
}

function buildTokenMap(brochure: BrochureRecord): Record<string, string> {
  const data = brochure.content.brochureData;

  const topicsList = data.topics
    .map((topic) => {
      const day = topic.date?.trim() || "Day";
      const forenoon = topic.forenoon?.trim() || "";
      const afternoon = topic.afternoon?.trim() || "";
      return `${day}: ${forenoon}${forenoon && afternoon ? " | " : ""}${afternoon}`.trim();
    })
    .join("\n");

  const speakersList = data.speakers
    .map((speaker) => {
      const name = speaker.name?.trim() || "Speaker";
      const role = speaker.role?.trim() || "";
      const org = speaker.org?.trim() || "";
      return `${name}${role ? ` - ${role}` : ""}${org ? `, ${org}` : ""}`;
    })
    .join("\n");

  const committeeList = data.committee
    .map((member) => {
      const name = member.name?.trim() || "Member";
      const role = member.role?.trim() || "";
      return `${name}${role ? ` - ${role}` : ""}`;
    })
    .join("\n");

  const registrationNotes = toMultilineList(data.registration.notes);

  const base: Record<string, string> = {
    title: brochure.title,
    description: brochure.description,
    eventTitle: data.eventTitle,
    department: data.department,
    dates: data.dates,
    googleForm: data.googleForm,
    aboutCollege: data.aboutCollege,
    aboutSchool: data.aboutSchool,
    aboutDepartment: data.aboutDepartment,
    aboutFdp: data.aboutFdp,
    programHighlights: data.programHighlightsText,
    programHighlightsText: data.programHighlightsText,
    topics: topicsList,
    speakers: speakersList,
    committee: committeeList,
    registrationNotes,
    ieeePrice: data.registration.ieeePrice,
    nonIeeePrice: data.registration.nonIeeePrice,
    registrationDeadline: data.registration.deadline,
    bankName: data.accountDetails.bankName,
    accountNo: data.accountDetails.accountNo,
    accountName: data.accountDetails.accountName,
    accountType: data.accountDetails.accountType,
    branch: data.accountDetails.branch,
    ifscCode: data.accountDetails.ifscCode,
    contactName: data.contact.name,
    contactMobile: data.contact.mobile,
    headingTopics: data.headings.topics,
    headingSpeakers: data.headings.speakers,
    headingProgramHighlights: data.headings.programHighlights,
    headingAboutCollege: data.headings.aboutCollege,
    headingAboutSchool: data.headings.aboutSchool,
    headingAboutDepartment: data.headings.aboutDepartment,
    headingAboutFdp: data.headings.aboutFdp,
  };

  const aliasEntries = Object.entries(base).flatMap(([key, value]) => {
    const normalized = value.trim();
    return [
      [key, normalized],
      [key.toLowerCase(), normalized],
      [`brochure.${key}`, normalized],
      [`brochureData.${key}`, normalized],
    ] as Array<[string, string]>;
  });

  return Object.fromEntries(aliasEntries);
}

function applyTokenText(text: string, tokenMap: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_full, rawKey: string) => {
    const key = rawKey.trim();
    return tokenMap[key] ?? tokenMap[key.toLowerCase()] ?? "";
  });
}

function createWorkspaceObject(width: number, height: number, fill: string) {
  return {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 0,
    top: 0,
    width,
    height,
    fill,
    stroke: null,
    strokeWidth: 0,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    name: "clip",
  };
}

function createTextbox(
  text: string,
  left: number,
  top: number,
  width: number,
  fontSize: number,
  fill: string,
  fontWeight = 400,
) {
  return {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left,
    top,
    width,
    height: Math.max(48, Math.round(fontSize * 2.8)),
    fill,
    fontFamily: "Arial",
    fontSize,
    fontWeight,
    lineHeight: 1.28,
    text,
    editable: true,
    selectable: true,
    evented: true,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  };
}

function createRect(
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  radius = 0,
) {
  return {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left,
    top,
    width,
    height,
    rx: radius,
    ry: radius,
    fill,
    stroke: null,
    strokeWidth: 0,
    selectable: true,
    evented: true,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  };
}

function createFallbackTemplateJson(brochure: BrochureRecord, width: number, height: number): string {
  const state = brochure.content;
  const data = state.brochureData;
  const palette = templatePalette[state.template] ?? templatePalette.whiteBlue;

  const margin = 48;
  const contentWidth = width - margin * 2;
  const columnGap = 24;
  const colWidth = (contentWidth - columnGap) / 2;

  const aboutSummary = [
    `${data.headings.aboutCollege}: ${data.aboutCollege}`,
    `${data.headings.aboutDepartment}: ${data.aboutDepartment}`,
  ].join("\n\n");

  const schedule = data.topics
    .map((topic) => `${topic.date}: ${topic.forenoon} | ${topic.afternoon}`)
    .join("\n");

  const speakers = data.speakers
    .map((speaker) => `${speaker.name} - ${speaker.role}${speaker.org ? `, ${speaker.org}` : ""}`)
    .join("\n");

  const registrationBlock = [
    `${data.headings.registrationFee}`,
    `IEEE: Rs.${data.registration.ieeePrice}`,
    `Non-IEEE: Rs.${data.registration.nonIeeePrice}`,
    `Deadline: ${data.registration.deadline}`,
    "",
    `${data.headings.registrationNote}`,
    ...data.registration.notes,
    "",
    `Contact: ${data.contact.name} (${data.contact.mobile})`,
    `Form: ${data.googleForm}`,
  ].join("\n");

  const objects = [
    createWorkspaceObject(width, height, palette.page),
    createRect(0, 0, width, 160, palette.header),
    createTextbox(data.eventTitle, margin, 34, contentWidth, 38, palette.headerText, 700),
    createTextbox(`${data.department} | ${data.dates}`, margin, 98, contentWidth, 20, palette.headerText, 500),
    createRect(margin, 190, colWidth, height - 250, palette.panel, 18),
    createRect(margin + colWidth + columnGap, 190, colWidth, height - 250, palette.panel, 18),
    createTextbox(data.headings.programHighlights, margin + 18, 210, colWidth - 36, 22, palette.sectionTitle, 700),
    createTextbox(data.programHighlightsText, margin + 18, 250, colWidth - 36, 16, palette.bodyText, 400),
    createTextbox(data.headings.topics, margin + 18, 530, colWidth - 36, 22, palette.sectionTitle, 700),
    createTextbox(schedule, margin + 18, 570, colWidth - 36, 15, palette.bodyText, 400),
    createTextbox(data.headings.speakers, margin + colWidth + columnGap + 18, 210, colWidth - 36, 22, palette.sectionTitle, 700),
    createTextbox(speakers, margin + colWidth + columnGap + 18, 250, colWidth - 36, 15, palette.bodyText, 400),
    createTextbox("About", margin + colWidth + columnGap + 18, 530, colWidth - 36, 22, palette.sectionTitle, 700),
    createTextbox(aboutSummary, margin + colWidth + columnGap + 18, 570, colWidth - 36, 14, palette.bodyText, 400),
    createTextbox(registrationBlock, margin, height - 220, contentWidth, 14, palette.bodyText, 500),
  ];

  return JSON.stringify({ version: "5.3.0", objects });
}

function applyTemplateJson(
  templateJson: string,
  tokenMap: Record<string, string>,
  width: number,
  height: number,
): string | null {
  try {
    const parsed = JSON.parse(templateJson) as Record<string, unknown>;
    if (!isRecord(parsed)) {
      return null;
    }

    const objects = Array.isArray(parsed.objects) ? parsed.objects : [];

    const walk = (node: unknown): void => {
      if (!isRecord(node)) {
        return;
      }

      const textValue = typeof node.text === "string" ? node.text : null;
      if (textValue !== null) {
        let nextText = applyTokenText(textValue, tokenMap);

        const dataKeyCandidates = [node.dataKey, node.name, node.id]
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0);

        for (const key of dataKeyCandidates) {
          const match = tokenMap[key] ?? tokenMap[key.toLowerCase()];
          if (match) {
            const shouldReplaceDirect = textValue.trim().length === 0 || /^\{\{.+\}\}$/.test(textValue.trim());
            if (shouldReplaceDirect || nextText === textValue) {
              nextText = match;
              break;
            }
          }
        }

        node.text = nextText;
      }

      const children = Array.isArray(node.objects) ? node.objects : null;
      if (children) {
        for (const child of children) {
          walk(child);
        }
      }
    };

    for (const object of objects) {
      walk(object);
    }

    const hasWorkspace = objects.some(
      (item) => isRecord(item) && item.name === "clip",
    );

    if (!hasWorkspace) {
      objects.unshift(createWorkspaceObject(width, height, "#ffffff"));
    }

    parsed.version = toText(parsed.version) || "5.3.0";
    parsed.objects = objects;

    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

export function createDesignProjectSeedFromBrochure(
  brochure: BrochureRecord,
  template?: DesignTemplateSeed | null,
): BridgeResult {
  const tokenMap = buildTokenMap(brochure);

  const width = template?.width && template.width > 0 ? template.width : 900;
  const height = template?.height && template.height > 0 ? template.height : 1200;

  const templateJson = template?.json ? applyTemplateJson(template.json, tokenMap, width, height) : null;

  return {
    name: brochure.title || "Untitled design",
    width,
    height,
    json: templateJson ?? createFallbackTemplateJson(brochure, width, height),
  };
}
