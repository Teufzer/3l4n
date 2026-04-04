'use client'
import VerifiedBadge from '@/components/VerifiedBadge'
import { useState, useCallback } from 'react'

interface UserItem {
  id: string
  name: string | null
  email: string
  avatar: string | null
  image: string | null
  role: 'USER' | 'ADMIN'
  banned: boolean
  verified: boolean
  createdAt: string | Date
  startWeight: number | null
  _count: { posts: number; comments: number }
  weightDelta: number | null
  weightEntriesCount: number
  weeklyWeightChange: number | null
}

interface Props {
  initialUsers: UserItem[]
}

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isSuspect(user: UserItem): boolean {
  if (
    user.weeklyWeightChange !== null &&
    (user.weeklyWeightChange > 100 || user.weeklyWeightChange < -100)
  )
    return true
  if (user.weightDelta !== null && Math.abs(user.weightDelta) > 200) return true
  return false
}

function WeightDeltaBadge({ user }: { user: UserItem }) {
  if (user.weightDelta === null) {
    return <span className="text-white/20 text-xs">—</span>
  }

  const suspicious =
    user.weeklyWeightChange !== null &&
    (Math.abs(user.weeklyWeightChange) > 50)

  const sign = user.weightDelta >= 0 ? '+' : ''
  const color = suspicious
    ? 'text-red-400'
    : user.weightDelta < 0
    ? 'text-emerald-400'
    : 'text-orange-400'

  return (
    <span className={`text-xs font-mono ${color}`}>
      {sign}
      {user.weightDelta.toFixed(1)}kg
      {suspicious && ' ⚠️'}
    </span>
  )
}

// Simple toast system
interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

let toastIdCounter = 0

export default function AdminUsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmDeleteWeights, setConfirmDeleteWeights] = useState<UserItem | null>(null)

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const suspects = users.filter(isSuspect)
  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase()
      return (
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })

  const handleBanToggle = async (userId: string, banned: boolean) => {
    setLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned }),
      })

      if (!res.ok) {
        const data = await res.json()
        addToast(data.error || 'Erreur', 'error')
        return
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, banned } : u))
      )
    } catch {
      addToast('Erreur réseau', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleVerifyToggle = async (userId: string, verified: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified }),
    })
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verified } : u))
    )
  }

  const handleDeleteWeights = async (userId: string) => {
    setLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/weights`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        addToast(data.error || 'Erreur', 'error')
        return
      }

      const data = await res.json()
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                startWeight: null,
                weightDelta: null,
                weeklyWeightChange: null,
                weightEntriesCount: 0,
              }
            : u
        )
      )
      addToast(`${data.deleted} pesée${data.deleted !== 1 ? 's' : ''} supprimée${data.deleted !== 1 ? 's' : ''}`)
    } catch {
      addToast('Erreur réseau', 'error')
    } finally {
      setLoading(null)
      setConfirmDeleteWeights(null)
    }
  }

  const bannedCount = users.filter((u) => u.banned).length

  const UserActions = ({ user }: { user: UserItem }) => (
    <div className="flex items-center gap-2 justify-end flex-wrap">
      {user.role !== 'ADMIN' && (
        <button
          onClick={() => handleBanToggle(user.id, !user.banned)}
          disabled={loading === user.id}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
            user.banned
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
        >
          {loading === user.id ? '…' : user.banned ? 'Débannir' : 'Bannir'}
        </button>
      )}
      <button
        onClick={() => handleVerifyToggle(user.id, !user.verified)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
          user.verified
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
        }`}
      >
        <VerifiedBadge className="w-3.5 h-3.5" />
        {user.verified ? 'Certifié' : 'Certifier'}
      </button>
      {user.weightEntriesCount > 0 && (
        <button
          onClick={() => setConfirmDeleteWeights(user)}
          disabled={loading === user.id}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
        >
          🗑 Pesées
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl border pointer-events-auto transition-all ${
              toast.type === 'success'
                ? 'bg-[#1a1a1a] border-emerald-500/30 text-emerald-400'
                : 'bg-[#1a1a1a] border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? '✅ ' : '❌ '}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Confirm delete weights modal */}
      {confirmDeleteWeights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer les pesées ?</h3>
            <p className="text-white/50 text-sm mb-1">
              Toutes les pesées de{' '}
              <span className="text-white font-medium">
                {confirmDeleteWeights.name ?? confirmDeleteWeights.email}
              </span>{' '}
              seront supprimées ({confirmDeleteWeights.weightEntriesCount} entrée
              {confirmDeleteWeights.weightEntriesCount !== 1 ? 's' : ''}).
            </p>
            <p className="text-white/40 text-xs mb-6">
              Le poids de départ sera aussi réinitialisé. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteWeights(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteWeights(confirmDeleteWeights.id)}
                disabled={loading === confirmDeleteWeights.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                {loading === confirmDeleteWeights.id ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-white/40 text-sm mt-1">
            {users.length} membre{users.length !== 1 ? 's' : ''} · {bannedCount} banni
            {bannedCount !== 1 ? 's' : ''}
            {suspects.length > 0 && (
              <span className="ml-2 text-red-400">
                · {suspects.length} suspect{suspects.length !== 1 ? 's' : ''} 🚨
              </span>
            )}
          </p>
        </div>
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors w-64"
        />
      </div>

      {/* Suspects section */}
      {suspects.length > 0 && !search && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-red-400 font-semibold text-sm">
              Suspects — données de poids anormales
            </h2>
          </div>
          <div className="space-y-2">
            {suspects.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 bg-[#0f0f0f] rounded-xl px-4 py-3 border border-red-500/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base">🚨</span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {user.name ?? user.email}
                    </p>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-white/50">
                  {user.weightDelta !== null && (
                    <span>
                      Δ total :{' '}
                      <span
                        className={
                          Math.abs(user.weightDelta) > 200
                            ? 'text-red-400 font-mono'
                            : 'text-white/70 font-mono'
                        }
                      >
                        {user.weightDelta >= 0 ? '+' : ''}
                        {user.weightDelta.toFixed(1)}kg
                      </span>
                    </span>
                  )}
                  {user.weeklyWeightChange !== null && (
                    <span>
                      7j :{' '}
                      <span
                        className={
                          Math.abs(user.weeklyWeightChange) > 100
                            ? 'text-red-400 font-mono'
                            : 'text-white/70 font-mono'
                        }
                      >
                        {user.weeklyWeightChange >= 0 ? '+' : ''}
                        {user.weeklyWeightChange.toFixed(1)}kg
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => setConfirmDeleteWeights(user)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors"
                  >
                    🗑 Pesées
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
              <th className="text-left py-3 px-4 font-medium">Utilisateur</th>
              <th className="text-left py-3 px-4 font-medium">Rôle</th>
              <th className="text-center py-3 px-4 font-medium">Posts</th>
              <th className="text-center py-3 px-4 font-medium">Coms</th>
              <th className="text-center py-3 px-4 font-medium">Pesées</th>
              <th className="text-center py-3 px-4 font-medium">Δ Poids</th>
              <th className="text-left py-3 px-4 font-medium">Inscription</th>
              <th className="text-left py-3 px-4 font-medium">Statut</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((user) => {
              const photoUrl = user.image || user.avatar
              const suspect = isSuspect(user)
              return (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-white/[0.02] ${user.banned ? 'opacity-50' : ''} ${suspect ? 'bg-red-500/[0.03]' : ''}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={user.name || user.email}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold ring-1 ring-emerald-500/20">
                          {getInitials(user.name, user.email)}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium flex items-center gap-1.5">
                          {user.name ?? '—'}
                          {suspect && <span title="Données suspectes">🚨</span>}
                        </p>
                        <p className="text-white/40 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {user.role === 'ADMIN' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Admin
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">User</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-white/50">{user._count.posts}</td>
                  <td className="py-3 px-4 text-center text-white/50">{user._count.comments}</td>
                  <td className="py-3 px-4 text-center text-white/50">{user.weightEntriesCount}</td>
                  <td className="py-3 px-4 text-center">
                    <WeightDeltaBadge user={user} />
                  </td>
                  <td className="py-3 px-4 text-white/40 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4">
                    {user.banned ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                        Banni
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <UserActions user={user} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((user) => {
          const photoUrl = user.image || user.avatar
          const suspect = isSuspect(user)
          return (
            <div
              key={user.id}
              className={`border rounded-2xl p-4 space-y-3 ${
                user.banned ? 'opacity-60' : ''
              } ${
                suspect
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-white/10 bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center gap-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user.name || user.email}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold ring-2 ring-emerald-500/20">
                    {getInitials(user.name, user.email)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate flex items-center gap-1.5">
                    {user.name ?? '—'}
                    {suspect && <span>🚨</span>}
                  </p>
                  <p className="text-white/40 text-xs truncate">{user.email}</p>
                </div>
                {user.banned && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                    Banni
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-white/40 flex-wrap gap-1">
                <span>{user._count.posts} post{user._count.posts !== 1 ? 's' : ''}</span>
                <span>{user._count.comments} coms</span>
                <span>{user.weightEntriesCount} pesées</span>
                {user.weightDelta !== null && (
                  <WeightDeltaBadge user={user} />
                )}
                <span>Inscrit le {formatDate(user.createdAt)}</span>
              </div>
              {user.role !== 'ADMIN' && (
                <UserActions user={user} />
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <p>Aucun utilisateur trouvé</p>
        </div>
      )}
    </div>
  )
}
