import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#C00F7A",
};

export const metadata: Metadata = {
  title: "VSUAL Networking — Capture. Connect. Automate.",
  description:
    "VSUALdigitalmedia promotional marketing agency networking tool. Capture business cards with AI OCR, brand selfies, save contacts to CRM, and automate your networking — powered by Z AI.",
  keywords: [
    "VSUAL",
    "networking",
    "marketing",
    "business cards",
    "AI assistant",
    "OCR",
    "CRM",
    "GoHighLevel",
    "contact management",
  ],
  authors: [{ name: "VSUALdigitalmedia" }],
  creator: "VSUALdigitalmedia",
  openGraph: {
    title: "VSUAL Networking — Instant Authority",
    description: "Capture. Connect. Automate. AI-powered networking for promotional marketing professionals.",
    type: "website",
    locale: "en_US",
    siteName: "VSUAL Networking",
  },
  twitter: {
    card: "summary_large_image",
    title: "VSUAL Networking — Instant Authority",
    description: "Capture. Connect. Automate.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <SpeedInsights />
        <Toaster position="top-center" richColors closeButton />
        <SpeedInsights />
      </body>
    </html>
  );
}
