---
name: Intelligent Vendor Core
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#464555'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for high-stakes inventory management where precision meets intelligence. The brand personality is **analytical, proactive, and efficient**, catering to logistics professionals who require clarity under pressure. 

The aesthetic follows a **Corporate / Modern** style with a focus on high-density information display. It utilizes a refined layer-based architecture where critical data is surfaced through subtle depth and purposeful color accents. The emotional response is one of total control; the UI feels like a high-performance tool that anticipates needs through AI integration without sacrificing the reliability of traditional enterprise software.

## Colors
This design system employs a strategic four-color logic to drive user behavior:

*   **Indigo (#4F46E5):** Used for primary navigation, selection states, and standard executive actions. It represents the "Source of Truth."
*   **Purple (#7C3AED):** Reserved exclusively for "Compose" features and AI-driven insights. It signals non-deterministic, intelligent processes.
*   **Amber (#F59E0B):** A critical utility color for expiration warnings, low-stock alerts, and highlighting "leftover" inventory discrepancies.
*   **Neutrals:** A slate-leaning scale used for borders, secondary text, and background surfaces to ensure the primary accents remain impactful.

Selection states use a 2px Indigo border with a 5% Indigo tint fill. AI elements should utilize a subtle Purple-to-Indigo gradient for backgrounds or soft outer glows to differentiate from manual inputs.

## Typography
The system relies on **Inter** to provide a neutral, highly legible foundation. 

**Hierarchy Rules:**
*   **Item Names:** Always use `headline-sm` or `body-lg` with a **Bold (700)** weight to anchor the user's eye during rapid scanning.
*   **Data Labels:** Use `label-bold` for table headers and attribute keys, utilizing uppercase styling to create visual distinction from the data values.
*   **AI Text:** AI-generated suggestions or "Compose" results should use `body-md` with a slightly increased line-height (1.6) to improve readability for long-form descriptions.

## Layout & Spacing
The layout follows a **12-column fixed grid** on desktop to ensure data density remains consistent and predictable. 

*   **Desktop:** 12 columns, 24px margins, 16px gutters. Max-width of 1440px.
*   **Tablet:** 8 columns, 16px margins, 16px gutters. 
*   **Mobile:** 4 columns, 16px margins, 12px gutters.

The "Zone 3" workspace (editable results) should occupy a side-panel or a central 8-column span depending on the workflow depth. Use a tight 4px baseline grid for internal component spacing (e.g., icon to text) to maintain a professional, compact feel.

## Elevation & Depth
Depth is used sparingly to define interactive surfaces versus static data.

1.  **Level 0 (Surface):** Default background (#F9FAFB).
2.  **Level 1 (Cards/Tables):** White background (#FFFFFF) with a 1px solid border (#E5E7EB). No shadow.
3.  **Level 2 (Interactive/Floating):** Subtle ambient shadow (Y: 2px, Blur: 4px, Color: rgba(0,0,0,0.05)) and a 1px border. Used for hovered cards and dropdowns.
4.  **AI Elements:** Elevated with a specialized Purple-tinted shadow (0px 4px 12px rgba(124, 58, 237, 0.1)) to signify that the content is "generated" and floating above the standard data plane.

## Shapes
The design system uses a **Soft (0.25rem)** roundedness approach to maintain a professional, architectural feel. 

*   **Standard Inputs/Buttons:** 4px (0.25rem) corner radius.
*   **Cards/Containers:** 8px (0.5rem) corner radius.
*   **Chips/Status Tags:** 12px (0.75rem) to provide enough curve to distinguish them from actionable buttons, but stopping short of a full pill-shape to remain grounded.

## Components

### Buttons & Steppers
*   **Primary Action:** Indigo background, white text.
*   **AI Compose:** Purple background with a subtle shimmer effect or icon.
*   **Quantity Stepper:** A horizontal component with a central numeric value flanked by `-` and `+` buttons. The buttons use a light-gray stroke that turns Indigo on focus.

### Cards
*   **Standard Inventory Card:** White surface, 1px border. High-contrast Amber border triggers when "Stock < Threshold."
*   **Selection State:** Card border thickens to 2px Indigo with a visible checkmark icon in the top-right corner.

### Data Tables
*   **Header:** Grey-50 background, uppercase bold labels.
*   **Rows:** Alternating subtle zebra striping is permitted for high-density tables. Inline editing triggers a 1px Indigo border around the cell.

### Inputs
*   **Standard:** Clear 1px border (#D1D5DB). Focus state uses a 2px Indigo ring.
*   **AI Input:** Features a subtle Purple-tinted border and a "sparkle" icon prefix within the field.

### Warning Indicators
*   **Expiration/Leftover:** Amber-100 background with Amber-700 text and a bold Amber border. These should be visually distinct to ensure they are never missed during a vendor audit.