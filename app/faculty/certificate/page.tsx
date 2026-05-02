import CertificateWorkspace from "@/components/dashboard/CertificateWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyCertificatePage() {
  const session = await requireServerSession(["faculty"]);

  return (
    <CertificateWorkspace
      user={{
        userId: session.userId,
        username: session.username,
        role: session.role,
      }}
    />
  );
}