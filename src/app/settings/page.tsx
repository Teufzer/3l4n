'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AvatarUpload from '@/components/profile/AvatarUpload'

interface UserProfile {
  id: string
  name: string | null
  bio: string | null
  targetWeight: number | null
  startWeight: number | null
  height: number | null
  email: string
  avatar: string | null
  bannerUrl: string | null
  weightPrivate: boolean
  profilePrivate: boolean
  heightPrivate: boolean
  imcPrivate: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Banner upload state
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerToast, setBannerToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [startWeight, setStartWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [height, setHeight] = useState('')

  // Privacy state
  const [weightPrivate, setWeightPrivate] = useState(false)
  const [profilePrivate, setProfilePrivate] = useState(false)
  const [heightPrivate, setHeightPrivate] = useState(false)
  const [imcPrivate, setImcPrivate] = useState(false)
  const [privacySaving, setPrivacySaving] = useState(false)
  const [privacySaved, setPrivacySaved] = useState(false)

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setProfile(user)
          setLocalBannerUrl(user.bannerUrl ?? null)
          setName(user.name ?? '')
          setBio(user.bio ?? '')
          setStartWeight(user.startWeight?.toString() ?? '')
          setTargetWeight(user.targetWeight?.toString() ?? '')
          setHeight(user.height?.toString() ?? '')
          setWeightPrivate(user.weightPrivate ?? false)
          setProfilePrivate(user.profilePrivate ?? false)
          setHeightPrivate(user.heightPrivate ?? false)
          setImcPrivate(user.imcPrivate ?? false)
        }
      })
      .catch(() => setError('Impossible de charger le profil'))
      .finally(() => setLoading(false))
  }, [])

  function showBannerToast(type: 'success' | 'error', message: string) {
    setBannerToast({ type, message })
    setTimeout(() => setBannerToast(null), 3500)
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setBannerUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/banner', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      setLocalBannerUrl(data.bannerUrl)
      setProfile((prev) => prev ? { ...prev, bannerUrl: data.bannerUrl } : prev)
      showBannerToast('success', 'Bannière mise à jour !')
      router.refresh()
    } catch (err) {
      showBannerToast('error', err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setBannerUploading(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const body: Record<string, unknown> = {
      name: name.trim() || null,
      bio: bio.trim() || null,
      startWeight: startWeight ? parseFloat(startWeight) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      height: height ? parseInt(height, 10) : null,
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
        setName(fresh.user.name || '')
        setBio(fresh.user.bio || '')
        setStartWeight(fresh.user.startWeight?.toString() || '')
        setTargetWeight(fresh.user.targetWeight?.toString() || '')
        setHeight(fresh.user.height?.toString() || '')
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

  async function savePrivacy(patch: Record<string, boolean>) {
    setPrivacySaving(true)
    setPrivacySaved(false)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setPrivacySaved(true)
      setTimeout(() => setPrivacySaved(false), 3000)
    } catch {
      // Revert on error — reset to previous values
      if (patch.weightPrivate !== undefined) setWeightPrivate(!patch.weightPrivate)
      if (patch.profilePrivate !== undefined) setProfilePrivate(!patch.profilePrivate)
      if (patch.heightPrivate !== undefined) setHeightPrivate(!patch.heightPrivate)
      if (patch.imcPrivate !== undefined) setImcPrivate(!patch.imcPrivate)
    } finally {
      setPrivacySaving(false)
    }
  }

  async function handlePrivacyToggle(field: 'weightPrivate' | 'profilePrivate' | 'heightPrivate' | 'imcPrivate', newValue: boolean) {
    if (field === 'weightPrivate') setWeightPrivate(newValue)
    if (field === 'profilePrivate') setProfilePrivate(newValue)
    if (field === 'heightPrivate') setHeightPrivate(newValue)
    if (field === 'imcPrivate') setImcPrivate(newValue)
    await savePrivacy({ [field]: newValue })
  }

  async function handleSetAllPrivate() {
    setWeightPrivate(true)
    setProfilePrivate(true)
    setHeightPrivate(true)
    setImcPrivate(true)
    await savePrivacy({ weightPrivate: true, profilePrivate: true, heightPrivate: true, imcPrivate: true })
  }

  async function handleSetAllPublic() {
    setWeightPrivate(false)
    setProfilePrivate(false)
    setHeightPrivate(false)
    setImcPrivate(false)
    await savePrivacy({ weightPrivate: false, profilePrivate: false, heightPrivate: false, imcPrivate: false })
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

          {/* ── Photo & Bannière ──────────────────────────────── */}
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden flex flex-col gap-0">
            <div className="p-5 pb-3">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Photo & Bannière</h2>
            </div>

            {/* Banner preview */}
            <div className="relative mx-5 rounded-xl overflow-hidden">
              {/* Hidden banner file input */}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleBannerChange}
                disabled={bannerUploading}
              />

              {/* Banner image or gradient */}
              <div className="h-28 relative">
                {localBannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={localBannerUrl}
                    alt="Bannière"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-900" />
                )}

                {/* Change banner overlay button */}
                <button
                  type="button"
                  onClick={() => !bannerUploading && bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors ${bannerUploading ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  {bannerUploading ? (
                    <div className="flex items-center gap-2 text-white text-sm font-medium">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Upload en cours…</span>
                    </div>
                  ) : (
                    <span className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      📷 Changer la bannière
                    </span>
                  )}
                </button>
              </div>

              {/* Banner toast */}
              {bannerToast && (
                <div
                  className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-10
                    ${bannerToast.type === 'success'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                    }`}
                >
                  {bannerToast.message}
                </div>
              )}
            </div>

            {/* Avatar overlapping banner */}
            <div className="px-5 pb-5">
              <div className="flex items-end gap-4 -mt-8">
                {profile && (
                  <AvatarUpload
                    userId={profile.id}
                    currentAvatar={profile.avatar}
                    currentName={profile.name}
                    size="lg"
                    onUploaded={(url) => setProfile((prev) => prev ? { ...prev, avatar: url } : prev)}
                  />
                )}
                <div className="mb-1 text-xs text-white/30 leading-relaxed">
                  <p>Clique sur l&apos;avatar pour le changer</p>
                  <p className="text-white/20">JPG, PNG, GIF, WebP · max 5MB</p>
                </div>
              </div>
            </div>
          </section>

          {/* Infos perso */}
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Infos personnelles
            </h2>

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

            {/* Taille */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="height" className="text-sm text-white/60 font-medium">
                Taille <span className="text-white/20">(cm)</span>
              </label>
              <input
                id="height"
                type="number"
                step="1"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="ex: 175"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
              <p className="text-xs text-white/20">Utilisée pour calculer ton IMC sur le dashboard</p>
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

          {/* Confidentialité */}
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Confidentialité
              </h2>
              <p className="text-xs text-white/20 mt-1">
                Contrôle ce que les autres peuvent voir sur ton profil
              </p>
            </div>

            {/* Privacy toggles */}
            {[
              {
                field: 'profilePrivate' as const,
                value: profilePrivate,
                label: 'Profil privé',
                description: 'Seuls tes abonnés peuvent voir ton profil complet',
              },
              {
                field: 'weightPrivate' as const,
                value: weightPrivate,
                label: 'Poids privé',
                description: "Ton poids n'apparaît pas dans le classement",
              },
              {
                field: 'heightPrivate' as const,
                value: heightPrivate,
                label: 'Taille & IMC privés',
                description: 'Ta taille et ton IMC sont masqués',
              },
              {
                field: 'imcPrivate' as const,
                value: imcPrivate,
                label: 'Courbe privée',
                description: 'Ton graphique de progression est masqué',
              },
            ].map(({ field, value, label, description }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrivacyToggle(field, !value)}
                  disabled={privacySaving}
                  aria-label={label}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    value ? 'bg-emerald-500' : 'bg-white/10'
                  } ${privacySaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      value ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}

            {/* Bulk actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSetAllPrivate}
                disabled={privacySaving}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                🔒 Tout mettre en privé
              </button>
              <button
                type="button"
                onClick={handleSetAllPublic}
                disabled={privacySaving}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs font-semibold transition disabled:opacity-50"
              >
                🌐 Tout rendre public
              </button>
            </div>

            {privacySaved && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400 flex items-center gap-2">
                <span>✓</span> Confidentialité mise à jour !
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
