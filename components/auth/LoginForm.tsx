"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "faculty";

type LoginResponse = {
	user?: {
		role: UserRole;
	};
	error?: string;
};

export default function LoginForm() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<UserRole>("faculty");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password, role }),
			});

			const data = (await response.json()) as LoginResponse;
			if (!response.ok || !data.user) {
				throw new Error(data.error || "Login failed.");
			}

			if (data.user.role === "admin") {
				router.replace("/admin/modules");
			} else {
				router.replace("/faculty/modules");
			}
		} catch (submitError) {
			const message = submitError instanceof Error ? submitError.message : "Login failed.";
			setError(message);
			setSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-16">
			<div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
				<div className="mb-6">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Brochify</p>
					<h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Login</h1>
					<p className="mt-1 text-sm text-slate-600">Sign in to continue with brochure workflow.</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<label className="block">
						<span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
						<select
							value={role}
							onChange={(event) => setRole(event.target.value as UserRole)}
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
						>
							<option value="faculty">Faculty</option>
							<option value="admin">Admin</option>
						</select>
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-medium text-slate-700">Username</span>
						<input
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
							required
						/>
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
						<input
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
							required
						/>
					</label>

					{error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
					>
						{submitting ? "Signing in..." : "Sign In"}
					</button>
				</form>

				<p className="mt-5 text-xs text-slate-500">
					Demo users are seeded automatically if the users table is empty.
					<span className="mx-1">•</span>
					<Link href="/" className="font-medium text-slate-700 underline underline-offset-2">
						Back to home
					</Link>
				</p>
			</div>
		</main>
	);
}
