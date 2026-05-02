import ModuleSelectionWorkspace from "@/components/dashboard/ModuleSelectionWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyModuleSelectionPage() {
  const session = await requireServerSession(["faculty"]);

  return <ModuleSelectionWorkspace role="faculty" username={session.username} />;
}
