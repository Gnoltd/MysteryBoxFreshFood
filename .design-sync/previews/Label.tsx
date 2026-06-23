import { Label, Input } from 'mysterybox'

export function Default() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, width: 300 }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
        <Label htmlFor="store">Store Name</Label>
        <Input id="store" placeholder="Saigon Bakery" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
        <Label htmlFor="price">Price (VND)</Label>
        <Input id="price" type="number" placeholder="35000" />
      </div>
    </div>
  )
}
