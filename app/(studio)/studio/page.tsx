import { redirect } from "next/navigation";
import BrochureStudioPage from "@/features/studio/pages/BrochureStudioPage";
import { homeRouteForRole, requireServerSession } from "@/lib/server/auth";
import { getBrochureByIdForUser } from "@/lib/server/data";

type StudioPageProps = {
	searchParams?: Promise<{ brochureId?: string; animate?: string }>;
};

export default async function StudioPage({ searchParams }: StudioPageProps) {
	const session = await requireServerSession();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const rawBrochureId = resolvedSearchParams?.brochureId;
	const autoAnimate = resolvedSearchParams?.animate === "1";
	const brochureId = Number.parseInt(rawBrochureId || "", 10);

	if (!Number.isFinite(brochureId) || brochureId <= 0) {
		redirect(homeRouteForRole(session.role));
	}

	const brochure = await getBrochureByIdForUser(brochureId, session);
	if (!brochure) {
		redirect(homeRouteForRole(session.role));
	}

	return <BrochureStudioPage brochure={brochure} session={session} autoAnimate={autoAnimate} />;
}
