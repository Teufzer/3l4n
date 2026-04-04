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
          {/* Layout Twitter : sidebar gauche fixe | contenu centré | sidebar droite fixe */}
          <div className="min-h-screen">
            {/* Sidebar gauche fixe */}
            <Sidebar />

            {/* Zone centrale + droite */}
            <div className="lg:pl-[275px] xl:pl-[320px] xl:pr-[380px] flex flex-col min-h-screen">
              <main className="flex-1">
                <div className="w-full lg:border-x lg:border-white/5 min-h-screen">
                  {children}
                </div>
              </main>
              {/* Bottom nav - mobile uniquement */}
              <div className="lg:hidden">
                <BottomNavWrapper />
              </div>
            </div>

            {/* Sidebar droite fixe - xl uniquement */}
            <div className="hidden xl:block fixed right-0 top-0 w-[380px] h-full border-l border-white/5 px-6 py-4 overflow-y-auto">
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
