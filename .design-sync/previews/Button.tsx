import { Button } from 'mysterybox'

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12 }}>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}

export function Disabled() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
    </div>
  )
}
