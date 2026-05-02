import { redirect } from "next/navigation";
import BrochifyLanding from "@/components/landing/BrochifyLanding";
import { getServerSession, homeRouteForRole } from "@/lib/server/auth";

export default async function RootEntryPage() {
  const session = await getServerSession();
  if (session) {
    redirect(homeRouteForRole(session.role));
  }

  return <BrochifyLanding />;
}
