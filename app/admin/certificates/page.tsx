import CertificateWorkspace from "@/components/dashboard/CertificateWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function AdminCertificatesPage() {
  const session = await requireServerSession(["admin"]);

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
