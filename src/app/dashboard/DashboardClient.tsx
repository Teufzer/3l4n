'use client'

import { useState, useCallback } from 'react'
import WeightStats from '@/components/weight/WeightStats'
import WeightChart, { type WeightDataPoint } from '@/components/weight/WeightChart'
import WeightForm from '@/components/weight/WeightForm'

interface EntryWithId extends WeightDataPoint {
  id: string
}

interface DashboardClientProps {
  initialEntries: EntryWithId[]
  targetWeight?: number | null
  startWeight?: number | null
  userImage?: string | null
  height?: number | null
}

// ─── IMC helpers ──────────────────────────────────────────────────────────────

function computeImc(weightKg: number, heightCm: number) {
  const h = heightCm / 100
  return weightKg / (h * h)
}

function imcCategory(imc: number): { label: string; color: string; bg: string; border: string } {
  if (imc < 18.5) return { label: 'Insuffisance pondérale', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (imc < 25)   return { label: 'Corpulence normale',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  if (imc < 30)   return { label: 'Surpoids',              color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  return               { label: 'Obésité',                 color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardClient({ initialEntries, targetWeight, startWeight, height }: DashboardClientProps) {
  const [entries, setEntries] = useState<EntryWithId[]>(initialEntries)
  const [showForm, setShowForm] = useState(false)

  // Edit state
  const [editEntry, setEditEntry] = useState<EntryWithId | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete state
  const [deleteEntry, setDeleteEntry] = useState<EntryWithId | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleSuccess = useCallback(
    (entry: { id: string; weight: number; date: string; note?: string | null }) => {
      setEntries((prev) => {
        const updated = [
          ...prev,
          { id: entry.id, date: entry.date, weight: entry.weight, note: entry.note },
        ]
        return updated.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      })
      setTimeout(() => setShowForm(false), 1500)
    },
    []
  )

  // Open edit modal
  const openEdit = (entry: EntryWithId) => {
    setEditEntry(entry)
    setEditWeight(entry.weight.toString())
    setEditDate(new Date(entry.date).toISOString().slice(0, 10))
    setEditNote(entry.note ?? '')
    setEditError(null)
  }

  // Save edit
  const handleEditSave = async () => {
    if (!editEntry) return
    setEditSaving(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/weight/${editEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(editWeight),
          date: editDate,
          note: editNote.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      const updated = data.entry
      setEntries((prev) =>
        prev
          .map((e) =>
            e.id === updated.id
              ? { id: updated.id, weight: updated.weight, date: new Date(updated.date).toISOString(), note: updated.note }
              : e
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      )
      setEditEntry(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setEditSaving(false)
    }
  }

  // Delete entry
  const handleDelete = async () => {
    if (!deleteEntry) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/weight/${deleteEntry.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setEntries((prev) => prev.filter((e) => e.id !== deleteEntry.id))
      setDeleteEntry(null)
    } catch {
      // silent — could add toast
    } finally {
      setDeleteLoading(false)
    }
  }

  const hasData = entries.length > 0

  // IMC calculation
  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null
  const imc = lastEntry && height ? computeImc(lastEntry.weight, height) : null
  const imcInfo = imc !== null ? imcCategory(imc) : null

  // Recent history (10 dernières mesures, les plus récentes d'abord)
  const recentEntries = [...entries].reverse().slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Hero stats + CTA button */}
      <WeightStats
        data={entries}
        startWeight={startWeight ?? undefined}
        targetWeight={targetWeight ?? undefined}
        goal={targetWeight ?? undefined}
        onAddWeight={() => setShowForm(true)}
      />

      {/* IMC Card */}
      {imc !== null && imcInfo !== null && (
        <div className={`${imcInfo.bg} border ${imcInfo.border} rounded-2xl p-4 flex items-center gap-3`}>
          <span className="text-2xl flex-shrink-0">📏</span>
          <div>
            <p className={`text-sm font-semibold ${imcInfo.color}`}>
              IMC : {imc.toFixed(1)} — {imcInfo.label}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              Basé sur {lastEntry!.weight} kg · {height} cm
            </p>
          </div>
        </div>
      )}

      {/* Chart or empty state */}
      {hasData ? (
        <WeightChart data={entries} />
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
          <span className="text-5xl">💪</span>
          <div>
            <p className="text-white font-semibold text-base">Commence ici</p>
            <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
              Entre ton premier poids pour voir ta courbe de progression apparaître ici.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
          >
            Ajouter ma première pesée →
          </button>
        </div>
      )}

      {/* Historique récent */}
      {hasData && (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Historique récent</h3>
            <span className="text-xs text-white/20">{entries.length} mesure{entries.length > 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-white/5">
            {recentEntries.map((entry) => {
              const dateStr = new Date(entry.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              return (
                <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white font-semibold text-sm">{entry.weight} kg</span>
                      <span className="text-xs text-white/30">{dateStr}</span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-white/40 mt-0.5 truncate">{entry.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(entry)}
                      title="Modifier"
                      className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteEntry(entry)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add weight modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false)
          }}
        >
          <div className="w-full max-w-md space-y-3" style={{ animation: 'slideUp 0.25s ease-out' }}>
            <WeightForm onSuccess={handleSuccess} />
            <button
              onClick={() => setShowForm(false)}
              className="w-full text-zinc-500 hover:text-white text-sm py-2 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editEntry && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditEntry(null)
          }}
        >
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4" style={{ animation: 'slideUp 0.25s ease-out' }}>
            <h2 className="text-base font-bold text-white">Modifier la mesure</h2>

            {/* Poids */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-white/60">Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-white/60">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-white/60">Note (optionnel)</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ex: après le sport…"
                maxLength={500}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {editError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{editError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditEntry(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition"
              >
                Annuler
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editWeight || !editDate}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm transition"
              >
                {editSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Sauvegarde…
                  </span>
                ) : (
                  'Sauvegarder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteEntry && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteEntry(null)
          }}
        >
          <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4" style={{ animation: 'slideUp 0.25s ease-out' }}>
            <div className="text-center space-y-2">
              <div className="text-3xl">🗑️</div>
              <h2 className="text-base font-bold text-white">Supprimer cette mesure ?</h2>
              <p className="text-sm text-white/40">
                {deleteEntry.weight} kg — {new Date(deleteEntry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-white/30">Cette action est irréversible.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteEntry(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition disabled:opacity-50"
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    Suppression…
                  </span>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
