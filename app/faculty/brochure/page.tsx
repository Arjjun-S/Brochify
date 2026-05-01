import BrochureWorkspace from "@/components/dashboard/BrochureWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyBrochurePage() {
  const session = await requireServerSession(["faculty"]);

  return (
    <BrochureWorkspace
      user={{
        userId: session.userId,
        username: session.username,
        role: session.role,
      }}
    />
  );
}