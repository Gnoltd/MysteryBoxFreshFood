import { GhostButton } from 'mysterybox'

export function Default() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
      <GhostButton>View All</GhostButton>
      <GhostButton>See Details</GhostButton>
    </div>
  )
}

export function Disabled() {
  return <GhostButton disabled>Unavailable</GhostButton>
}

export function FullWidth() {
  return (
    <div style={{ width: 300 }}>
      <GhostButton className="w-full">Cancel Order</GhostButton>
    </div>
  )
}
