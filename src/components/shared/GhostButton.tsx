interface GhostButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  disabled?: boolean
}

export function GhostButton({ children, onClick, type = 'button', className = '', disabled }: GhostButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`border border-outline-variant text-on-surface font-semibold py-3 px-6 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
