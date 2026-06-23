import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from 'mysterybox'

export function Default() {
  return (
    <div style={{ width: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Saigon Bakery</CardTitle>
          <CardDescription>District 1 · Open until 9 PM</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            Artisan bread and pastries crafted daily. Mystery boxes available after 7 PM with 50% off.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">View Store</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function Minimal() {
  return (
    <div style={{ width: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Order #MB-2024-001</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Pickup ready at Saigon Bakery · Gate B</p>
        </CardContent>
      </Card>
    </div>
  )
}
