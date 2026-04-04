'use client'

import { useState } from 'react'

interface ReportUser {
  id: string
  name: string | null
  email: string
}

interface ReportPost {
  id: string
  content: string
  user: ReportUser
}

interface ReportComment {
  id: string
  content: string
  user: ReportUser
}

interface Report {
  id: string
  reason: string
  createdAt: string | Date
  resolved: boolean
  reporter: ReportUser
  post: ReportPost | null
  comment: ReportComment | null
}

interface Props {
  initialReports: Report[]
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminReportsClient({ initialReports }: Props) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = reports.filter((r) => {
    if (filter === 'unresolved') return !r.resolved
    if (filter === 'resolved') return r.resolved
    return true
  })

  const handleAction = async (reportId: string, action: 'ignore' | 'delete' | 'ban') => {
    setLoading(`${reportId}-${action}`)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erreur')
        return
      }

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, resolved: true } : r))
      )
    } catch {
      alert('Erreur réseau')
    } finally {
      setLoading(null)
    }
  }

  const unresolvedCount = reports.filter((r) => !r.resolved).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Signalements</h1>
          <p className="text-white/40 text-sm mt-1">
            {unresolvedCount} non résolu{unresolvedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {(['unresolved', 'all', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {f === 'unresolved' ? 'En attente' : f === 'resolved' ? 'Résolus' : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">✓</p>
          <p>Aucun signalement à traiter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const contentAuthor = report.post?.user ?? report.comment?.user
            const content = report.post?.content ?? report.comment?.content
            const contentType = report.post ? 'post' : 'commentaire'

            return (
              <div
                key={report.id}
                className={`border rounded-2xl p-5 space-y-4 transition-opacity ${
                  report.resolved
                    ? 'border-white/5 bg-[#141414] opacity-60'
                    : 'border-white/10 bg-[#1a1a1a]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-white/40 uppercase tracking-wide font-medium">
                        {contentType} signalé
                      </span>
                      {report.resolved && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Résolu
                        </span>
                      )}
                    </div>
                    <p className="text-white/30 text-xs">{formatDate(report.createdAt)}</p>
                  </div>
                </div>

                {/* Reported content */}
                {content && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-white/30 text-[11px] uppercase tracking-wide mb-1.5 font-medium">
                      Contenu signalé — par {contentAuthor?.name ?? contentAuthor?.email}
                    </p>
                    <p className="text-white/70 text-sm leading-relaxed line-clamp-4">{content}</p>
                  </div>
                )}

                {/* Report reason */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400/60 text-[11px] uppercase tracking-wide mb-1 font-medium">
                    Raison du signalement — par {report.reporter.name ?? report.reporter.email}
                  </p>
                  <p className="text-red-300/80 text-sm">{report.reason}</p>
                </div>

                {/* Actions */}
                {!report.resolved && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleAction(report.id, 'ignore')}
                      disabled={!!loading}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70 disabled:opacity-40 transition-all"
                    >
                      {loading === `${report.id}-ignore` ? '…' : 'Ignorer'}
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'delete')}
                      disabled={!!loading}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 disabled:opacity-40 transition-all"
                    >
                      {loading === `${report.id}-delete` ? '…' : 'Supprimer le contenu'}
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'ban')}
                      disabled={!!loading}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition-all"
                    >
                      {loading === `${report.id}-ban` ? '…' : "Bannir l'auteur"}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
