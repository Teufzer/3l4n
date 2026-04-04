'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface PostFormProps {
  onPostCreated?: () => void
  userName?: string
  r2Enabled?: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export default function PostForm({ onPostCreated, userName = 'Moi', r2Enabled = false }: PostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Photo state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_CHARS = 500

  const handleFileSelect = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilise jpg, png, gif ou webp.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image trop lourde (max 10 Mo).')
      return
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(localUrl)
    setUploadedImageUrl(null)

    // Upload via notre serveur (évite les problèmes CORS)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de l'envoi de la photo")
      }

      const { publicUrl } = await res.json()
      setUploadedImageUrl(publicUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
      // Clear the photo if upload failed
      setSelectedFile(null)
      setPreviewUrl(null)
      URL.revokeObjectURL(localUrl)
    } finally {
      setUploading(false)
    }
  }, [])

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedImageUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || loading) return

    // Don't submit while photo is still uploading
    if (uploading) {
      toast.error("La photo est encore en cours d'envoi, patiente un instant…")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la publication')
      }

      setContent('')
      handleRemovePhoto()
      onPostCreated?.()
      toast.success('Post publié ! 💪')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const remaining = MAX_CHARS - content.length
  const isOverLimit = remaining < 0
  const isNearLimit = remaining <= 50 && !isOverLimit

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30 flex-shrink-0 mt-0.5">
          {getInitials(userName)}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partage ta progression, tes ressentis… La communauté est là 💚"
          maxLength={MAX_CHARS + 50}
          rows={3}
          className="flex-1 bg-transparent text-white/80 placeholder:text-white/30 text-sm resize-none outline-none leading-relaxed"
          disabled={loading}
        />
      </div>

      {/* Photo preview */}
      {previewUrl && (
        <div className="relative inline-block ml-13">
          <img
            src={previewUrl}
            alt="Aperçu de la photo"
            className="max-h-32 max-w-xs rounded-xl border border-white/10 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
              <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors"
              aria-label="Supprimer la photo"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs px-1">{error}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-3">
          {/* Photo button — hidden if R2 not configured */}
          {r2Enabled && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileInputChange}
                aria-label="Ajouter une photo"
              />
              <button
                type="button"
                onClick={handlePhotoButtonClick}
                disabled={loading || uploading || !!selectedFile}
                className="text-white/40 hover:text-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                title="Ajouter une photo"
                aria-label="Ajouter une photo"
              >
                📷
              </button>
            </>
          )}

          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-red-400'
                : isNearLimit
                ? 'text-amber-400'
                : 'text-white/30'
            }`}
          >
            {remaining} caractères
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !content.trim() || isOverLimit || uploading}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold
            hover:bg-emerald-400 active:scale-95 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Publication…
            </span>
          ) : (
            'Publier'
          )}
        </button>
      </div>
    </form>
  )
}
