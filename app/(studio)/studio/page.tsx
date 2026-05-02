import { redirect } from "next/navigation";
import { homeRouteForRole, requireServerSession } from "@/lib/server/auth";
import { getBrochureByIdForUser } from "@/lib/server/data";
import { prisma } from "@/lib/server/prisma";
import { createDesignProjectSeedFromBrochure } from "@/lib/domains/brochure/canvasBridge";

function isBrochureLinkingUnavailable(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message;
	return (
		message.includes("Unknown argument `brochureId`")
		|| message.includes("Unknown arg `brochureId`")
		|| message.includes("Unknown column") && message.includes("brochure_id")
		|| message.includes("column `brochure_id` does not exist")
	);
}

type StudioPageProps = {
	searchParams?: Promise<{ brochureId?: string; animate?: string }>;
};

export default async function StudioPage({ searchParams }: StudioPageProps) {
	const session = await requireServerSession();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const rawBrochureId = resolvedSearchParams?.brochureId;
	const brochureId = Number.parseInt(rawBrochureId || "", 10);

	if (!Number.isFinite(brochureId) || brochureId <= 0) {
		redirect(homeRouteForRole(session.role));
	}

	const brochure = await getBrochureByIdForUser(brochureId, session);
	if (!brochure) {
		redirect(homeRouteForRole(session.role));
	}

	let existingProject: { id: number } | null = null;
	try {
		existingProject = await prisma.designProject.findFirst({
			where: { brochureId: brochure.id },
			select: { id: true },
		} as never);
	} catch (error) {
		if (!isBrochureLinkingUnavailable(error)) {
			throw error;
		}
	}

	if (existingProject) {
		redirect(`/editor/${existingProject.id}?brochureId=${brochure.id}`);
	}

	const templates = await prisma.designProject.findMany({
		where: { isTemplate: true },
		select: {
			id: true,
			name: true,
			json: true,
			width: true,
			height: true,
		},
		orderBy: { updatedAt: "desc" },
		take: 50,
	});

	const preferredTemplate = (() => {
		if (templates.length === 0) {
			return null;
		}

		const preferredToken = brochure.content.template.toLowerCase();
		return (
			templates.find((template) =>
				template.name.toLowerCase().includes(preferredToken),
			) ?? templates[0]
		);
	})();

	const seed = createDesignProjectSeedFromBrochure(brochure, preferredTemplate);

	const createWithoutLink = () => prisma.designProject.create({
		data: {
			name: seed.name,
			json: seed.json,
			width: seed.width,
			height: seed.height,
			createdBy: session.userId,
		},
	});

	let project: { id: number };
	try {
		project = await prisma.designProject.create({
			data: {
				name: seed.name,
				json: seed.json,
				width: seed.width,
				height: seed.height,
				brochureId: brochure.id,
				createdBy: session.userId,
			},
		} as never);
	} catch (error) {
		if (!isBrochureLinkingUnavailable(error)) {
			throw error;
		}

		project = await createWithoutLink();
	}

	redirect(`/editor/${project.id}?brochureId=${brochure.id}`);
}
