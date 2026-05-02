import React from "react";
import Image from "next/image";
import { cn } from "@/lib/ui/cn";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  /** When set, wordmark color matches app theme (use with `useThemePreference().isDark`). Avoids relying on `html.dark` alone, which can desync from React theme state. */
  appearance?: "light" | "dark";
}

export function Logo({ className, iconClassName, textClassName, showText = true, appearance }: LogoProps) {
  const wordmarkColor =
    appearance === "dark"
      ? "text-white"
      : appearance === "light"
        ? "text-indigo-950"
        : "text-slate-800 dark:text-white";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image 
        src="/icon-logo.png" 
        alt="Brochify" 
        width={40} 
        height={40}
        sizes="40px"
        className={cn("h-10 w-10 object-contain drop-shadow-sm", iconClassName)}
        priority 
      />
      {showText && (
        <span className={cn(
          outfit.className, 
          "text-2xl font-bold tracking-tight drop-shadow-sm", 
          wordmarkColor,
          textClassName
        )}>
          BROCHIFY
        </span>
      )}
    </div>
  );
}
