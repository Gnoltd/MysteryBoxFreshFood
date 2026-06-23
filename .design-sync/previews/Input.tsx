import { Input, Label } from 'mysterybox'

export function Default() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, width: 320 }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>
    </div>
  )
}

export function States() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, width: 320 }}>
      <Input placeholder="Normal" />
      <Input placeholder="Disabled" disabled />
      <Input defaultValue="With value" />
    </div>
  )
}
