import { redirect } from "next/navigation";
import { getServerSession, homeRouteForRole } from "@/lib/server/auth";

export default async function RootEntryPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  redirect(homeRouteForRole(session.role));
}
