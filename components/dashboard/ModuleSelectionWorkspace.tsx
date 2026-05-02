"use client";

import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LogOut, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type ModuleSelectionWorkspaceProps = {
  role: "admin" | "faculty";
  username: string;
};

const Glitter = () => {
  const [particles, setParticles] = useState<{ id: number; size: number; left: number; top: number; y: number; x: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(
      [...Array(20)].map((_, i) => ({
        id: i,
        size: Math.random() * 4 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        y: Math.random() * -40 - 10,
        x: Math.random() * 20 - 10,
        duration: Math.random() * 2 + 1.5,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 1, 0.8, 0],
            scale: [0, 1.5, 2, 1.5, 0],
            y: [0, p.y],
            x: [0, p.x],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function ModuleSelectionWorkspace({ role, username }: ModuleSelectionWorkspaceProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const brochureHref = role === "admin" ? "/admin/dashboard" : "/faculty/brochure";
  const certificateHref = role === "admin" ? "/admin/certificates" : "/faculty/certificate";

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loggingOut) return;
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white font-sans bg-slate-950">
      <div className="absolute left-1/2 top-6 z-30 flex min-w-[160px] -translate-x-1/2 items-center justify-center rounded-[2rem] border border-white/40 bg-white/90 px-6 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-transform hover:scale-105 duration-300">
        <Link href="/landing" aria-label="Brochify home" className="pointer-events-auto">
          <Logo appearance="light" iconClassName="h-9 w-9" />
        </Link>
      </div>

      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <Link
          href={brochureHref}
          className="group relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 py-8 lg:min-h-screen lg:px-10 lg:py-10 cursor-pointer"
        >
          {/* Animated Background */}
          <motion.div 
            className="absolute inset-0 z-0 bg-gradient-to-br from-[#002A82] to-[#001850]"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
          
          <div className="absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            <Glitter />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center w-full mt-24">
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-[500px] flex justify-center"
            >
              <Image
                src="/brochure.png"
                alt="Brochure Generator"
                width={560}
                height={400}
                className="h-auto w-[74%] rotate-[-5deg] object-contain transition-all duration-700 group-hover:scale-[1.15] group-hover:-translate-y-6 group-hover:rotate-[-2deg] drop-shadow-2xl pointer-events-none select-none"
              />
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 text-center mt-auto pb-10">
            <motion.h1 
              className="text-[44px] font-black leading-[1.05] tracking-tight md:text-[56px] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-sm"
            >
              <span className="block">BROCHURE</span>
              <span className="block">GENERATOR</span>
            </motion.h1>
            <p className="max-w-md text-sm text-white/80 font-medium md:text-base">
              Create stunning, professional brochures in minutes with Brochify.
            </p>
            <div className="pt-6">
              <span className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-bold tracking-wide text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#002A82] shadow-lg hover:shadow-xl hover:shadow-white/20">
                <Sparkles className="h-4 w-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 -ml-2" />
                Create Brochure
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>

        <Link
          href={certificateHref}
          className="group relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 py-8 lg:min-h-screen lg:px-10 lg:py-10 cursor-pointer"
        >
          {/* Animated Background */}
          <motion.div 
            className="absolute inset-0 z-0 bg-gradient-to-br from-[#462E93] to-[#2B1B61]"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />

          <div className="absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            <Glitter />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center w-full mt-24">
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="relative w-full max-w-[500px] flex justify-center"
            >
              <Image
                src="/certificate.png"
                alt="Certificate Generator"
                width={560}
                height={400}
                className="h-auto w-[74%] object-contain transition-all duration-700 group-hover:scale-[1.15] group-hover:-translate-y-6 group-hover:rotate-[3deg] drop-shadow-2xl pointer-events-none select-none"
              />
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 text-center mt-auto pb-10">
            <motion.h2 
              className="text-[44px] font-black leading-[1.05] tracking-tight md:text-[56px] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-sm"
            >
              <span className="block">CERTIFICATE</span>
              <span className="block">GENERATOR</span>
            </motion.h2>
            <p className="max-w-md text-sm text-white/80 font-medium md:text-base">
              Design elegant, customized certificates for any occasion effortlessly.
            </p>
            <div className="pt-6">
              <span className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-bold tracking-wide text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#462E93] shadow-lg hover:shadow-xl hover:shadow-white/20">
                <Sparkles className="h-4 w-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 -ml-2" />
                Create Certificate
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 pt-6 md:px-10">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-xl transition hover:bg-white/20 hover:border-white/40 disabled:opacity-70 group shadow-lg"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {loggingOut ? "Signing Out..." : "Logout"}
        </button>

        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-xl transition hover:bg-white/20 hover:border-white/40 shadow-lg cursor-default">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-white to-slate-200 text-sm font-black uppercase text-slate-900 shadow-inner">
            {username.slice(0, 1)}
          </div>
          <div className="hidden text-left sm:block pr-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Profile</p>
            <p className="text-sm font-bold text-white leading-tight">{username}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
