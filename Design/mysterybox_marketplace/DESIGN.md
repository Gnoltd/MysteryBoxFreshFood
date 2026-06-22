---
name: MysteryBox Marketplace
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-stat:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 16px
---

## Brand & Style
The brand personality is energetic, efficient, and modern, designed to transform food waste into a premium, gamified experience. The design system leverages a **High-Contrast / Modern** aesthetic with subtle nods to **Glassmorphism** for its overlay elements. 

The UI must evoke a sense of urgency and value, targeting eco-conscious consumers and tech-forward F&B operators. By utilizing deep dark surfaces paired with vibrant, neon-adjacent gradients, the design system creates a "night market" atmosphere that feels both exclusive and high-tech. Visual depth is achieved through structural borders rather than heavy shadows, emphasizing a clean, systematic layout tailored for AI-driven inventory logistics.

## Colors
The palette is rooted in a deep "Slate" spectrum to ensure maximum contrast for high-fidelity content.

- **Backgrounds:** The foundation uses `Slate-950` (#020617) for the primary canvas and `Slate-900` (#0f172a) for elevated cards and containers.
- **Brand Gradient:** A linear gradient from **Indigo-500** (#6366f1) to **Purple-500** (#a855f7) is reserved for primary actions, progress indicators, and "Mystery Box" highlights.
- **Accents & Status:** 
    - **Amber (#f59e0b):** Used exclusively for time-sensitive elements like expiring boxes or "last chance" notifications.
    - **Emerald (#10b981):** Signals successful transactions, savings achieved, and active marketplace status.
    - **Rose (#f43f5e):** Reserved for critical errors, stock-outs, or payment failures.
- **Typography:** Primary text is **White** (#ffffff) for maximum legibility, with secondary supporting text in **Slate-400** (#94a3b8).

## Typography
The design system utilizes **Inter** across all levels to maintain a clean, systematic, and utilitarian feel. 

Headlines use heavy weights and slight negative letter-spacing to create a bold, authoritative presence. Body copy is optimized for readability on dark backgrounds; ensure that `Slate-400` text never falls below `body-sm` size to maintain accessibility. For inventory numbers and "time remaining" counters, use the `mono-stat` style to ensure numerical alignment and high visibility.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure for desktop and a single-column stack for mobile.

- **Margins:** 24px on mobile, scaling to 48px or auto-centered on desktop.
- **Gutters:** 16px consistent across all breakpoints to maintain tight, dense information density.
- **Rhythm:** All spacing must be a multiple of 4px. Use `lg` (24px) for padding within cards and `sm` (12px) for spacing between internal card elements (e.g., title to description).
- **Safe Areas:** On mobile, ensure all primary "Claim Box" actions remain within the bottom thumb-zone, utilizing fixed-position floating containers.

## Elevation & Depth
This design system avoids traditional soft shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Depth is communicated through color shifts. The background is `Slate-950`. Cards and interactive containers are `Slate-900`. 
- **Borders:** Every card and input field must have a 1px solid border of `Slate-800` (#1e293b). This creates a crisp, architectural feel.
- **Active State:** When an element is focused or active, the border should transition to the Indigo-Purple gradient or the specific status color (Amber/Emerald).
- **Overlays:** Modals and bottom sheets use a `Slate-950` background with a 60% opacity backdrop blur to create a "glass" effect that maintains context of the marketplace behind it.

## Shapes
The shape language is defined by a consistent **Rounded (12px)** logic.

- **Cards & Modals:** Use `rounded-xl` (12px) to soften the high-contrast aesthetic.
- **Buttons:** Large primary buttons should use `rounded-xl` to match cards. Smaller utility buttons or chips may use `rounded-lg` (8px).
- **Inputs:** Form fields must match the `rounded-xl` corner radius of the buttons to ensure a cohesive form-factor.
- **Visual Continuity:** Do not use full pills (rounded-full) for buttons; maintain the 12px radius to preserve the modern, structured grid feel.

## Components
- **Buttons:** Primary buttons feature the Indigo-to-Purple gradient with white text. Secondary buttons are "Ghost" style with a `Slate-800` border and white text.
- **Mystery Box Cards:** The flagship component. Uses a `Slate-900` background, a `Slate-800` border, and a 4px top-border featuring the brand gradient.
- **Status Chips:** Small, high-contrast badges (e.g., "Left: 3"). Use a subtle background tint of the status color (e.g., 10% Amber) with a 100% opacity text label.
- **Inputs:** `Slate-950` fill with `Slate-800` borders. On focus, the border glows with a subtle Indigo highlight.
- **Progress Bars:** Used for AI inventory tracking. The track is `Slate-800`, and the fill is the brand gradient.
- **Inventory Lists:** Compact rows with `Slate-800` bottom-dividers. Use `mono-stat` for quantity counts.
- **Timer Component:** A specialized chip for "Amber" status alerts, featuring a countdown icon and `label-caps` typography.