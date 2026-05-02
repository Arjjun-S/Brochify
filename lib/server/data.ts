import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { createEmptyBrochureData, normalizeBrochureData, normalizeFontFamilyValue } from "@/lib/domains/brochure";
import { createEmptyCertificateEditorState, normalizeCertificateEditorState } from "@/lib/domains/certificate";
import { prisma } from "@/lib/server/prisma";
import type {
  BrochureRecord,
  BrochureStatus,
  CertificateRecord,
  CertificateStatus,
  EditorFormLineStyle,
  EditorState,
  SessionUser,
  UserRole,
} from "@/lib/server/types";

const TEMPLATE_IDS = ["whiteBlue", "beigeDust", "softBlue", "tealGloss", "yellowDust", "posterFlyer"] as const;

const DEFAULT_FORM_LINE_STYLES: Record<string, EditorFormLineStyle> = {
  "registration.notes": { fontSize: 13 },
};

type BrochureWithRelations = Prisma.BrochureGetPayload<{
  include: {
    creator: { select: { username: true } };
    assignedAdminUser: { select: { username: true } };
  };
}>;

type CertificateWithRelations = Prisma.CertificateGetPayload<{
  include: {
    creator: { select: { username: true } };
    assignedAdminUser: { select: { username: true } };
  };
}>;

let databaseReadyPromise: Promise<void> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createEmptyEditorState(template: EditorState["template"] = "whiteBlue"): EditorState {
  return {
    brochureData: createEmptyBrochureData(),
    selectedLogos: ["srm", "ieee", "ctech"],
    segmentPositions: {},
    overlayItems: [],
    template,
    hiddenSegments: [],
    formLineStyles: { ...DEFAULT_FORM_LINE_STYLES },
  };
}

function parseJsonContent(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return raw;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeEditorState(raw: unknown): EditorState {
  const fallback = createEmptyEditorState();
  const source = parseJsonContent(raw);

  if (!isRecord(source)) {
    return fallback;
  }

  const template =
    typeof source.template === "string" && TEMPLATE_IDS.includes(source.template as (typeof TEMPLATE_IDS)[number])
      ? (source.template as EditorState["template"])
      : fallback.template;

  const selectedLogos = Array.isArray(source.selectedLogos)
    ? source.selectedLogos.filter((item): item is string => typeof item === "string")
    : fallback.selectedLogos;

  const hiddenSegments = Array.isArray(source.hiddenSegments)
    ? source.hiddenSegments.filter((item): item is string => typeof item === "string")
    : fallback.hiddenSegments;

  const formLineStyles = isRecord(source.formLineStyles)
    ? Object.entries(source.formLineStyles).reduce<Record<string, EditorFormLineStyle>>((acc, [key, value]) => {
        if (!isRecord(value)) {
          return acc;
        }

        acc[key] = {
          ...(typeof value.fontFamily === "string" ? { fontFamily: normalizeFontFamilyValue(value.fontFamily) } : {}),
          ...(typeof value.fontSize === "number" ? { fontSize: value.fontSize } : {}),
          ...(typeof value.color === "string" ? { color: value.color } : {}),
          ...(value.align === "left" || value.align === "center" || value.align === "right" || value.align === "justify"
            ? { align: value.align }
            : {}),
        };

        return acc;
      }, { ...DEFAULT_FORM_LINE_STYLES })
    : fallback.formLineStyles;

  const segmentPositions = isRecord(source.segmentPositions)
    ? (source.segmentPositions as EditorState["segmentPositions"])
    : fallback.segmentPositions;

  const overlayItems = Array.isArray(source.overlayItems)
    ? (source.overlayItems as EditorState["overlayItems"])
    : fallback.overlayItems;

  return {
    brochureData: normalizeBrochureData(source.brochureData as Record<string, unknown>),
    selectedLogos,
    segmentPositions,
    overlayItems,
    template,
    hiddenSegments,
    formLineStyles,
  };
}

function mapBrochureRow(row: BrochureWithRelations): BrochureRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: normalizeEditorState(row.content),
    createdBy: row.createdBy,
    createdByUsername: row.creator.username,
    assignedAdminId: row.assignedAdminId,
    assignedAdminUsername: row.assignedAdminUser?.username ?? null,
    status: row.status as BrochureStatus,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapCertificateRow(row: CertificateWithRelations): CertificateRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: normalizeCertificateEditorState(row.content),
    createdBy: row.createdBy,
    createdByUsername: row.creator.username,
    assignedAdminId: row.assignedAdminId,
    assignedAdminUsername: row.assignedAdminUser?.username ?? null,
    status: row.status as CertificateStatus,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function backfillLegacyPasswordColumns(): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ passwordHash: null }, { password: null }],
    },
    select: {
      id: true,
      password: true,
      passwordHash: true,
    },
  });

  if (users.length === 0) {
    return;
  }

  await prisma.$transaction(
    users.map((user) => {
      const normalizedHash = user.passwordHash ?? user.password ?? "";
      const normalizedPassword = user.password ?? user.passwordHash ?? "";
      return prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: normalizedHash,
          password: normalizedPassword,
        },
      });
    }),
  );
}

async function seedUsersIfMissing(): Promise<void> {
  const totalUsers = await prisma.user.count();
  if (totalUsers > 0) {
    return;
  }

  const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin123", 10);
  const facultyHash = await bcrypt.hash(process.env.SEED_FACULTY_PASSWORD || "faculty123", 10);

  await prisma.user.createMany({
    data: [
      {
        username: process.env.SEED_ADMIN_USERNAME || "admin",
        password: adminHash,
        passwordHash: adminHash,
        role: "admin",
      },
      {
        username: process.env.SEED_FACULTY_USERNAME || "faculty",
        password: facultyHash,
        passwordHash: facultyHash,
        role: "faculty",
      },
    ],
    skipDuplicates: true,
  });
}

function wrapSchemaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    throw new Error("Database tables are missing. Run Prisma migrations with npm run prisma:migrate or npm run prisma:push.");
  }

  throw error;
}

async function initDatabase(): Promise<void> {
  try {
    await backfillLegacyPasswordColumns();
    await seedUsersIfMissing();
  } catch (error) {
    wrapSchemaError(error);
  }
}

async function ensureDatabase(): Promise<void> {
  if (!databaseReadyPromise) {
    databaseReadyPromise = initDatabase();
  }

  await databaseReadyPromise;
}

export async function listAdmins(): Promise<Array<{ id: number; username: string }>> {
  await ensureDatabase();

  const rows = await prisma.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      username: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  return rows;
}

export async function verifyUserCredentials(
  username: string,
  password: string,
  role: UserRole,
): Promise<SessionUser | null> {
  await ensureDatabase();

  const user = await prisma.user.findFirst({
    where: {
      username,
      role,
    },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
}

type ListBrochureOptions = {
  status?: BrochureStatus;
};

type ListCertificateOptions = {
  status?: CertificateStatus;
};

function isValidStatus(status: string | undefined): status is BrochureStatus {
  return status === "draft" || status === "pending" || status === "approved" || status === "rejected";
}

export async function listBrochuresForUser(user: SessionUser, options?: ListBrochureOptions): Promise<BrochureRecord[]> {
  await ensureDatabase();

  const where: Prisma.BrochureWhereInput =
    user.role === "faculty" ? { createdBy: user.userId } : { assignedAdminId: user.userId };

  if (options?.status && isValidStatus(options.status)) {
    where.status = options.status;
  }

  const rows = await prisma.brochure.findMany({
    where,
    include: {
      creator: {
        select: { username: true },
      },
      assignedAdminUser: {
        select: { username: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rows.map(mapBrochureRow);
}

export async function getBrochureByIdForUser(id: number, user: SessionUser): Promise<BrochureRecord | null> {
  await ensureDatabase();

  const row = await prisma.brochure.findFirst({
    where: {
      id,
      ...(user.role === "faculty" ? { createdBy: user.userId } : { assignedAdminId: user.userId }),
    },
    include: {
      creator: {
        select: { username: true },
      },
      assignedAdminUser: {
        select: { username: true },
      },
    },
  });

  return row ? mapBrochureRow(row) : null;
}

export async function createBrochureDraft(input: {
  title: string;
  description: string;
  createdBy: number;
  assignedAdminId: number;
  template?: EditorState["template"];
}): Promise<number> {
  await ensureDatabase();

  const created = await prisma.brochure.create({
    data: {
      title: input.title,
      description: input.description,
      content: toPrismaJson(createEmptyEditorState(input.template)),
      createdBy: input.createdBy,
      assignedAdminId: input.assignedAdminId,
      status: "draft",
    },
    select: {
      id: true,
    },
  });

  return created.id;
}

export async function updateBrochureContent(
  id: number,
  user: SessionUser,
  content: unknown,
): Promise<BrochureRecord | null> {
  await ensureDatabase();

  const existing = await getBrochureByIdForUser(id, user);
  if (!existing) {
    return null;
  }

  const normalizedContent = normalizeEditorState(content);

  await prisma.brochure.update({
    where: { id },
    data: {
      content: toPrismaJson(normalizedContent),
    },
  });

  return getBrochureByIdForUser(id, user);
}

export async function deleteBrochureForFaculty(id: number, user: SessionUser): Promise<boolean> {
  await ensureDatabase();

  if (user.role !== "faculty") {
    return false;
  }

  const result = await prisma.brochure.deleteMany({
    where: {
      id,
      createdBy: user.userId,
    },
  });

  return result.count > 0;
}

export async function submitBrochureForReview(
  id: number,
  user: SessionUser,
  content: unknown,
): Promise<BrochureRecord | null> {
  await ensureDatabase();

  if (user.role !== "faculty") {
    return null;
  }

  const normalizedContent = normalizeEditorState(content);
  const result = await prisma.brochure.updateMany({
    where: {
      id,
      createdBy: user.userId,
    },
    data: {
      content: toPrismaJson(normalizedContent),
      status: "pending",
      rejectionReason: null,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getBrochureByIdForUser(id, user);
}

export async function decideBrochure(
  id: number,
  user: SessionUser,
  decision: "approved" | "rejected",
  content?: unknown,
  rejectionReason?: string | null,
): Promise<BrochureRecord | null> {
  await ensureDatabase();

  if (user.role !== "admin") {
    return null;
  }

  const data: Prisma.BrochureUpdateManyMutationInput = {
    status: decision,
    rejectionReason: decision === "rejected" ? (rejectionReason?.trim() || null) : null,
  };

  if (content !== undefined) {
    data.content = toPrismaJson(normalizeEditorState(content));
  }

  const result = await prisma.brochure.updateMany({
    where: {
      id,
      assignedAdminId: user.userId,
    },
    data,
  });

  if (result.count === 0) {
    return null;
  }

  return getBrochureByIdForUser(id, user);
}

export async function listCertificatesForUser(
  user: SessionUser,
  options?: ListCertificateOptions,
): Promise<CertificateRecord[]> {
  await ensureDatabase();

  const where: Prisma.CertificateWhereInput =
    user.role === "faculty" ? { createdBy: user.userId } : { assignedAdminId: user.userId };

  if (options?.status && isValidStatus(options.status)) {
    where.status = options.status;
  }

  const rows = await prisma.certificate.findMany({
    where,
    include: {
      creator: {
        select: { username: true },
      },
      assignedAdminUser: {
        select: { username: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rows.map(mapCertificateRow);
}

export async function getCertificateByIdForUser(
  id: number,
  user: SessionUser,
): Promise<CertificateRecord | null> {
  await ensureDatabase();

  const row = await prisma.certificate.findFirst({
    where: {
      id,
      ...(user.role === "faculty" ? { createdBy: user.userId } : { assignedAdminId: user.userId }),
    },
    include: {
      creator: {
        select: { username: true },
      },
      assignedAdminUser: {
        select: { username: true },
      },
    },
  });

  return row ? mapCertificateRow(row) : null;
}

export async function createCertificateDraft(input: {
  title: string;
  description: string;
  createdBy: number;
  assignedAdminId: number;
  content?: unknown;
}): Promise<number> {
  await ensureDatabase();

  const normalizedContent = normalizeCertificateEditorState(
    input.content === undefined ? createEmptyCertificateEditorState() : input.content,
  );

  const created = await prisma.certificate.create({
    data: {
      title: input.title,
      description: input.description,
      content: toPrismaJson(normalizedContent),
      createdBy: input.createdBy,
      assignedAdminId: input.assignedAdminId,
      status: "draft",
    },
    select: {
      id: true,
    },
  });

  return created.id;
}

export async function updateCertificateContent(
  id: number,
  user: SessionUser,
  content: unknown,
): Promise<CertificateRecord | null> {
  await ensureDatabase();

  const existing = await getCertificateByIdForUser(id, user);
  if (!existing) {
    return null;
  }

  const normalizedContent = normalizeCertificateEditorState(content);

  await prisma.certificate.update({
    where: { id },
    data: {
      content: toPrismaJson(normalizedContent),
    },
  });

  return getCertificateByIdForUser(id, user);
}

export async function deleteCertificateForFaculty(id: number, user: SessionUser): Promise<boolean> {
  await ensureDatabase();

  if (user.role !== "faculty") {
    return false;
  }

  const result = await prisma.certificate.deleteMany({
    where: {
      id,
      createdBy: user.userId,
    },
  });

  return result.count > 0;
}

export async function submitCertificateForReview(
  id: number,
  user: SessionUser,
  content: unknown,
): Promise<CertificateRecord | null> {
  await ensureDatabase();

  if (user.role !== "faculty") {
    return null;
  }

  const normalizedContent = normalizeCertificateEditorState(content);
  const result = await prisma.certificate.updateMany({
    where: {
      id,
      createdBy: user.userId,
    },
    data: {
      content: toPrismaJson(normalizedContent),
      status: "pending",
      rejectionReason: null,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getCertificateByIdForUser(id, user);
}

export async function decideCertificate(
  id: number,
  user: SessionUser,
  decision: "approved" | "rejected",
  content?: unknown,
  rejectionReason?: string | null,
): Promise<CertificateRecord | null> {
  await ensureDatabase();

  if (user.role !== "admin") {
    return null;
  }

  const data: Prisma.CertificateUpdateManyMutationInput = {
    status: decision,
    rejectionReason: decision === "rejected" ? (rejectionReason?.trim() || null) : null,
  };

  if (content !== undefined) {
    data.content = toPrismaJson(normalizeCertificateEditorState(content));
  }

  const result = await prisma.certificate.updateMany({
    where: {
      id,
      assignedAdminId: user.userId,
    },
    data,
  });

  if (result.count === 0) {
    return null;
  }

  return getCertificateByIdForUser(id, user);
}
