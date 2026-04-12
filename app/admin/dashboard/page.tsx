import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";
import { requireServerSession } from "@/lib/server/auth";

export default async function AdminDashboardPage() {
	const session = await requireServerSession(["admin"]);

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
