import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import { NavigationProgress } from "@/components/navigation-progress";
import { buildPageMetadata, getSiteUrl, siteConfig } from "@/lib/seo";
import "./globals.css";
import { Toaster } from "sonner";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...buildPageMetadata({ path: "/" }),
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  icons: {
    icon: [{ url: "/logo.webp", type: "image/webp" }],
    apple: [{ url: "/logo.webp", type: "image/webp" }],
    shortcut: "/logo.webp",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A18" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${newsreader.variable} min-h-screen bg-paper font-sans text-body-md text-ink antialiased`}
        suppressHydrationWarning
      >
        <AppProviders>
          <NavigationProgress />
          <div className="flex min-h-screen flex-col">
            <div className="flex-grow">{children}</div>
            <ConditionalSiteFooter />
          </div>
        </AppProviders>
        <Toaster richColors />
      </body>
    </html>
  );
}
