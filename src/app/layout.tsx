import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3l4n — Suivi de poids bienveillant",
  description: "Réseau social de suivi de poids bienveillant, mobile-first",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f0f0f] text-white">
        <main className="flex-1">{children}</main>
        <BottomNavWrapper />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
              borderRadius: '12px',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
