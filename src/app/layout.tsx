import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";

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
      <body className="min-h-full bg-[#0f0f0f] text-white">
        <Providers>
          <div className="flex min-h-screen">
            {/* Sidebar gauche - desktop uniquement */}
            <Sidebar />

            {/* Contenu principal */}
            <div className="flex-1 lg:ml-[275px] xl:ml-[320px] flex flex-col min-h-screen">
              <main className="flex-1">
                <div className="max-w-[680px] lg:border-r lg:border-white/5 min-h-screen">
                  {children}
                </div>
              </main>
              {/* Bottom nav - mobile uniquement */}
              <div className="lg:hidden">
                <BottomNavWrapper />
              </div>
            </div>

            {/* Sidebar droite - xl uniquement */}
            <div className="hidden xl:block w-[380px] shrink-0 px-6 py-4">
              <RightSidebar />
            </div>
          </div>
        </Providers>
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
