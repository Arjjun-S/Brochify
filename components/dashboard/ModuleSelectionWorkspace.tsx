"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogOut } from "lucide-react";

type ModuleSelectionWorkspaceProps = {
  role: "admin" | "faculty";
  username: string;
};

export default function ModuleSelectionWorkspace({ role, username }: ModuleSelectionWorkspaceProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const brochureHref = role === "admin" ? "/admin/dashboard" : "/faculty/dashboard";
  const certificateHref = role === "admin" ? "/admin/certificates" : "/faculty/certificates";

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute left-1/2 top-6 z-20 flex min-w-[160px] -translate-x-1/2 items-center justify-center rounded-3xl border border-white/60 bg-white/85 px-5 py-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.15)] backdrop-blur-[18px]">
        <Link href="/landing" aria-label="Brochify home" className="pointer-events-auto">
          <Image src="/Main-logo.png" alt="Brochify" width={150} height={150} className="h-14 w-auto object-contain" priority />
        </Link>
      </div>

      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <Link
          href={brochureHref}
          className="group relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 py-8 lg:min-h-screen lg:px-10 lg:py-10"
          style={{ background: "rgba(0, 42, 130, 1)" }}
        >
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <Image
              src="/brochure.png"
              alt="Brochure Generator"
              width={560}
              height={400}
              className="module-image h-auto w-[74%] max-w-[500px] rotate-[-5deg] object-contain transition duration-300 group-hover:scale-[1.02] pointer-events-none select-none"
              style={{ transform: "scale(0.9) rotate(-5deg)" }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <h1 className="max-w-4xl text-center text-[44px] font-bold leading-[0.95] tracking-[0.5px] [font-family:'Poppins','Montserrat',sans-serif] md:text-[56px]">
              <span className="block">BROCHURE</span>
              <span className="block">GENERATOR</span>
            </h1>
            <p className="max-w-lg text-sm text-white/70 [font-family:'Inter','Open Sans',sans-serif] md:text-base">
              Create stunning, professional brochures in minutes with Brochify.
            </p>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition">
                Create Brochure
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>

        <Link
          href={certificateHref}
          className="group relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 py-8 lg:min-h-screen lg:px-10 lg:py-10"
          style={{ background: "rgba(70, 46, 147, 1)" }}
        >
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <Image
              src="/certificate.png"
              alt="Certificate Generator"
              width={560}
              height={400}
              className="module-image h-auto w-[74%] max-w-[500px] object-contain transition duration-300 group-hover:scale-[1.02] pointer-events-none select-none"
              style={{ transform: "scale(0.9)" }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <h2 className="max-w-4xl text-center text-[44px] font-bold leading-[0.95] tracking-[0.5px] [font-family:'Poppins','Montserrat',sans-serif] md:text-[56px]">
              <span className="block">CERTIFICATE</span>
              <span className="block">GENERATOR</span>
            </h2>
            <p className="max-w-lg text-sm text-white/70 [font-family:'Inter','Open Sans',sans-serif] md:text-base">
              Design elegant, customized certificates for any occasion effortlessly.
            </p>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition">
                Create Certificate
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-5 md:px-10">
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Signing Out" : "Logout"}
        </button>

        <div className="pointer-events-none" />

        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-2 backdrop-blur-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black uppercase text-slate-900">
            {username.slice(0, 1)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">Profile</p>
            <p className="text-xs font-semibold text-white">{username}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
