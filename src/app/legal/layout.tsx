import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="text-xl font-black tracking-tight"
        >
          3l<span className="text-emerald-400">4</span>n
        </Link>
        <span className="text-white/20">/</span>
        <Link
          href="/"
          className="text-sm text-white/40 hover:text-white/70 transition flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-3 text-xs text-white/25">
          <Link href="/legal/cgu" className="hover:text-white/50 transition">CGU</Link>
          <span>·</span>
          <Link href="/legal/privacy" className="hover:text-white/50 transition">Confidentialité</Link>
          <span>·</span>
          <Link href="/legal/mentions" className="hover:text-white/50 transition">Mentions légales</Link>
        </div>
      </footer>
    </div>
  )
}
