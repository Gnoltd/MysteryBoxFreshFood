import { GradientButton } from 'mysterybox'

export function Default() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
      <GradientButton>Browse Boxes</GradientButton>
      <GradientButton>Place Order</GradientButton>
    </div>
  )
}

export function Disabled() {
  return <GradientButton disabled>Sold Out</GradientButton>
}

export function FullWidth() {
  return (
    <div style={{ width: 300 }}>
      <GradientButton className="w-full">Checkout Now</GradientButton>
    </div>
  )
}
