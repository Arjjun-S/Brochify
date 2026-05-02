import { redirect } from "next/navigation";
import { homeRouteForRole, requireServerSession } from "@/lib/server/auth";
import { getBrochureByIdForUser } from "@/lib/server/data";
import { prisma } from "@/lib/server/prisma";

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

	const project = await prisma.designProject.create({
		data: {
			name: brochure.title || "Untitled design",
			json: typeof brochure.content === "string"
				? brochure.content
				: JSON.stringify(brochure.content || {}),
			width: 900,
			height: 1200,
			createdBy: session.userId,
		},
	});

	redirect(`/editor/${project.id}`);
}
