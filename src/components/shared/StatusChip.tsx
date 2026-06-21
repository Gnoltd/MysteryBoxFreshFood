type ChipVariant = 'amber' | 'emerald' | 'rose' | 'slate' | 'primary'

const variantClasses: Record<ChipVariant, string> = {
  amber:   'bg-tertiary/10 text-tertiary border-tertiary/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rose:    'bg-error-container/20 text-error-token border-error-token/30',
  slate:   'bg-surface-container text-on-surface-variant border-outline-variant',
  primary: 'bg-primary/10 text-primary border-primary/30',
}

interface StatusChipProps {
  variant: ChipVariant
  children: React.ReactNode
}

export function StatusChip({ variant, children }: StatusChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-label-caps font-bold uppercase tracking-wider ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
