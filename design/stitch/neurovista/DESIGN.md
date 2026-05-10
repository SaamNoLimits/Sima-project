---
name: NeuroVista
colors:
  surface: '#f9faf5'
  surface-dim: '#d9dad6'
  surface-bright: '#f9faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f0'
  surface-container: '#edeeea'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e2e3df'
  on-surface: '#191c1a'
  on-surface-variant: '#414942'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#f0f1ed'
  outline: '#717972'
  outline-variant: '#c0c9c0'
  surface-tint: '#38684c'
  primary: '#023820'
  on-primary: '#ffffff'
  primary-container: '#1f4f35'
  on-primary-container: '#8dc09e'
  inverse-primary: '#9fd2b0'
  secondary: '#006d3d'
  on-secondary: '#ffffff'
  secondary-container: '#97f3b5'
  on-secondary-container: '#047240'
  tertiary: '#502127'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b373c'
  on-tertiary-container: '#e9a2a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#baefcb'
  primary-fixed-dim: '#9fd2b0'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#205036'
  secondary-fixed: '#9af6b8'
  secondary-fixed-dim: '#7ed99e'
  on-secondary-fixed: '#00210f'
  on-secondary-fixed-variant: '#00522d'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#fcb3b8'
  on-tertiary-fixed: '#360d13'
  on-tertiary-fixed-variant: '#6b373c'
  background: '#f9faf5'
  on-background: '#191c1a'
  surface-variant: '#e2e3df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 42px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-base:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  tabular-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for a high-stakes clinical environment, emphasizing precision, academic rigor, and absolute clarity. The aesthetic balances the warmth of a modern editorial publication with the sterile efficiency required by medical diagnostic tools.

The visual language draws from **Minimalism** and **Corporate Modernism**, utilizing generous whitespace and a "Donezo-inspired" philosophy where every element serves a functional purpose. The goal is to reduce cognitive load for radiologists and neurologists by presenting complex MRI classification data through a lens of quiet authority. 

The voice is strictly clinical and delivered in French, maintaining a formal distance that reinforces the professional nature of the software. Visual embellishments are stripped away in favor of high-contrast data visualization and structured information hierarchies.

## Colors

The palette is anchored by deep, botanical greens and warm, paper-like neutrals. This choice moves away from the "tech-blue" cliché of medical software, opting instead for a palette that feels academic and grounded.

- **Primary & Secondary:** Deep Forest Green and Kelly Green are used for primary actions, navigational highlights, and brand presence.
- **Neutrals:** A tiered system of creams (Warm Cream for the background, Soft Cream for secondary containers, White for primary content cards) creates a subtle but effective sense of depth without relying on aggressive shadows.
- **Contrast:** Rich Black is reserved for primary typography and essential iconography to ensure maximum legibility.
- **Status/Severity:** Standardized semantic colors are used strictly for diagnostic results (e.g., tumor classification, anomaly detection).

## Typography

This design system utilizes **Plus Jakarta Sans** for all UI interactions to provide a soft yet professional reading experience. For numerical data, coordinates, and classification confidence scores, a **Monospace** font (JetBrains Mono) is used to ensure vertical alignment in tables and diagnostic lists.

- **Headlines:** Set in Plus Jakarta Sans with tighter tracking for a precise, modern appearance.
- **Body:** Optimized for long-form clinical reports, using generous line heights.
- **Tabular Numbers:** All clinical values, percentages, and MRI metadata must use the monospaced font to avoid "jumping" characters during data updates.
- **Language:** All UI copy must be in professional French (e.g., "Analyse en cours", "Classification de la pathologie").

## Layout & Spacing

The system follows a **Fixed Grid** model for desktop dashboards to ensure that medical imagery remains at a consistent, predictable scale for diagnostic purposes.

- **Grid:** A 12-column grid with 16px gutters.
- **Consistency:** All spacing is derived from a 4px baseline unit. 
- **Reflow:** On mobile devices, sidebars collapse into a bottom navigation bar, and the 3-column diagnostic view stacks into a single-column scroll.
- **Density:** High information density is permitted in the classification results pane, but MRI viewports must maintain a "safe zone" margin of 32px to avoid visual clutter near the edges of the scan.

## Elevation & Depth

Depth is primarily established through **Tonal Layering** rather than traditional shadows. This keeps the interface feeling "academic" and flat, like a printed medical journal.

- **Level 0 (Background):** Warm Cream (#F4F4EE).
- **Level 1 (Cards/Panels):** White (#FFFFFF) with a very soft, low-opacity ambient shadow (Blur 10px, Opacity 4%, Color #18181B).
- **Level 2 (Modals/Overlays):** White (#FFFFFF) with a 1px border in Deep Forest Green at 10% opacity.

The contrast between the cream background and white surfaces provides enough separation for the user to distinguish between the workbench and the tools.

## Shapes

The shape language is intentional and hierarchical:
- **Large Containers (Cards):** 16px radius. Used for the main MRI viewport and classification results to soften the clinical edge.
- **Interactive Elements (Inputs/Buttons):** 8px radius. A sharper corner conveys precision and utility.
- **Status Badges (Pills):** 9999px (full pill). Used exclusively for severity tags (e.g., "Critique", "Stable") to make them instantly recognizable against the rectangular grid of the dashboard.

## Components

- **Buttons:** Primary buttons are Solid Deep Forest Green with White text. Secondary buttons use a Deep Forest Green outline with no fill.
- **Input Fields:** 8px radius with a Soft Cream fill and a subtle 1px border (#18181B at 15% opacity). On focus, the border hardens to Kelly Green.
- **Classification Chips:** Used for labeling brain regions. These are pill-shaped with a light tint of the status color and a 700 weight monospaced label.
- **MRI Viewport:** A black-boxed container with 16px radius, featuring Kelly Green crosshair overlays and monospaced coordinate labels.
- **Data Tables:** Row-based with no vertical borders. Alternating rows use Soft Cream (#FAFAF6) for zebra striping. Header labels are uppercase Plus Jakarta Sans.
- **Icons:** Minimalist, stroke-based (1.5px weight). Severity icons are the only permitted colored icons (Red for "Urgent", Amber for "Attention", Green for "Normal").