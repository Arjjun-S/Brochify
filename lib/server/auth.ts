import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionUser, UserRole } from "@/lib/server/types";

const SESSION_COOKIE_NAME = "brochify_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = SessionUser & {
	exp: number;
};

function getSessionSecret(): string {
	return process.env.SESSION_SECRET || "change_this_session_secret";
}

function signPayload(payloadBase64: string): string {
	return createHmac("sha256", getSessionSecret()).update(payloadBase64).digest("base64url");
}

function parseSessionToken(token: string | undefined | null): SessionUser | null {
	if (!token) {
		return null;
	}

	const [payloadBase64, signature] = token.split(".");
	if (!payloadBase64 || !signature) {
		return null;
	}

	const expectedSignature = signPayload(payloadBase64);
	const left = Buffer.from(signature);
	const right = Buffer.from(expectedSignature);

	if (left.length !== right.length || !timingSafeEqual(left, right)) {
		return null;
	}

	try {
		const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as SessionPayload;
		if (!payload || typeof payload !== "object") {
			return null;
		}

		const now = Math.floor(Date.now() / 1000);
		if (!payload.exp || payload.exp <= now) {
			return null;
		}

		if (!payload.userId || !payload.username || (payload.role !== "admin" && payload.role !== "faculty")) {
			return null;
		}

		return {
			userId: payload.userId,
			username: payload.username,
			role: payload.role,
		};
	} catch {
		return null;
	}
}

export function createSessionToken(user: SessionUser): string {
	const payload: SessionPayload = {
		...user,
		exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
	};

	const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
	const signature = signPayload(payloadBase64);
	return `${payloadBase64}.${signature}`;
}

export function setSessionCookie(response: NextResponse, user: SessionUser): void {
	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: createSessionToken(user),
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: SESSION_TTL_SECONDS,
	});
}

export function clearSessionCookie(response: NextResponse): void {
	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: "",
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		expires: new Date(0),
	});
}

export function readSessionFromRequest(request: NextRequest): SessionUser | null {
	const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	return parseSessionToken(cookieValue);
}

export async function getServerSession(): Promise<SessionUser | null> {
	const cookieStore = await cookies();
	const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	return parseSessionToken(cookieValue);
}

function roleHome(role: UserRole): string {
	return role === "admin" ? "/admin/modules" : "/faculty/modules";
}

export async function requireServerSession(allowedRoles?: UserRole[]): Promise<SessionUser> {
	const session = await getServerSession();
	if (!session) {
		redirect("/login");
	}

	if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
		redirect(roleHome(session.role));
	}

	return session;
}

export function homeRouteForRole(role: UserRole): string {
	return roleHome(role);
}
