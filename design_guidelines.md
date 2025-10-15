# Research Profile Platform Design Guidelines

## Design Approach: Material Design System

**Rationale**: Academic platform requires clear information hierarchy, robust data visualization, and professional credibility. Material Design provides excellent patterns for data-dense applications with strong visual feedback and component consistency.

**Core Principles**: Information clarity, scannable layouts, confident data presentation, academic professionalism

---

## Color System

### Light Mode
- **Primary**: 210 90% 45% (Deep academic blue - headers, CTAs, links)
- **Secondary**: 210 25% 25% (Charcoal - body text, labels)
- **Surface**: 0 0% 98% (Off-white cards/panels)
- **Background**: 210 15% 97% (Subtle blue-tinted base)
- **Accent**: 165 70% 42% (Teal - charts, metrics, highlights)
- **Success/Positive**: 145 65% 45% (Publication indicators)
- **Border**: 210 15% 88%

### Dark Mode  
- **Primary**: 210 85% 65% (Lighter blue)
- **Secondary**: 210 8% 75% (Light gray text)
- **Surface**: 215 25% 12% (Elevated cards)
- **Background**: 220 20% 8% (Deep base)
- **Accent**: 165 55% 55% (Brighter teal)
- **Border**: 215 15% 20%

### Chart Palette (Both Modes)
Six distinct colors: Primary blue, Accent teal, 280 65% 60% (Purple), 25 85% 55% (Orange), 145 60% 48% (Green), 340 70% 55% (Pink)

---

## Typography

**Fonts**: Inter (interface), Source Sans Pro (data/metrics)

**Hierarchy**:
- Hero/Landing H1: text-5xl/text-6xl font-bold (48-60px)
- Section Headers: text-3xl/text-4xl font-semibold (30-36px)
- Profile Names: text-2xl font-bold (24px)
- Card Titles: text-lg font-semibold (18px)
- Body/Stats: text-base (16px)
- Labels/Meta: text-sm text-secondary (14px)
- Captions: text-xs (12px)

---

## Layout System

**Spacing Primitives**: Tailwind units 2, 4, 6, 8, 12, 16 (8px base grid)

**Structure**:
- Landing pages: Full-width hero, contained sections (max-w-7xl mx-auto px-6)
- Profile pages: Sidebar layout (aside: w-80, main: flex-1, gap-8)
- Dashboard: 3-column grid for metrics (grid-cols-1 md:grid-cols-3 gap-6)
- Cards: Consistent padding p-6, rounded-xl, shadow-sm elevation

---

## Component Library

### Navigation
**Global Header**: Sticky top bar (h-16), logo left, search center, profile/theme toggle right, backdrop-blur-lg bg-surface/90

**Profile Sidebar**: Fixed navigation showing researcher photo (w-24 h-24 rounded-full), name, title, affiliation list, quick stats (h-index, citations)

### Data Display
**Publication Cards**: White surface, border-l-4 accent border for category coding, publication title (font-semibold), authors (text-sm truncate), venue (italic text-sm), metrics row (citations, year) with icons

**Metrics Dashboard**: Grid of stat cards - large number (text-4xl font-bold), label below (text-sm uppercase tracking-wide), sparkline charts for trends, color-coded backgrounds (accent/10 opacity)

**Research Topics**: Tag cloud with varying text sizes (text-sm to text-xl) based on frequency, pill-shaped (px-4 py-2 rounded-full), primary background with opacity

**Affiliation Cards**: Institution logo (w-16 h-16), name, role, date range, stacked vertically with connecting timeline line

### Charts & Visualization
**Publication Timeline**: Horizontal bar chart, gradient fills (accent color), interactive tooltips, grid lines (opacity-20), responsive height (h-64 to h-96)

**Citation Metrics**: Line/area charts with smooth curves, dual Y-axis when comparing metrics, legend positioned top-right, grid backdrop

**Co-author Network**: Force-directed graph visualization using D3.js patterns, node sizes based on collaboration frequency, edges with varying opacity

### Forms (Admin Theme Customization)
**Color Pickers**: Large preview swatch (w-20 h-20 rounded-lg border-2), HSL sliders below, live preview panel showing all UI elements with selected colors

**Theme Presets**: Gallery of preset cards (grid-cols-2 lg:grid-cols-4), thumbnail previews showing color scheme, radio selection

---

## Images

### Hero Section
**Landing Page Hero**: Full-width (h-[500px] lg:h-[600px]), overlay gradient (from-black/60 to-transparent), professional academic imagery (modern library, research lab, collaborative workspace, diverse scholars), centered content with white text

**Profile Headers**: Banner image (h-48) showing institutional building or research context, subtle overlay, researcher photo overlapping bottom edge (-mb-12 relative positioning)

### Supporting Imagery
- Research topic cards: Abstract scientific imagery backgrounds (opacity-10)
- Publication thumbnails: Journal covers or paper preview images (aspect-square)
- Institutional logos: Within affiliation cards (grayscale filter)

---

## Interactive States

**Hover**: Cards elevate (shadow-md transition-shadow), buttons brighten (brightness-110), chart elements highlight stroke-width increase

**Focus**: 2px accent ring (ring-2 ring-accent ring-offset-2), smooth transition

**Loading**: Skeleton screens with shimmer animation, chart placeholders with pulsing gradient

---

## Page Layouts

**Landing**: Hero with search, featured researchers (3-col grid), trending topics (tag cloud), platform stats (4-col metrics), recent publications feed, institutional partners logos

**Profile**: Sticky sidebar (photo, contact, quick stats), main content (about, publications infinite scroll, analytics charts stacked, topics grid, collaborators)

**Search Results**: Filters sidebar (left), results grid (2-col cards), pagination, sort controls (top right)

**Admin Dashboard**: Theme customizer (split view: controls left, live preview right), analytics overview (multi-chart layout), user management table

---

## Accessibility & Theme

Consistent dark mode throughout including form inputs (bg-surface border-border). WCAG AA contrast ratios. Keyboard navigation with visible focus states. Semantic HTML5. ARIA labels for charts/interactive elements. Responsive: mobile-first, breakpoints at sm(640px), md(768px), lg(1024px), xl(1280px).