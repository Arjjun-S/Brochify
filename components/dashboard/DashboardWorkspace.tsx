"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrochureRecord, SessionUser } from "@/lib/server/types";

type DashboardWorkspaceProps = {
	user: SessionUser;
};

export default function DashboardWorkspace({ user }: DashboardWorkspaceProps) {
	const router = useRouter();
	const [brochures, setBrochures] = useState<BrochureRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const pendingCount = useMemo(
		() => brochures.filter((brochure) => brochure.status === "pending").length,
		[brochures],
	);

	const dashboardHomeHref = user.role === "admin" ? "/admin/dashboard" : "/faculty/dashboard";

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const endpoint = user.role === "admin" ? "/api/brochure?status=pending" : "/api/brochure";
				const response = await fetch(endpoint, { cache: "no-store" });
				const data = (await response.json()) as { brochures?: BrochureRecord[]; error?: string };

				if (!response.ok) {
					throw new Error(data.error || "Failed to load brochures.");
				}

				setBrochures(data.brochures || []);
			} catch (loadError) {
				const message = loadError instanceof Error ? loadError.message : "Failed to load brochures.";
				setError(message);
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [user.role]);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.replace("/login");
	};

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
			<div className="mx-auto max-w-6xl space-y-6">
				<header className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex min-w-0 items-start gap-4">
							<Link href={dashboardHomeHref} className="flex shrink-0 items-center gap-3 group">
								<Image
									src="/icon-logo.png"
									alt="Brochify Icon"
									width={40}
									height={40}
									priority
									className="h-10 w-10 object-contain drop-shadow-sm"
								/>
								<Image
									src="/text-logo.png"
									alt="Brochify Wordmark"
									width={176}
									height={40}
									priority
									className="h-10 w-auto object-contain drop-shadow-sm"
								/>
							</Link>
							<div className="min-w-0">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Brochify Dashboard</p>
								<h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
									{user.role === "admin" ? "Admin Dashboard" : "Faculty Dashboard"}
								</h1>
								<p className="mt-1 text-sm text-slate-600">Signed in as {user.username}</p>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							{user.role === "faculty" && (
								<Link
									href="/faculty/brochures/create"
									className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
								>
									Create Brochure
								</Link>
							)}

							<button
								type="button"
								onClick={handleLogout}
								className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
							>
								Logout
							</button>
						</div>
					</div>
				</header>

				{user.role === "admin" && (
					<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review Queue</p>
						<p className="mt-2 text-3xl font-black text-slate-900">{pendingCount}</p>
						<p className="text-sm text-slate-600">Pending brochure requests assigned to you</p>
					</section>
				)}

				<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-xl font-semibold text-slate-900">
							{user.role === "admin" ? "Pending Requests" : "My Brochures"}
						</h2>
						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
							{brochures.length} items
						</span>
					</div>

					{loading ? (
						<p className="text-sm text-slate-500">Loading brochures...</p>
					) : error ? (
						<p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
					) : brochures.length === 0 ? (
						<p className="text-sm text-slate-500">No brochures found.</p>
					) : (
						<ul className="space-y-3">
							{brochures.map((brochure) => (
								<li key={brochure.id} className="rounded-2xl border border-slate-200 p-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="font-semibold text-slate-900">{brochure.title}</p>
											<p className="mt-1 text-sm text-slate-600">{brochure.description}</p>
											<p className="mt-1 text-xs text-slate-500">
												{user.role === "admin"
													? `Created by ${brochure.createdByUsername}`
													: `Assigned admin: ${brochure.assignedAdminUsername || "N/A"}`}
											</p>
										</div>

										<div className="flex items-center gap-2">
											<span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
												{brochure.status}
											</span>
											<Link
												href={
													user.role === "faculty" && brochure.status === "draft"
														? `/faculty/brochures/${brochure.id}/details`
														: `/studio?brochureId=${brochure.id}`
												}
												className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
											>
												Open Editor
											</Link>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	);
}
