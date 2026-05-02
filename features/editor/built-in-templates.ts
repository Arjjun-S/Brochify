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
    stroke: null,
    strokeWidth: 0,
    selectable: false,
    evented: false,
    hasControls: false,
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
    editable: true,
    selectable: true,
    hasControls: true,
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

// ─── Trifold Templates ──────────────────────────────────────────────────

const W_TRI = 1754;
const H_TRI = 1240;
const COL_W = Math.floor(W_TRI / 3);

function trifoldClassic(): BuiltInTemplate {
  const objects = [
    workspace(W_TRI, H_TRI, "#ffffff"),
    rect(0, 0, W_TRI, 160, "#1e3a5f"),
    text("Your Event Title", 48, 40, W_TRI - 96, 42, "#ffffff", 700, "Arial", "center"),
    text("Department Name  |  Date Range", 48, 100, W_TRI - 96, 18, "#94b8d9", 500, "Arial", "center"),
    line(COL_W, 180, COL_W, H_TRI - 60, "#d1d5db", 1),
    line(COL_W * 2, 180, COL_W * 2, H_TRI - 60, "#d1d5db", 1),
    rect(24, 190, COL_W - 48, 100, "#e8f0fe", 12),
    text("About the Program", 44, 205, COL_W - 88, 20, "#1e3a5f", 700),
    text("Add a brief description of your program, workshop, or event here. Highlight key objectives and what participants will gain.", 44, 240, COL_W - 88, 14, "#374151"),
    text("Schedule & Topics", 44, 370, COL_W - 88, 20, "#1e3a5f", 700),
    text("Day 1: Topic A — Morning Session\nDay 1: Topic B — Afternoon Session\nDay 2: Topic C — Morning Session\nDay 2: Topic D — Afternoon Session", 44, 405, COL_W - 88, 14, "#374151"),
    rect(COL_W + 24, 190, COL_W - 48, 100, "#e8f0fe", 12),
    text("Speakers & Guests", COL_W + 44, 205, COL_W - 88, 20, "#1e3a5f", 700),
    text("Dr. Jane Smith — AI Researcher, MIT\nProf. John Doe — Data Science, Stanford\nMs. Sarah Lee — Industry Expert, Google", COL_W + 44, 310, COL_W - 88, 14, "#374151"),
    text("Program Highlights", COL_W + 44, 500, COL_W - 88, 20, "#1e3a5f", 700),
    text("• Hands-on workshops\n• Industry expert sessions\n• Networking opportunities\n• Certificate of participation", COL_W + 44, 535, COL_W - 88, 14, "#374151"),
    rect(COL_W * 2 + 24, 190, COL_W - 48, 100, "#e8f0fe", 12),
    text("Registration", COL_W * 2 + 44, 205, COL_W - 88, 20, "#1e3a5f", 700),
    text("Early Bird: ₹500\nRegular: ₹750\nDeadline: 15th March 2026", COL_W * 2 + 44, 310, COL_W - 88, 14, "#374151"),
    text("Contact Information", COL_W * 2 + 44, 500, COL_W - 88, 20, "#1e3a5f", 700),
    text("Email: event@college.edu\nPhone: +91 98765 43210\nWebsite: www.college.edu/event", COL_W * 2 + 44, 535, COL_W - 88, 14, "#374151"),
    rect(0, H_TRI - 50, W_TRI, 50, "#1e3a5f"),
    text("College Name  •  Address  •  www.college.edu", 48, H_TRI - 40, W_TRI - 96, 14, "#94b8d9", 500, "Arial", "center"),
  ];

  return {
    id: "builtin-trifold-classic",
    name: "Classic Trifold",
    width: W_TRI,
    height: H_TRI,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#1e3a5f",
  };
}

function trifoldModern(): BuiltInTemplate {
  const objects = [
    workspace(W_TRI, H_TRI, "#f8fafc"),
    rect(0, 0, W_TRI, 200, "#7c3aed"),
    text("Workshop / Symposium Title", 48, 50, W_TRI - 96, 48, "#ffffff", 800, "Arial", "center"),
    text("Organized by Department of Computer Science", 48, 120, W_TRI - 96, 20, "#ddd6fe", 500, "Arial", "center"),
    text("Date: March 15-16, 2026  |  Venue: Auditorium Hall", 48, 155, W_TRI - 96, 16, "#c4b5fd", 400, "Arial", "center"),
    rect(30, 220, COL_W - 45, H_TRI - 280, "#f3e8ff", 16),
    rect(COL_W + 8, 220, COL_W - 15, H_TRI - 280, "#ede9fe", 16),
    rect(COL_W * 2 + 15, 220, COL_W - 45, H_TRI - 280, "#f3e8ff", 16),
    text("About", 60, 245, COL_W - 105, 22, "#7c3aed", 700),
    text("This event brings together researchers, practitioners, and students to explore cutting-edge topics in technology and innovation.", 60, 280, COL_W - 105, 14, "#1e1b4b"),
    text("Key Topics", 60, 440, COL_W - 105, 22, "#7c3aed", 700),
    text("• Artificial Intelligence & ML\n• Cloud Computing\n• Cybersecurity\n• IoT & Edge Computing\n• Data Analytics", 60, 475, COL_W - 105, 14, "#1e1b4b"),
    text("Invited Speakers", COL_W + 38, 245, COL_W - 75, 22, "#7c3aed", 700),
    text("Dr. A. Kumar\nAI Research Lead, Google\n\nProf. B. Sharma\nDirector, IIT Mumbai\n\nMs. C. Patel\nCTO, TechStart Inc.", COL_W + 38, 280, COL_W - 75, 14, "#1e1b4b"),
    text("Schedule", COL_W + 38, 550, COL_W - 75, 22, "#7c3aed", 700),
    text("Day 1 AM: Inauguration & Keynote\nDay 1 PM: Technical Sessions\nDay 2 AM: Workshops\nDay 2 PM: Panel Discussion", COL_W + 38, 585, COL_W - 75, 14, "#1e1b4b"),
    text("Registration", COL_W * 2 + 45, 245, COL_W - 105, 22, "#7c3aed", 700),
    text("Students: ₹300\nFaculty: ₹500\nIndustry: ₹1000\n\nRegister before March 1st\nfor early bird discount!", COL_W * 2 + 45, 280, COL_W - 105, 14, "#1e1b4b"),
    text("Contact", COL_W * 2 + 45, 520, COL_W - 105, 22, "#7c3aed", 700),
    text("Prof. Coordinator Name\nDept. of Computer Science\n\nPhone: +91 98765 43210\nEmail: event@college.edu\n\nRegister: forms.google.com", COL_W * 2 + 45, 555, COL_W - 105, 14, "#1e1b4b"),
    rect(0, H_TRI - 50, W_TRI, 50, "#7c3aed"),
    text("Institution Name  •  City, State  •  Accredited by NAAC", 48, H_TRI - 38, W_TRI - 96, 13, "#ddd6fe", 500, "Arial", "center"),
  ];

  return {
    id: "builtin-trifold-modern",
    name: "Modern Purple Trifold",
    width: W_TRI,
    height: H_TRI,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#7c3aed",
  };
}

function trifoldMinimal(): BuiltInTemplate {
  const objects = [
    workspace(W_TRI, H_TRI, "#fafaf9"),
    rect(0, 0, W_TRI, 4, "#0d9488"),
    text("Event / Workshop Title", 60, 40, W_TRI - 120, 44, "#0f172a", 800, "Georgia", "center"),
    text("Department  •  Institution  •  Dates", 60, 100, W_TRI - 120, 18, "#64748b", 400, "Arial", "center"),
    line(60, 140, W_TRI - 60, 140, "#e2e8f0", 2),
    text("About", 50, 170, COL_W - 80, 24, "#0d9488", 700),
    text("A comprehensive overview of the event, its goals, and what participants can expect. Edit this text to describe your specific program.", 50, 210, COL_W - 80, 14, "#334155"),
    text("Topics Covered", 50, 400, COL_W - 80, 24, "#0d9488", 700),
    text("1. Introduction & Fundamentals\n2. Advanced Concepts\n3. Practical Applications\n4. Case Studies\n5. Future Directions", 50, 440, COL_W - 80, 14, "#334155"),
    text("Speakers", COL_W + 20, 170, COL_W - 40, 24, "#0d9488", 700),
    text("Speaker Name 1\nDesignation, Organization\n\nSpeaker Name 2\nDesignation, Organization\n\nSpeaker Name 3\nDesignation, Organization", COL_W + 20, 210, COL_W - 40, 14, "#334155"),
    text("Highlights", COL_W + 20, 520, COL_W - 40, 24, "#0d9488", 700),
    text("• Expert-led sessions\n• Hands-on experience\n• Industry exposure\n• Certificate provided", COL_W + 20, 560, COL_W - 40, 14, "#334155"),
    text("How to Register", COL_W * 2 + 20, 170, COL_W - 50, 24, "#0d9488", 700),
    text("Fee: ₹500 (Students)\nFee: ₹800 (Others)\nDeadline: March 10, 2026\n\nScan the QR code or visit\nthe registration link below.", COL_W * 2 + 20, 210, COL_W - 50, 14, "#334155"),
    text("Contact Us", COL_W * 2 + 20, 520, COL_W - 50, 24, "#0d9488", 700),
    text("Name: Coordinator Name\nMobile: +91 98765 43210\nEmail: info@college.edu\nWeb: college.edu/event", COL_W * 2 + 20, 560, COL_W - 50, 14, "#334155"),
    rect(0, H_TRI - 40, W_TRI, 40, "#0d9488"),
    text("Institution Name  •  Address Line  •  contact@college.edu", 48, H_TRI - 30, W_TRI - 96, 12, "#ffffff", 500, "Arial", "center"),
  ];

  return {
    id: "builtin-trifold-minimal",
    name: "Minimal Teal Trifold",
    width: W_TRI,
    height: H_TRI,
    json: JSON.stringify({ version: "5.3.0", objects }),
    thumbnailColor: "#0d9488",
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
  trifoldClassic(),
  trifoldModern(),
  trifoldMinimal(),
  posterBold(),
  posterElegant(),
  posterMinimal(),
];

export function getBuiltInTemplates(type?: BrochureType): BuiltInTemplate[] {
  if (!type) return allBuiltIn;
  if (type === "trifold") return allBuiltIn.filter((t) => t.width > t.height);
  return allBuiltIn.filter((t) => t.height >= t.width);
}
