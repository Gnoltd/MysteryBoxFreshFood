# MysteryBoxFreshFood — Redesign Part 1: Design System & Shared Components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Tailwind/shadcn token layer with the new dark design system tokens and build the shared component library all pages will consume.

**Architecture:** Update `tailwind.config.ts` and `index.css` with new color/typography tokens, then build atomic components (buttons, chips, badges) followed by composite components (MysteryCard, GlassNav, NotificationPanel).

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, Vitest + @testing-library/react, lucide-react, react-i18next

## Global Constraints

- App name is **MysteryBoxFreshFood** — never "SAVOR"
- All user-visible strings use `t('key')` — no hardcoded text
- Components never import Firebase SDK directly
- Theme: unified dark — `background: #0c1324` everywhere
- Primary font: Inter (Google Fonts)
- Border radius for cards/buttons/inputs: `rounded-xl` (0.75rem)
- Currency format: `35.000 đ` (Vietnamese locale)

---

## File Map

| Action | Path |
|---|---|
| Modify | `tailwind.config.ts` |
| Modify | `src/index.css` |
| Modify | `index.html` |
| Modify | `src/types.ts` |
| Modify | `firestore.rules` |
| Modify | `firestore.indexes.json` |
| Create | `src/components/shared/GradientButton.tsx` |
| Create | `src/components/shared/GhostButton.tsx` |
| Create | `src/components/shared/StatusChip.tsx` |
| Create | `src/components/shared/StockBadge.tsx` |
| Create | `src/components/shared/TimerBadge.tsx` |
| Create | `src/components/shared/StockProgressBar.tsx` |
| Create | `src/components/shared/MysteryCard.tsx` |
| Create | `src/components/shared/GlassNav.tsx` |
| Create | `src/components/shared/NotificationPanel.tsx` |
| Create | `src/components/shared/GradientButton.test.tsx` |
| Create | `src/components/shared/StatusChip.test.tsx` |
| Create | `src/components/shared/StockBadge.test.tsx` |
| Create | `src/components/shared/MysteryCard.test.tsx` |

---

### Task 1: Tailwind Config + CSS Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Update `tailwind.config.ts`**

Replace the entire file content:

```ts
import type { Config } from 'tailwindcss'
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn/ui tokens (kept for component compat)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // New design-system semantic tokens
        'surface': '#0c1324',
        'surface-dim': '#0c1324',
        'surface-bright': '#33394c',
        'surface-container-lowest': '#070d1f',
        'surface-container-low': '#151b2d',
        'surface-container': '#191f31',
        'surface-container-high': '#23293c',
        'surface-container-highest': '#2e3447',
        'on-surface': '#dce1fb',
        'on-surface-variant': '#c7c4d7',
        'inverse-surface': '#dce1fb',
        'inverse-on-surface': '#2a3043',
        'outline': '#908fa0',
        'outline-variant': '#464554',
        'surface-tint': '#c0c1ff',
        'on-primary-token': '#1000a9',
        'primary-container-token': '#8083ff',
        'on-primary-container': '#0d0096',
        'inverse-primary': '#494bd6',
        'secondary-token': '#ddb7ff',
        'on-secondary': '#490080',
        'secondary-container': '#6f00be',
        'on-secondary-container': '#d6a9ff',
        'tertiary': '#ffb95f',
        'on-tertiary': '#472a00',
        'tertiary-container': '#ca8100',
        'on-tertiary-container': '#3e2400',
        'error-token': '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
        'surface-variant': '#2e3447',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        'headline-lg':        ['32px', { lineHeight: '40px',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px',  letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md':        ['20px', { lineHeight: '28px',  fontWeight: '600' }],
        'body-lg':            ['16px', { lineHeight: '24px',  fontWeight: '400' }],
        'body-sm':            ['14px', { lineHeight: '20px',  fontWeight: '400' }],
        'label-caps':         ['12px', { lineHeight: '16px',  letterSpacing: '0.05em', fontWeight: '700' }],
        'mono-stat':          ['18px', { lineHeight: '24px',  letterSpacing: '-0.01em', fontWeight: '600' }],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

- [ ] **Step 2: Update `src/index.css`**

Replace the entire file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 225 64% 9%;
    --foreground: 232 84% 92%;
    --card: 225 64% 9%;
    --card-foreground: 232 84% 92%;
    --popover: 225 50% 12%;
    --popover-foreground: 232 84% 92%;
    --primary: 240 100% 87%;
    --primary-foreground: 240 100% 34%;
    --secondary: 270 100% 85%;
    --secondary-foreground: 270 100% 25%;
    --muted: 225 40% 18%;
    --muted-foreground: 225 20% 65%;
    --accent: 225 40% 18%;
    --accent-foreground: 232 84% 92%;
    --destructive: 0 60% 85%;
    --destructive-foreground: 0 90% 21%;
    --border: 232 14% 28%;
    --input: 225 40% 18%;
    --ring: 240 100% 87%;
    --radius: 0.75rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; }
}

@layer utilities {
  .gradient-bg {
    background-image: linear-gradient(to right, #494bd6, #6f00be);
  }
  .gradient-text {
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(to right, #c0c1ff, #ddb7ff);
  }
  .mystery-border {
    border-top: 4px solid transparent;
    border-image: linear-gradient(to right, #494bd6, #6f00be) 1;
  }
  .glass-panel {
    background-color: rgba(12, 19, 36, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .gradient-border-box {
    box-shadow: 0 0 0 1px #8083ff;
  }
}
```

- [ ] **Step 3: Add Inter font to `index.html`**

Inside `<head>`, after the `<title>` tag, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

Also update `tailwind.config.ts` under `theme.extend` to add:
```ts
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
},
```

- [ ] **Step 4: Verify build compiles**

```bash
npm run build
```

Expected: no TypeScript or CSS errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts src/index.css index.html
git commit -m "feat: apply new dark design system tokens and CSS utilities"
```

---

### Task 2: Types + Firestore Rules

**Files:**
- Modify: `src/types.ts`
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Add new types to `src/types.ts`**

Append to the end of the file:

```ts
export type SubscriptionPlan = 'free' | 'weekly' | 'monthly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due'

export interface Follow {
  id: string
  customerId: string
  vendorId: string
  notificationsEnabled: boolean
  createdAt: Timestamp
}

export interface Subscription {
  id: string
  customerId: string
  plan: SubscriptionPlan
  stripeSubscriptionId?: string
  status: SubscriptionStatus
  currentPeriodEnd?: Timestamp
  createdAt: Timestamp
}

export interface PushToken {
  fcmToken: string
  updatedAt: Timestamp
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  listingId: string
  vendorId: string
  read: boolean
  createdAt: Timestamp
}
```

- [ ] **Step 2: Update `firestore.rules`**

Replace entire file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null
        && (request.auth.uid == uid || resource.data.role == 'vendor');
      allow write: if request.auth != null && request.auth.uid == uid;
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
        && request.resource.data.status == 'picked_up'
        && (resource.data.status == 'paid'
            || resource.data.status == 'pending_cod'
            || resource.data.status == 'pending_bank_transfer');
      allow create, delete: if false;
    }
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.customerId == request.auth.uid
        && request.resource.data.rating is int
        && request.resource.data.rating >= 1
        && request.resource.data.rating <= 5;
      allow update, delete: if false;
    }
    match /inventory/{vendorId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == vendorId;
    }
    match /follows/{followId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.customerId == request.auth.uid;
      allow update: if request.auth != null
        && resource.data.customerId == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.customerId == request.auth.uid;
    }
    match /subscriptions/{subId} {
      allow read: if request.auth != null
        && resource.data.customerId == request.auth.uid;
      allow create, update, delete: if false;
    }
    match /pushTokens/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /notifications/{uid}/items/{itemId} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null
        && request.auth.uid == uid
        && request.resource.data.read == true;
      allow create, delete: if false;
    }
  }
}
```

- [ ] **Step 3: Update `firestore.indexes.json`**

Open the file and add inside the `"indexes"` array:

```json
{
  "collectionGroup": "follows",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "customerId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "follows",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "vendorId", "order": "ASCENDING" },
    { "fieldPath": "notificationsEnabled", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "subscriptions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "customerId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "items",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "read", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types.ts firestore.rules firestore.indexes.json
git commit -m "feat: add Follow/Subscription/PushToken types and Firestore rules"
```

---

### Task 3: Atomic Shared Components

**Files:**
- Create: `src/components/shared/GradientButton.tsx`
- Create: `src/components/shared/GhostButton.tsx`
- Create: `src/components/shared/StatusChip.tsx`
- Create: `src/components/shared/StockBadge.tsx`
- Create: `src/components/shared/TimerBadge.tsx`
- Create: `src/components/shared/StockProgressBar.tsx`
- Create: `src/components/shared/GradientButton.test.tsx`
- Create: `src/components/shared/StatusChip.test.tsx`
- Create: `src/components/shared/StockBadge.test.tsx`

**Interfaces — Produces:**
- `GradientButton`: `{ children, onClick?, type?, disabled?, className? }`
- `GhostButton`: `{ children, onClick?, type?, className? }`
- `StatusChip`: `{ variant: 'amber'|'emerald'|'rose'|'slate'|'primary', children }`
- `StockBadge`: `{ quantity: number }`
- `TimerBadge`: `{ pickupEnd: Timestamp }`
- `StockProgressBar`: `{ current: number; total: number }`

- [ ] **Step 1: Write failing tests**

Create `src/components/shared/GradientButton.test.tsx`:
```tsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GradientButton } from './GradientButton'

describe('GradientButton', () => {
  test('renders children', () => {
    render(<GradientButton>Claim Box</GradientButton>)
    expect(screen.getByText('Claim Box')).toBeInTheDocument()
  })

  test('calls onClick when clicked', () => {
    const fn = vi.fn()
    render(<GradientButton onClick={fn}>Go</GradientButton>)
    fireEvent.click(screen.getByText('Go'))
    expect(fn).toHaveBeenCalledOnce()
  })

  test('is disabled when disabled prop is true', () => {
    render(<GradientButton disabled>Go</GradientButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

Create `src/components/shared/StatusChip.test.tsx`:
```tsx
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusChip } from './StatusChip'

describe('StatusChip', () => {
  test('renders children text', () => {
    render(<StatusChip variant="emerald">Paid</StatusChip>)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  test('renders amber variant', () => {
    const { container } = render(<StatusChip variant="amber">Urgent</StatusChip>)
    expect(container.firstChild).toHaveClass('text-tertiary')
  })

  test('renders rose variant', () => {
    const { container } = render(<StatusChip variant="rose">Error</StatusChip>)
    expect(container.firstChild).toHaveClass('text-error-token')
  })
})
```

Create `src/components/shared/StockBadge.test.tsx`:
```tsx
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StockBadge } from './StockBadge'

describe('StockBadge', () => {
  test('renders quantity', () => {
    render(<StockBadge quantity={5} />)
    expect(screen.getByText('5 left')).toBeInTheDocument()
  })

  test('applies rose color at quantity 2 or below', () => {
    const { container } = render(<StockBadge quantity={2} />)
    expect(container.firstChild).toHaveClass('text-error-token')
  })

  test('applies normal color above 2', () => {
    const { container } = render(<StockBadge quantity={3} />)
    expect(container.firstChild).not.toHaveClass('text-error-token')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run src/components/shared/GradientButton.test.tsx src/components/shared/StatusChip.test.tsx src/components/shared/StockBadge.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/components/shared/GradientButton.tsx`**

```tsx
interface GradientButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

export function GradientButton({ children, onClick, type = 'button', disabled, className = '' }: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`gradient-bg text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Create `src/components/shared/GhostButton.tsx`**

```tsx
interface GhostButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function GhostButton({ children, onClick, type = 'button', className = '' }: GhostButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border border-outline-variant text-on-surface font-semibold py-3 px-6 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 5: Create `src/components/shared/StatusChip.tsx`**

```tsx
type ChipVariant = 'amber' | 'emerald' | 'rose' | 'slate' | 'primary'

const variantClasses: Record<ChipVariant, string> = {
  amber:   'bg-tertiary/10 text-tertiary border-tertiary/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rose:    'bg-error-container/20 text-error-token border-error-token/30',
  slate:   'bg-surface-container text-on-surface-variant border-outline-variant',
  primary: 'bg-primary/10 text-primary border-primary/30',
}

interface StatusChipProps {
  variant: ChipVariant
  children: React.ReactNode
}

export function StatusChip({ variant, children }: StatusChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-label-caps font-bold uppercase tracking-wider ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 6: Create `src/components/shared/StockBadge.tsx`**

```tsx
interface StockBadgeProps {
  quantity: number
}

export function StockBadge({ quantity }: StockBadgeProps) {
  const low = quantity <= 2
  return (
    <span className={`text-label-caps font-bold uppercase tracking-wider ${low ? 'text-error-token' : 'text-on-surface-variant'}`}>
      {quantity} left
    </span>
  )
}
```

- [ ] **Step 7: Create `src/components/shared/TimerBadge.tsx`**

```tsx
import { useCountdown } from '../../hooks/useCountdown'
import type { Timestamp } from 'firebase/firestore'

interface TimerBadgeProps {
  pickupEnd: Timestamp
}

export function TimerBadge({ pickupEnd }: TimerBadgeProps) {
  const { hoursLeft, minutesLeft, urgent, expired } = useCountdown(pickupEnd)
  if (expired) return null
  return (
    <span className={`inline-flex items-center gap-1 text-label-caps font-bold uppercase tracking-wider ${urgent ? 'text-error-token' : 'text-tertiary'}`}>
      ⏱{' '}
      {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
    </span>
  )
}
```

- [ ] **Step 8: Create `src/components/shared/StockProgressBar.tsx`**

```tsx
interface StockProgressBarProps {
  current: number
  total: number
}

export function StockProgressBar({ current, total }: StockProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const low = current <= 2
  return (
    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${low ? 'bg-tertiary' : 'gradient-bg'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 9: Run tests — expect PASS**

```bash
npx vitest run src/components/shared/GradientButton.test.tsx src/components/shared/StatusChip.test.tsx src/components/shared/StockBadge.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/shared/GradientButton.tsx src/components/shared/GhostButton.tsx src/components/shared/StatusChip.tsx src/components/shared/StockBadge.tsx src/components/shared/TimerBadge.tsx src/components/shared/StockProgressBar.tsx src/components/shared/GradientButton.test.tsx src/components/shared/StatusChip.test.tsx src/components/shared/StockBadge.test.tsx
git commit -m "feat: add atomic shared components (buttons, chips, badges)"
```

---

### Task 4: Composite Shared Components

**Files:**
- Create: `src/components/shared/MysteryCard.tsx`
- Create: `src/components/shared/GlassNav.tsx`
- Create: `src/components/shared/NotificationPanel.tsx`
- Create: `src/components/shared/MysteryCard.test.tsx`

**Interfaces — Consumes:**
- `StatusChip` from Task 3
- `TimerBadge` from Task 3
- `StockBadge` from Task 3

**Interfaces — Produces:**
- `MysteryCard`: `{ listing: Listing; onClick: () => void }`
- `GlassNav`: `{ storeName?: string; backHref?: string; backLabel?: string; actions?: ReactNode }`
- `NotificationPanel`: `{ open: boolean; onClose: () => void }`

- [ ] **Step 1: Write failing test**

Create `src/components/shared/MysteryCard.test.tsx`:
```tsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MysteryCard } from './MysteryCard'
import type { Listing } from '../../types'
import { Timestamp } from 'firebase/firestore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

const mockListing: Listing = {
  id: 'l1',
  vendorId: 'v1',
  type: 'mystery_box',
  title: 'Artisan Pastry Box',
  description: 'Fresh pastries',
  price: 35000,
  originalPrice: 58000,
  quantityTotal: 10,
  quantityRemaining: 3,
  pickupStart: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
  pickupEnd: { seconds: (Date.now() + 7200000) / 1000, nanoseconds: 0 } as Timestamp,
  category: 'bakery',
  imageUrl: '',
  status: 'active',
  createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
}

describe('MysteryCard', () => {
  test('renders listing title', () => {
    render(<MemoryRouter><MysteryCard listing={mockListing} onClick={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText('Artisan Pastry Box')).toBeInTheDocument()
  })

  test('renders discount badge', () => {
    render(<MemoryRouter><MysteryCard listing={mockListing} onClick={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText(/-39%|-40%/)).toBeInTheDocument()
  })

  test('calls onClick when card is clicked', () => {
    const fn = vi.fn()
    render(<MemoryRouter><MysteryCard listing={mockListing} onClick={fn} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('article'))
    expect(fn).toHaveBeenCalledOnce()
  })

  test('shows sold out overlay when status is sold_out', () => {
    render(<MemoryRouter><MysteryCard listing={{ ...mockListing, status: 'sold_out' }} onClick={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText('listing.soldOut')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run src/components/shared/MysteryCard.test.tsx
```

Expected: FAIL — MysteryCard not found.

- [ ] **Step 3: Create `src/components/shared/MysteryCard.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { StatusChip } from './StatusChip'
import { TimerBadge } from './TimerBadge'
import { StockBadge } from './StockBadge'
import type { Listing } from '../../types'

interface MysteryCardProps {
  listing: Listing
  onClick: () => void
}

export function MysteryCard({ listing, onClick }: MysteryCardProps) {
  const { t } = useTranslation()
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)

  return (
    <article
      role="article"
      onClick={onClick}
      className="mystery-border bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-40 bg-surface-container-high overflow-hidden">
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}
        {/* Discount badge */}
        <span className="absolute top-2 left-2 bg-tertiary-container/20 backdrop-blur-sm border border-tertiary/50 text-tertiary text-label-caps font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </span>
        {/* Sold out overlay */}
        {listing.status === 'sold_out' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase tracking-wider">{t('listing.soldOut')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="font-semibold text-on-surface text-body-sm truncate">{listing.title}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary font-bold text-body-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-outline text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <StatusChip variant="slate">{listing.category}</StatusChip>
        </div>

        <div className="flex items-center justify-between">
          <TimerBadge pickupEnd={listing.pickupEnd} />
          <StockBadge quantity={listing.quantityRemaining} />
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Create `src/components/shared/GlassNav.tsx`**

```tsx
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface GlassNavProps {
  /** If provided, shows back button with this label */
  backHref?: string
  backLabel?: string
  /** Shown as brand name (center or left when no back button) */
  storeName?: string
  /** Icons/buttons rendered on the right */
  actions?: ReactNode
}

export function GlassNav({ backHref, backLabel, storeName, actions }: GlassNavProps) {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 w-full z-50 glass-panel border-b border-outline-variant h-16 flex items-center px-6">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        {backHref ? (
          <button
            onClick={() => navigate(backHref)}
            className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-body-lg">{backLabel ?? 'Back'}</span>
          </button>
        ) : (
          <Link to="/browse" className="gradient-text font-bold text-headline-md">
            MysteryBox<span className="font-extrabold">FreshFood</span>
          </Link>
        )}

        {storeName && !backHref && (
          <span className="text-on-surface-variant text-body-sm hidden md:block">{storeName}</span>
        )}

        {actions && (
          <div className="flex items-center gap-3 text-on-surface-variant">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Create `src/components/shared/NotificationPanel.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { X, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications, markAllRead } from '../../services/notifications'
import type { NotificationItem } from '../../types'
import { useNavigate } from 'react-router-dom'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { userProfile } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!open || !userProfile) return
    getNotifications(userProfile.uid).then(setItems)
  }, [open, userProfile])

  const handleMarkAll = async () => {
    if (!userProfile) return
    await markAllRead(userProfile.uid)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleItem = (item: NotificationItem) => {
    navigate(`/listing/${item.listingId}`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative w-full max-w-sm bg-surface-container border-l border-outline-variant h-full overflow-y-auto flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface font-semibold">
            <Bell size={18} />
            Notifications
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant text-body-sm">
            No notifications yet
          </div>
        ) : (
          <>
            <button onClick={handleMarkAll} className="text-primary text-body-sm px-4 py-2 text-left hover:underline">
              Mark all as read
            </button>
            <ul className="flex-1">
              {items.map(item => (
                <li
                  key={item.id}
                  onClick={() => handleItem(item)}
                  className={`px-4 py-3 border-b border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors ${!item.read ? 'bg-primary/5' : ''}`}
                >
                  <p className={`text-body-sm ${!item.read ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{item.title}</p>
                  <p className="text-xs text-outline mt-0.5">{item.body}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  )
}
```

- [ ] **Step 6: Run MysteryCard test — expect PASS**

```bash
npx vitest run src/components/shared/MysteryCard.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/MysteryCard.tsx src/components/shared/MysteryCard.test.tsx src/components/shared/GlassNav.tsx src/components/shared/NotificationPanel.tsx
git commit -m "feat: add MysteryCard, GlassNav, NotificationPanel composite components"
```
