import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from 'mysterybox'

export function Default() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, width: 280 }}>
      <Label>Category</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bakery">Bakery</SelectItem>
          <SelectItem value="drinks">Drinks</SelectItem>
          <SelectItem value="fruit">Fruit</SelectItem>
          <SelectItem value="vegetables">Vegetables</SelectItem>
          <SelectItem value="dairy">Dairy</SelectItem>
          <SelectItem value="meat">Meat</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function WithDefault() {
  return (
    <div style={{ width: 280 }}>
      <Select defaultValue="bakery">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bakery">Bakery</SelectItem>
          <SelectItem value="drinks">Drinks</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
