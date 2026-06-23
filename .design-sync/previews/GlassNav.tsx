import { GlassNav } from 'mysterybox'

export function HomeNav() {
  return (
    <div style={{ height: 80, position: 'relative' as const, overflow: 'hidden' }}>
      <GlassNav
        storeName="Saigon Bakery"
        actions={<span style={{ fontSize: 18 }}>🔔</span>}
      />
    </div>
  )
}

export function DetailNav() {
  return (
    <div style={{ height: 80, position: 'relative' as const, overflow: 'hidden' }}>
      <GlassNav
        backHref="/browse"
        backLabel="Back to Browse"
      />
    </div>
  )
}

export function VendorNav() {
  return (
    <div style={{ height: 80, position: 'relative' as const, overflow: 'hidden' }}>
      <GlassNav
        storeName="Pho Hung Restaurant"
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>Dashboard</span>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>Orders</span>
          </div>
        }
      />
    </div>
  )
}
