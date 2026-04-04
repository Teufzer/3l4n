'use client'

import './globals.css'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-white px-4 text-center">
          <p className="text-5xl mb-4">😬</p>
          <h1 className="text-xl font-bold mb-2">Oups, quelque chose a merdé</h1>
          <p className="text-white/40 text-sm mb-6">On est sur le coup.</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
