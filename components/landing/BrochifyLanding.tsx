"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileDown,
  LayoutTemplate,
  Send,
  ShieldCheck,
  PenLine,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import LandingTileCanvas from "./LandingTileCanvas";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const softReveal = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

type ClickBurst = { id: number; x: number; y: number };

function loginNext(path: string) {
  return `/login?next=${encodeURIComponent(path)}`;
}

const workspaces: { title: string; meta: string; href: string; icon: ReactNode }[] = [
  {
    title: "Studio",
    meta: "Brochures",
    href: loginNext("/faculty/brochures/create"),
    icon: <PenLine className="h-4 w-4" aria-hidden />,
  },
  {
    title: "Certificates",
    meta: "Issue",
    href: loginNext("/faculty/certificates"),
    icon: <Award className="h-4 w-4" aria-hidden />,
  },
  {
    title: "Review",
    meta: "Approve",
    href: loginNext("/admin/dashboard"),
    icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
  },
  {
    title: "Templates",
    meta: "Brand",
    href: loginNext("/studio"),
    icon: <LayoutTemplate className="h-4 w-4" aria-hidden />,
  },
];

const workflowSteps: { title: string; meta: string; icon: ReactNode }[] = [
  {
    title: "Brief",
    meta: "Details in",
    icon: <PenLine className="h-4 w-4" aria-hidden />,
  },
  {
    title: "Design",
    meta: "Layout set",
    icon: <LayoutTemplate className="h-4 w-4" aria-hidden />,
  },
  {
    title: "Review",
    meta: "Admin pass",
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  },
  {
    title: "Export",
    meta: "PDF ready",
    icon: <FileDown className="h-4 w-4" aria-hidden />,
  },
];

const shouldUseLiteMode = () => {
  if (typeof window === "undefined") return false;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData =
    (window.navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData ?? false;
  return prefersReducedMotion || saveData;
};

export default function BrochifyLanding() {
  const hydrated = useHydrated();
  const [clickBursts, setClickBursts] = useState<ClickBurst[]>([]);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  const liteMode = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const fn = () => onStoreChange();
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    () => shouldUseLiteMode(),
    () => false,
  );

  const showMouseFx = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      const fn = () => onStoreChange();
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    () => !liteMode && !window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  useEffect(() => {
    if (!showMouseFx) return;

    const applyPointerPosition = (x: number, y: number) => {
      const ring = ringRef.current;
      const dot = dotRef.current;
      if (ring) {
        ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(45deg)`;
      }
      if (dot) {
        dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    const updatePointer = (event: PointerEvent) => {
      applyPointerPosition(event.clientX, event.clientY);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (liteMode) return;
      const burstId = event.timeStamp + Math.random();
      setClickBursts((prev) => [...prev.slice(-4), { id: burstId, x: event.clientX, y: event.clientY }]);
      window.setTimeout(() => {
        setClickBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 420);
    };

    const hidePointer = () => {
      applyPointerPosition(-120, -120);
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerleave", hidePointer);

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerleave", hidePointer);
    };
  }, [liteMode, showMouseFx]);

  return (
    <div
      className="relative min-h-[100svh] w-full overflow-x-hidden bg-[#05040A] text-slate-200 selection:bg-violet-500/30"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {!liteMode && <LandingTileCanvas />}

      {showMouseFx && (
        <>
          <div
            ref={ringRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[29] h-7 w-7 border border-violet-400/30 will-change-transform"
          />
          <div
            ref={dotRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[29] h-1.5 w-1.5 rounded-full bg-violet-400/80 will-change-transform"
          />

          {clickBursts.map((burst) => (
            <motion.div
              key={burst.id}
              aria-hidden
              className="pointer-events-none fixed z-30 h-3 w-3 border border-violet-500/60"
              initial={{ x: burst.x, y: burst.y, scale: 0.2, opacity: 0.95, rotate: 20 }}
              animate={{ x: burst.x, y: burst.y, scale: 5.2, opacity: 0, rotate: 130 }}
              transition={{ duration: 0.42, ease: [0.18, 0.78, 0.2, 1] }}
              style={{ translateX: "-50%", translateY: "-50%" }}
            />
          ))}
        </>
      )}

      <div className="relative z-10">
        <header className="px-4 pt-4 sm:px-6 md:pt-6">
          <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between rounded-full border border-white/5 bg-[#0C0916]/80 px-3.5 shadow-2xl backdrop-blur-2xl sm:px-5">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Image
                src="/icon-logo.png"
                alt=""
                width={36}
                height={36}
                className="h-8 w-8 object-contain"
                priority
              />
              <Image
                src="/text-logo.png"
                alt="Brochify"
                width={152}
                height={34}
                className="h-6 w-auto object-contain sm:h-7 invert opacity-90 brightness-200"
                priority
              />
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-[13px] font-semibold text-slate-400 transition hover:text-white sm:px-4"
              >
                Sign in
              </Link>
              <Link
                href={hydrated ? loginNext("/studio") : "/login"}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black shadow-lg transition hover:bg-slate-200"
              >
                Open <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
              </Link>
            </div>
          </div>
        </header>

        <main className="relative">
          <section className="mx-auto w-full max-w-[1180px] px-5 pb-8 pt-8 sm:px-6 md:pb-12 md:pt-10">
            <motion.div
              variants={softReveal}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2.6rem] border border-white/5 bg-[#0C0916]/90 p-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-7 lg:p-10"
            >
              <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-fuchsia-600/5 blur-[80px]" />

              <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                <div className="max-w-xl">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    transition={{ duration: 0.5, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-xs font-semibold tracking-wide text-violet-300">
                        Campus Collateral
                      </span>
                    </div>
                    <h1 className="mt-6 max-w-[12ch] text-[3.5rem] font-bold leading-[1.05] tracking-tight text-white sm:text-[4.5rem] lg:text-[5.2rem]">
                      Draft to <br className="hidden sm:block" />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300">
                        approved PDF.
                      </span>
                    </h1>
                    <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
                      Empower faculty teams to effortlessly design, review, and export beautifully branded brochures and certificates.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        href={hydrated ? loginNext("/studio") : "/login"}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-200"
                      >
                        Open studio <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
                      </Link>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  variants={softReveal}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="relative min-h-[390px] lg:min-h-[455px]"
                >
                  <div className="absolute left-2 top-8 hidden h-40 w-40 rounded-[2rem] border border-white/5 bg-[#120F1C] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] sm:block" />

                  <div className="absolute left-0 top-3 w-[68%] min-w-[290px] max-w-[430px] rotate-[-3deg] rounded-[2rem] border border-white/5 bg-[#120F1C] p-3 shadow-2xl">
                    <div className="flex items-center justify-between px-2 pb-3 pt-1">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Studio
                      </span>
                    </div>

                    <div className="rounded-[1.45rem] bg-[#0A0810] p-4 border border-white/5">
                      <div className="rounded-[1.1rem] bg-[linear-gradient(135deg,#7c3aed_0%,#a855f7_100%)] p-5 text-white shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                        <div className="h-2 w-16 rounded-full bg-white/40" />
                        <div className="mt-14 space-y-2 relative">
                          <div className="h-4 w-40 rounded-full bg-white/90" />
                          <div className="h-2.5 w-52 rounded-full bg-white/60" />
                          <div className="h-2.5 w-32 rounded-full bg-white/40" />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="h-20 rounded-2xl bg-[#1A1629] border border-white/5" />
                        <div className="h-20 rounded-2xl bg-[#1A1629] border border-white/5" />
                        <div className="h-20 rounded-2xl bg-[#1A1629] border border-white/5" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-0 top-20 w-[54%] min-w-[245px] rounded-[1.75rem] border border-white/5 bg-[#161324] p-5 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Approval</p>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                        Live
                      </span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {["Faculty draft", "Admin review", "PDF export"].map((item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <span
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border",
                              index === 2 
                                ? "bg-violet-600 text-white border-violet-500 shadow-md" 
                                : "bg-[#0A0810] text-slate-400 border-white/5",
                            ].join(" ")}
                          >
                            {index + 1}
                          </span>
                          <span className={index === 2 ? "text-sm font-semibold text-white" : "text-sm font-medium text-slate-400"}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-7 left-[18%] flex items-center gap-3 rounded-full border border-white/5 bg-[#1C182B] px-4 py-3 shadow-2xl">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
                      <Send className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Ready to publish</p>
                      <p className="text-xs font-medium text-slate-400">Signed-off export</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          <section className="mx-auto w-full max-w-[1180px] px-5 pb-10 sm:px-6 md:pb-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2.25rem] border border-white/5 bg-[#0C0916]/90 p-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-6 md:p-8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                    Workflow
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Approval lane
                  </h2>
                </div>
                <p className="max-w-xs text-sm leading-6 text-slate-400">
                  Every handoff stays visible.
                </p>
              </div>

              <div className="relative mt-8 rounded-[1.7rem] border border-white/5 bg-[#120F1C] p-4 sm:p-5">
                <div className="absolute left-10 right-10 top-1/2 hidden h-[1px] -translate-y-1/2 bg-white/5 sm:block" />
                <div className="grid gap-3 sm:grid-cols-4">
                  {workflowSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.28, delay: index * 0.05 }}
                      className={[
                        "group relative rounded-[1.35rem] border border-white/5 bg-[#161324] p-5 shadow-xl hover:bg-[#1C182B] hover:border-white/10 transition-all",
                        index % 2 === 0 ? "sm:-translate-y-3" : "sm:translate-y-3",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#201C33] border border-white/5 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                          {step.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-500">0{index + 1}</span>
                      </div>
                      <p className="mt-6 text-base font-semibold text-slate-100">{step.title}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {step.meta}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-6 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {workspaces.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/5 bg-[#0C0916]/90 p-5 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-[#120F1C] hover:border-white/10"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1629] border border-white/5 text-slate-300 transition-colors group-hover:bg-violet-600/20 group-hover:text-violet-300 group-hover:border-violet-500/30">
                      {tool.icon}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-slate-100">{tool.title}</span>
                      <span className="text-xs font-medium text-slate-500 mt-0.5 block">{tool.meta}</span>
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-400"
                    aria-hidden
                  />
                </Link>
              ))}
            </motion.div>
          </section>
        </main>

        <footer className="relative px-5 pb-8 sm:px-6">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-2 border-t border-white/5 pt-6 sm:flex-row">
            <span className="text-[11px] font-medium text-slate-500">© {new Date().getFullYear()} Brochify</span>
            <span className="text-[11px] text-slate-500">Built for campus teams.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
