import type { BrochureData, OverlayItem, OverlayTextAlign, SegmentPosition } from "@/lib/domains/brochure";

export type UserRole = "admin" | "faculty";
export type BrochureStatus = "draft" | "pending" | "approved" | "rejected";

export type SessionUser = {
	userId: number;
	username: string;
	role: UserRole;
};

export type BrochureTemplateId = "whiteBlue" | "beigeDust" | "softBlue" | "tealGloss" | "yellowDust";

export type EditorFormLineStyle = {
	fontFamily?: string;
	fontSize?: number;
	color?: string;
	align?: OverlayTextAlign;
};

export type EditorState = {
	brochureData: BrochureData;
	selectedLogos: string[];
	segmentPositions: Record<string, SegmentPosition>;
	overlayItems: OverlayItem[];
	template: BrochureTemplateId;
	hiddenSegments: string[];
	formLineStyles: Record<string, EditorFormLineStyle>;
};

export type BrochureRecord = {
	id: number;
	title: string;
	description: string;
	content: EditorState;
	createdBy: number;
	createdByUsername: string;
	assignedAdminId: number;
	assignedAdminUsername: string | null;
	status: BrochureStatus;
	rejectionReason: string | null;
	createdAt: string;
	updatedAt: string;
};

export type LoginInput = {
	username: string;
	password: string;
	role: UserRole;
};
