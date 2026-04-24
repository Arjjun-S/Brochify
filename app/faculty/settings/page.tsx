import SettingsWorkspace from "@/components/dashboard/SettingsWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultySettingsPage() {
  const session = await requireServerSession(["faculty"]);

  return <SettingsWorkspace user={session} />;
}
