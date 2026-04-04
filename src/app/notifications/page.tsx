'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface NotifActor {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  image: string | null
}

interface Notification {
  id: string
  type: 'MENTION' | 'REACTION' | 'COMMENT'
  read: boolean
  createdAt: string
  actorId: string
  postId: string | null
  actor: NotifActor
  post: { id: string; content: string } | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "\u00e0 l'instant"
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function notifText(notif: Notification): string {
  const actor = notif.actor.name ?? notif.actor.username ?? 'Quelqu\'un'
  switch (notif.type) {
    case 'MENTION':
      return `${actor} t'a mentionné dans un post`
    case 'REACTION':
      return `${actor} a réagi à ton post`
    case 'COMMENT':
      return `${actor} a commenté ton post`
  }
}

function notifEmoji(type: Notification['type']): string {
  switch (type) {
    case 'MENTION': return '💬'
    case 'REACTION': return '🔥'
    case 'COMMENT': return '💭'
  }
}

function ActorAvatar({ actor }: { actor: NotifActor }) {
  const src = actor.avatar ?? actor.image
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
    )
  }
  const initials = (actor.name ?? actor.username ?? '?')[0].toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) throw new Error('Erreur chargement notifications')
        const data = await res.json()
        setNotifications(data.notifications ?? [])

        // Mark all as read
        await fetch('/api/notifications/read', { method: 'PATCH' })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🔔</span>
          <span>Notifications</span>
        </h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-red-400 text-sm">{error}</div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-white/40 text-sm">Aucune notification pour l'instant</p>
            <p className="text-white/20 text-xs mt-1">Reviens quand quelqu'un réagit à tes posts !</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const content = (
                <div
                  className={`flex items-start gap-3 p-4 rounded-2xl transition-colors ${
                    !notif.read
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-[#1a1a1a] border border-white/5'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="relative flex-shrink-0">
                    <ActorAvatar actor={notif.actor} />
                    {!notif.read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f0f0f]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white/80 leading-snug">
                        <span className="mr-1.5">{notifEmoji(notif.type)}</span>
                        {notifText(notif)}
                      </p>
                      <span className="text-[10px] text-white/30 flex-shrink-0 mt-0.5">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {notif.post && (
                      <p className="text-xs text-white/30 mt-1 truncate">
                        "{notif.post.content.slice(0, 60)}{notif.post.content.length > 60 ? '…' : ''}"
                      </p>
                    )}
                  </div>
                </div>
              )

              if (notif.postId) {
                return (
                  <Link key={notif.id} href={`/post/${notif.postId}`} className="block hover:opacity-90 transition-opacity">
                    {content}
                  </Link>
                )
              }

              return <div key={notif.id}>{content}</div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
