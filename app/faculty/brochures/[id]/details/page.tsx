import { notFound } from "next/navigation";
import FacultyDetailedInputForm from "@/components/dashboard/FacultyDetailedInputForm";
import { requireServerSession } from "@/lib/server/auth";

type FacultyDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FacultyDetailsPage({ params }: FacultyDetailsPageProps) {
  await requireServerSession(["faculty"]);

  const { id: rawId } = await params;
  const brochureId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(brochureId) || brochureId <= 0) {
    notFound();
  }

  return <FacultyDetailedInputForm brochureId={brochureId} />;
}
