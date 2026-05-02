import FacultyCertificateWorkspace from "@/components/dashboard/FacultyCertificateWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyCertificatesPage() {
  const session = await requireServerSession(["faculty"]);

  return <FacultyCertificateWorkspace user={session} />;
}
