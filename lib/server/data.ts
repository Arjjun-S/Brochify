import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { createEmptyBrochureData, normalizeBrochureData } from "@/lib/domains/brochure";
import { pool } from "@/lib/server/db";
import type { BrochureRecord, BrochureStatus, EditorFormLineStyle, EditorState, SessionUser, UserRole } from "@/lib/server/types";

const TEMPLATE_IDS = ["whiteBlue", "beigeDust", "softBlue", "tealGloss", "yellowDust"] as const;

const DEFAULT_FORM_LINE_STYLES: Record<string, EditorFormLineStyle> = {
	"registration.notes": { fontSize: 13 },
};

type UserRow = RowDataPacket & {
	id: number;
	username: string;
	password_hash: string;
	role: UserRole;
};

type AdminRow = RowDataPacket & {
	id: number;
	username: string;
};

type BrochureRow = RowDataPacket & {
	id: number;
	title: string;
	description: string;
	content: unknown;
	createdBy: number;
	createdByUsername: string;
	assignedAdminId: number;
	assignedAdminUsername: string | null;
	status: BrochureStatus;
	rejectionReason: string | null;
	createdAt: Date | string;
};

let schemaReadyPromise: Promise<void> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createEmptyEditorState(): EditorState {
	return {
		brochureData: createEmptyBrochureData(),
		selectedLogos: ["srm", "ieee", "ctech"],
		segmentPositions: {},
		overlayItems: [],
		template: "whiteBlue",
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

function mapBrochureRow(row: BrochureRow): BrochureRecord {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		content: normalizeEditorState(row.content),
		createdBy: row.createdBy,
		createdByUsername: row.createdByUsername,
		assignedAdminId: row.assignedAdminId,
		assignedAdminUsername: row.assignedAdminUsername,
		status: row.status,
		rejectionReason: row.rejectionReason,
		createdAt: new Date(row.createdAt).toISOString(),
	};
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`
			SELECT COUNT(*) AS total
			FROM information_schema.COLUMNS
			WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
		`,
		[tableName, columnName],
	);

	return Number(rows[0]?.total ?? 0) > 0;
}

async function addColumnIfMissing(tableName: string, columnName: string, definitionSql: string): Promise<void> {
	const exists = await columnExists(tableName, columnName);
	if (exists) {
		return;
	}

	await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
}

async function initSchema(): Promise<void> {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(64) NOT NULL UNIQUE,
			password VARCHAR(255) NULL,
			password_hash VARCHAR(255) NOT NULL,
			role ENUM('admin', 'faculty') NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`);

	// Backward-compat migration from legacy schema that used `password` instead of `password_hash`.
	await addColumnIfMissing("users", "password", "VARCHAR(255) NULL AFTER username");
	await addColumnIfMissing("users", "password_hash", "VARCHAR(255) NULL AFTER password");
	await addColumnIfMissing("users", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
	await pool.query("UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL");
	await pool.query("UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL");
	await pool.query("UPDATE users SET password_hash = '' WHERE password_hash IS NULL");

	await pool.query(`
		CREATE TABLE IF NOT EXISTS brochures (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT NOT NULL,
			content JSON NOT NULL,
			created_by INT NOT NULL,
			assigned_admin INT NOT NULL,
			status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
			rejection_reason TEXT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT fk_brochure_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
			CONSTRAINT fk_brochure_assigned_admin FOREIGN KEY (assigned_admin) REFERENCES users(id) ON DELETE CASCADE,
			INDEX idx_brochure_status (status),
			INDEX idx_brochure_created_by (created_by),
			INDEX idx_brochure_assigned_admin (assigned_admin)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`);

	await addColumnIfMissing("brochures", "rejection_reason", "TEXT NULL AFTER status");

	await seedUsersIfMissing();
}

async function seedUsersIfMissing(): Promise<void> {
	const [countRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM users");
	const totalUsers = Number(countRows[0]?.total ?? 0);
	if (totalUsers > 0) {
		return;
	}

	const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "admin123", 10);
	const facultyHash = await bcrypt.hash(process.env.SEED_FACULTY_PASSWORD || "faculty123", 10);

	await pool.query(
		"INSERT INTO users (username, password, password_hash, role) VALUES (?, ?, ?, 'admin'), (?, ?, ?, 'faculty')",
		[
			process.env.SEED_ADMIN_USERNAME || "admin",
			adminHash,
			adminHash,
			process.env.SEED_FACULTY_USERNAME || "faculty",
			facultyHash,
			facultyHash,
		],
	);
}

async function ensureSchema(): Promise<void> {
	if (!schemaReadyPromise) {
		schemaReadyPromise = initSchema();
	}

	await schemaReadyPromise;
	await seedUsersIfMissing();
}

export async function listAdmins(): Promise<Array<{ id: number; username: string }>> {
	await ensureSchema();
	const [rows] = await pool.query<AdminRow[]>(
		"SELECT id, username FROM users WHERE role = 'admin' ORDER BY username ASC",
	);
	return rows.map((row) => ({ id: row.id, username: row.username }));
}

export async function verifyUserCredentials(
	username: string,
	password: string,
	role: UserRole,
): Promise<SessionUser | null> {
	await ensureSchema();

	const [rows] = await pool.query<UserRow[]>(
		"SELECT id, username, password_hash, role FROM users WHERE username = ? AND role = ? LIMIT 1",
		[username, role],
	);

	const user = rows[0];
	if (!user) {
		return null;
	}

	const isValid = await bcrypt.compare(password, user.password_hash);
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

function isValidStatus(status: string | undefined): status is BrochureStatus {
	return status === "draft" || status === "pending" || status === "approved" || status === "rejected";
}

export async function listBrochuresForUser(user: SessionUser, options?: ListBrochureOptions): Promise<BrochureRecord[]> {
	await ensureSchema();

	const whereClauses: string[] = [];
	const values: Array<number | string> = [];

	if (user.role === "faculty") {
		whereClauses.push("b.created_by = ?");
		values.push(user.userId);
	} else {
		whereClauses.push("b.assigned_admin = ?");
		values.push(user.userId);
	}

	if (options?.status && isValidStatus(options.status)) {
		whereClauses.push("b.status = ?");
		values.push(options.status);
	}

	const [rows] = await pool.query<BrochureRow[]>(
		`
			SELECT
				b.id,
				b.title,
				b.description,
				b.content,
				b.created_by AS createdBy,
				creator.username AS createdByUsername,
				b.assigned_admin AS assignedAdminId,
				admin.username AS assignedAdminUsername,
				b.status,
				b.rejection_reason AS rejectionReason,
				b.created_at AS createdAt
			FROM brochures b
			INNER JOIN users creator ON creator.id = b.created_by
			LEFT JOIN users admin ON admin.id = b.assigned_admin
			WHERE ${whereClauses.join(" AND ")}
			ORDER BY b.created_at DESC
		`,
		values,
	);

	return rows.map(mapBrochureRow);
}

export async function getBrochureByIdForUser(id: number, user: SessionUser): Promise<BrochureRecord | null> {
	await ensureSchema();

	const [rows] = await pool.query<BrochureRow[]>(
		`
			SELECT
				b.id,
				b.title,
				b.description,
				b.content,
				b.created_by AS createdBy,
				creator.username AS createdByUsername,
				b.assigned_admin AS assignedAdminId,
				admin.username AS assignedAdminUsername,
				b.status,
				b.rejection_reason AS rejectionReason,
				b.created_at AS createdAt
			FROM brochures b
			INNER JOIN users creator ON creator.id = b.created_by
			LEFT JOIN users admin ON admin.id = b.assigned_admin
			WHERE b.id = ? AND ${user.role === "faculty" ? "b.created_by = ?" : "b.assigned_admin = ?"}
			LIMIT 1
		`,
		[id, user.userId],
	);

	const row = rows[0];
	return row ? mapBrochureRow(row) : null;
}

export async function createBrochureDraft(input: {
	title: string;
	description: string;
	createdBy: number;
	assignedAdminId: number;
}): Promise<number> {
	await ensureSchema();

	const content = JSON.stringify(createEmptyEditorState());
	const [result] = await pool.query<ResultSetHeader>(
		`
			INSERT INTO brochures (title, description, content, created_by, assigned_admin, status)
			VALUES (?, ?, ?, ?, ?, 'draft')
		`,
		[input.title, input.description, content, input.createdBy, input.assignedAdminId],
	);

	return result.insertId;
}

export async function updateBrochureContent(
	id: number,
	user: SessionUser,
	content: unknown,
): Promise<BrochureRecord | null> {
	await ensureSchema();

	const existing = await getBrochureByIdForUser(id, user);
	if (!existing) {
		return null;
	}

	const normalizedContent = normalizeEditorState(content);

	await pool.query(
		`
			UPDATE brochures
			SET content = ?
			WHERE id = ?
		`,
		[JSON.stringify(normalizedContent), id],
	);

	return getBrochureByIdForUser(id, user);
}

export async function deleteBrochureForFaculty(id: number, user: SessionUser): Promise<boolean> {
	await ensureSchema();

	if (user.role !== "faculty") {
		return false;
	}

	const [result] = await pool.query<ResultSetHeader>(
		`
			DELETE FROM brochures
			WHERE id = ? AND created_by = ?
		`,
		[id, user.userId],
	);

	return result.affectedRows > 0;
}

export async function submitBrochureForReview(
	id: number,
	user: SessionUser,
	content: unknown,
): Promise<BrochureRecord | null> {
	await ensureSchema();

	if (user.role !== "faculty") {
		return null;
	}

	const normalizedContent = normalizeEditorState(content);
	const [result] = await pool.query<ResultSetHeader>(
		`
			UPDATE brochures
			SET content = ?, status = 'pending', rejection_reason = NULL
			WHERE id = ? AND created_by = ?
		`,
		[JSON.stringify(normalizedContent), id, user.userId],
	);

	if (result.affectedRows === 0) {
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
	await ensureSchema();

	if (user.role !== "admin") {
		return null;
	}

	const normalizedContent = content === undefined ? null : normalizeEditorState(content);

	const [result] = await pool.query<ResultSetHeader>(
		`
			UPDATE brochures
			SET status = ?, content = COALESCE(?, content), rejection_reason = ?
			WHERE id = ? AND assigned_admin = ?
		`,
		[
			decision,
			normalizedContent ? JSON.stringify(normalizedContent) : null,
			decision === "rejected" ? (rejectionReason?.trim() || null) : null,
			id,
			user.userId,
		],
	);

	if (result.affectedRows === 0) {
		return null;
	}

	return getBrochureByIdForUser(id, user);
}
