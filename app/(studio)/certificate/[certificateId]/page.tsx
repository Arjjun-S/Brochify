import { redirect } from "next/navigation";
import CertificateEditorPage from "./page-client";
import { requireServerSession } from "@/lib/server/auth";
import { getCertificateByIdForUser } from "@/lib/server/data";

type CertificateEditorRouteProps = {
  params?: Promise<{ certificateId?: string }>;
};

export default async function CertificateEditorRoute({ params }: CertificateEditorRouteProps) {
  const session = await requireServerSession();
  const resolvedParams = params ? await params : undefined;
  const rawCertificateId = resolvedParams?.certificateId;
  const certificateId = Number.parseInt(rawCertificateId || "", 10);

  if (!Number.isFinite(certificateId) || certificateId <= 0) {
    redirect(session.role === "admin" ? "/admin/certificates" : "/faculty/certificate");
  }

  const certificate = await getCertificateByIdForUser(certificateId, session);
  if (!certificate) {
    redirect(session.role === "admin" ? "/admin/certificates" : "/faculty/certificate");
  }

  return (
    <CertificateEditorPage
      initialData={{
        id: certificate.id,
        content: certificate.content,
        status: certificate.status,
      }}
    />
  );
}
