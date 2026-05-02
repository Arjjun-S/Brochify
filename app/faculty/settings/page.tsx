import SettingsWorkspace from "@/components/dashboard/SettingsWorkspace";
import { requireServerSession } from "@/lib/server/auth";

interface FacultySettingsPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function FacultySettingsPage({ searchParams }: FacultySettingsPageProps) {
  const session = await requireServerSession(["faculty"]);
  const { from } = await searchParams;

  return <SettingsWorkspace user={session} backTo={from ? `/${from}` : undefined} />;
}
