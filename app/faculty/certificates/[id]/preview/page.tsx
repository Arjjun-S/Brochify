import { redirect } from "next/navigation";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyCertificatePreviewRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireServerSession(["faculty"]);
  const { id } = await params;
  redirect(`/certificate?certificateId=${id}`);
}
