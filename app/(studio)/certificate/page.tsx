import { redirect } from "next/navigation";
import CertificateStudioPage from "@/features/certificate/pages/CertificateStudioPage";
import { requireServerSession } from "@/lib/server/auth";
import { getCertificateByIdForUser } from "@/lib/server/data";

type CertificateStudioRouteProps = {
  searchParams?: Promise<{ certificateId?: string }>;
};

export default async function CertificateStudioRoute({ searchParams }: CertificateStudioRouteProps) {
  const session = await requireServerSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawCertificateId = resolvedSearchParams?.certificateId;
  const certificateId = Number.parseInt(rawCertificateId || "", 10);

  if (!Number.isFinite(certificateId) || certificateId <= 0) {
    redirect(session.role === "admin" ? "/admin/certificates" : "/faculty/certificates");
  }

  const certificate = await getCertificateByIdForUser(certificateId, session);
  if (!certificate) {
    redirect(session.role === "admin" ? "/admin/certificates" : "/faculty/certificates");
  }

  return <CertificateStudioPage session={session} certificate={certificate} />;
}
