import ModuleSelectionWorkspace from "@/components/dashboard/ModuleSelectionWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function AdminModuleSelectionPage() {
  const session = await requireServerSession(["admin"]);

  return <ModuleSelectionWorkspace role="admin" username={session.username} />;
}
