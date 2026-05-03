import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type FooterGroup = {
  title: string;
  links: { label: string; href: string }[];
};

const footerGroups: FooterGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Templates", href: "/#templates" },
      { label: "Get Started", href: "/login?next=%2Fstudio" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help", href: "/help" },
      { label: "Tutorials", href: "/tutorials" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function InfoPageShell({
  eyebrow,
  title,
  intro,
  centerHeader = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  centerHeader?: boolean;
  children: ReactNode;
}) {
  const headerAlignment = centerHeader ? "text-center" : "";
  const introAlignment = centerHeader ? "mx-auto text-center" : "";

  return (
    <div
      className="min-h-screen bg-[#f7f9ff] text-[#0b163f] selection:bg-[#462E93]/20"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#031756]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <nav className="mx-auto flex h-14 max-w-[1180px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icon-logo.png" alt="Brochify" width={42} height={42} className="h-10 w-10" priority />
            <span
              className="text-lg font-extrabold tracking-tight text-white"
              style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
            >
              BROCHIFY
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-3 py-2 text-xs font-semibold text-white/85 hover:text-white">
              Login
            </Link>
            <Link
              href="/login?next=%2Fstudio"
              className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#462E93] transition hover:-translate-y-0.5 hover:bg-[#eef4ff]"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[980px] px-5 py-14 sm:px-6">
          <div className={`mb-10 ${headerAlignment}`.trim()}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#7d62db]">{eyebrow}</p>
            <h1
              className="mt-3 text-4xl font-extrabold tracking-tight text-[#111b45] sm:text-5xl"
              style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
            >
              {title}
            </h1>
            {intro ? (
              <p className={`mt-5 max-w-2xl text-base leading-8 text-[#5f6b8d] ${introAlignment}`.trim()}>
                {intro}
              </p>
            ) : null}
          </div>
          {children}
        </section>
      </main>

      <footer className="bg-[#03122f] px-5 py-10 text-white sm:px-6">
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
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-extrabold">{group.title}</h3>
              <div className="mt-4 space-y-3 text-sm text-white/62">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="block transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-5 text-center text-xs text-white/52">
          © 2026 Brochify. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <h2
        className="text-xl font-extrabold text-[#111b45]"
        style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
      >
        {title}
      </h2>
      <div className="mt-3 text-base leading-8 text-[#5f6b8d]">{children}</div>
    </section>
  );
}
