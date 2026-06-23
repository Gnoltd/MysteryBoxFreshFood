import { StatusChip } from 'mysterybox'

export function AllVariants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, alignItems: 'center' }}>
      <StatusChip variant="emerald">Active</StatusChip>
      <StatusChip variant="rose">Sold Out</StatusChip>
      <StatusChip variant="amber">Pending</StatusChip>
      <StatusChip variant="slate">Expired</StatusChip>
      <StatusChip variant="primary">New</StatusChip>
    </div>
  )
}

export function OrderStatuses() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, width: 160 }}>
      <StatusChip variant="amber">Pending</StatusChip>
      <StatusChip variant="emerald">Paid</StatusChip>
      <StatusChip variant="primary">Picked Up</StatusChip>
      <StatusChip variant="rose">Cancelled</StatusChip>
    </div>
  )
}
