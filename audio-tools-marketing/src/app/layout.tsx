import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Audio Tools Pro - Professional Audio Analysis for Adobe Premiere Pro",
  description: "Transform your Adobe Premiere Pro workflow with AI-powered silence detection, overlap analysis, multi-track handling, and professional audio processing capabilities.",
  keywords: "Adobe Premiere Pro, audio editing, silence detection, overlap detection, multi-track audio, AI audio processing, CEP plugin",
  authors: [{ name: "Audio Tools Pro Team" }],
  openGraph: {
    title: "Audio Tools Pro - Professional Audio Analysis for Adobe Premiere Pro",
    description: "AI-powered audio analysis and editing tools for Adobe Premiere Pro. Silence detection, overlap analysis, multi-track handling, and more.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Audio Tools Pro - Professional Audio Analysis for Adobe Premiere Pro",
    description: "AI-powered audio analysis and editing tools for Adobe Premiere Pro.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}