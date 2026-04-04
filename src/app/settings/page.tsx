'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string | null
  name: string | null
  bio: string | null
  targetWeight: number | null
  startWeight: number | null
  email: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [startWeight, setStartWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setProfile(user)
          setUsername(user.username ?? '')
          setName(user.name ?? '')
          setBio(user.bio ?? '')
          setStartWeight(user.startWeight?.toString() ?? '')
          setTargetWeight(user.targetWeight?.toString() ?? '')
        }
      })
      .catch(() => setError('Impossible de charger le profil'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const body: Record<string, unknown> = {
      username: username.trim() || null,
      name: name.trim() || null,
      bio: bio.trim() || null,
      startWeight: startWeight ? parseFloat(startWeight) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
    }

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      // Re-fetch profile to reflect saved values
      const fresh = await fetch('/api/user').then(r => r.json())
      if (fresh.user) {
        setProfile(fresh.user)
        setUsername(fresh.user.username || '')
        setName(fresh.user.name || '')
        setBio(fresh.user.bio || '')
        setStartWeight(fresh.user.startWeight?.toString() || '')
        setTargetWeight(fresh.user.targetWeight?.toString() || '')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={profile ? `/profile/${profile.id}` : '/'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Paramètres</h1>
            <p className="text-xs text-white/30 mt-0.5">{profile?.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Infos perso */}
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Infos personnelles
            </h2>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm text-white/60 font-medium">
                @pseudo
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  placeholder="monpseudo"
                  maxLength={30}
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                />
              </div>
              <p className="text-xs text-white/20">Ton profil sera accessible sur 3l4n.com/{username || 'username'}</p>
            </div>

            {/* Nom */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm text-white/60 font-medium">
                Nom
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton prénom ou pseudo"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-sm text-white/60 font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Décris ton objectif en quelques mots…"
                rows={3}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition resize-none"
              />
            </div>
          </section>

          {/* Objectifs de poids */}
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Objectifs de poids
              </h2>
              <p className="text-xs text-white/20 mt-1">
                Utilisés pour calculer ta progression sur le dashboard
              </p>
            </div>

            {/* Poids de départ */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="startWeight" className="text-sm text-white/60 font-medium">
                Poids de départ <span className="text-white/20">(kg)</span>
              </label>
              <input
                id="startWeight"
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                placeholder="ex: 85.0"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Objectif de poids */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="targetWeight" className="text-sm text-white/60 font-medium">
                Objectif de poids <span className="text-white/20">(kg)</span>
              </label>
              <input
                id="targetWeight"
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="ex: 75.0"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Preview progression */}
            {startWeight && targetWeight && parseFloat(startWeight) > 0 && parseFloat(targetWeight) > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="text-sm text-emerald-400 font-medium">
                    {parseFloat(startWeight) > parseFloat(targetWeight)
                      ? `Perdre ${(parseFloat(startWeight) - parseFloat(targetWeight)).toFixed(1)} kg`
                      : `Prendre ${(parseFloat(targetWeight) - parseFloat(startWeight)).toFixed(1)} kg`}
                  </p>
                  <p className="text-xs text-white/30">
                    {startWeight} kg → {targetWeight} kg
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400 flex items-center gap-2">
              <span>✓</span> Profil mis à jour !
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-2xl transition text-sm"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Sauvegarde…
              </span>
            ) : (
              'Sauvegarder'
            )}
          </button>
        </form>

        {/* Danger zone */}
        <section className="mt-6 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Compte
          </h2>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition text-sm"
          >
            Se déconnecter
          </button>
        </section>
      </div>
    </div>
  )
}
