'use client'

import { useEffect, useState, useCallback } from 'react'
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
  type: 'MENTION' | 'REACTION' | 'COMMENT' | 'FOLLOW'
  read: boolean
  createdAt: string
  actorId: string
  postId: string | null
  actor: NotifActor
  post: { id: string; content: string } | null
}

type Tab = 'all' | 'mentions' | 'reactions' | 'comments' | 'follows'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'reactions', label: 'Réactions' },
  { key: 'comments', label: 'Commentaires' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "à l'instant"
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'hier'
  if (d < 7) return `il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function notifText(notif: Notification): { prefix: string; highlight?: string; suffix: string } {
  const actor = notif.actor.username
    ? `@${notif.actor.username}`
    : (notif.actor.name ?? 'Quelqu\'un')

  switch (notif.type) {
    case 'MENTION':
      return { prefix: actor, highlight: " t'a mentionné", suffix: ' dans un commentaire' }
    case 'REACTION':
      return { prefix: actor, highlight: ' a réagi', suffix: ' à ton post avec 🔥' }
    case 'COMMENT':
      return { prefix: actor, highlight: ' a commenté', suffix: ' ton post' }
    case 'FOLLOW':
      return { prefix: actor, highlight: ' a commencé', suffix: ' à te suivre' }
    default:
      return { prefix: actor, highlight: '', suffix: '' }
  }
}

function notifIcon(type: Notification['type']) {
  switch (type) {
    case 'FOLLOW':
      return <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs">👤</span>
    case 'MENTION':
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
          @
        </span>
      )
    case 'REACTION':
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs">
          ❤️
        </span>
      )
    case 'COMMENT':
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
          💬
        </span>
      )
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
        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
      />
    )
  }
  const initials = (actor.name ?? actor.username ?? '?')[0].toUpperCase()
  return (
    <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { emoji: string; title: string; sub: string }> = {
    all: { emoji: '🔔', title: 'Tout est calme ici', sub: 'Tes notifications apparaîtront ici quand quelqu\'un interagit avec toi.' },
    mentions: { emoji: '@', title: 'Aucune mention', sub: 'Personne ne t\'a encore mentionné dans un post ou commentaire.' },
    reactions: { emoji: '❤️', title: 'Aucune réaction', sub: 'Quand quelqu\'un réagit à tes posts, tu le verras ici.' },
    follows: { emoji: '👤', title: 'Aucun abonné', sub: "Quand quelqu'un te suit, tu le verras ici" },
    comments: { emoji: '💬', title: 'Aucun commentaire', sub: 'Les commentaires sur tes posts apparaîtront ici.' },
  }
  const { emoji, title, sub } = messages[tab]
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-5xl mb-4 opacity-60">{emoji}</div>
      <p className="text-white/50 font-semibold text-sm mb-1">{title}</p>
      <p className="text-white/25 text-xs leading-relaxed max-w-xs">{sub}</p>
    </div>
  )
}

function NotifCard({
  notif,
  onRead,
}: {
  notif: Notification
  onRead: (id: string) => void
}) {
  const text = notifText(notif)

  const handleClick = () => {
    if (!notif.read) {
      onRead(notif.id)
    }
  }

  const inner = (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors border-b border-white/5 ${
        !notif.read
          ? 'bg-emerald-500/5 hover:bg-emerald-500/8'
          : 'hover:bg-white/[0.03]'
      }`}
    >
      {/* Unread indicator */}
      <div className="pt-1 flex-shrink-0">
        {!notif.read ? (
          <span className="block w-2 h-2 rounded-full bg-emerald-400 mt-1" />
        ) : (
          <span className="block w-2 h-2" />
        )}
      </div>

      {/* Avatar with type icon */}
      <div className="relative flex-shrink-0">
        <ActorAvatar actor={notif.actor} />
        <span className="absolute -bottom-0.5 -right-0.5">
          {notifIcon(notif.type)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white/80 leading-snug">
            <span className="font-semibold text-white">{text.prefix}</span>
            <span className="text-white/60">{text.highlight}</span>
            <span className="text-white/50">{text.suffix}</span>
          </p>
          <span className="text-[10px] text-white/30 flex-shrink-0 mt-0.5 whitespace-nowrap">
            {timeAgo(notif.createdAt)}
          </span>
        </div>

        {notif.post && (
          <p className="text-xs text-white/30 mt-1.5 line-clamp-1">
            "{notif.post.content.slice(0, 80)}{notif.post.content.length > 80 ? '…' : ''}"
          </p>
        )}
      </div>
    </div>
  )

  if (notif.postId) {
    return (
      <Link key={notif.id} href={`/post/${notif.postId}`} onClick={handleClick} className="block">
        {inner}
      </Link>
    )
  }

  // Pour FOLLOW ou autres sans post → rediriger vers le profil de l'acteur
  const actorHref = notif.actor.username ? `/${notif.actor.username}` : `/profile/${notif.actorId}`
  return (
    <Link key={notif.id} href={actorHref} onClick={handleClick} className="block">
      {inner}
    </Link>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Erreur chargement notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkAllRead = async () => {
    if (markingAll) return
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkOneRead = useCallback((id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    // Fire and forget
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      )
    })
  }, [])

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'mentions') return n.type === 'MENTION'
    if (activeTab === 'reactions') return n.type === 'REACTION'
    if (activeTab === 'comments') return n.type === 'COMMENT'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:opacity-50"
              >
                {markingAll ? 'En cours…' : 'Tout marquer comme lu'}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mx-1">
            {TABS.map((tab) => {
              const tabCount =
                tab.key === 'all'
                  ? notifications.filter((n) => !n.read).length
                  : notifications.filter(
                      (n) =>
                        !n.read &&
                        (tab.key === 'mentions'
                          ? n.type === 'MENTION'
                          : tab.key === 'reactions'
                          ? n.type === 'REACTION'
                          : n.type === 'COMMENT')
                    ).length

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold transition-all relative ${
                    activeTab === tab.key
                      ? 'text-white'
                      : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  {tab.label}
                  {tabCount > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center">
                      {tabCount > 99 ? '99+' : tabCount}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg className="w-6 h-6 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-red-400 text-sm px-4">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState tab={activeTab} />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div>
            {filtered.map((notif) => (
              <NotifCard key={notif.id} notif={notif} onRead={handleMarkOneRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
