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
          {/* Layout centré style Twitter */}
          <div className="min-h-screen flex justify-center">
            {/* Wrapper max-width centré */}
            <div className="w-full max-w-[1280px] flex relative">

              {/* Sidebar gauche */}
              <div className="hidden lg:flex flex-col w-[275px] xl:w-[320px] shrink-0">
                <div className="fixed top-0 h-full w-[275px] xl:w-[320px] flex flex-col">
                  <Sidebar />
                </div>
              </div>

              {/* Contenu principal centré */}
              <main className="flex-1 min-w-0 border-x border-white/5 min-h-screen">
                {children}
              </main>

              {/* Sidebar droite */}
              <div className="hidden xl:flex flex-col w-[380px] shrink-0">
                <div className="fixed top-0 w-[380px] h-full overflow-y-auto px-6 py-4">
                  <RightSidebar />
                </div>
              </div>

            </div>
          </div>

          {/* Bottom nav mobile */}
          <div className="lg:hidden">
            <BottomNavWrapper />
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
