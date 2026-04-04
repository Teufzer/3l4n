import Link from 'next/link'
import React from 'react'

/**
 * Parses a string and returns JSX with:
 * - @mentions → clickable internal links (emerald)
 * - URLs (http/https) → clickable external links (blue/underline)
 */
export function parseMentions(text: string): React.ReactNode {
  // Split on @mentions AND URLs
  const parts = text.split(/(https?:\/\/[^\s<>\"']+|@\w+)/g)

  return parts.map((part, i) => {
    // @mention
    if (/^@\w+$/.test(part)) {
      const username = part.slice(1)
      return (
        <Link
          key={i}
          href={`/${username}`}
          className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      )
    }

    // URL — F-004: validate URL strictly to prevent XSS via malicious href
    if (/^https?:\/\/[^\s<>"'`]+$/.test(part)) {
      // Display a shorter version of the URL
      let display = part.replace(/^https?:\/\//, '').replace(/\/$/, '')
      if (display.length > 40) display = display.slice(0, 40) + '…'
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 hover:underline transition-colors break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {display}
        </a>
      )
    }

    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}
