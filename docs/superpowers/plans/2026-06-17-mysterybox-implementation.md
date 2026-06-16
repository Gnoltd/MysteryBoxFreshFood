# MysteryBox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional MysteryBox prototype — F&B surplus app where vendors list mystery boxes and customers purchase via Stripe, collecting with a QR code the vendor scans.

**Architecture:** React/Vite SPA + Firebase (Auth, Firestore, Cloud Functions, Storage) + Stripe Checkout test mode. Two role-based layouts (customer top-nav, vendor sidebar). Orders created server-side only via Cloud Functions. QR pickup validated against vendorId.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Firebase v9 modular SDK, Firebase Cloud Functions Node 18, Stripe.js, react-i18next, qrcode.react, html5-qrcode, uuid, Vitest

---

## Prerequisites (Manual — do before Task 1)

1. Create Firebase project → enable Email/Password auth → create Firestore DB → enable Storage → upgrade to Blaze plan
2. Copy Firebase config values from Project Settings → General
3. Create Stripe account → get test keys (`sk_test_...`, `pk_test_...`)
4. Install Firebase CLI: `npm install -g firebase-tools` then `firebase login`
5. Create `.env.local` in project root:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `vite.config.ts`, `tailwind.config.ts`, `src/index.css`, `components.json`
- Create: `src/firebase.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create Vite project and install all dependencies**

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install firebase react-router-dom react-i18next i18next i18next-browser-languagedetector qrcode.react html5-qrcode @stripe/stripe-js uuid
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install -D tailwindcss postcss autoprefixer @types/uuid vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npx tailwindcss init -p
npx shadcn-ui@latest init
```
When shadcn asks: style → `Default`, base color → `Slate`, CSS variables → `yes`.

- [ ] **Step 2: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

- [ ] **Step 3: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 238 84% 67%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 238 84% 67%;
    --radius: 0.5rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 4: Update `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 5: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `src/firebase.ts`**

```ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
```

- [ ] **Step 7: Create directory structure**

```bash
mkdir -p src/contexts src/services src/components/shared src/components/layouts
mkdir -p src/pages/auth src/pages/customer src/pages/vendor
mkdir -p src/locales/en src/locales/vi src/hooks
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project scaffold — Vite, Tailwind, shadcn/ui, Firebase init"
```

---

## Task 2: TypeScript Types + Firestore Rules

**Files:**
- Create: `src/types.ts`
- Create: `firestore.rules`

- [ ] **Step 1: Create `src/types.ts`**

```ts
import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  role: 'vendor' | 'customer'
  displayName: string
  email: string
  lang: 'en' | 'vi'
  storeName?: string
  address?: string
  storeDescription?: string
}

export type ListingCategory = 'bakery' | 'rice' | 'noodles' | 'drinks' | 'snacks' | 'other'
export type ListingStatus = 'active' | 'sold_out' | 'expired'
export type OrderStatus = 'pending' | 'paid' | 'picked_up' | 'cancelled'

export interface Listing {
  id: string
  vendorId: string
  type: 'mystery_box' | 'item'
  title: string
  description: string
  price: number
  originalPrice: number
  quantityTotal: number
  quantityRemaining: number
  pickupStart: Timestamp
  pickupEnd: Timestamp
  category: ListingCategory
  imageUrl: string
  status: ListingStatus
  createdAt: Timestamp
  // Note: stripeProductId/stripePriceId omitted — prototype uses price_data at checkout time
}

export interface Order {
  id: string
  customerId: string
  vendorId: string
  listingId: string
  listingTitle: string
  quantity: number
  totalPrice: number
  status: OrderStatus
  qrCode: string
  stripeSessionId: string
  createdAt: Timestamp
}
```

- [ ] **Step 2: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /listings/{listingId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.vendorId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.vendorId == request.auth.uid;
    }
    match /orders/{orderId} {
      allow read: if request.auth != null
        && (request.auth.uid == resource.data.customerId
            || request.auth.uid == resource.data.vendorId);
      allow update: if request.auth != null
        && request.auth.uid == resource.data.vendorId
        && resource.data.status == 'paid'
        && request.resource.data.status == 'picked_up';
      allow create, delete: if false;
    }
  }
}
```

- [ ] **Step 3: Deploy rules**

```bash
firebase deploy --only firestore:rules
```
Expected: `Deploy complete!`

- [ ] **Step 4: Commit**

```bash
git add src/types.ts firestore.rules
git commit -m "feat: TypeScript types and Firestore security rules"
```

---

## Task 3: Auth Service + AuthContext

**Files:**
- Create: `src/services/auth.ts`
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/test/auth.test.ts`

- [ ] **Step 1: Create `src/services/auth.ts`**

```ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { UserProfile } from '../types'

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: 'vendor' | 'customer',
  extra?: Partial<UserProfile>
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await setDoc(doc(db, 'users', cred.user.uid), {
    role,
    displayName,
    email,
    lang: 'en',
    ...extra,
  })
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null
}

export async function updateUserLang(uid: string, lang: 'en' | 'vi'): Promise<void> {
  const { updateDoc } = await import('firebase/firestore')
  await updateDoc(doc(db, 'users', uid), { lang })
}
```

- [ ] **Step 2: Create `src/contexts/AuthContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'
import { getUserProfile } from '../services/auth'
import type { UserProfile } from '../types'

interface AuthContextValue {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userProfile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/auth.ts src/contexts/AuthContext.tsx
git commit -m "feat: auth service and AuthContext"
```

---

## Task 4: React Router + Route Guards

**Files:**
- Create: `src/components/shared/ProtectedRoute.tsx`
- Create: `src/components/shared/RoleRoute.tsx`
- Create: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/components/shared/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center">Loading…</div>
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: Create `src/components/shared/RoleRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface RoleRouteProps {
  role: 'vendor' | 'customer'
  children: React.ReactNode
}

export function RoleRoute({ role, children }: RoleRouteProps) {
  const { userProfile, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center">Loading…</div>
  if (!userProfile) return <Navigate to="/login" replace />
  if (userProfile.role !== role) {
    return <Navigate to={userProfile.role === 'vendor' ? '/vendor' : '/browse'} replace />
  }
  return <>{children}</>
}
```

- [ ] **Step 3: Create `src/App.tsx`** (stub pages — will be replaced in later tasks)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { RoleRoute } from './components/shared/RoleRoute'

// Stub components — replaced in Tasks 5–18
const P = (name: string) => () => <div className="p-8 text-white">{name}</div>
const LoginPage = P('Login')
const RegisterPage = P('Register')
const BrowsePage = P('Browse')
const ListingDetailPage = P('ListingDetail')
const CheckoutSuccessPage = P('CheckoutSuccess')
const CheckoutCancelPage = P('CheckoutCancel')
const OrdersPage = P('Orders')
const OrderDetailPage = P('OrderDetail')
const VendorDashboardPage = P('VendorDashboard')
const ListingsPage = P('Listings')
const ListingFormPage = P('ListingForm')
const VendorOrdersPage = P('VendorOrders')
const QRScanPage = P('QRScan')

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/browse" element={
            <ProtectedRoute><RoleRoute role="customer"><BrowsePage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/listing/:id" element={
            <ProtectedRoute><RoleRoute role="customer"><ListingDetailPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/checkout/success" element={
            <ProtectedRoute><RoleRoute role="customer"><CheckoutSuccessPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/checkout/cancel" element={
            <ProtectedRoute><RoleRoute role="customer"><CheckoutCancelPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><RoleRoute role="customer"><OrdersPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute><RoleRoute role="customer"><OrderDetailPage /></RoleRoute></ProtectedRoute>
          } />

          <Route path="/vendor" element={
            <ProtectedRoute><RoleRoute role="vendor"><VendorDashboardPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/vendor/listings" element={
            <ProtectedRoute><RoleRoute role="vendor"><ListingsPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/vendor/listings/new" element={
            <ProtectedRoute><RoleRoute role="vendor"><ListingFormPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/vendor/listings/:id/edit" element={
            <ProtectedRoute><RoleRoute role="vendor"><ListingFormPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/vendor/orders" element={
            <ProtectedRoute><RoleRoute role="vendor"><VendorOrdersPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/vendor/scan" element={
            <ProtectedRoute><RoleRoute role="vendor"><QRScanPage /></RoleRoute></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="*" element={<Navigate to="/browse" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Update `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Run dev server and verify routes load**

```bash
npm run dev
```
Open http://localhost:5173 — should redirect to `/browse` and show "Browse" stub (or redirect to /login if not authenticated).

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/ProtectedRoute.tsx src/components/shared/RoleRoute.tsx src/App.tsx src/main.tsx
git commit -m "feat: React Router setup with ProtectedRoute and RoleRoute"
```

---

## Task 5: Layouts

**Files:**
- Create: `src/components/layouts/AuthLayout.tsx`
- Create: `src/components/layouts/CustomerLayout.tsx`
- Create: `src/components/layouts/VendorLayout.tsx`
- Create: `src/components/shared/LanguageToggle.tsx` (placeholder — wired in Task 19)

- [ ] **Step 1: Add shadcn Button component**

```bash
npx shadcn-ui@latest add button
```

- [ ] **Step 2: Create `src/components/shared/LanguageToggle.tsx`**

```tsx
export function LanguageToggle() {
  return (
    <button className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700">
      EN / VI
    </button>
  )
}
```

- [ ] **Step 3: Create `src/components/layouts/AuthLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            MysteryBox
          </h1>
          <p className="text-slate-400 text-sm mt-1">F&B Surplus Marketplace</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/layouts/CustomerLayout.tsx`**

```tsx
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'

export function CustomerLayout() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/browse" className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            MysteryBox
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/browse" className="text-slate-300 hover:text-white">Browse</Link>
            <Link to="/orders" className="text-slate-300 hover:text-white">My Orders</Link>
            <LanguageToggle />
            <span className="text-slate-500 text-xs">{userProfile?.displayName}</span>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-white text-xs">Sign out</button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/layouts/VendorLayout.tsx`**

```tsx
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { LayoutDashboard, Package, ShoppingBag, QrCode, LogOut } from 'lucide-react'

const navItems = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/vendor/listings', label: 'Listings', icon: Package },
  { to: '/vendor/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/vendor/scan', label: 'Scan QR', icon: QrCode },
]

export function VendorLayout() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col py-6 px-3">
        <div className="px-3 mb-8">
          <p className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MysteryBox</p>
          <p className="text-xs text-slate-500 mt-0.5">{userProfile?.storeName ?? userProfile?.displayName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 space-y-2">
          <LanguageToggle />
          <button onClick={handleSignOut} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-slate-800">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Wire layouts into `src/App.tsx`** — replace stub routes with layout wrappers

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { RoleRoute } from './components/shared/RoleRoute'
import { AuthLayout } from './components/layouts/AuthLayout'
import { CustomerLayout } from './components/layouts/CustomerLayout'
import { VendorLayout } from './components/layouts/VendorLayout'

const P = (name: string) => () => <div className="p-8 text-white">{name}</div>
const LoginPage = P('Login')
const RegisterPage = P('Register')
const BrowsePage = P('Browse')
const ListingDetailPage = P('ListingDetail')
const CheckoutSuccessPage = P('CheckoutSuccess')
const CheckoutCancelPage = P('CheckoutCancel')
const OrdersPage = P('Orders')
const OrderDetailPage = P('OrderDetail')
const VendorDashboardPage = P('VendorDashboard')
const ListingsPage = P('Listings')
const ListingFormPage = P('ListingForm')
const VendorOrdersPage = P('VendorOrders')
const QRScanPage = P('QRScan')

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute><RoleRoute role="customer"><CustomerLayout /></RoleRoute></ProtectedRoute>}>
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute><RoleRoute role="vendor"><VendorLayout /></RoleRoute></ProtectedRoute>}>
            <Route path="/vendor" element={<VendorDashboardPage />} />
            <Route path="/vendor/listings" element={<ListingsPage />} />
            <Route path="/vendor/listings/new" element={<ListingFormPage />} />
            <Route path="/vendor/listings/:id/edit" element={<ListingFormPage />} />
            <Route path="/vendor/orders" element={<VendorOrdersPage />} />
            <Route path="/vendor/scan" element={<QRScanPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="*" element={<Navigate to="/browse" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 7: Run `npm run dev` — verify both layouts render**

Navigate to `/login` → should show centered AuthLayout. After auth, `/browse` shows top nav, `/vendor` shows sidebar.

- [ ] **Step 8: Commit**

```bash
git add src/components/layouts/ src/components/shared/LanguageToggle.tsx src/App.tsx
git commit -m "feat: AuthLayout, CustomerLayout, VendorLayout"
```

---

## Task 6: Auth Pages (Login + Register)

**Files:**
- Create: `src/pages/auth/LoginPage.tsx`
- Create: `src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Add shadcn components**

```bash
npx shadcn-ui@latest add input label card
```

- [ ] **Step 2: Create `src/pages/auth/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      // RoleRoute will redirect based on role — navigate to root
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Sign in</CardTitle>
        <CardDescription className="text-slate-400">Welcome back</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Password</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-slate-400 text-sm text-center mt-4">
          No account? <Link to="/register" className="text-indigo-400 hover:underline">Register</Link>
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create `src/pages/auth/RegisterPage.tsx`**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, displayName, role, role === 'vendor' ? { storeName } : {})
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Create account</CardTitle>
        <CardDescription className="text-slate-400">Join MysteryBox</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['customer', 'vendor'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${role === r ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                {r === 'customer' ? '🛒 Customer' : '🏪 Vendor'}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Display name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {role === 'vendor' && (
            <div className="space-y-1">
              <Label className="text-slate-300">Store name</Label>
              <Input value={storeName} onChange={e => setStoreName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Password</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="text-slate-400 text-sm text-center mt-4">
          Have an account? <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Wire pages into `App.tsx`** — replace stub `LoginPage`/`RegisterPage` with real imports

```tsx
// Replace at top of App.tsx:
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
// Remove the P('Login') and P('Register') stubs
```

- [ ] **Step 5: Test manually**

Run `npm run dev`. Go to `/register`, create a customer account. Verify redirect to `/browse`. Sign out, sign in, verify redirect. Create a vendor account, verify redirect to `/vendor`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/auth/ src/App.tsx
git commit -m "feat: login and register pages with role selector"
```

---

## Task 7: Firestore Services (listings + orders)

**Files:**
- Create: `src/services/listings.ts`
- Create: `src/services/orders.ts`
- Create: `src/services/storage.ts`

- [ ] **Step 1: Create `src/services/listings.ts`**

```ts
import {
  collection, doc, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Listing } from '../types'

export function subscribeToActiveListings(callback: (listings: Listing[]) => void): Unsubscribe {
  const q = query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))))
}

export function subscribeToVendorListings(vendorId: string, callback: (listings: Listing[]) => void): Unsubscribe {
  const q = query(collection(db, 'listings'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))))
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, 'listings', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Listing) : null
}

export async function createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'listings'), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateListing(id: string, data: Partial<Omit<Listing, 'id'>>): Promise<void> {
  await updateDoc(doc(db, 'listings', id), data)
}

export async function deleteListing(id: string): Promise<void> {
  await deleteDoc(doc(db, 'listings', id))
}
```

- [ ] **Step 2: Create `src/services/orders.ts`**

```ts
import {
  collection, doc, updateDoc, onSnapshot,
  query, where, orderBy, getDocs, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Order } from '../types'

export function subscribeToCustomerOrders(customerId: string, callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))))
}

export function subscribeToVendorOrders(vendorId: string, callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))))
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'orders', orderId), snap =>
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null)
  )
}

export async function redeemQRCode(qrCode: string, vendorId: string): Promise<Order> {
  const snap = await getDocs(
    query(collection(db, 'orders'),
      where('qrCode', '==', qrCode),
      where('vendorId', '==', vendorId),
      where('status', '==', 'paid'))
  )
  if (snap.empty) throw new Error('Invalid or already used QR code')
  await updateDoc(snap.docs[0].ref, { status: 'picked_up' })
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order
}
```

- [ ] **Step 3: Create `src/services/storage.ts`**

```ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

export async function uploadListingImage(vendorId: string, file: File): Promise<string> {
  const path = `listings/${vendorId}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}
```

- [ ] **Step 4: Create Firestore composite indexes** — run this in terminal and follow the link that appears in Firestore errors, OR manually create in Firebase Console:

Required indexes:
- Collection `listings`: fields `status ASC`, `createdAt DESC`
- Collection `listings`: fields `vendorId ASC`, `createdAt DESC`
- Collection `orders`: fields `customerId ASC`, `createdAt DESC`
- Collection `orders`: fields `vendorId ASC`, `createdAt DESC`
- Collection `orders`: fields `qrCode ASC`, `vendorId ASC`, `status ASC`

Alternatively create `firestore.indexes.json`:
```json
{
  "indexes": [
    { "collectionGroup": "listings", "queryScope": "COLLECTION", "fields": [{"fieldPath":"status","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    { "collectionGroup": "listings", "queryScope": "COLLECTION", "fields": [{"fieldPath":"vendorId","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [{"fieldPath":"customerId","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [{"fieldPath":"vendorId","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [{"fieldPath":"qrCode","order":"ASCENDING"},{"fieldPath":"vendorId","order":"ASCENDING"},{"fieldPath":"status","order":"ASCENDING"}]}
  ],
  "fieldOverrides": []
}
```

Deploy: `firebase deploy --only firestore:indexes`

- [ ] **Step 5: Commit**

```bash
git add src/services/ firestore.indexes.json
git commit -m "feat: Firestore services for listings, orders, and storage"
```

---

## Task 8: Cloud Functions Setup

**Files:**
- Create: `functions/` directory (via Firebase CLI)
- Create: `functions/src/index.ts`
- Create: `functions/package.json` additions

- [ ] **Step 1: Initialize Firebase Functions**

```bash
firebase init functions
```
Choose: TypeScript, ESLint yes, install deps yes.

- [ ] **Step 2: Install Stripe + uuid in functions**

```bash
cd functions
npm install stripe uuid @types/uuid
cd ..
```

- [ ] **Step 3: Set Firebase config for Stripe secrets**

```bash
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY" stripe.webhook_secret="whsec_YOUR_SECRET" app.url="http://localhost:5173"
```

For local dev, create `functions/.runtimeconfig.json`:
```json
{
  "stripe": {
    "secret_key": "sk_test_YOUR_KEY",
    "webhook_secret": "whsec_YOUR_SECRET"
  },
  "app": {
    "url": "http://localhost:5173"
  }
}
```

- [ ] **Step 4: Initialize admin SDK in `functions/src/index.ts`**

```ts
import * as admin from 'firebase-admin'
export { createCheckoutSession } from './createCheckoutSession'
export { stripeWebhook } from './stripeWebhook'

admin.initializeApp()
```

- [ ] **Step 5: Commit**

```bash
git add functions/
git commit -m "feat: Firebase Cloud Functions scaffold"
```

---

## Task 9: Cloud Function — createCheckoutSession

**Files:**
- Create: `functions/src/createCheckoutSession.ts`

- [ ] **Step 1: Create `functions/src/createCheckoutSession.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
  }

  const { listingId, quantity } = data as { listingId: string; quantity: number }
  const customerId = context.auth.uid
  const db = admin.firestore()
  const stripe = getStripe()

  const listingRef = db.collection('listings').doc(listingId)
  const listingSnap = await listingRef.get()
  if (!listingSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Listing not found')
  }
  const listing = listingSnap.data()!

  if (listing.quantityRemaining < quantity) {
    throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')
  }

  const appUrl = functions.config().app?.url ?? 'http://localhost:5173'
  const orderId = db.collection('orders').doc().id

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'vnd',
        product_data: { name: listing.title, description: listing.description },
        unit_amount: listing.price,
      },
      quantity,
    }],
    mode: 'payment',
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${appUrl}/checkout/cancel`,
    metadata: { orderId, listingId, customerId, vendorId: listing.vendorId, quantity: String(quantity) },
  })

  await db.collection('orders').doc(orderId).set({
    customerId,
    vendorId: listing.vendorId,
    listingId,
    listingTitle: listing.title,
    quantity,
    totalPrice: listing.price * quantity,
    status: 'pending',
    qrCode: uuidv4(),
    stripeSessionId: session.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { url: session.url, orderId }
})
```

- [ ] **Step 2: Create `src/services/stripe.ts` in the frontend**

```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function initiateCheckout(listingId: string, quantity: number): Promise<void> {
  const fn = httpsCallable<{ listingId: string; quantity: number }, { url: string; orderId: string }>(
    functions,
    'createCheckoutSession'
  )
  const result = await fn({ listingId, quantity })
  window.location.href = result.data.url
}
```

- [ ] **Step 3: Build and deploy**

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions:createCheckoutSession
```
Expected: `Deploy complete!`

- [ ] **Step 4: Commit**

```bash
git add functions/src/createCheckoutSession.ts src/services/stripe.ts
git commit -m "feat: createCheckoutSession Cloud Function and stripe service"
```

---

## Task 10: Cloud Function — stripeWebhook

**Files:**
- Create: `functions/src/stripeWebhook.ts`

- [ ] **Step 1: Create `functions/src/stripeWebhook.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = functions.config().stripe.webhook_secret

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { orderId, listingId, quantity } = session.metadata!

    const db = admin.firestore()
    const orderRef = db.collection('orders').doc(orderId)
    const listingRef = db.collection('listings').doc(listingId)

    await db.runTransaction(async t => {
      const [orderSnap, listingSnap] = await Promise.all([t.get(orderRef), t.get(listingRef)])
      if (!orderSnap.exists || !listingSnap.exists) return

      const newQty = listingSnap.data()!.quantityRemaining - parseInt(quantity)
      t.update(orderRef, { status: 'paid' })
      t.update(listingRef, {
        quantityRemaining: newQty,
        status: newQty <= 0 ? 'sold_out' : 'active',
      })
    })
  }

  res.json({ received: true })
})

```

- [ ] **Step 2: Deploy**

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions:stripeWebhook
```

- [ ] **Step 3: Get webhook URL and register in Stripe Dashboard**

After deploy, copy the function URL (shown in output, format: `https://us-central1-<project>.cloudfunctions.net/stripeWebhook`).

Go to Stripe Dashboard → Developers → Webhooks → Add endpoint. Paste URL. Select event: `checkout.session.completed`. Copy the signing secret (`whsec_...`) and update Firebase config:

```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_REAL_SECRET"
firebase deploy --only functions
```

- [ ] **Step 4: Set up Stripe CLI for local webhook forwarding (dev only)**

```bash
stripe listen --forward-to http://127.0.0.1:5001/<PROJECT_ID>/us-central1/stripeWebhook
```
This prints a webhook signing secret — use it in `.runtimeconfig.json` for local testing.

- [ ] **Step 5: Commit**

```bash
git add functions/src/stripeWebhook.ts functions/src/index.ts
git commit -m "feat: stripeWebhook Cloud Function"
```

---

## Task 11: Customer — ListingCard + BrowsePage

**Files:**
- Create: `src/components/shared/ListingCard.tsx`
- Create: `src/pages/customer/BrowsePage.tsx`
- Modify: `src/App.tsx` (replace stub)

- [ ] **Step 1: Create `src/components/shared/ListingCard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import type { Listing } from '../../types'

interface ListingCardProps {
  listing: Listing
  href: string
}

export function ListingCard({ listing, href }: ListingCardProps) {
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const pickup = new Date(listing.pickupStart.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    + ' – ' + new Date(listing.pickupEnd.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <Link to={href} className="block group">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors">
        <div className="relative h-40 bg-slate-800">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}
          <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
          {listing.status === 'sold_out' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SOLD OUT</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-white text-sm truncate">{listing.title}</p>
          <div className="flex items-center justify-between mt-1">
            <div>
              <span className="text-indigo-400 font-bold text-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
              <span className="text-slate-500 text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <span className="text-slate-400 text-xs">{listing.quantityRemaining} left</span>
          </div>
          <p className="text-slate-500 text-xs mt-1 truncate">Pickup {pickup}</p>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create `src/pages/customer/BrowsePage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { subscribeToActiveListings } from '../../services/listings'
import { ListingCard } from '../../components/shared/ListingCard'
import type { Listing, ListingCategory } from '../../types'

const CATEGORIES: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'rice', label: 'Rice' },
  { value: 'noodles', label: 'Noodles' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'other', label: 'Other' },
]

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      setListings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = category === 'all' ? listings : listings.filter(l => l.category === category)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Browse Surplus Boxes</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c.value ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {c.label}
          </button>
        ))}
      </div>
      {loading && <p className="text-slate-400">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="text-slate-400">No listings available right now.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire into `App.tsx`**

```tsx
import BrowsePage from './pages/customer/BrowsePage'
// Remove P('Browse') stub
```

- [ ] **Step 4: Test** — run `npm run dev`, sign in as customer, verify listings grid loads.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/ListingCard.tsx src/pages/customer/BrowsePage.tsx src/App.tsx
git commit -m "feat: ListingCard component and BrowsePage with category filter"
```

---

## Task 12: Customer — ListingDetailPage + CheckoutButton

**Files:**
- Create: `src/pages/customer/ListingDetailPage.tsx`

- [ ] **Step 1: Create `src/pages/customer/ListingDetailPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing } from '../../services/listings'
import { initiateCheckout } from '../../services/stripe'
import { Button } from '@/components/ui/button'
import type { Listing } from '../../types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getListing(id).then(l => { setListing(l); setLoading(false) })
  }, [id])

  const handleBuy = async () => {
    if (!listing) return
    setCheckoutLoading(true)
    setError('')
    try {
      await initiateCheckout(listing.id, 1)
    } catch (err: any) {
      setError(err.message ?? 'Checkout failed')
      setCheckoutLoading(false)
    }
  }

  if (loading) return <p className="text-slate-400 p-8">Loading…</p>
  if (!listing) return <p className="text-slate-400 p-8">Listing not found.</p>

  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const pickupStart = new Date(listing.pickupStart.seconds * 1000).toLocaleString('vi-VN')
  const pickupEnd = new Date(listing.pickupEnd.seconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const isSoldOut = listing.status === 'sold_out' || listing.quantityRemaining === 0

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-4">← Back</button>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="relative h-64 bg-slate-800">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>}
          <span className="absolute top-3 right-3 bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</span>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
            <p className="text-slate-400 mt-2">{listing.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-indigo-400">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-slate-500 text-lg line-through">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Remaining</p>
              <p className="text-white font-medium">{listing.quantityRemaining} boxes</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Pickup window</p>
              <p className="text-white font-medium">{pickupStart} – {pickupEnd}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Category</p>
              <p className="text-white font-medium capitalize">{listing.category}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Type</p>
              <p className="text-white font-medium">{listing.type === 'mystery_box' ? '🎁 Mystery Box' : 'Single Item'}</p>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            onClick={handleBuy}
            disabled={isSoldOut || checkoutLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 text-base disabled:opacity-50"
          >
            {isSoldOut ? 'Sold Out' : checkoutLoading ? 'Redirecting to checkout…' : `Buy Now — ${listing.price.toLocaleString('vi-VN')} đ`}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `App.tsx`**

```tsx
import ListingDetailPage from './pages/customer/ListingDetailPage'
```

- [ ] **Step 3: Test** — click a listing card from BrowsePage, verify detail page loads. Click "Buy Now", verify redirect to Stripe Checkout (test mode).

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/ListingDetailPage.tsx src/App.tsx
git commit -m "feat: ListingDetailPage with Stripe checkout trigger"
```

---

## Task 13: Customer — Checkout Success/Cancel + Orders + QR

**Files:**
- Create: `src/pages/customer/CheckoutSuccessPage.tsx`
- Create: `src/pages/customer/CheckoutCancelPage.tsx`
- Create: `src/pages/customer/OrdersPage.tsx`
- Create: `src/pages/customer/OrderDetailPage.tsx`

- [ ] **Step 1: Create `src/pages/customer/CheckoutSuccessPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { subscribeToOrder } from '../../services/orders'
import type { Order } from '../../types'

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('order_id')
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) { navigate('/browse'); return }
    const unsub = subscribeToOrder(orderId, o => {
      setOrder(o)
      if (o?.status === 'paid') navigate(`/orders/${orderId}`, { replace: true })
    })
    return unsub
  }, [orderId])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-4xl mb-4 animate-spin">⏳</div>
      <h2 className="text-white text-xl font-bold">Confirming your payment…</h2>
      <p className="text-slate-400 mt-2">This usually takes a few seconds.</p>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/customer/CheckoutCancelPage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="text-white text-xl font-bold">Payment cancelled</h2>
      <p className="text-slate-400 mt-2">Your box is still available. Ready to try again?</p>
      <Link to="/browse" className="mt-6"><Button className="bg-indigo-600 hover:bg-indigo-500">Back to Browse</Button></Link>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/pages/customer/OrdersPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToCustomerOrders } from '../../services/orders'
import type { Order } from '../../types'

const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-slate-700 text-slate-300',
  cancelled: 'bg-red-900 text-red-300',
}

export default function OrdersPage() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToCustomerOrders(currentUser.uid, data => { setOrders(data); setLoading(false) })
    return unsub
  }, [currentUser])

  if (loading) return <p className="text-slate-400">Loading…</p>
  if (orders.length === 0) return (
    <div className="text-center mt-16">
      <p className="text-slate-400">No orders yet.</p>
      <Link to="/browse" className="text-indigo-400 hover:underline text-sm mt-2 block">Browse listings →</Link>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <Link key={order.id} to={`/orders/${order.id}`} className="block">
            <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl p-4 flex items-center justify-between transition-colors">
              <div>
                <p className="text-white font-medium">{order.listingTitle}</p>
                <p className="text-slate-400 text-sm">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString('vi-VN')} · {order.quantity} box · {order.totalPrice.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Install qrcode.react**

```bash
npm install qrcode.react
```

- [ ] **Step 5: Create `src/pages/customer/OrderDetailPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { subscribeToOrder } from '../../services/orders'
import type { Order } from '../../types'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = subscribeToOrder(id, o => { setOrder(o); setLoading(false) })
    return unsub
  }, [id])

  if (loading) return <p className="text-slate-400 p-8">Loading…</p>
  if (!order) return <p className="text-slate-400 p-8">Order not found.</p>

  const isPickedUp = order.status === 'picked_up'
  const isPaid = order.status === 'paid'

  return (
    <div className="max-w-sm mx-auto text-center">
      <button onClick={() => navigate('/orders')} className="text-slate-400 hover:text-white text-sm mb-6 block text-left">← My Orders</button>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white text-xl font-bold mb-1">{order.listingTitle}</h2>
        <p className="text-slate-400 text-sm mb-6">{order.quantity} box · {order.totalPrice.toLocaleString('vi-VN')} đ</p>

        {isPaid && (
          <>
            <p className="text-green-400 font-medium text-sm mb-4">Show this QR code at pickup</p>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4">
              <QRCodeSVG value={order.qrCode} size={200} />
            </div>
            <p className="text-slate-500 text-xs font-mono break-all">{order.qrCode}</p>
          </>
        )}

        {isPickedUp && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-bold">Picked up!</p>
            <p className="text-slate-400 text-sm mt-1">Enjoy your meal 🎉</p>
          </div>
        )}

        {order.status === 'pending' && (
          <p className="text-yellow-400 text-sm">Payment pending — please complete checkout.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Wire all four pages into `App.tsx`**

```tsx
import CheckoutSuccessPage from './pages/customer/CheckoutSuccessPage'
import CheckoutCancelPage from './pages/customer/CheckoutCancelPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
```

- [ ] **Step 7: End-to-end test the purchase flow**

1. Sign in as customer
2. Browse → click a listing → click "Buy Now"
3. Stripe Checkout → use card `4242 4242 4242 4242`, any future date, any CVC
4. Verify redirect to `/checkout/success` → spinner → redirects to `/orders/:id`
5. Verify QR code displays on order detail page
6. Check Firestore Console — order status should be `"paid"`

- [ ] **Step 8: Commit**

```bash
git add src/pages/customer/
git commit -m "feat: checkout success/cancel, orders list, order detail with QR code"
```

---

## Task 14: Vendor — Dashboard

**Files:**
- Create: `src/pages/vendor/VendorDashboardPage.tsx`

- [ ] **Step 1: Create `src/pages/vendor/VendorDashboardPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { subscribeToVendorOrders } from '../../services/orders'
import type { Listing, Order } from '../../types'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function VendorDashboardPage() {
  const { currentUser, userProfile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!currentUser) return
    const u1 = subscribeToVendorListings(currentUser.uid, setListings)
    const u2 = subscribeToVendorOrders(currentUser.uid, setOrders)
    return () => { u1(); u2() }
  }, [currentUser])

  const activeListings = listings.filter(l => l.status === 'active').length
  const paidOrders = orders.filter(o => o.status === 'paid')
  const revenue = orders.filter(o => o.status === 'paid' || o.status === 'picked_up')
    .reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-8">Welcome back, {userProfile?.displayName}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Listings" value={activeListings} />
        <StatCard label="Pending Pickups" value={paidOrders.length} sub="awaiting QR scan" />
        <StatCard label="Total Revenue" value={`${revenue.toLocaleString('vi-VN')} đ`} />
      </div>
      <div>
        <h2 className="text-white font-semibold mb-3">Recent Orders</h2>
        {orders.slice(0, 5).map(o => (
          <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-800 text-sm">
            <span className="text-white">{o.listingTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === 'paid' ? 'bg-green-900 text-green-300' : o.status === 'picked_up' ? 'bg-slate-700 text-slate-300' : 'bg-yellow-900 text-yellow-300'}`}>
              {o.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `App.tsx`**

```tsx
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/vendor/VendorDashboardPage.tsx src/App.tsx
git commit -m "feat: vendor dashboard with stats and recent orders"
```

---

## Task 15: Vendor — Listings CRUD

**Files:**
- Create: `src/pages/vendor/ListingsPage.tsx`
- Create: `src/pages/vendor/ListingFormPage.tsx`

- [ ] **Step 1: Add shadcn select and textarea**

```bash
npx shadcn-ui@latest add select textarea
```

- [ ] **Step 2: Create `src/pages/vendor/ListingsPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing } from '../../services/listings'
import { Button } from '@/components/ui/button'
import type { Listing } from '../../types'

export default function ListingsPage() {
  const { currentUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorListings(currentUser.uid, data => { setListings(data); setLoading(false) })
    return unsub
  }, [currentUser])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
  }

  const STATUS_COLOR: Record<string, string> = {
    active: 'text-green-400', sold_out: 'text-orange-400', expired: 'text-slate-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Listings</h1>
        <Link to="/vendor/listings/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500">+ New Listing</Button>
        </Link>
      </div>

      {loading && <p className="text-slate-400">Loading…</p>}
      {!loading && listings.length === 0 && <p className="text-slate-400">No listings yet. Create your first one!</p>}

      <div className="space-y-3">
        {listings.map(l => (
          <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {l.imageUrl ? <img src={l.imageUrl} className="w-full h-full object-cover rounded-lg" /> : '🎁'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{l.title}</p>
              <p className="text-slate-400 text-sm">
                {l.price.toLocaleString('vi-VN')} đ · {l.quantityRemaining}/{l.quantityTotal} left ·{' '}
                <span className={STATUS_COLOR[l.status]}>{l.status.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link to={`/vendor/listings/${l.id}/edit`}>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white">Edit</Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(l.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/pages/vendor/ListingFormPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createListing, getListing, updateListing } from '../../services/listings'
import { uploadListingImage } from '../../services/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Timestamp } from 'firebase/firestore'
import type { ListingCategory } from '../../types'

const CATEGORIES: ListingCategory[] = ['bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

export default function ListingFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [quantity, setQuantity] = useState('10')
  const [category, setCategory] = useState<ListingCategory>('bakery')
  const [type, setType] = useState<'mystery_box' | 'item'>('mystery_box')
  const [pickupStart, setPickupStart] = useState('')
  const [pickupEnd, setPickupEnd] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getListing(id).then(l => {
      if (!l) return
      setTitle(l.title)
      setDescription(l.description)
      setPrice(String(l.price))
      setOriginalPrice(String(l.originalPrice))
      setQuantity(String(l.quantityTotal))
      setCategory(l.category)
      setType(l.type)
      setExistingImageUrl(l.imageUrl)
      const toDatetimeLocal = (ts: Timestamp) => {
        const d = new Date(ts.seconds * 1000)
        return d.toISOString().slice(0, 16)
      }
      setPickupStart(toDatetimeLocal(l.pickupStart))
      setPickupEnd(toDatetimeLocal(l.pickupEnd))
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setLoading(true)
    setError('')
    try {
      let imageUrl = existingImageUrl
      if (imageFile) {
        imageUrl = await uploadListingImage(currentUser.uid, imageFile)
      }

      const data = {
        vendorId: currentUser.uid,
        type,
        title,
        description,
        price: parseInt(price),
        originalPrice: parseInt(originalPrice),
        quantityTotal: parseInt(quantity),
        quantityRemaining: isEdit ? undefined : parseInt(quantity),
        category,
        imageUrl,
        pickupStart: Timestamp.fromDate(new Date(pickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
        status: 'active' as const,
      }

      if (isEdit && id) {
        const { quantityRemaining: _, ...updateData } = data
        await updateListing(id, updateData)
      } else {
        await createListing({ ...data, quantityRemaining: parseInt(quantity) })
      }
      navigate('/vendor/listings')
    } catch (err: any) {
      setError(err.message ?? 'Failed to save listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['mystery_box', 'item'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`py-2 rounded-lg border text-sm font-medium ${type === t ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-700 text-slate-400'}`}>
              {t === 'mystery_box' ? '🎁 Mystery Box' : '📦 Single Item'}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="Bánh mì mystery box" />
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="What's inside…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Price (VND)</Label>
            <Input value={price} onChange={e => setPrice(e.target.value)} type="number" required min="1000" className="bg-slate-800 border-slate-700 text-white" placeholder="35000" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Original Price (VND)</Label>
            <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} type="number" required min="1000" className="bg-slate-800 border-slate-700 text-white" placeholder="90000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Quantity</Label>
            <Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" required min="1" className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as ListingCategory)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Pickup start</Label>
            <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)} type="datetime-local" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Pickup end</Label>
            <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} type="datetime-local" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Image</Label>
          <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="bg-slate-800 border-slate-700 text-white" />
          {existingImageUrl && !imageFile && <img src={existingImageUrl} className="mt-2 h-20 rounded object-cover" />}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/vendor/listings')} className="border-slate-700 text-slate-300">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Wire into `App.tsx`**

```tsx
import ListingsPage from './pages/vendor/ListingsPage'
import ListingFormPage from './pages/vendor/ListingFormPage'
```

- [ ] **Step 5: Test** — create a listing as vendor. Verify it appears on the customer Browse page in real-time.

- [ ] **Step 6: Commit**

```bash
git add src/pages/vendor/ListingsPage.tsx src/pages/vendor/ListingFormPage.tsx src/App.tsx
git commit -m "feat: vendor listings CRUD with image upload"
```

---

## Task 16: Vendor — Orders + QR Scanner

**Files:**
- Create: `src/pages/vendor/VendorOrdersPage.tsx`
- Create: `src/pages/vendor/QRScanPage.tsx`

- [ ] **Step 1: Create `src/pages/vendor/VendorOrdersPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorOrders } from '../../services/orders'
import type { Order } from '../../types'

const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-slate-700 text-slate-300',
  cancelled: 'bg-red-900 text-red-300',
}

export default function VendorOrdersPage() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorOrders(currentUser.uid, data => { setOrders(data); setLoading(false) })
    return unsub
  }, [currentUser])

  if (loading) return <p className="text-slate-400">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <Link to="/vendor/scan" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Scan QR →
        </Link>
      </div>

      {orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}

      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{o.listingTitle}</p>
              <p className="text-slate-400 text-sm">
                {new Date(o.createdAt.seconds * 1000).toLocaleString('vi-VN')} · {o.quantity} box · {o.totalPrice.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status]}`}>
              {o.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/vendor/QRScanPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../contexts/AuthContext'
import { redeemQRCode } from '../../services/orders'
import type { Order } from '../../types'

export default function QRScanPage() {
  const { currentUser } = useAuth()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [status, setStatus] = useState<'scanning' | 'success' | 'error'>('scanning')
  const [result, setResult] = useState<Order | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!currentUser) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 260, height: 260 } },
      false
    )
    scannerRef.current = scanner

    scanner.render(
      async (decodedText) => {
        try {
          await scanner.clear()
          const order = await redeemQRCode(decodedText, currentUser.uid)
          setResult(order)
          setStatus('success')
        } catch (err: any) {
          setErrorMsg(err.message ?? 'Invalid QR code')
          setStatus('error')
        }
      },
      () => {}
    )

    return () => { scanner.clear().catch(() => {}) }
  }, [currentUser])

  const handleReset = () => {
    setStatus('scanning')
    setResult(null)
    setErrorMsg('')
    // Re-render scanner
    if (scannerRef.current) {
      scannerRef.current.render(async () => {}, () => {})
    }
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-white mb-2">Scan QR Code</h1>
      <p className="text-slate-400 text-sm mb-6">Point camera at customer's QR code to confirm pickup</p>

      {status === 'scanning' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div id="qr-reader" className="w-full" />
        </div>
      )}

      {status === 'success' && result && (
        <div className="bg-slate-900 border border-green-700 rounded-xl p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-white text-xl font-bold">Pickup Confirmed!</h2>
          <p className="text-slate-400 mt-2">{result.listingTitle}</p>
          <p className="text-slate-400 text-sm">{result.quantity} box · {result.totalPrice.toLocaleString('vi-VN')} đ</p>
          <button onClick={handleReset} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Scan another
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-slate-900 border border-red-700 rounded-xl p-8">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-white text-xl font-bold">Invalid QR Code</h2>
          <p className="text-red-400 mt-2">{errorMsg}</p>
          <button onClick={handleReset} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire into `App.tsx`**

```tsx
import VendorOrdersPage from './pages/vendor/VendorOrdersPage'
import QRScanPage from './pages/vendor/QRScanPage'
```

- [ ] **Step 4: Test the QR pickup flow**

1. Sign in as customer, complete a purchase, open `/orders/:id` — QR code visible
2. Open a second browser window (or incognito), sign in as the vendor for that listing
3. Go to `/vendor/scan` — camera activates
4. Hold the customer's QR code in front of the camera
5. Verify "Pickup Confirmed" screen appears
6. Verify in Firestore that order status is now `"picked_up"`
7. Verify the customer's order detail page updates in real time (QR replaced with ✅)

- [ ] **Step 5: Commit**

```bash
git add src/pages/vendor/VendorOrdersPage.tsx src/pages/vendor/QRScanPage.tsx src/App.tsx
git commit -m "feat: vendor orders page and QR scanner for pickup confirmation"
```

---

## Task 17: i18n — EN/VI Translations + Language Toggle

**Files:**
- Create: `src/i18n.ts`
- Create: `src/locales/en/translation.json`
- Create: `src/locales/vi/translation.json`
- Modify: `src/components/shared/LanguageToggle.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/locales/en/translation.json`**

```json
{
  "nav": {
    "browse": "Browse",
    "myOrders": "My Orders",
    "dashboard": "Dashboard",
    "listings": "Listings",
    "orders": "Orders",
    "scanQR": "Scan QR",
    "signOut": "Sign out"
  },
  "auth": {
    "signIn": "Sign in",
    "createAccount": "Create account",
    "email": "Email",
    "password": "Password",
    "displayName": "Display name",
    "storeName": "Store name",
    "noAccount": "No account?",
    "register": "Register",
    "haveAccount": "Have an account?",
    "invalidCredentials": "Invalid email or password",
    "customer": "Customer",
    "vendor": "Vendor"
  },
  "browse": {
    "title": "Browse Surplus Boxes",
    "all": "All",
    "noListings": "No listings available right now.",
    "loading": "Loading…"
  },
  "listing": {
    "buyNow": "Buy Now",
    "soldOut": "Sold Out",
    "remaining": "{{count}} boxes left",
    "pickup": "Pickup",
    "category": "Category",
    "type": "Type",
    "mysteryBox": "🎁 Mystery Box",
    "singleItem": "📦 Single Item",
    "redirecting": "Redirecting to checkout…",
    "checkoutFailed": "Checkout failed"
  },
  "order": {
    "title": "My Orders",
    "noOrders": "No orders yet.",
    "confirmingPayment": "Confirming your payment…",
    "showQR": "Show this QR code at pickup",
    "pickedUp": "Picked up!",
    "enjoy": "Enjoy your meal 🎉",
    "paymentCancelled": "Payment cancelled",
    "tryAgain": "Back to Browse"
  },
  "vendor": {
    "dashboard": "Dashboard",
    "welcome": "Welcome back",
    "activeListings": "Active Listings",
    "pendingPickups": "Pending Pickups",
    "totalRevenue": "Total Revenue",
    "recentOrders": "Recent Orders",
    "newListing": "+ New Listing",
    "myListings": "My Listings",
    "editListing": "Edit Listing",
    "createListing": "New Listing",
    "save": "Save Changes",
    "create": "Create Listing",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "scanQR": "Scan QR Code",
    "scanInstruction": "Point camera at customer's QR code to confirm pickup",
    "pickupConfirmed": "Pickup Confirmed!",
    "invalidQR": "Invalid QR Code",
    "scanAnother": "Scan another",
    "tryAgain": "Try again"
  },
  "categories": {
    "bakery": "Bakery",
    "rice": "Rice",
    "noodles": "Noodles",
    "drinks": "Drinks",
    "snacks": "Snacks",
    "other": "Other"
  }
}
```

- [ ] **Step 2: Create `src/locales/vi/translation.json`**

```json
{
  "nav": {
    "browse": "Khám phá",
    "myOrders": "Đơn của tôi",
    "dashboard": "Tổng quan",
    "listings": "Sản phẩm",
    "orders": "Đơn hàng",
    "scanQR": "Quét QR",
    "signOut": "Đăng xuất"
  },
  "auth": {
    "signIn": "Đăng nhập",
    "createAccount": "Tạo tài khoản",
    "email": "Email",
    "password": "Mật khẩu",
    "displayName": "Tên hiển thị",
    "storeName": "Tên cửa hàng",
    "noAccount": "Chưa có tài khoản?",
    "register": "Đăng ký",
    "haveAccount": "Đã có tài khoản?",
    "invalidCredentials": "Email hoặc mật khẩu không đúng",
    "customer": "Khách hàng",
    "vendor": "Người bán"
  },
  "browse": {
    "title": "Khám phá Hộp Dư Thừa",
    "all": "Tất cả",
    "noListings": "Hiện không có sản phẩm nào.",
    "loading": "Đang tải…"
  },
  "listing": {
    "buyNow": "Mua ngay",
    "soldOut": "Hết hàng",
    "remaining": "Còn {{count}} hộp",
    "pickup": "Nhận hàng",
    "category": "Danh mục",
    "type": "Loại",
    "mysteryBox": "🎁 Hộp Bí Ẩn",
    "singleItem": "📦 Món đơn lẻ",
    "redirecting": "Đang chuyển đến trang thanh toán…",
    "checkoutFailed": "Thanh toán thất bại"
  },
  "order": {
    "title": "Đơn hàng của tôi",
    "noOrders": "Chưa có đơn hàng.",
    "confirmingPayment": "Đang xác nhận thanh toán…",
    "showQR": "Hiển thị mã QR khi nhận hàng",
    "pickedUp": "Đã nhận hàng!",
    "enjoy": "Chúc ngon miệng 🎉",
    "paymentCancelled": "Đã hủy thanh toán",
    "tryAgain": "Quay lại trang khám phá"
  },
  "vendor": {
    "dashboard": "Tổng quan",
    "welcome": "Chào mừng trở lại",
    "activeListings": "Sản phẩm đang bán",
    "pendingPickups": "Chờ nhận hàng",
    "totalRevenue": "Tổng doanh thu",
    "recentOrders": "Đơn hàng gần đây",
    "newListing": "+ Thêm sản phẩm",
    "myListings": "Sản phẩm của tôi",
    "editListing": "Chỉnh sửa",
    "createListing": "Sản phẩm mới",
    "save": "Lưu thay đổi",
    "create": "Tạo sản phẩm",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Sửa",
    "scanQR": "Quét mã QR",
    "scanInstruction": "Hướng camera vào mã QR của khách để xác nhận nhận hàng",
    "pickupConfirmed": "Xác nhận nhận hàng!",
    "invalidQR": "Mã QR không hợp lệ",
    "scanAnother": "Quét tiếp",
    "tryAgain": "Thử lại"
  },
  "categories": {
    "bakery": "Bánh",
    "rice": "Cơm",
    "noodles": "Bún / Phở",
    "drinks": "Đồ uống",
    "snacks": "Đồ ăn vặt",
    "other": "Khác"
  }
}
```

- [ ] **Step 3: Create `src/i18n.ts`**

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en/translation.json'
import vi from './locales/vi/translation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, vi: { translation: vi } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
```

- [ ] **Step 4: Import i18n in `src/main.tsx`**

```tsx
import './i18n'   // ← add this line before App import
```

- [ ] **Step 5: Replace `src/components/shared/LanguageToggle.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { updateUserLang } from '../../services/auth'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const { currentUser } = useAuth()
  const current = i18n.language.startsWith('vi') ? 'vi' : 'en'

  const toggle = async () => {
    const next = current === 'en' ? 'vi' : 'en'
    await i18n.changeLanguage(next)
    if (currentUser) await updateUserLang(currentUser.uid, next)
  }

  return (
    <button onClick={toggle} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 transition-colors">
      {current === 'en' ? 'VI' : 'EN'}
    </button>
  )
}
```

- [ ] **Step 6: Load user's saved language on login** — update `AuthContext.tsx` to call `i18n.changeLanguage` after fetching profile

```tsx
// In AuthContext.tsx, after setUserProfile(profile):
import i18n from '../i18n'
// ...
if (profile?.lang) {
  i18n.changeLanguage(profile.lang)
}
```

- [ ] **Step 7: Update key components to use `t()`** — at minimum update these strings in each page:

In `BrowsePage.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
// inside component:
const { t } = useTranslation()
// Replace: "Browse Surplus Boxes" → {t('browse.title')}
// Replace: "All" → {t('browse.all')}
// Replace: "Loading…" → {t('browse.loading')}
// Replace: "No listings available…" → {t('browse.noListings')}
```

In `CustomerLayout.tsx`:
```tsx
const { t } = useTranslation()
// Replace nav link text with t('nav.browse'), t('nav.myOrders'), t('nav.signOut')
```

In `VendorLayout.tsx`:
```tsx
const { t } = useTranslation()
// Replace navItems labels with t('nav.dashboard'), t('nav.listings'), t('nav.orders'), t('nav.scanQR')
```

Repeat for remaining hardcoded strings in other pages using the keys from translation.json.

- [ ] **Step 8: Test language toggle**

1. Run `npm run dev`
2. Click the EN/VI toggle button in the header
3. Verify navigation labels change language
4. Sign out and sign in again — verify the saved language preference is restored

- [ ] **Step 9: Commit**

```bash
git add src/i18n.ts src/locales/ src/components/shared/LanguageToggle.tsx src/contexts/AuthContext.tsx src/main.tsx src/pages/
git commit -m "feat: EN/VI i18n with react-i18next and language toggle"
```

---

## Task 18: Final Polish + Firebase Storage Rules

**Files:**
- Modify: `storage.rules` (create if not exists)

- [ ] **Step 1: Create `storage.rules`**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listings/{vendorId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == vendorId;
    }
  }
}
```

- [ ] **Step 2: Deploy storage rules**

```bash
firebase deploy --only storage
```

- [ ] **Step 3: Update `firebase.json` to include all deploy targets**

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

- [ ] **Step 4: Build and deploy everything**

```bash
npm run build
firebase deploy
```
Expected: All targets deploy successfully. Note the Hosting URL.

- [ ] **Step 5: Full end-to-end test on deployed URL**

1. Register vendor → create a listing with image
2. Register customer → browse → buy a box (Stripe test card `4242 4242 4242 4242`)
3. Verify order appears in customer's orders with QR code
4. Switch to vendor account → `/vendor/scan` → scan the QR code
5. Verify order updates to `"picked_up"` in real time on customer side
6. Toggle language EN↔VI, verify UI updates

- [ ] **Step 6: Final commit**

```bash
git add storage.rules firebase.json
git commit -m "feat: storage rules, firebase.json, full deploy"
```

---

## Progress Tracking

After each task, update `progress.md` to mark the completed phase. At the start of every new session, read `progress.md` and `CLAUDE.md` before touching any code.
