import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getServerSession, homeRouteForRole } from "@/lib/server/auth";

export default async function LoginPage() {
	const session = await getServerSession();
	if (session) {
		redirect(homeRouteForRole(session.role));
	}

	return <LoginForm />;
}
