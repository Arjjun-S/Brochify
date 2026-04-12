import { redirect } from "next/navigation";
import { homeRouteForRole, requireServerSession } from "@/lib/server/auth";

export default async function DashboardRootPage() {
  const session = await requireServerSession();
  redirect(homeRouteForRole(session.role));
}
