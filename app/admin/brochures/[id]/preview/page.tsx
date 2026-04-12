import { redirect } from "next/navigation";
import { requireServerSession } from "@/lib/server/auth";

export default async function AdminPreviewRedirectPage({ params }: { params: Promise<{ id: string }> }) {
	await requireServerSession(["admin"]);
	const { id } = await params;
	redirect(`/studio?brochureId=${id}`);
}
