'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AvatarUploadProps {
  userId: string
  currentAvatar: string | null
  currentName: string | null
  size?: 'sm' | 'md' | 'lg'
  onUploaded?: (avatarUrl: string) => void
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AvatarUpload({
  currentAvatar,
  currentName,
  size = 'lg',
  onUploaded,
}: AvatarUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [localAvatar, setLocalAvatar] = useState<string | null>(currentAvatar)

  const sizeClasses = {
    sm: 'w-12 h-12 text-base',
    md: 'w-16 h-16 text-lg',
    lg: 'w-20 h-20 text-2xl',
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      setLocalAvatar(data.avatarUrl)
      onUploaded?.(data.avatarUrl)
      showToast('success', 'Photo de profil mise à jour !')
      router.refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-uploaded if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative inline-block">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Avatar with hover overlay */}
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative group rounded-full overflow-hidden ring-4 ring-[#0f0f0f] flex items-center justify-center ${sizeClasses[size]} ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
        aria-label="Changer la photo de profil"
      >
        {/* Avatar image or initials */}
        {localAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={localAvatar}
            alt={currentName || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] border-2 border-zinc-700 flex items-center justify-center">
            <span className="text-emerald-400 font-bold">
              {getInitials(currentName)}
            </span>
          </div>
        )}

        {/* Hover / loading overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity rounded-full
          ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-white text-xl">📷</span>
          )}
        </div>
      </button>

      {/* Toast notification */}
      {toast && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap z-50 shadow-lg
            ${toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
        >
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.message}
        </div>
      )}
    </div>
  )
}
