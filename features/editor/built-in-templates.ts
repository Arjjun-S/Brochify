import type { BrochureType } from "./types";

export type BuiltInTemplate = {
  id: string;
  name: string;
  width: number;
  height: number;
  json: string;
  thumbnailColor: string;
};

function workspace(w: number, h: number, fill: string) {
  return {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill,
    stroke: null,
    strokeWidth: 0,
    selectable: false,
    evented: false,
    hasControls: false,
    name: "clip",
    shadow: { color: "rgba(0,0,0,0.8)", blur: 5 },
  };
}

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  rx = 0,
  options?: {
    stroke?: string | null;
    strokeWidth?: number;
    strokeDashArray?: number[];
    selectable?: boolean;
    evented?: boolean;
    hasControls?: boolean;
    name?: string;
    pageIndex?: number;
  },
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
    rx,
    ry: rx,
    fill,
    stroke: options?.stroke ?? null,
    strokeWidth: options?.strokeWidth ?? 0,
    strokeDashArray: options?.strokeDashArray,
    selectable: options?.selectable ?? false,
    evented: options?.evented ?? (options?.selectable ?? false),
    hasControls: options?.hasControls ?? (options?.selectable ?? false),
    name: options?.name,
    pageIndex: options?.pageIndex,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  };
}

function text(
  value: string,
  left: number,
  top: number,
  width: number,
  fontSize: number,
  fill: string,
  fontWeight = 400,
  fontFamily = "Arial",
  textAlign = "left",
  options?: {
    editable?: boolean;
    selectable?: boolean;
    evented?: boolean;
    hasControls?: boolean;
    name?: string;
    pageIndex?: number;
  },
) {
  return {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left,
    top,
    width,
    height: Math.max(40, Math.round(fontSize * 2.5)),
    fill,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight: 1.3,
    textAlign,
    text: value,
    editable: options?.editable ?? true,
    selectable: options?.selectable ?? true,
    evented: options?.evented ?? (options?.selectable ?? true),
    hasControls: options?.hasControls ?? (options?.selectable ?? true),
    name: options?.name,
    pageIndex: options?.pageIndex,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  };
}

function line(x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth = 1) {
  return {
    type: "line",
    version: "5.3.0",
    x1,
    y1,
    x2,
    y2,
    left: x1,
    top: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    stroke,
    strokeWidth,
    selectable: false,
    evented: false,
    hasControls: false,
  };
}

function circle(
  left: number,
  top: number,
  radius: number,
  fill: string,
  options?: {
    stroke?: string | null;
    strokeWidth?: number;
    strokeDashArray?: number[];
    selectable?: boolean;
    evented?: boolean;
    hasControls?: boolean;
  },
) {
  return {
    type: "circle",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left,
    top,
    radius,
    fill,
    stroke: options?.stroke ?? null,
    strokeWidth: options?.strokeWidth ?? 0,
    strokeDashArray: options?.strokeDashArray,
    selectable: options?.selectable ?? false,
    evented: options?.evented ?? (options?.selectable ?? false),
    hasControls: options?.hasControls ?? (options?.selectable ?? false),
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  };
}

function sectionHeader(
  left: number,
  top: number,
  width: number,
  label: string,
  fill = "#0b4ca8",
  labelColor = "#ffffff",
) {
  return [
    rect(left, top, width, 30, fill, 8),
    text(label, left + 10, top + 6, width - 20, 13, labelColor, 700, "Arial", "left", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),
  ];
}

function placeholderBox(
  left: number,
  top: number,
  width: number,
  height: number,
  label: string,
) {
  return [
    rect(left, top, width, height, "#ffffff", 10, {
      stroke: "#2563eb",
      strokeWidth: 2,
      strokeDashArray: [8, 6],
      selectable: true,
      evented: true,
      hasControls: true,
    }),
    text(`[${label}]`, left + 8, top + height / 2 - 10, width - 16, 14, "#1d4ed8", 700, "Arial", "center"),
  ];
}

// ─── Trifold Templates ──────────────────────────────────────────────────

const TRI_SIDE_W = 1754;
const TRI_SIDE_H = 1240;
const TRI_PAGE_GAP = 120;
const TRI_OUTER_MARGIN = 40;
const W_TRI = TRI_SIDE_W * 2 + TRI_PAGE_GAP + TRI_OUTER_MARGIN * 2;
const H_TRI = TRI_SIDE_H;
const TRI_PANEL_W = TRI_SIDE_W / 3;

function trifoldFdpTwoSide(): BuiltInTemplate {
  const frontPageX = TRI_OUTER_MARGIN;
  const backPageX = TRI_OUTER_MARGIN + TRI_SIDE_W + TRI_PAGE_GAP;

  const frontLeftX = frontPageX;
  const frontMiddleX = frontPageX + TRI_PANEL_W;
  const frontRightX = frontPageX + TRI_PANEL_W * 2;

  const backLeftX = backPageX;
  const backMiddleX = backPageX + TRI_PANEL_W;
  const backRightX = backPageX + TRI_PANEL_W * 2;

  const tableX = backRightX + 20;
  const tableY = 92;
  const tableW = TRI_PANEL_W - 40;
  const rowH = 86;

  const objects = [
    workspace(W_TRI, H_TRI, "#e5e7eb"),

    rect(frontPageX, 0, TRI_SIDE_W, H_TRI, "#ffffff", 16, {
      stroke: "#94a3b8",
      strokeWidth: 2,
      name: "page-frame",
      pageIndex: 1,
    }),
    rect(backPageX, 0, TRI_SIDE_W, H_TRI, "#ffffff", 16, {
      stroke: "#94a3b8",
      strokeWidth: 2,
      name: "page-frame",
      pageIndex: 2,
    }),
    text("PAGE 1 - OUTER SIDE", frontPageX + 14, 8, 220, 12, "#334155", 700, "Arial", "left", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
      name: "page-label",
      pageIndex: 1,
    }),
    text("PAGE 2 - INNER SIDE", backPageX + 14, 8, 220, 12, "#334155", 700, "Arial", "left", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
      name: "page-label",
      pageIndex: 2,
    }),

    rect(frontMiddleX, 0, TRI_PANEL_W, H_TRI, "#0b4ca8"),
    rect(backLeftX, 0, TRI_PANEL_W, H_TRI, "#0a4a96"),
    rect(backMiddleX, 0, TRI_PANEL_W, H_TRI, "#f5f7fb"),
    rect(backRightX, 0, TRI_PANEL_W, H_TRI, "#0b4ca8"),

    line(frontPageX + TRI_PANEL_W, 0, frontPageX + TRI_PANEL_W, H_TRI, "#dbeafe", 1),
    line(frontPageX + TRI_PANEL_W * 2, 0, frontPageX + TRI_PANEL_W * 2, H_TRI, "#dbeafe", 1),
    line(backPageX + TRI_PANEL_W, 0, backPageX + TRI_PANEL_W, H_TRI, "#93c5fd", 1),
    line(backPageX + TRI_PANEL_W * 2, 0, backPageX + TRI_PANEL_W * 2, H_TRI, "#93c5fd", 1),
    line(frontPageX + TRI_SIDE_W + TRI_PAGE_GAP / 2, 0, frontPageX + TRI_SIDE_W + TRI_PAGE_GAP / 2, H_TRI, "#64748b", 2),

    // FRONT SIDE - Panel 1 (Committees)
    rect(frontLeftX + 18, 24, TRI_PANEL_W - 36, H_TRI - 48, "#f8fbff", 16, {
      stroke: "#3b82f6",
      strokeWidth: 2,
    }),

    ...sectionHeader(frontLeftX + 34, 40, TRI_PANEL_W - 68, "ADVISORY COMMITTEE"),
    text(
      "Dr. P. Sathivel, Chair, IEEE Madras Section\nDr. S. Radha, Secretary, IEEE Madras Section\nDr. S. Brindha, Treasurer, IEEE Madras Section\nDr. S. Arumugaperumal, Vice Chair, IEEE Madras Section",
      frontLeftX + 38,
      78,
      TRI_PANEL_W - 76,
      11,
      "#0f172a",
      500,
    ),

    ...sectionHeader(frontLeftX + 34, 196, TRI_PANEL_W - 68, "ORGANIZING COMMITTEE"),
    text(
      "CHIEF PATRONS\nDr. T. R. Paarivendhar, Chancellor, SRMIST\nDr. Ravi Pachamoothoo, Pro-Chancellor, SRMIST\n\nPATRONS\nDr. C. Muthamizhchelvan, Vice Chancellor, SRMIST, KTR\nDr. S. Ponnusamy, Registrar, SRMIST, KTR",
      frontLeftX + 38,
      234,
      TRI_PANEL_W - 76,
      11,
      "#0f172a",
      500,
    ),

    ...sectionHeader(frontLeftX + 34, 504, TRI_PANEL_W - 68, "ACADEMIC ADVISORY COMMITTEE"),
    text(
      "Dr. Leenus Jesu Martin M\nDr. Sridhar S S\nDr. Revathi Venkatasamy\nDr. M. Pushpalatha\nDr. C. Lokasami\nDr. S. Niranjana",
      frontLeftX + 38,
      542,
      TRI_PANEL_W - 76,
      11,
      "#0f172a",
      500,
    ),

    ...sectionHeader(frontLeftX + 34, 760, TRI_PANEL_W - 68, "CONVENER / CO-CONVENER / CO-ORDINATORS"),
    text(
      "Dr. Gokulakrishnan D, Associate Professor, CTECH\nDr. K. Kishore Anthony, Assistant Professor, CTECH\nDr. Muralidharan C, Assistant Professor, CTECH\nDr. Arulalan V, Assistant Professor, CTECH\nDr. Arunachalam N, Assistant Professor, CTECH\nDr. Abirami G, Assistant Professor, CTECH\nDr. Balamurugan G, Associate Professor, CTECH\nDr. V. Vijayakumar K, Assistant Professor, CTECH",
      frontLeftX + 38,
      798,
      TRI_PANEL_W - 76,
      10,
      "#0f172a",
      500,
    ),

    // FRONT SIDE - Panel 2 (Registration, QR, Account, Contact)
    rect(frontMiddleX + 92, 20, TRI_PANEL_W - 184, 42, "#ffffff", 22),
    text("REGISTRATION DETAIL", frontMiddleX + 102, 31, TRI_PANEL_W - 204, 20, "#0b4ca8", 700, "Arial", "center", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),

    rect(frontMiddleX + 20, 82, TRI_PANEL_W - 40, 560, "#0d55c9", 10, {
      stroke: "#93c5fd",
      strokeWidth: 2,
    }),
    text(
      "Registration Fee:\nIEEE Member            : Rs. 500/-\nNon IEEE Member        : Rs. 750/-\n(Refundable for IEEE membership enrollment)\nLast date for registration: 19th March 2026\nRegistration Link: https://forms.gle/TEMPLATE-LINK\n\nNote:\n• Registration confirmation by mail\n• Session timing: 9:30 AM - 4:00 PM\n• Registration is compulsory for all participants\n• Participation certificate provided by IEEE\n• Laptops are required for hands-on sessions",
      frontMiddleX + 34,
      106,
      TRI_PANEL_W - 68,
      14,
      "#ffffff",
      500,
    ),
    ...placeholderBox(frontMiddleX + TRI_PANEL_W / 2 - 88, 276, 176, 176, "QR PLACEHOLDER"),

    rect(frontMiddleX + 92, 662, TRI_PANEL_W - 184, 40, "#ffffff", 20),
    text("ACCOUNT DETAIL", frontMiddleX + 102, 671, TRI_PANEL_W - 204, 18, "#0b4ca8", 700, "Arial", "center", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),
    rect(frontMiddleX + 20, 710, TRI_PANEL_W - 40, 194, "#0d55c9", 10, {
      stroke: "#93c5fd",
      strokeWidth: 2,
    }),
    text(
      "Bank Name : Indian Bank\nAccount No : 7111751848\nAccount Name : COMPUTER SCIENCE AND ENGG ASSOCIATION\nAccount Type : SB\nBranch : SRM University, Kattankulathur\nIFSC Code : IDIB000S181",
      frontMiddleX + 34,
      734,
      TRI_PANEL_W - 68,
      15,
      "#ffffff",
      500,
    ),

    rect(frontMiddleX + 112, 920, TRI_PANEL_W - 224, 38, "#ffffff", 19),
    text("CONTACT DETAILS", frontMiddleX + 122, 928, TRI_PANEL_W - 244, 17, "#0b4ca8", 700, "Arial", "center", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),
    rect(frontMiddleX + 20, 966, TRI_PANEL_W - 40, 230, "#eef4ff", 10, {
      stroke: "#93c5fd",
      strokeWidth: 2,
    }),
    text(
      "Dr. Gokulakrishnan D\nAssociate Professor, CTECH\nMobile: +91 98765 43210\n\nDr. Muralidharan C\nAssistant Professor, CTECH\nMobile: +91 90000 12345\n\nEmail: fdp@srm.edu.in",
      frontMiddleX + 34,
      990,
      TRI_PANEL_W - 68,
      13,
      "#0f172a",
      500,
    ),

    // FRONT SIDE - Panel 3 (Cover)
    ...placeholderBox(frontRightX + 18, 18, 130, 52, "LOGO 1"),
    ...placeholderBox(frontRightX + 157, 18, 130, 52, "LOGO 2"),
    ...placeholderBox(frontRightX + 296, 18, 130, 52, "LOGO 3"),
    ...placeholderBox(frontRightX + 435, 18, 130, 52, "LOGO 4"),

    text("IEEE Madras Section Sponsored", frontRightX + 34, 96, TRI_PANEL_W - 68, 34, "#111827", 700, "Arial", "center"),
    text("Five Days Faculty Development Program on", frontRightX + 34, 144, TRI_PANEL_W - 68, 34, "#111827", 700, "Arial", "center"),

    rect(frontRightX + 40, 262, TRI_PANEL_W - 80, 188, "#fde047", 6, {
      stroke: "#facc15",
      strokeWidth: 1,
    }),
    text(
      "DEMYSTIFYING GENERATIVE\nAI: FROM FOUNDATIONS TO\nFRONTIERS",
      frontRightX + 52,
      284,
      TRI_PANEL_W - 104,
      44,
      "#111827",
      800,
      "Arial",
      "center",
    ),

    text("23rd - 27th March, 2026", frontRightX + 34, 474, TRI_PANEL_W - 68, 36, "#111827", 700, "Arial", "center"),

    circle(frontRightX + 182, 552, 74, "#dbeafe", {
      stroke: "#38bdf8",
      strokeWidth: 3,
      selectable: true,
      evented: true,
      hasControls: true,
      strokeDashArray: [8, 6],
    }),
    circle(frontRightX + 330, 552, 74, "#dbeafe", {
      stroke: "#38bdf8",
      strokeWidth: 3,
      selectable: true,
      evented: true,
      hasControls: true,
      strokeDashArray: [8, 6],
    }),
    line(frontRightX + 256, 624, frontRightX + 330, 624, "#38bdf8", 4),
    text("[ICON A]", frontRightX + 190, 610, 58, 14, "#0369a1", 700, "Arial", "center"),
    text("[ICON B]", frontRightX + 338, 610, 58, 14, "#0369a1", 700, "Arial", "center"),

    text("Organized by", frontRightX + 34, 746, TRI_PANEL_W - 68, 28, "#111827", 700, "Arial", "center"),
    text("Department of Computing Technologies\nSchool of Computing\nin association with\nAdvanced Multilingual Computing Vertical", frontRightX + 34, 780, TRI_PANEL_W - 68, 17, "#111827", 500, "Arial", "center"),

    text("SRM Institute of Science and Technology", frontRightX + 34, 968, TRI_PANEL_W - 68, 16, "#111827", 700, "Arial", "center"),
    text("Kattankulathur - 603203, Chengalpattu Dist., TN", frontRightX + 34, 992, TRI_PANEL_W - 68, 14, "#111827", 500, "Arial", "center"),

    ...placeholderBox(frontRightX + 18, 1042, 100, 46, "LOGO A"),
    ...placeholderBox(frontRightX + 127, 1042, 100, 46, "LOGO B"),
    ...placeholderBox(frontRightX + 236, 1042, 100, 46, "LOGO C"),
    ...placeholderBox(frontRightX + 345, 1042, 100, 46, "LOGO D"),
    ...placeholderBox(frontRightX + 454, 1042, 110, 46, "LOGO E"),

    // BACK SIDE - Panel 4 (About SRM)
    text("About SRM", backLeftX + 36, 42, TRI_PANEL_W - 72, 36, "#ffffff", 800, "Arial", "center"),
    text(
      "SRM Institute of Science and Technology, Chennai, India is one of the top ranking institutions in India with over 60,000 students and 6,000 faculty members. SRM has state-of-the-art infrastructure, smart classrooms, high-tech labs and world class research facilities.\n\nThe institute is placed in Category-I by UGC and accredited by NAAC with highest grade. SRM is known for multidisciplinary research, innovation and strong global collaborations.",
      backLeftX + 34,
      102,
      TRI_PANEL_W - 68,
      14,
      "#e2e8f0",
      500,
    ),
    text("About the School", backLeftX + 36, 634, TRI_PANEL_W - 72, 32, "#ffffff", 800, "Arial", "center"),
    text(
      "The School of Computing is among the largest in SRM with over 1000 students and 500 faculty members. Departments include CSE, CTECH, AI and DS, Software Engineering, Networks and Communications. Programs are offered at UG, PG and doctoral levels with strong industry alignment.",
      backLeftX + 34,
      684,
      TRI_PANEL_W - 68,
      14,
      "#e2e8f0",
      500,
    ),

    // BACK SIDE - Panel 5 (Department + FDP)
    text("About the Computing Technologies", backMiddleX + 30, 34, TRI_PANEL_W - 60, 32, "#111827", 800),
    text(
      "The Department of Computing Technologies (CTECH) fosters cutting-edge innovation and interdisciplinary education in Computer Science and Engineering. The department contributes to national and international research while nurturing students for impactful careers.",
      backMiddleX + 30,
      86,
      TRI_PANEL_W - 60,
      14,
      "#334155",
      500,
    ),

    text("About the FDP", backMiddleX + 30, 406, TRI_PANEL_W - 60, 32, "#111827", 800),
    text(
      "The Faculty Development Program on AI to Generative AI explores concepts, techniques and research pathways from foundational AI to practical GenAI systems.\n\nDay 1 : Intro to AI and Generative AI\nDay 2 : Retrieval-Augmented Generation\nDay 3 : GenAI for agriculture and healthcare\nDay 4 : Multimodal AI and agentic systems\nDay 5 : Research problem formulation, proposal writing and funding paths",
      backMiddleX + 30,
      458,
      TRI_PANEL_W - 60,
      14,
      "#334155",
      500,
    ),

    // BACK SIDE - Panel 6 (Topics + Eminent Speakers)
    text("Topics to be covered", backRightX + 34, 38, TRI_PANEL_W - 68, 34, "#ffffff", 800, "Arial", "center"),

    rect(tableX, tableY, tableW, 44 + rowH * 5, "#0b4ca8", 8, {
      stroke: "#bfdbfe",
      strokeWidth: 2,
    }),
    line(tableX + 86, tableY, tableX + 86, tableY + 44 + rowH * 5, "#bfdbfe", 1),
    line(tableX + tableW * 0.57, tableY, tableX + tableW * 0.57, tableY + 44 + rowH * 5, "#bfdbfe", 1),
    line(tableX, tableY + 44, tableX + tableW, tableY + 44, "#bfdbfe", 1),
    line(tableX, tableY + 44 + rowH, tableX + tableW, tableY + 44 + rowH, "#bfdbfe", 1),
    line(tableX, tableY + 44 + rowH * 2, tableX + tableW, tableY + 44 + rowH * 2, "#bfdbfe", 1),
    line(tableX, tableY + 44 + rowH * 3, tableX + tableW, tableY + 44 + rowH * 3, "#bfdbfe", 1),
    line(tableX, tableY + 44 + rowH * 4, tableX + tableW, tableY + 44 + rowH * 4, "#bfdbfe", 1),

    text("Date", tableX + 8, tableY + 12, 70, 14, "#ffffff", 700, "Arial", "center", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),
    text("Forenoon", tableX + 96, tableY + 12, tableW * 0.57 - 98, 14, "#ffffff", 700, "Arial", "center", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),
    text("Afternoon", tableX + tableW * 0.57 + 8, tableY + 12, tableW * 0.43 - 16, 14, "#ffffff", 700, "Arial", "center", {
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
    }),

    text("23rd March", tableX + 8, tableY + 64, 70, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Intro to Generative AI", tableX + 96, tableY + 60, tableW * 0.57 - 98, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Large Language Models (LLMs)", tableX + tableW * 0.57 + 8, tableY + 60, tableW * 0.43 - 16, 12, "#e2e8f0", 600, "Arial", "center"),

    text("24th March", tableX + 8, tableY + 150, 70, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Retrieval-Augmented Generation", tableX + 96, tableY + 146, tableW * 0.57 - 98, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Prompt Engineering & Output Evaluation", tableX + tableW * 0.57 + 8, tableY + 146, tableW * 0.43 - 16, 12, "#e2e8f0", 600, "Arial", "center"),

    text("25th March", tableX + 8, tableY + 236, 70, 12, "#e2e8f0", 600, "Arial", "center"),
    text("GenAI for Sustainable Agriculture", tableX + 96, tableY + 232, tableW * 0.57 - 98, 12, "#e2e8f0", 600, "Arial", "center"),
    text("GenAI in Ethical Healthcare Systems", tableX + tableW * 0.57 + 8, tableY + 232, tableW * 0.43 - 16, 12, "#e2e8f0", 600, "Arial", "center"),

    text("26th March", tableX + 8, tableY + 322, 70, 12, "#e2e8f0", 600, "Arial", "center"),
    text("GenAI for Climate and Environment", tableX + 96, tableY + 318, tableW * 0.57 - 98, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Multimodal AI and Agentic Systems", tableX + tableW * 0.57 + 8, tableY + 318, tableW * 0.43 - 16, 12, "#e2e8f0", 600, "Arial", "center"),

    text("27th March", tableX + 8, tableY + 408, 70, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Research Problem Formulation", tableX + 96, tableY + 404, tableW * 0.57 - 98, 12, "#e2e8f0", 600, "Arial", "center"),
    text("Proposal Writing, Funding & Impact", tableX + tableW * 0.57 + 8, tableY + 404, tableW * 0.43 - 16, 12, "#e2e8f0", 600, "Arial", "center"),

    text("Eminent Speakers", backRightX + 34, 640, TRI_PANEL_W - 68, 30, "#ffffff", 800, "Arial", "center"),
    ...placeholderBox(backRightX + 26, 688, 54, 54, "ICON"),
    ...placeholderBox(backRightX + 26, 758, 54, 54, "ICON"),
    ...placeholderBox(backRightX + 26, 828, 54, 54, "ICON"),
    ...placeholderBox(backRightX + 26, 898, 54, 54, "ICON"),
    text(
      "Dr. Nancy Jane - Assistant Professor\nDr. D. Thenmozhi - Associate Professor\nDr. B. Bharathi - Associate Professor\nDr. Subaellatha C N - Professor\nMs. Monagapathi V - Senior Associate Engineer\nMr. Luvk Yannan - Product Manager",
      backRightX + 94,
      698,
      TRI_PANEL_W - 120,
      13,
      "#e2e8f0",
      500,
    ),
  ];

  return {
    id: "builtin-trifold-fdp-two-side",
    name: "FDP Trifold (Two-Side)",
    width: W_TRI,
    height: H_TRI,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#0b4ca8",
  };
}

// ─── Poster Templates ────────────────────────────────────────────────────

const W_POST = 1240;
const H_POST = 1754;

function posterBold(): BuiltInTemplate {
  const objects = [
    workspace(W_POST, H_POST, "#ffffff"),
    rect(0, 0, W_POST, 340, "#1e3a8a"),
    text("EVENT TITLE", 60, 60, W_POST - 120, 56, "#ffffff", 800, "Arial", "center"),
    text("A National Level Workshop / Seminar / FDP", 60, 140, W_POST - 120, 22, "#93c5fd", 500, "Arial", "center"),
    text("March 15-16, 2026  |  Main Auditorium", 60, 180, W_POST - 120, 18, "#bfdbfe", 400, "Arial", "center"),
    text("Organized by Department of Computer Science", 60, 220, W_POST - 120, 16, "#93c5fd", 400, "Arial", "center"),
    text("Institution / College Name", 60, 260, W_POST - 120, 24, "#ffffff", 700, "Arial", "center"),
    rect(40, 370, W_POST - 80, 4, "#3b82f6"),
    text("About the Event", 60, 400, W_POST - 120, 28, "#1e3a8a", 700),
    text("This event aims to bring together academicians, industry professionals, and students to discuss the latest advancements and trends. Edit this section to describe your specific event.", 60, 445, W_POST - 120, 16, "#374151"),
    text("Topics Covered", 60, 560, W_POST - 120, 28, "#1e3a8a", 700),
    text("• Artificial Intelligence & Machine Learning\n• Cloud Computing & DevOps\n• Cybersecurity & Ethical Hacking\n• Data Science & Big Data\n• Internet of Things", 60, 605, W_POST - 120, 16, "#374151"),
    text("Invited Speakers", 60, 790, W_POST - 120, 28, "#1e3a8a", 700),
    text("Dr. First Last — Organization\nProf. First Last — Organization\nMr./Ms. First Last — Organization", 60, 835, W_POST - 120, 16, "#374151"),
    rect(40, 960, W_POST - 80, 4, "#3b82f6"),
    text("Registration Details", 60, 990, W_POST - 120, 28, "#1e3a8a", 700),
    rect(60, 1035, 520, 200, "#eff6ff", 16),
    text("Students: ₹500\nFaculty: ₹750\nIndustry: ₹1500\n\nDeadline: March 5, 2026\nLimited seats available!", 80, 1055, 480, 16, "#1e40af"),
    text("Contact Information", 60, 1280, W_POST - 120, 28, "#1e3a8a", 700),
    text("Coordinator: Prof. Name\nMobile: +91 98765 43210\nEmail: event@college.edu\nRegistration: forms.google.com/your-form", 60, 1325, W_POST - 120, 16, "#374151"),
    rect(0, H_POST - 120, W_POST, 120, "#1e3a8a"),
    text("College / University Name", 60, H_POST - 105, W_POST - 120, 22, "#ffffff", 700, "Arial", "center"),
    text("Address Line 1, City — PIN Code", 60, H_POST - 72, W_POST - 120, 14, "#93c5fd", 400, "Arial", "center"),
    text("www.college.edu  |  info@college.edu  |  +91 12345 67890", 60, H_POST - 48, W_POST - 120, 13, "#93c5fd", 400, "Arial", "center"),
  ];

  return {
    id: "builtin-poster-bold",
    name: "Bold Blue Poster",
    width: W_POST,
    height: H_POST,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#1e3a8a",
  };
}

function posterElegant(): BuiltInTemplate {
  const objects = [
    workspace(W_POST, H_POST, "#fefce8"),
    rect(0, 0, W_POST, 6, "#b45309"),
    rect(0, H_POST - 6, W_POST, 6, "#b45309"),
    rect(0, 0, 6, H_POST, "#b45309"),
    rect(W_POST - 6, 0, 6, H_POST, "#b45309"),
    rect(40, 50, W_POST - 80, 250, "#78350f", 0),
    text("NATIONAL SEMINAR", 60, 75, W_POST - 120, 20, "#fde68a", 600, "Georgia", "center"),
    text("Event Title Here", 60, 110, W_POST - 120, 52, "#ffffff", 800, "Georgia", "center"),
    text("15th — 16th March, 2026", 60, 185, W_POST - 120, 22, "#fde68a", 500, "Georgia", "center"),
    text("Organized by Department Name", 60, 225, W_POST - 120, 16, "#fcd34d", 400, "Georgia", "center"),
    text("About", 60, 340, W_POST - 120, 30, "#78350f", 700, "Georgia"),
    text("An enriching academic event designed to foster collaboration between academia and industry. Participants will gain insights into emerging trends and practical knowledge through interactive sessions.", 60, 385, W_POST - 120, 15, "#44403c"),
    text("Key Themes", 60, 510, W_POST - 120, 30, "#78350f", 700, "Georgia"),
    text("✦ Theme 1 — Description\n✦ Theme 2 — Description\n✦ Theme 3 — Description\n✦ Theme 4 — Description\n✦ Theme 5 — Description", 60, 555, W_POST - 120, 15, "#44403c"),
    text("Distinguished Speakers", 60, 740, W_POST - 120, 30, "#78350f", 700, "Georgia"),
    text("Dr. Speaker Name — Affiliation\nProf. Speaker Name — Affiliation\nMs. Speaker Name — Affiliation", 60, 785, W_POST - 120, 15, "#44403c"),
    line(60, 900, W_POST - 60, 900, "#d6d3d1", 1),
    text("Registration", 60, 930, W_POST - 120, 30, "#78350f", 700, "Georgia"),
    text("Faculty: ₹700  |  Students: ₹400  |  Industry: ₹1200\nLast date to register: March 8, 2026\nRegistration form: forms.google.com/your-form", 60, 975, W_POST - 120, 15, "#44403c"),
    text("Contact", 60, 1120, W_POST - 120, 30, "#78350f", 700, "Georgia"),
    text("Convenor: Dr. Name (+91 98765 43210)\nEmail: event@institution.edu", 60, 1165, W_POST - 120, 15, "#44403c"),
    rect(40, H_POST - 180, W_POST - 80, 140, "#78350f", 0),
    text("Institution / University Name", 60, H_POST - 165, W_POST - 120, 24, "#ffffff", 700, "Georgia", "center"),
    text("Accredited by NAAC with Grade 'A++'", 60, H_POST - 128, W_POST - 120, 14, "#fde68a", 400, "Georgia", "center"),
    text("Address  •  City  •  Website", 60, H_POST - 100, W_POST - 120, 14, "#fcd34d", 400, "Georgia", "center"),
  ];

  return {
    id: "builtin-poster-elegant",
    name: "Elegant Gold Poster",
    width: W_POST,
    height: H_POST,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#78350f",
  };
}

function posterMinimal(): BuiltInTemplate {
  const objects = [
    workspace(W_POST, H_POST, "#f8fafc"),
    rect(0, 0, W_POST, 280, "#0f172a"),
    text("EVENT", 60, 40, W_POST - 120, 18, "#94a3b8", 600, "Arial", "center"),
    text("Your Event Title", 60, 70, W_POST - 120, 52, "#ffffff", 800, "Arial", "center"),
    text("Date  •  Venue  •  Mode", 60, 145, W_POST - 120, 18, "#94a3b8", 400, "Arial", "center"),
    text("Department of Computer Science\nCollege / University Name", 60, 190, W_POST - 120, 16, "#64748b", 400, "Arial", "center"),
    text("Overview", 60, 320, W_POST - 120, 28, "#0f172a", 700),
    text("A brief introduction about the event, its purpose, and what participants will learn. Replace this placeholder text with your event description.", 60, 360, W_POST - 120, 15, "#475569"),
    text("What You'll Learn", 60, 480, W_POST - 120, 28, "#0f172a", 700),
    rect(60, 525, W_POST - 120, 260, "#f1f5f9", 12),
    text("→ Topic 1: Description\n→ Topic 2: Description\n→ Topic 3: Description\n→ Topic 4: Description\n→ Topic 5: Description\n→ Topic 6: Description", 85, 545, W_POST - 170, 15, "#334155"),
    text("Expert Speakers", 60, 830, W_POST - 120, 28, "#0f172a", 700),
    text("Name 1 — Title, Organization\nName 2 — Title, Organization\nName 3 — Title, Organization", 60, 875, W_POST - 120, 15, "#475569"),
    text("Registration", 60, 1020, W_POST - 120, 28, "#0f172a", 700),
    rect(60, 1065, 550, 180, "#0f172a", 16),
    text("Students: ₹400\nFaculty: ₹600\nIndustry: ₹1000\n\nDeadline: March 10, 2026", 85, 1085, 500, 16, "#e2e8f0"),
    text("Register Now", 60, 1290, W_POST - 120, 24, "#0f172a", 700),
    text("Scan the QR code or visit:\nforms.google.com/your-form", 60, 1325, W_POST - 120, 15, "#475569"),
    text("Contact", 60, 1420, W_POST - 120, 24, "#0f172a", 700),
    text("Coordinator: Prof. Name\nMobile: +91 98765 43210\nEmail: event@college.edu", 60, 1455, W_POST - 120, 15, "#475569"),
    rect(0, H_POST - 80, W_POST, 80, "#0f172a"),
    text("Institution Name  •  Address  •  www.college.edu", 60, H_POST - 55, W_POST - 120, 13, "#94a3b8", 400, "Arial", "center"),
  ];

  return {
    id: "builtin-poster-minimal",
    name: "Minimal Dark Poster",
    width: W_POST,
    height: H_POST,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#0f172a",
  };
}

// ─── Export ──────────────────────────────────────────────────────────────

const allBuiltIn: BuiltInTemplate[] = [
  trifoldFdpTwoSide(),
  posterBold(),
  posterElegant(),
  posterMinimal(),
];

export function getBuiltInTemplates(type?: BrochureType): BuiltInTemplate[] {
  if (!type) return allBuiltIn;
  if (type === "trifold") return allBuiltIn.filter((t) => t.width > t.height);
  return allBuiltIn.filter((t) => t.height >= t.width);
}
