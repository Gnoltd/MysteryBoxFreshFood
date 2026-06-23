import { Textarea, Label } from 'mysterybox'

export function Default() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, width: 320 }}>
      <Label htmlFor="desc">Box Description</Label>
      <Textarea
        id="desc"
        placeholder="Describe what's in the mystery box — ingredients, portion size, allergens..."
        rows={4}
      />
    </div>
  )
}

export function States() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, width: 320 }}>
      <Textarea placeholder="Empty state" rows={3} />
      <Textarea defaultValue="Today's leftover pastries: 4 croissants, 2 baguettes, mixed cookies" rows={3} />
      <Textarea placeholder="Disabled" disabled rows={3} />
    </div>
  )
}
