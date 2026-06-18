# ShipGen Theme and Typography Reference

This document captures the current visual system used across the ShipGen web app (`frontend/`) and driver mobile app (`driver-mobile/`), based on the code that exists today.

It is a documentation snapshot of the implementation, not an aspirational design spec. Where the code is inconsistent or partially tokenized, that is called out explicitly.

---

## 1. Scope and source files

### Web app sources

- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `frontend/index.html`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/TopBar.tsx`
- `frontend/src/components/ui/PageParts.tsx`
- page-level styling in `frontend/src/pages/*`

### Mobile app sources

- `driver-mobile/App.tsx`
- `driver-mobile/src/components/AppButton.tsx`
- `driver-mobile/src/components/Card.tsx`
- `driver-mobile/src/components/StatusBadge.tsx`
- `driver-mobile/src/components/TripPicker.tsx`
- `driver-mobile/src/screens/*`

---

## 2. High-level design summary

### Web

- The web application uses a **light neutral base theme**.
- It has a **small Tailwind token layer** for colors and fonts.
- The default look is built from:
  - off-white backgrounds
  - white content cards
  - dark text
  - light neutral borders
  - green / mint AI-success accents
  - red error surfaces
- Some areas, especially the sidebar and top bar, still use **hardcoded slate, cyan, and black values** instead of only design tokens.

### Mobile

- The driver app visually follows the web app's direction:
  - light gray page backgrounds
  - white cards
  - dark primary actions
  - muted slate labels
  - semantic blue / green / amber / red status colors
- However, the mobile app does **not** currently have a centralized theme file.
- Colors and typography choices are repeated directly in component `StyleSheet`s.

---

## 3. Web theme tokens

The main token source is `frontend/tailwind.config.js`.

### 3.1 Color palette

| Token | Hex | Role | Typical usage |
|------|------|------|--------|
| `background` | `#f7f9fb` | Global app background | page shell, body background |
| `surface` | `#f7f9fb` | Base surface | top-level app container |
| `surface-container-low` | `#f2f4f6` | Soft elevated neutral surface | section backgrounds, hover fills |
| `surface-container-lowest` | `#ffffff` | Highest-contrast surface | cards, tables, form panels |
| `surface-container-high` | `#e6e8ea` | Raised neutral state | elevated neutral surfaces |
| `surface-container-highest` | `#e0e3e5` | Highest neutral emphasis | active / emphasized neutral fills |
| `surface-container` | `#eceef0` | General neutral container | info panels, neutral chips |
| `primary` | `#000000` | Primary action and strong contrast | primary buttons, strong text accents |
| `on-primary` | `#ffffff` | Text on primary | primary button labels |
| `on-surface` | `#191c1e` | Primary content text | headings, body text |
| `on-surface-variant` | `#45464d` | Secondary content text | labels, helper text, table metadata |
| `on-primary-container` | `#188ace` | Blue accent | AI / info emphasis |
| `on-tertiary-container` | `#009668` | Green accent | AI-active / positive messaging |
| `tertiary-fixed` | `#6ffbbe` | Mint highlight surface | AI chips and highlight pills |
| `outline-variant` | `#c6c6cd` | Border / divider color | inputs, separators, table borders |
| `error` | `#ba1a1a` | Error / destructive accent | destructive states, badges |
| `error-container` | `#ffdad6` | Error background | banners, inline error containers |
| `on-error-container` | `#93000a` | Text on error surface | error message text |

### 3.2 Global CSS usage

`frontend/src/index.css` establishes the baseline:

- `body` background: `#f7f9fb`
- `body` font: `'Inter', sans-serif`
- `body` text color: `#191c1e`

It also defines:

- `.font-headline` -> `'Manrope', sans-serif`
- `.material-symbols-outlined` -> Material Symbols variable font settings
- `.kinetic-gradient` -> `linear-gradient(135deg, #000000 0%, #188ace 100%)`

### 3.3 Web styling behavior

Common patterns used across pages:

- `bg-surface-container-lowest` for cards and primary content blocks
- `bg-surface-container-low` for secondary sections and hover states
- `border-outline-variant/...` for borders and separators
- `text-on-surface` for primary text
- `text-on-surface-variant` for secondary text
- `bg-error-container` + `text-on-error-container` for error notices
- `bg-primary text-white` for strong primary actions

---

## 4. Web typography

### 4.1 Font families

The web app loads fonts in `frontend/index.html`:

- `Manrope`: weights `400`, `500`, `600`, `700`, `800`
- `Inter`: weights `400`, `500`, `600`

### 4.2 Font roles

| Role | Font | Typical usage |
|------|------|--------|
| Headline | `Manrope` | login hero, page titles, numeric emphasis, major section headers |
| Body | `Inter` | forms, labels, tables, general UI copy |
| Icons | Material Symbols | navigation, alerts, AI state, actions |

### 4.3 Type scale patterns in the web UI

The code does not define a single formal type scale object, but the following sizes are used repeatedly:

| Pattern | Typical size | Weight | Usage |
|------|------|--------|--------|
| Hero headline | `text-4xl` or custom ~`1.9rem` | `600-800` | login hero, AI-focused screen titles |
| Page title | `text-3xl` to `text-4xl` | `700-800` | top-level page headings |
| Section title | `text-lg` / `text-2xl` | `700-800` | section headers, key cards |
| Body text | `text-sm` | `400-600` | descriptions, form copy, table content |
| Label / metadata | `text-xs`, `text-[10px]`, `text-[11px]` | `600-700` | table headers, pills, helper copy |

### 4.4 Typography conventions

Repeated typography conventions include:

- **Uppercase metadata labels** for operational and AI context
- **Tight tracking** (`tracking-tight`, `tracking-wider`, custom tracking) for headings and status labels
- **Bold numeric emphasis** for KPIs, trip IDs, and confidence percentages
- **Headline font used selectively**, not globally

---

## 5. Web component-level visual conventions

### 5.1 App shell

`frontend/src/components/layout/AppLayout.tsx` uses:

- `bg-surface`
- `text-on-surface`
- a light app shell with content inset beside a persistent sidebar

### 5.2 Sidebar

`frontend/src/components/layout/Sidebar.tsx` intentionally departs from the light main theme:

- background: dark slate gradient (`from-slate-900 via-slate-900 to-slate-950`)
- text: slate whites / grays
- active item accent: cyan-based
- border and shadow are hardcoded

This gives the navigation a stronger contrast and product identity, but it is **not purely token-driven**.

### 5.3 Top bar

`frontend/src/components/layout/TopBar.tsx` uses:

- translucent off-white background
- `Manrope` directly in the class name
- black title text
- subtle border and small shadow

This is visually aligned with the theme, but again includes hardcoded color usage.

### 5.4 Cards and tables

Shared UI patterns in `frontend/src/components/ui/PageParts.tsx` and the page files:

- white card background
- rounded corners (`rounded-xl`, `rounded-2xl`)
- soft borders
- occasional soft shadows
- secondary labels in muted gray
- icons often placed on neutral circular surfaces

### 5.5 Error styling

Error messaging is consistently handled with:

- `bg-error-container`
- `text-on-error-container`
- red border or red-accent text where needed

---

## 6. Web token gaps and inconsistencies

The following token names are referenced in the UI but are **not declared** in `frontend/tailwind.config.js`:

| Referenced token / class | Where used | Problem |
|------|------|--------|
| `secondary` | multiple buttons | background token is referenced but not defined |
| `on-secondary` | multiple buttons | text token is referenced but not defined |
| `on-tertiary-fixed` | AI mint chips | text token is referenced but not defined |
| `on-primary-fixed-variant` | `PageParts.tsx` border class | token is referenced but not defined |

This means the current theme layer is **incomplete** and some styles rely on classes that are not backed by the configured token set.

---

## 7. Mobile theme colors

There is no single token file for mobile. The values below are repeated across the app and behave like a de facto theme.

### 7.1 Core mobile palette

| Semantic group | Hex values | Role | Typical usage |
|------|------|------|--------|
| App background | `#f4f5f7`, `#f4f6f8` | page background | main screen background |
| Surface | `#ffffff` | card / field surface | cards, inputs, ghost buttons |
| Border | `#e5e7eb`, `#e2e8f0`, `#d1d5db`, `#dbe1ea` | borders and dividers | cards, chips, tab bars, fields |
| Primary dark | `#020617` | primary interactive color | buttons, active tabs, avatar |
| Main text | `#0f172a`, `#111827` | primary content text | titles, values, emphasis |
| Secondary text | `#64748b`, `#6b7280`, `#334155`, `#94a3b8`, `#374151` | secondary / tertiary copy | metadata, labels, helper text |
| Info blue | `#dbeafe`, `#eff6ff`, `#1d4ed8`, `#1e3a8a`, `#1e40af`, `#0369a1`, `#e0f2fe` | informational / assigned state | AI tag, account role pill, map fallback, assigned status |
| Success green | `#dcfce7`, `#86efac`, `#065f46` | positive / live state | in-transit badge, AI navigation active |
| Warning amber | `#fffbeb`, `#f59e0b`, `#92400e`, `#78350f` | warning state | map configuration banner |
| Error red | `#fee2e2`, `#991b1b`, `#b91c1c`, `#7f1d1d`, `#ef4444` | error / danger | error banners, danger buttons, trip warning |
| Navigation blue | `#083b66`, `#93c5fd` | navigation-only emphasis | traffic / live route banner |

### 7.2 Mobile component conventions

#### Buttons

`driver-mobile/src/components/AppButton.tsx` defines four button variants:

| Variant | Background | Text |
|------|------|--------|
| `primary` | `#020617` | `#ffffff` |
| `secondary` | `#e2e8f0` | `#0f172a` |
| `ghost` | `#ffffff` + border | `#0f172a` |
| `danger` | `#fee2e2` | `#b91c1c` |

#### Cards

`driver-mobile/src/components/Card.tsx` uses:

- white background
- `16px` border radius
- light gray border
- subtle shadow / elevation

#### Status badges

`driver-mobile/src/components/StatusBadge.tsx` uses:

- assigned: blue surface (`#dbeafe`) with dark-blue label
- in-transit: green surface (`#86efac`) with dark-green label

#### Trip picker

`driver-mobile/src/components/TripPicker.tsx` uses:

- pale gray container background
- white default chips
- dark active chip fill
- small uppercase muted label

---

## 8. Mobile typography

### 8.1 Font family

No custom `fontFamily` usage was found in the mobile app. The app appears to use the **default React Native system font** on the platform.

That means:

- Android will render with the platform default Android system font
- there is no shared mobile typography token map yet
- typography hierarchy is created with `fontSize`, `fontWeight`, uppercase styling, and `letterSpacing`

### 8.2 Mobile type scale patterns

| Pattern | Typical size | Weight | Usage |
|------|------|--------|--------|
| Hero trip label / major heading | `36px` to `44px` | `700-800` | trip ID, status hero |
| Screen title | `24px` to `28px` | `700-800` | login title, account title |
| Section title / important value | `17px` to `22px` | `600-700` | trip details, navigation title, names |
| Body copy | `14px` to `16px` | `400-600` | descriptions, rows, helper text |
| Metadata label | `11px` to `13px` | `600-700` | badges, tab labels, compact labels |
| Micro label | `9px` to `12px` | `600-700` | AI tags, warning labels, compact headings |

### 8.3 Typography conventions in mobile

Repeated conventions include:

- large bold headings for trip identity and status
- uppercase labels for status and section metadata
- slight positive `letterSpacing` on labels for operational UI tone
- muted slate text for secondary information

---

## 9. Web vs mobile comparison

| Area | Web | Mobile |
|------|------|--------|
| Theme system | Partially centralized in Tailwind config | Not centralized; repeated inline |
| Primary fonts | `Manrope` + `Inter` | System font |
| Base visual style | Light neutral, card-heavy dashboard | Light neutral operational mobile UI |
| Semantic color usage | Token names plus some hardcoded values | Mostly raw hex values |
| AI / positive accents | Mint / green accents | Blue / green status accents |
| Error styling | Dedicated error tokens | Repeated red palette values |

---

## 10. Current state assessment

### What is strong already

- The web app has a recognizable visual direction and a mostly consistent base palette.
- The mobile app generally aligns with the web product identity.
- Typography hierarchy is clear in both surfaces.
- Error, success, and informational states are easy to distinguish.

### What is missing

- The web token layer is incomplete because some referenced tokens are not defined.
- The mobile app does not have a shared theme or typography module.
- Some important shell elements use hardcoded colors instead of shared tokens.
- Typography is consistent in practice, but not yet formalized as a reusable design scale.

---

## 11. Recommended next step

If this documentation is meant to become a long-term design reference, the next implementation step should be:

1. complete the missing web tokens in `frontend/tailwind.config.js`
2. move hardcoded shell colors into named web tokens where appropriate
3. create a shared mobile theme module for colors, spacing, and typography
4. define a reusable type scale for both web and mobile

That would turn the current styling approach from "consistent by repetition" into an actual shared design system.
