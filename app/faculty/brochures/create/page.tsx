import FacultyCreateBrochureForm from "@/components/dashboard/FacultyCreateBrochureForm";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyCreateBrochurePage() {
  await requireServerSession(["faculty"]);
  return <FacultyCreateBrochureForm />;
}