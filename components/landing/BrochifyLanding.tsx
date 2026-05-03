"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Download,
  Eye,
  FileDown,
  FileText,
  Layers3,
  MousePointer2,
  PenTool,
  Play,
  WandSparkles,
} from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function loginNext(path: string) {
  return `/login?next=${encodeURIComponent(path)}`;
}

type IconItem = {
  title: string;
  description?: string;
  icon: ReactNode;
};

const trustedLogos = [
  "SRM",
  "IEEE Madras Section",
  "School of Computing",
  "IEEE TEMS",
  "Institution's Innovation Council",
];

const highlights: IconItem[] = [
  { title: "Easy to Use", icon: <MousePointer2 className="h-4 w-4" aria-hidden /> },
  { title: "AI Powered", icon: <WandSparkles className="h-4 w-4" aria-hidden /> },
  { title: "Bulk Generation", icon: <Layers3 className="h-4 w-4" aria-hidden /> },
  { title: "Export as PDF", icon: <FileDown className="h-4 w-4" aria-hidden /> },
];

const features: IconItem[] = [
  {
    title: "Drag & Drop Editor",
    description: "Canva-like editor with text, images, shapes, logos and custom layouts.",
    icon: <MousePointer2 className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Smart Templates",
    description: "Ready-made professional brochure and certificate templates.",
    icon: <PenTool className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Bulk Certificate Generator",
    description: "Upload data and generate hundreds of certificates instantly.",
    icon: <Layers3 className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Approval Workflow",
    description: "Admin approval system for authenticity, quality and control.",
    icon: <BadgeCheck className="h-6 w-6" aria-hidden />,
  },
];

const steps: IconItem[] = [
  {
    title: "Fill Details",
    description: "Add basic information and content.",
    icon: <FileText className="h-5 w-5" aria-hidden />,
  },
  {
    title: "Customize",
    description: "Edit the layout, colors and brand assets.",
    icon: <PenTool className="h-5 w-5" aria-hidden />,
  },
  {
    title: "Preview",
    description: "Review your final design before export.",
    icon: <Eye className="h-5 w-5" aria-hidden />,
  },
  {
    title: "Download",
    description: "Export as PDF or generate in bulk.",
    icon: <Download className="h-5 w-5" aria-hidden />,
  },
];

export default function BrochifyLanding() {
  const hydrated = useHydrated();
  const studioHref = hydrated ? loginNext("/studio") : "/login";
  const certificateHref = hydrated ? loginNext("/faculty/certificates") : "/login";

  return (
    <div
      className="min-h-screen bg-[#f7f9ff] text-[#0b163f] selection:bg-[#462E93]/20"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#031756]/65 px-4 py-3 backdrop-blur-xl sm:px-6">
        <nav className="mx-auto flex h-14 max-w-[1180px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icon-logo.png" alt="Brochify" width={42} height={42} className="h-10 w-10" priority />
            <span className="leading-none">
              <span
                className="block text-lg font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
              >
                BROCHIFY
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-xs font-semibold text-white/85 transition hover:text-white"
            >
              Login
            </Link>
            <Link
              href={studioHref}
              className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#462E93] shadow-[0_10px_24px_-10px_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5 hover:bg-[#eef4ff]"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(125deg,#001846_0%,#002A82_45%,#462E93_100%)] pt-28 text-white sm:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_83%_26%,rgba(255,255,255,0.15),transparent_28%),radial-gradient(circle_at_15%_10%,rgba(58,172,255,0.24),transparent_26%)]" />
          <div className="absolute right-8 top-28 hidden h-56 w-56 bg-[radial-gradient(circle,rgba(255,255,255,0.18)_1.5px,transparent_1.5px)] [background-size:18px_18px] opacity-50 lg:block" />

          <div className="relative mx-auto grid min-h-[610px] max-w-[1180px] gap-10 px-5 pb-24 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl">
              <motion.h1
                variants={fadeUp}
                className="max-w-[700px] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[4.55rem]"
                style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
              >
                Create Stunning{" "}
                <span className="text-[#37b7ff]">Brochures</span> &{" "}
                <span className="text-[#b998ff]">Certificates</span> in Minutes
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-5 max-w-[590px] text-base leading-8 text-white/78 sm:text-lg">
                Design professional brochures and certificates with easy customization, bulk generation, and cloud
                export. All in one powerful platform.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={studioHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#39b8ff,#9c4dff)] px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_34px_-18px_rgba(84,178,255,0.95)] transition hover:-translate-y-1"
                >
                  Start Creating For Free <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="#templates"
                  className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/7 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/12"
                >
                  <Play className="h-4 w-4" aria-hidden /> View Demo
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-x-7 gap-y-4">
                {highlights.map((item) => (
                  <span key={item.title} className="inline-flex items-center gap-2 text-xs font-semibold text-white/88">
                    {item.icon}
                    {item.title}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-h-[420px] lg:min-h-[520px]"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 top-8 w-[58%] min-w-[280px] max-w-[430px] origin-bottom rotate-[-8deg] drop-shadow-[0_28px_40px_rgba(0,0,0,0.35)]"
              >
                <Image
                  src="/brochure.png"
                  alt="Blue folded brochure preview"
                  width={1270}
                  height={1239}
                  className="h-auto w-full"
                  priority
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 right-0 w-[64%] min-w-[300px] max-w-[500px] rotate-[4deg] drop-shadow-[0_30px_46px_rgba(0,0,0,0.38)]"
              >
                <Image
                  src="/certificate.png"
                  alt="Purple certificate preview"
                  width={1334}
                  height={1179}
                  className="h-auto w-full"
                  priority
                />
              </motion.div>
            </motion.div>
          </div>
          <div className="absolute -bottom-px left-0 h-14 w-full rounded-t-[50%] bg-[#f7f9ff]" />
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6">
          <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#7969b2]">
            Import logos easily
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {trustedLogos.map((logo) => (
              <motion.div
                key={logo}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex min-h-20 items-center justify-center rounded-2xl border border-[#e8edff] bg-white px-5 text-center text-sm font-extrabold text-[#1c3679] shadow-[0_16px_40px_-28px_rgba(42,58,117,0.65)]"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#7d62db]">Powerful Features</p>
            <h2
              className="mt-2 text-3xl font-extrabold tracking-tight text-[#111b45] sm:text-4xl"
              style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
            >
              Everything You Need to Create Professionally
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl border border-[#edf1ff] bg-white p-7 text-center shadow-[0_20px_50px_-32px_rgba(42,58,117,0.85)] transition duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_28px_70px_-32px_rgba(70,46,147,0.8)]"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2fb9ff,#8d4dff)] text-white shadow-[0_14px_24px_-14px_rgba(70,46,147,0.9)]">
                  {feature.icon}
                </span>
                <h3 className="mt-6 text-base font-extrabold text-[#172052]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#657092]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#7d62db]">How It Works</p>
            <h2
              className="mt-2 text-3xl font-extrabold tracking-tight text-[#111b45] sm:text-4xl"
              style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
            >
              Simple Steps, Amazing Results
            </h2>
          </div>
          <div className="relative mt-12 grid gap-7 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-8 hidden border-t border-dashed border-[#b8c4ff] md:block" />
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative text-center"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#edf1ff] bg-white text-[#7c51ff] shadow-[0_16px_40px_-28px_rgba(42,58,117,0.7)]">
                  {step.icon}
                </span>
                <h3 className="mt-5 text-sm font-extrabold text-[#111b45]">
                  {index + 1}. {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-[170px] text-xs leading-5 text-[#707a9b]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="templates" className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6">
          <div className="rounded-3xl border border-[#e5ebff] bg-[linear-gradient(135deg,#eef5ff,#f4eefe)] p-6 shadow-[0_24px_70px_-45px_rgba(42,58,117,0.9)] sm:p-8">
            <div className="text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#7d62db]">
                Beautiful Templates
              </p>
              <h2
                className="mt-2 text-3xl font-extrabold tracking-tight text-[#111b45] sm:text-4xl"
                style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
              >
                Professionally Designed for Every Need
              </h2>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-[#172052]">Brochure Templates</h3>
                  <p className="mt-3 text-sm leading-6 text-[#657092]">
                    Business, events, academic and institutional layouts ready for customization.
                  </p>
                  <Link
                    href={studioHref}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#7b55e7] bg-white/55 px-5 py-3 text-sm font-bold text-[#462E93] transition hover:-translate-y-1 hover:bg-white"
                  >
                    Explore Brochures <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                <Image
                  src="/brochure.png"
                  alt="Brochure templates"
                  width={1270}
                  height={1239}
                  className="mx-auto w-full max-w-[320px] drop-shadow-[0_20px_26px_rgba(0,42,130,0.16)]"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-[#172052]">Certificate Templates</h3>
                  <p className="mt-3 text-sm leading-6 text-[#657092]">
                    Elegant certificates for participation, achievement, awards and events.
                  </p>
                  <Link
                    href={certificateHref}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#7b55e7] bg-white/55 px-5 py-3 text-sm font-bold text-[#462E93] transition hover:-translate-y-1 hover:bg-white"
                  >
                    Explore Certificates <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                <Image
                  src="/certificate.png"
                  alt="Certificate templates"
                  width={1334}
                  height={1179}
                  className="mx-auto w-full max-w-[330px] drop-shadow-[0_20px_26px_rgba(70,46,147,0.18)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-[linear-gradient(110deg,#002A82,#462E93,#a83cf0)] p-8 text-white shadow-[0_24px_70px_-38px_rgba(70,46,147,0.95)] sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                  style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
                >
                  Ready to Create Something Amazing?
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Join thousands of users who trust Brochify for their professional designs.
                </p>
              </div>
              <Link
                href={studioHref}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#462E93] shadow-[0_16px_30px_-18px_rgba(255,255,255,0.85)] transition hover:-translate-y-1"
              >
                Get Started For Free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="bg-[#03122f] px-5 py-10 text-white sm:px-6">
        <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/icon-logo.png" alt="Brochify" width={42} height={42} className="h-10 w-10" />
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
              >
                BROCHIFY
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/62">
              The all-in-one platform to create professional brochures and certificates in minutes.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-extrabold">Product</h3>
            <div className="mt-4 space-y-3 text-sm text-white/62">
              <a href="#features" className="block transition hover:text-white">
                Features
              </a>
              <a href="#templates" className="block transition hover:text-white">
                Templates
              </a>
              <Link href={studioHref} className="block transition hover:text-white">
                Get Started
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold">Resources</h3>
            <div className="mt-4 space-y-3 text-sm text-white/62">
              <Link href="/help" className="block transition hover:text-white">
                Help
              </Link>
              <Link href="/tutorials" className="block transition hover:text-white">
                Tutorials
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold">Company</h3>
            <div className="mt-4 space-y-3 text-sm text-white/62">
              <Link href="/about" className="block transition hover:text-white">
                About
              </Link>
              <Link href="/contact" className="block transition hover:text-white">
                Contact
              </Link>
              <Link href="/privacy-policy" className="block transition hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block transition hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-5 text-center text-xs text-white/52">
          © 2026 Brochify. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
