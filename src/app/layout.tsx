import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VSUAL Networking - Instant Authority",
  description: "Capture. Connect. Automate. VSUALdigitalmedia promotional marketing agency networking tool with AI assistant powered by Z AI.",
  keywords: ["VSUAL", "networking", "marketing", "business cards", "AI assistant"],
  authors: [{ name: "VSUALdigitalmedia" }],
  openGraph: {
    title: "VSUAL Networking - Instant Authority",
    description: "Capture. Connect. Automate.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VSUAL Networking - Instant Authority",
    description: "Capture. Connect. Automate.",
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
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
