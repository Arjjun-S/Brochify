import { redirect } from "next/navigation";
import { requireServerSession } from "@/lib/server/auth";

export default async function AdminCertificatePreviewRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireServerSession(["admin"]);
  const { id } = await params;
  redirect(`/certificate?certificateId=${id}`);
}
