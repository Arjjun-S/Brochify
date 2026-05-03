import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { InfoPageShell } from "@/components/landing/InfoPageShell";

const mentors = [
  {
    name: "Dr. Balamurugan G",
    title: "Associate Professor",
    image: "/teacher1.png",
  },
  {
    name: "Dr. Arulalan V",
    title: "Assistant Professor",
    image: "/teacher2.png",
  },
];

const developers = [
  {
    name: "Dhanush S",
    image: "/dhanush.jpeg",
    github: "https://github.com/Cosmos-0118",
    linkedin: "https://www.linkedin.com/in/dhanushs-dev/",
  },
  {
    name: "Bala Tharun R",
    image: "/bala tharun.jpeg",
    github: "https://github.com/balatharunr",
    linkedin: "https://www.linkedin.com/in/balatharunr/",
  },
  {
    name: "Arjjun S",
    image: "/arjjun.jpeg",
    github: "https://github.com/Arjjun-S",
    linkedin: "https://www.linkedin.com/in/arjjuns/",
  },
  {
    name: "Priyan",
    image: "/priyan.jpeg",
    github: "https://github.com/Skygazer1111",
    linkedin: "https://www.linkedin.com/in/priyan-rajarajan-b8128b2a2/",
  },
  {
    name: "Hariharan D",
    image: "/hariharan.jpeg",
    github: "https://github.com/HARIHARAN-38",
    linkedin: "https://www.linkedin.com/in/hariharan38/",
  },
];

function FloatingParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#462E93]/18"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 23) % 100}%`,
            animation: `about-particle ${5 + (index % 5)}s ease-in-out infinite`,
            animationDelay: `${index * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.34em] text-[#462E93]">{title}</p>
      <h2
        className="mt-3 text-2xl font-extrabold tracking-tight text-[#111b45] sm:text-3xl"
        style={{ fontFamily: "var(--font-poppins), var(--font-inter), sans-serif" }}
      >
        {subtitle}
      </h2>
    </div>
  );
}

function MentorCard({ mentor }: { mentor: (typeof mentors)[number] }) {
  return (
    <article className="w-[260px] rounded-[20px] bg-white p-3 shadow-[0_18px_50px_-34px_rgba(42,58,117,0.8)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_26px_70px_-34px_rgba(70,46,147,0.78)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#edf2ff]">
        <Image src={mentor.image} alt={mentor.name} fill className="object-cover" sizes="260px" />
      </div>
      <div className="px-2 pb-2 pt-4 text-center">
        <h3 className="text-base font-extrabold text-[#111b45]">{mentor.name}</h3>
        <p className="mt-1 text-sm font-semibold text-[#657092]">{mentor.title}</p>
      </div>
    </article>
  );
}

function DeveloperCard({ developer }: { developer: (typeof developers)[number] }) {
  return (
    <article className="group relative w-[170px] rounded-[18px] bg-white p-2 shadow-[0_18px_45px_-34px_rgba(42,58,117,0.75)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_24px_65px_-34px_rgba(70,46,147,0.75)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#edf2ff]">
        <Image src={developer.image} alt={developer.name} fill className="object-cover" sizes="170px" />
        <div className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-between opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            href={developer.github}
            target="_blank"
            rel="noreferrer"
            aria-label={`${developer.name} GitHub`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#111b45] shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
          >
            <Github className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={developer.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={`${developer.name} LinkedIn`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#0a66c2] shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
          >
            <Linkedin className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="px-1 pb-2 pt-3 text-center">
        <h3 className="text-sm font-extrabold text-[#111b45]">{developer.name}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#657092]">Developer</p>
      </div>
    </article>
  );
}

export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="About"
      title="About Brochify"
      intro="Brochify is an AI-powered platform designed to simplify the creation of professional brochures and certificates."
      centerHeader
    >
      <style>
        {`
          @keyframes about-particle {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.25; }
            50% { transform: translate3d(10px, -18px, 0); opacity: 0.7; }
          }
        `}
      </style>
      <div className="relative isolate space-y-20 overflow-hidden py-2">
        <FloatingParticles />

        <section className="mx-auto max-w-3xl space-y-4 text-center text-base leading-8 text-[#5f6b8d]">
          <p>
            Built for academic and institutional use, it enables users to design, customize, and generate documents
            efficiently.
          </p>
          <p>This project is made by SRM students with guidance from two faculty members.</p>
        </section>

        <section>
          <SectionHeader title="Mentors" subtitle="Faculty Guidance & Strategic Direction" />
          <div className="mt-9 flex flex-wrap justify-center gap-8">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.name} mentor={mentor} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Developers" subtitle="The student builders who made it real" />
          <div className="mt-9 flex flex-wrap justify-center gap-5">
            {developers.map((developer) => (
              <DeveloperCard key={developer.name} developer={developer} />
            ))}
          </div>
        </section>
      </div>
    </InfoPageShell>
  );
}
