import Link from "next/link";
import Image from "next/image";

export const Logo = () => {
  return (
    <Link href="/">
      <div className="size-8 relative shrink-0">
        <Image
          src="/icon-logo.png"
          fill
          sizes="32px"
          priority
          alt="Brochify"
          className="object-contain shrink-0 transition hover:opacity-75"
        />
      </div>
    </Link>
  );
};
