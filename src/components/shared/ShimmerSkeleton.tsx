interface ShimmerSkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ShimmerSkeleton({ className = '', rounded = 'lg' }: ShimmerSkeletonProps) {
  const roundedCls = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded]
  return <div className={`skeleton ${roundedCls} ${className}`} />
}

export function MysteryCardSkeleton() {
  return (
    <div className="glass glow-border rounded-xl overflow-hidden animate-fade-in-up">
      <ShimmerSkeleton className="h-48 w-full" rounded="sm" />
      <div className="p-4 flex flex-col gap-3">
        <ShimmerSkeleton className="h-4 w-3/4" />
        <ShimmerSkeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between mt-1">
          <ShimmerSkeleton className="h-4 w-24" />
          <ShimmerSkeleton className="h-6 w-16" rounded="full" />
        </div>
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="glass glow-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-3 w-20" />
        <ShimmerSkeleton className="h-5 w-5" rounded="full" />
      </div>
      <ShimmerSkeleton className="h-6 w-16" />
    </div>
  )
}
