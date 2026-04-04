import Link from 'next/link'
import React from 'react'

/**
 * Parses a string and returns JSX with @mentions converted to clickable links.
 * Mentions are styled in emerald color.
 */
export function parseMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+)/g)

  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      const username = part.slice(1) // strip the @
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
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}
