import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface GlassNavProps {
  backHref?: string
  backLabel?: string
  storeName?: string
  actions?: ReactNode
}

export function GlassNav({ backHref, backLabel, storeName, actions }: GlassNavProps) {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 w-full z-50 glass-panel border-b border-outline-variant h-16 flex items-center px-6">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        {backHref ? (
          <button
            onClick={() => navigate(backHref)}
            className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-body-lg">{backLabel ?? 'Back'}</span>
          </button>
        ) : (
          <Link to="/browse" className="gradient-text font-bold text-headline-md">
            MysteryBox<span className="font-extrabold">FreshFood</span>
          </Link>
        )}

        {storeName && !backHref && (
          <span className="text-on-surface-variant text-body-sm hidden md:block">{storeName}</span>
        )}

        {actions && (
          <div className="flex items-center gap-3 text-on-surface-variant">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
