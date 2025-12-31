import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Stable, Turbopack-safe font imports
const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Exam Scheduler",
  description: "Manage and access your exam schedules easily",
};

import Layout from "@/components/shared/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";

// RootLayout
// This wraps all pages in your global layout and theme provider.
// Uses stable Google fonts (Inter + Roboto Mono)
// Retains ThemeProvider and Layout
// - Fully Turbopack compatible


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
