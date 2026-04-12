import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function FacultyDashboardPage() {
	const session = await requireServerSession(["faculty"]);

	return (
		<DashboardWorkspace
			user={{
				userId: session.userId,
				username: session.username,
				role: session.role,
			}}
		/>
	);
}
