# ShipGen Sidebar UI Styles — End-to-End Documentation

This document explains the **ShipGen web application's sidebar UI** from end to end: where its data comes from, how it is laid out, which styles it uses, how it behaves across screen sizes, and what implementation details or inconsistencies exist today.

The sidebar lives in the web frontend under `frontend/src/components/layout/Sidebar.tsx`, but its full behavior depends on `AppMain.tsx`, `AppLayout.tsx`, `TopBar.tsx`, and the shared Tailwind theme configuration.

---

## 1. Source files

The sidebar is controlled by these files:

| File | Responsibility |
|------|----------------|
| `frontend/src/components/layout/Sidebar.tsx` | Sidebar structure, navigation buttons, visual styles |
| `frontend/src/components/layout/AppLayout.tsx` | Open / close state, collapsed state, overlay, ESC handling, desktop content offset |
| `frontend/src/components/layout/TopBar.tsx` | Toggle button that opens mobile menu or collapses desktop sidebar |
| `frontend/src/AppMain.tsx` | Defines navigation items and role-based filtering |
| `frontend/src/types.ts` | Defines `NavItem` and `Screen` types |
| `frontend/tailwind.config.js` | Shared theme tokens used by focus rings and some shell colors |
| `frontend/src/index.css` | Global body font and icon font setup |

---

## 2. Purpose of the sidebar

The sidebar is the primary navigation surface for the ShipGen web app. Its job is to:

- expose the app's main operational screens
- show the current navigation state
- provide compact account context
- surface unresolved alert count
- give the user a logout path
- support both desktop and mobile navigation patterns

It is not just a static menu. It is a persistent shell component that changes behavior based on:

- screen size
- collapsed vs expanded desktop mode
- mobile open vs closed state
- current route / current screen
- logged-in role
- unresolved alert count

---

## 3. End-to-end data flow

### 3.1 Navigation definitions

`AppMain.tsx` defines the sidebar items as a `NavItem[]`:

- `Dashboard`
- `Orders`
- `Shipments`
- `Routes`
- `Alerts`
- `Profit`
- `Driver Ops`

Each item contains:

- `label`
- `screen`
- `icon`

The `icon` values map to **Material Symbols** names such as:

- `grid_view`
- `receipt_long`
- `local_shipping`
- `route`
- `warning`
- `payments`
- `badge`

### 3.2 Role-based filtering

The sidebar content is role-aware before it ever reaches the `Sidebar` component.

In `AppMain.tsx`:

- if the logged-in session role is `driver`
- only `driver-ops` and `tracking` are passed through
- otherwise the full navigation array is used

So the sidebar itself does **not** contain authorization logic; it renders whatever `navItems` it receives.

### 3.3 Layout state management

`AppLayout.tsx` owns two separate pieces of sidebar state:

| State | Meaning |
|------|---------|
| `isSidebarCollapsed` | desktop-only narrow / wide sidebar mode |
| `isSidebarOpen` | mobile off-canvas visibility |

These states intentionally serve different purposes:

- **desktop** uses width changes and content offset changes
- **mobile** uses translate-in / translate-out behavior

### 3.4 Persistence

The desktop collapsed state is persisted in `localStorage` using:

- `shipgen-sidebar-collapsed`

Behavior:

- `stored === '1'` => collapsed
- anything else => expanded

This means the user's desktop sidebar width preference survives reloads.

### 3.5 Top bar integration

The top bar menu button calls `onToggleSidebar()`.

The logic is:

- on `min-width: 1024px`, toggle `isSidebarCollapsed`
- on smaller screens, toggle `isSidebarOpen`

This is the key bridge between the top navigation shell and the sidebar component.

---

## 4. Sidebar structure

The sidebar is rendered as a fixed `<aside>` with four visual sections:

1. brand header
2. divider + section label
3. navigation list
4. footer utility area

### 4.1 Brand header

The top section contains:

- the ShipGen logo (`/logo.png`)
- the label `Logistics Intelligence` when expanded

Behavior:

- expanded desktop / mobile: logo + subtitle
- collapsed desktop: logo only, centered

### 4.2 Divider and section label

Below the header is a subtle gradient divider:

- transparent edges
- muted slate center

Then, when expanded, a compact uppercase `Navigation` label is shown.

### 4.3 Navigation list

The navigation body:

- takes the available vertical space with `flex-1`
- stacks items with `space-y-2`
- highlights the active item
- shows icon + label in expanded mode
- shows icon only in collapsed mode

### 4.4 Footer utility area

The bottom area contains:

- a role / alerts summary card in expanded mode
- a compact `Alerts: {count}` line in collapsed mode
- logout button
- mobile-only `Close menu` button

---

## 5. Base layout and positioning

### 5.1 Sidebar container

The sidebar `<aside>` is styled as:

- `fixed`
- `left-0 top-0`
- `h-screen`
- `z-50`
- `flex flex-col`
- internal padding `p-3`
- vertical gap `gap-2`

This makes it a persistent full-height vertical navigation rail.

### 5.2 Widths

The sidebar has two width modes on desktop:

| Mode | Width class | Approx width |
|------|-------------|--------------|
| Expanded | `lg:w-64` | `16rem` |
| Collapsed | `lg:w-20` | `5rem` |

On smaller screens it always uses:

- `w-64`

### 5.3 Main content offset

The sidebar width is mirrored in `AppLayout.tsx` by shifting the `<main>` element:

| Sidebar mode | Main offset class |
|------|----------------|
| Expanded | `lg:ml-64` |
| Collapsed | `lg:ml-20` |

This keeps the content aligned with the visible sidebar width.

### 5.4 Mobile overlay

When `isSidebarOpen` is true on mobile, `AppLayout.tsx` renders a backdrop:

- `fixed inset-0`
- `z-40`
- `bg-black/40`
- hidden on large screens

The sidebar itself sits above it at `z-50`.

---

## 6. Sidebar visual style

The sidebar is intentionally **darker and more dramatic** than the rest of the app shell.

While the main app background uses light theme tokens, the sidebar uses a custom dark slate treatment.

### 6.1 Background

The sidebar background is:

- `bg-gradient-to-b`
- `from-slate-900`
- `via-slate-900`
- `to-slate-950`

This creates a dark vertical gradient that visually separates navigation from the lighter main workspace.

### 6.2 Border

The sidebar uses:

- `border-r`
- `border-white/20`
- `dark:border-white/12`

This is a subtle translucent right border separating it from the main content.

### 6.3 Shadow

The sidebar uses a strong custom shadow:

- `shadow-[0_16px_34px_rgba(15,23,42,0.22)]`

This gives it a floating panel feel, especially when it appears as an off-canvas mobile drawer.

### 6.4 Typography

The sidebar uses:

- `font-body`
- `font-medium`

`font-body` maps to `Inter` in `tailwind.config.js`.

Text patterns:

- small uppercase muted labels for section headings
- `text-[14px]` for nav labels
- `text-[11px]` or `text-[10px]` for footer metadata
- stronger text weight for active navigation and account details

### 6.5 Iconography

Icons use the `material-symbols-outlined` class defined in `frontend/src/index.css`.

Base icon styling:

- `text-[20px]`
- `leading-none`

Color behavior:

- active icon: `text-cyan-200`
- inactive icon: `text-slate-300`
- hover inactive icon: `text-slate-100`

---

## 7. Navigation item styling

Each sidebar item is a `<button>` with state-dependent styling.

### 7.1 Shared structure

All nav buttons use:

- full width
- rounded corners
- border
- transition animation
- focus-visible ring

Shared classes include:

- `relative`
- `w-full`
- `flex`
- `items-center`
- `rounded-lg`
- `transition-all`
- `duration-200`
- `ease-out`
- `focus-visible:ring-2`
- `focus-visible:ring-primary/40`

### 7.2 Expanded vs collapsed layout

#### Expanded

- `gap-2.5`
- `h-11`
- `px-3`
- `text-left`

#### Collapsed

- `justify-center`
- `h-10`
- `px-2`

In collapsed mode:

- only the icon is visible
- the label becomes screen-reader-only text
- a hover/focus tooltip appears beside the button

### 7.3 Inactive state

Inactive nav items use:

- transparent border
- transparent background
- `text-slate-200`
- hover border: `white/10`
- hover background: `white/5`
- hover text: `white`

This makes the menu calm by default while still discoverable on hover.

### 7.4 Active state

Active nav items use a much stronger style:

- border: `border-cyan-400/55`
- background: `bg-gradient-to-r from-cyan-500/28 to-slate-700/65`
- text: `text-slate-100`
- shadow: `shadow-[0_10px_24px_rgba(14,165,233,0.20)]`
- font weight: `font-semibold`

In addition, an active left-edge indicator is rendered:

- positioned absolutely
- `left-0`
- vertical inset from top/bottom
- `w-1`
- `rounded-r-full`
- `bg-cyan-400`

This is the clearest visual marker for the current screen.

### 7.5 Tooltip in collapsed mode

Collapsed items display a hover/focus tooltip:

- positioned to the right of the sidebar
- dark hardcoded background: `bg-[#0f172a]/92`
- white text
- rounded corners
- small padding
- `shadow-lg`
- `backdrop-blur-sm`

Visibility:

- hidden by default
- shown on `group-hover`
- shown on `group-focus-within`

This is important because text labels are otherwise hidden in collapsed mode.

---

## 8. Footer card and utility controls

### 8.1 Expanded footer card

When expanded, the sidebar shows a compact info card containing:

- current role
- unresolved alert count
- polling hint: `Live polling every 5s`

Styles:

- `rounded-xl`
- `border border-white/10`
- `bg-white/5`
- `text-slate-300`
- internal spacing
- soft shadow

Important values are elevated with:

- `text-slate-100`
- `font-semibold`
- uppercase tracking on the role value

### 8.2 Collapsed footer state

When collapsed, the info card becomes:

- a single line text label
- `Alerts: {count}`

This is a deliberate simplification to fit the narrow sidebar width.

### 8.3 Logout button

The logout button is always present but changes shape by mode.

#### Expanded logout button

- full width
- `rounded-xl`
- translucent white background
- left-aligned label
- `text-xs font-semibold`
- label format: `Logout ({sessionRole})`

#### Collapsed logout button

- centered
- compact text
- label: `↩`

Both modes use:

- `border-white/10`
- `bg-white/10`
- hover background `white/15`
- focus-visible ring

### 8.4 Mobile close button

The `Close menu` button is:

- only visible on mobile (`lg:hidden`)
- placed below logout
- styled more like a neutral app button than a dark nav item

It uses shared light theme tokens instead of the dark sidebar palette:

- `border-outline-variant/30`
- hover `bg-surface-container-low`
- focus ring `primary/35`

This makes it feel like an auxiliary control rather than a core nav item.

---

## 9. Responsive behavior

The sidebar has two different behavior models depending on breakpoint.

### 9.1 Desktop behavior (`>= 1024px`)

Desktop rules:

- sidebar is always visible
- `lg:translate-x-0` forces it onscreen
- top bar button toggles collapsed width, not open/close
- main content is shifted using `lg:ml-20` or `lg:ml-64`
- collapsed preference is persisted in `localStorage`

### 9.2 Mobile behavior (`< 1024px`)

Mobile rules:

- sidebar is off-canvas by default
- hidden state: `-translate-x-full`
- open state: `translate-x-0`
- width remains `w-64`
- a dark overlay is shown behind it
- body scrolling is disabled while open
- `Escape` closes the menu

### 9.3 Mobile close triggers

The sidebar closes in these cases:

- clicking the overlay
- pressing `Escape`
- selecting a nav item
- clicking anywhere in the sidebar on mobile, unless the click came from the dedicated `Close menu` button
- pressing the `Close menu` button

This makes the mobile drawer aggressively self-dismissing after interaction.

---

## 10. Interaction and state details

### 10.1 Click handling inside the sidebar

The `<aside>` itself has a click handler:

- ignore non-HTMLElement targets
- ignore events inside `[data-close-sidebar]`
- on mobile, otherwise call `onCloseSidebar()`

This means the sidebar closes after most mobile interactions, even when the clicked child already performed another action.

### 10.2 Active state detection

An item is active when:

- `screen === item.screen`

There is no path parsing or URL router integration here. It is entirely driven by the `screen` state passed from `AppMain`.

### 10.3 Role and alert summary

The footer is not purely decorative. It reflects live application state:

- `sessionRole`
- `unresolvedAlertsCount`

So the sidebar also functions as a lightweight operational status panel.

---

## 11. Accessibility behavior

The sidebar includes several useful accessibility affordances.

### 11.1 Sidebar semantics

The container uses:

- `<aside>`
- `aria-label="Primary navigation"`

The nav region uses:

- `<nav aria-label="Sidebar sections">`

### 11.2 Button semantics

Each nav item button includes:

- `aria-label={item.label}`
- `aria-current="page"` when active
- `title={item.label}` in collapsed mode

This supports:

- screen reader naming
- active page announcement
- hover tooltips

### 11.3 Keyboard focus

Interactive elements use focus-visible styling through:

- `focus-visible:ring-2`
- `focus-visible:ring-primary/40`

or the related variant used on the close button.

### 11.4 Collapsed label handling

When collapsed:

- visible label is removed
- `sr-only` text preserves the label for assistive technologies
- visual tooltip restores discoverability for sighted pointer users

### 11.5 Top bar relationship

The top bar toggle button includes:

- `aria-controls="app-sidebar"`
- `aria-expanded={isSidebarOpen}`

This is useful on mobile, where the sidebar truly opens and closes as a drawer.

---

## 12. Theme and token usage

The sidebar is only partially tokenized.

### 12.1 Token-based styling used

The sidebar uses shared theme tokens for:

- `font-body`
- focus ring: `primary`
- mobile close button border: `outline-variant`
- mobile close button hover: `surface-container-low`

### 12.2 Hardcoded styling used

A large portion of the sidebar's visual identity is hardcoded:

- slate gradient background
- white alpha borders
- cyan active accents
- hardcoded shadow values
- hardcoded tooltip background

This means the sidebar is visually consistent, but not fully aligned with the tokenized theme system described in `tailwind.config.js`.

---

## 13. State matrix

| Context | Visible? | Width | Labels visible? | Tooltip? | Main content offset? |
|------|------|------|------|------|------|
| Desktop expanded | Yes | `w-64` | Yes | No | `lg:ml-64` |
| Desktop collapsed | Yes | `w-20` | No | Yes | `lg:ml-20` |
| Mobile closed | No | `w-64` off-canvas | No | No | None |
| Mobile open | Yes | `w-64` | Yes | No | None |

---

## 14. Known implementation quirks and cleanup opportunities

### 14.1 Partial tokenization

The sidebar relies heavily on hardcoded slate / cyan styling instead of named design tokens. If the broader app theme evolves, the sidebar may require manual restyling.

### 14.2 Toggle ARIA state is mobile-oriented

`TopBar.tsx` sets:

- `aria-expanded={isSidebarOpen}`

That accurately reflects the mobile drawer state, but it does **not** reflect desktop collapsed vs expanded width state.

### 14.3 Toggle icon is tied to collapsed state

The menu icon in `TopBar.tsx` is:

- `menu_open` when `isSidebarCollapsed`
- `menu` otherwise

That is useful for desktop collapse state, but it is not fully aligned with mobile open / close state.

### 14.4 Click-anywhere mobile close behavior

The mobile sidebar closes on almost any click within the sidebar container. This is simple and effective, but somewhat aggressive if more complex interactive sidebar content is added later.

### 14.5 Mixed visual language

The main app shell is light and token-driven, but the sidebar uses a custom dark-glass/slate treatment. This is visually strong, though it creates a split between:

- token-based app theme
- bespoke sidebar theme

That may be intentional, but it is worth documenting as a design decision.

---

## 15. Practical summary

The ShipGen sidebar is a **dark, fixed, responsive navigation rail** with:

- persistent desktop collapse state
- off-canvas mobile drawer behavior
- strong active-item highlighting
- role-aware navigation input
- compact operational context in the footer
- accessible labels and focus states

From a UI-style perspective, its key identity comes from:

- dark slate gradient background
- cyan active emphasis
- rounded navigation pills
- subtle translucent borders
- layered shadows
- compact uppercase metadata

From an implementation perspective, it is best understood as a combination of:

1. `AppMain.tsx` for what items exist
2. `AppLayout.tsx` for how it opens, closes, collapses, and offsets layout
3. `Sidebar.tsx` for the final rendered structure and visual states
