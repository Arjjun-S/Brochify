import type { Metadata } from "next";
import {
  Bebas_Neue,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  IBM_Plex_Sans,
  Inter,
  Libre_Baskerville,
  Manrope,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Sora,
  Space_Grotesk,
} from "next/font/google";
import { FONT_PRELOAD_STYLESHEET_HREF } from "@/lib/domains/brochure";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins" });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-ibm-plex-sans" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas-neue" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant-garamond" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-libre-baskerville" });

export const metadata: Metadata = {
  title: "Brochify — University brochures & certificates",
  description: "Brochures and certificates for faculty teams—from draft to approved PDF.",
  icons: {
    icon: [
      { url: "/icon-logo.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-logo.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/icon-logo.png",
    apple: "/icon-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_PRELOAD_STYLESHEET_HREF} />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${plusJakartaSans.variable} ${sora.variable} ${poppins.variable} ${ibmPlexSans.variable} ${bebasNeue.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${fraunces.variable} ${libreBaskerville.variable} font-sans antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
