# Design System Document: Logistics Intelligence & Automation

## 1. Overview & Creative North Star: "The Kinetic Architect"
This design system moves beyond the static "box-and-line" constraints of traditional SaaS. Our Creative North Star is **The Kinetic Architect**: a philosophy where data isn't just displayed; it is choreographed. 

For a logistics powerhouse like this, the UI must feel as efficient as a global supply chain—weightless, precise, and fluid. We break the "template" look by utilizing **intentional asymmetry** (e.g., left-aligned editorial headers balanced by wide-open data visualizations) and **tonal depth**. We replace rigid borders with "atmospheric containment," where the UI feels like a series of sophisticated, layered surfaces rather than a flat grid.

## 2. Colors & Surface Philosophy
The palette is rooted in deep, authoritative blues, balanced by an expansive range of "Paper" neutrals that provide the breathing room necessary for complex automation workflows.

### Surface Hierarchy & Nesting (The "No-Line" Rule)
**Prohibition:** 1px solid borders are strictly forbidden for sectioning. 
**The Rule:** Boundaries must be defined solely through background color shifts or tonal nesting.
*   **Base Layer:** `surface` (#f7f9fb) acts as the canvas.
*   **Secondary Zones:** Use `surface-container-low` (#f2f4f6) for sidebar backgrounds or secondary utilities.
*   **Actionable Containers:** Use `surface-container-lowest` (#ffffff) for primary cards and workspace modules. This creates a natural "lift" through contrast rather than lines.

### Glass & Gradient Signature
To elevate the experience from "tool" to "premium service":
*   **Glassmorphism:** Floating overlays (modals, command bars) must use `surface-container-lowest` with a 70% opacity and a `24px` backdrop-blur.
*   **Signature Textures:** Main Action CTAs and Hero progress states should utilize a subtle linear gradient: `primary` (#000000) to `on-primary-container` (#188ace) at 135 degrees. This adds "soul" and depth to the automation triggers.

## 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headlines) with **Inter** (Body/Labels) to create a high-contrast, editorial feel that distinguishes ShipGen from "standard" logistics software.

*   **The Display Scale (Manrope):** Large, airy, and authoritative. Use `display-md` for high-level shipment volumes. The wide apertures of Manrope suggest openness and transparency.
*   **The UI Scale (Inter):** Tight, functional, and highly legible. `body-md` is the workhorse for data tables.
*   **Visual Hierarchy Rule:** Always use `on-surface-variant` (#45464d) for labels to create a clear "secondary" layer of information, allowing the primary data (in `on-surface` #191c1e) to pop.

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too heavy for a "clean, minimal" aesthetic. We utilize **Tonal Layering** to communicate hierarchy.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card inside a `surface-container` section. The subtle delta in hex value creates a "soft lift."
*   **Ambient Shadows:** When a float is required (e.g., a dragging shipment card), use a shadow tinted with the brand: `0px 12px 32px rgba(25, 28, 30, 0.06)`. It should feel like a soft glow of light, not a dark smudge.
*   **The Ghost Border Fallback:** If a container sits on a background of the same color, use a "Ghost Border": `outline-variant` (#c6c6cd) at **15% opacity**. It should be felt, not seen.

## 5. Component Guidelines

### Buttons: The Kinetic Trigger
*   **Primary:** Solid `primary` (#000000) with `on-primary` (#ffffff) text. Radius: `md` (0.375rem). Use the signature gradient on hover.
*   **Secondary:** `surface-container-high` (#e6e8ea) background. No border.
*   **Tertiary:** Transparent background with `on-surface` text. Use for low-emphasis actions like "Cancel."

### Cards & Lists: The White Space Rule
*   **Forbid Dividers:** Never use a line to separate list items. Use `16px` of vertical white space (the Spacing Scale) or a hover state that shifts the background to `surface-container-highest` (#e0e3e5).
*   **Shipment Cards:** Use `surface-container-lowest` with a `lg` (0.5rem) corner radius. Internal padding should be generous (`24px`).

### Automation Inputs
*   **Fields:** Use `surface-container-low` for input backgrounds to make them feel "recessed" into the UI.
*   **States:** On focus, transition the background to `surface-container-lowest` and apply a `1px` ghost border using `surface-tint`.

### Advanced Logistics Components
*   **Status Indicators:** Use `tertiary-fixed` (#6ffbbe) for "In Transit" (Success) and `error-container` (#ffdad6) for "Blocked" (Alert). 
*   **The "Route Pulse":** For active shipping routes, use a subtle `on-tertiary-container` (#009668) animated stroke to indicate "System-Driven Automation" is active.

## 6. Do’s and Don'ts

### Do:
*   **DO** use asymmetric layouts. If the left side is a dense table, the right side should be an airy, high-level summary.
*   **DO** stack containers (Lowest on Low) to create depth.
*   **DO** use `body-sm` for metadata but keep the weight `Medium` (500) for legibility.

### Don’t:
*   **DON'T** use 100% black text on 100% white backgrounds. Use `on-surface` on `surface`.
*   **DON'T** use hard-edged shadows. If you can see where the shadow ends, it's too dark.
*   **DON'T** use icons as the sole communicator. High-end SaaS requires clear, sophisticated labeling.