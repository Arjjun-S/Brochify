"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { SelectBox } from "@/components/ui/SelectBox";

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
		<main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 font-sans selection:bg-indigo-500/30">
			{/* Decorative Background Elements */}
			<div className="absolute inset-0 z-0">
				<div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-indigo-600/20 blur-[120px]" />
				<div className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[60%] rounded-full bg-blue-600/20 blur-[120px]" />
				<div className="absolute top-[20%] right-[10%] h-[40%] w-[30%] rounded-full bg-purple-600/20 blur-[100px]" />
			</div>

			<motion.div 
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
				className="relative z-10 w-full max-w-[420px] px-6"
			>
				<div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl shadow-black/50">
					<div className="mb-10 text-center">
						<motion.div 
							initial={{ scale: 0.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
							className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30"
						>
							<Sparkles className="h-7 w-7 text-white" />
						</motion.div>
						<h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
						<p className="mt-2 text-sm text-slate-400">Sign in to continue your workflow.</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-1.5">
							<label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</label>
							<SelectBox
								value={role}
								onChange={(val) => setRole(val as UserRole)}
								options={[
									{ label: "Faculty Member", value: "faculty" },
									{ label: "Administrator", value: "admin" }
								]}
								className="!border-white/10 !bg-white/5 !text-slate-200 hover:!bg-white/10 focus:!ring-indigo-500/50"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Username</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
									<User className="h-5 w-5 text-slate-500" />
								</div>
								<input
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
									placeholder="Enter your username"
									required
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
									<Lock className="h-5 w-5 text-slate-500" />
								</div>
								<input
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
									placeholder="••••••••"
									required
								/>
							</div>
						</div>

						<AnimatePresence>
							{error && (
								<motion.div
									initial={{ opacity: 0, height: 0, marginTop: 0 }}
									animate={{ opacity: 1, height: "auto", marginTop: 12 }}
									exit={{ opacity: 0, height: 0, marginTop: 0 }}
									className="overflow-hidden rounded-xl bg-rose-500/10 border border-rose-500/20"
								>
									<div className="flex items-center gap-3 px-4 py-3">
										<AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
										<p className="text-sm text-rose-200">{error}</p>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						<motion.button
							whileHover={{ scale: 1.01 }}
							whileTap={{ scale: 0.98 }}
							type="submit"
							disabled={submitting}
							className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white transition-all hover:bg-indigo-600 disabled:opacity-70 mt-4"
						>
							<div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
								<div className="relative h-full w-8 bg-white/20" />
							</div>
							<span>{submitting ? "Authenticating..." : "Sign In"}</span>
							{!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
						</motion.button>
					</form>
				</div>
				
				<div className="mt-8 text-center text-sm">
					<Link href="/" className="font-medium text-slate-400 transition-colors hover:text-white">
						Back home
					</Link>
				</div>
			</motion.div>
		</main>
	);
}
