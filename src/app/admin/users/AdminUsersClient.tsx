'use client'

import { useState } from 'react'

interface UserItem {
  id: string
  name: string | null
  email: string
  avatar: string | null
  image: string | null
  role: 'USER' | 'ADMIN'
  banned: boolean
  createdAt: string | Date
  _count: { posts: number; comments: number }
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

export default function AdminUsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = users.filter((u) => {
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
        alert(data.error || 'Erreur')
        return
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, banned } : u))
      )
    } catch {
      alert('Erreur réseau')
    } finally {
      setLoading(null)
    }
  }

  const bannedCount = users.filter((u) => u.banned).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-white/40 text-sm mt-1">
            {users.length} membre{users.length !== 1 ? 's' : ''} · {bannedCount} banni{bannedCount !== 1 ? 's' : ''}
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

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
              <th className="text-left py-3 px-4 font-medium">Utilisateur</th>
              <th className="text-left py-3 px-4 font-medium">Rôle</th>
              <th className="text-center py-3 px-4 font-medium">Posts</th>
              <th className="text-center py-3 px-4 font-medium">Commentaires</th>
              <th className="text-left py-3 px-4 font-medium">Inscription</th>
              <th className="text-left py-3 px-4 font-medium">Statut</th>
              <th className="text-right py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((user) => {
              const photoUrl = user.image || user.avatar
              return (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-white/[0.02] ${user.banned ? 'opacity-50' : ''}`}
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
                        <p className="text-white font-medium">{user.name ?? '—'}</p>
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
          return (
            <div
              key={user.id}
              className={`border border-white/10 bg-[#1a1a1a] rounded-2xl p-4 space-y-3 ${
                user.banned ? 'opacity-60' : ''
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
                  <p className="text-white font-semibold text-sm truncate">{user.name ?? '—'}</p>
                  <p className="text-white/40 text-xs truncate">{user.email}</p>
                </div>
                {user.banned && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                    Banni
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>{user._count.posts} post{user._count.posts !== 1 ? 's' : ''}</span>
                <span>{user._count.comments} commentaire{user._count.comments !== 1 ? 's' : ''}</span>
                <span>Inscrit le {formatDate(user.createdAt)}</span>
              </div>
              {user.role !== 'ADMIN' && (
                <button
                  onClick={() => handleBanToggle(user.id, !user.banned)}
                  disabled={loading === user.id}
                  className={`w-full py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40 ${
                    user.banned
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {loading === user.id ? '…' : user.banned ? 'Débannir' : 'Bannir'}
                </button>
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
