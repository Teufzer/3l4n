'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface LogoProps {
  /** Override the destination href */
  href?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const sizes = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export default function Logo({
  href,
  size = 'md',
  showIcon = true,
  className = '',
}: LogoProps) {
  const { data: session } = useSession()
  const destination = href ?? (session ? '/feed' : '/')

  return (
    <Link
      href={destination}
      className={`inline-flex items-center gap-1.5 font-bold tracking-tight group ${sizes[size]} ${className}`}
      aria-label="3l4n — accueil"
    >
      {showIcon && (
        /* Descending-curve icon: symbolises weight loss */
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-emerald-500 group-hover:text-emerald-400 transition-colors flex-shrink-0"
          aria-hidden="true"
        >
          {/* Arrow pointing down-right along a curve */}
          <path
            d="M3 4 C3 4 6 4 9 8 C12 12 15 15 19 16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Arrowhead */}
          <path
            d="M14.5 16.5 L19 16 L18.5 11.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
      <span className="text-white group-hover:text-white/90 transition-colors">
        3l<span className="text-emerald-500 group-hover:text-emerald-400 transition-colors">4</span>n
      </span>
    </Link>
  )
}
