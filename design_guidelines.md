# ScholarSite Premium Design Guidelines

## Design Approach: Premium Academic Refinement

**Rationale**: High-end SaaS platform requires sophisticated visual language that balances scholarly credibility with modern premium aesthetics. Drawing inspiration from premium SaaS products like Linear and Stripe, combined with academic gravitas.

**Core Principles**: Refined elegance, data-rich transparency, trustworthy sophistication, intentional whitespace

---

## Color System

### Light Mode
- **Midnight Blue**: #0B1F3A (Primary headers, navigation, key CTAs)
- **Oxford Blue**: #142850 (Section backgrounds, card overlays)
- **Platinum**: #E4E9F7 (Surface cards, elevated panels)
- **Sage Green**: #7AA874 (Success indicators, publication metrics, chart accents)
- **Warm Accent**: #F2994A (Primary CTAs, interactive highlights)
- **Background**: #F8F9FC (Subtle blue-tinted base)
- **Text Primary**: #0B1F3A
- **Text Secondary**: #5A6B8C
- **Border**: #D1D9E6

### Dark Mode
- **Midnight Blue**: #2A4A6F (Elevated elements)
- **Oxford Blue**: #0F1826 (Base background)
- **Platinum**: #1F2937 (Card surfaces)
- **Sage Green**: #8BC88F (Brightened metrics)
- **Warm Accent**: #FFB366 (Enhanced CTAs)
- **Text Primary**: #E4E9F7
- **Text Secondary**: #9CA3AF
- **Border**: #2D3748

### Chart Palette
Six-color system: Midnight Blue, Sage Green, Warm Accent, #6B5B95 (Deep Purple), #4A9EAF (Teal), #C65D7B (Rose)

---

## Typography

**Fonts**: 
- Interface: Inter (navigation, body, labels, data)
- Display: Source Serif Pro (headlines, researcher names, section headers)

**Hierarchy**:
- Landing Hero: text-6xl/text-7xl font-serif font-bold (60-72px)
- Section Headers: text-4xl font-serif font-semibold (36px)
- Profile Names: text-3xl font-serif font-bold (30px)
- Subsections: text-2xl font-serif font-medium (24px)
- Card Titles: text-lg font-semibold (18px, Inter)
- Body/Data: text-base (16px, Inter)
- Labels: text-sm text-secondary (14px, Inter)
- Micro-copy: text-xs (12px, Inter)

---

## Layout System

**Spacing Primitives**: Tailwind units 4, 6, 8, 12, 16, 24 (consistent 4px rhythm)

**Structure**:
- Landing: Full-width hero (h-screen), sections max-w-7xl mx-auto px-8 py-24
- Profile: Two-column (sidebar w-80 sticky, main flex-1, gap-12)
- Grids: Publications 2-col, Metrics 3-col, Features 3-col with gap-8
- Generous vertical spacing: section gaps py-32 for breathing room

---

## Visual Treatments

### Glassmorphism
Cards with backdrop-blur-xl, bg-white/70 (light) or bg-midnight/30 (dark), border border-white/20, subtle shadow-2xl. Use for feature cards, stat panels, floating navigation.

### Gradients
- Hero overlays: from-midnight via-oxford/80 to-transparent
- Card backgrounds: radial-gradient from sage/5 to transparent
- Accent elements: linear-gradient warm accent to sage green
- Subtle mesh backgrounds: multi-color gradient overlays at 3% opacity

### Geometric Academic Motifs
Decorative elements: Abstract connection lines (nodes and edges), geometric grid patterns in backgrounds, tessellated academic symbols (books, molecules, graphs) as subtle watermarks, floating particle effects around data visualizations.

---

## Component Library

### Navigation
Glassmorphic sticky header (backdrop-blur-lg bg-white/80), logo left with scholar icon, centered navigation links (text-sm tracking-wide uppercase), search with soft shadow, profile/theme toggle right. Magnetic hover effect on nav items.

### Data Display
**Publication Cards**: Glassmorphic surface, left accent bar (4px sage green), serif title (text-xl font-semibold), author list with truncation, venue italic below, metrics row (citation count with sparkline, year, impact badge), hover elevates with shadow expansion.

**Metrics Dashboard**: Premium stat cards with gradient backgrounds, large serif numbers (text-5xl font-bold), label uppercase tracking-widest, embedded sparkline charts (h-12), trend arrows, glassmorphic surfaces stacked in grid.

**Impact Visualizations**: Citation graph (area chart with gradient fill), publication timeline (horizontal bars with glow effect), collaboration network (force-directed with glow nodes), h-index progression (line chart with milestone markers).

**Research Topics**: Sophisticated tag system with varying sizes (text-sm to text-2xl based on frequency), glassmorphic pills with sage green borders, magnetic hover clustering effect.

### Interactive Elements
**Premium CTAs**: Warm accent background with white text, magnetic hover (element follows cursor slightly), glow effect on hover, rounded-xl, px-8 py-4, font-semibold tracking-wide.

**Data Cards**: Hover reveals additional metrics with slide-in animation, border glow effect in sage green, smooth scale transition (scale-105).

**Charts**: Interactive tooltips with glassmorphic backgrounds, smooth curve animations on load, highlight on hover with increased stroke width, crosshair guides.

---

## Images

### Hero Section
**Landing Hero**: Full-viewport (h-screen) professional academic imagery - modern research libraries with natural light, collaborative lab spaces with diverse scholars, prestigious university architecture, innovative study environments. Apply gradient overlay (from-midnight/70 via-oxford/50 to-transparent) for text legibility. Centered content with serif display typography in white.

**Profile Banners**: Wide banner (h-64) showing institutional setting or research context, subtle blur with overlay, researcher profile photo (w-32 h-32 rounded-full border-4 border-platinum) positioned overlapping (-mt-16).

### Supporting Imagery
- Feature sections: Abstract academic textures (parchment, geometric patterns) at low opacity backgrounds
- Testimonial cards: Circular researcher photos with sage green ring borders
- Institution logos: Grayscale with slight blur, arranged in elegant grid
- Publication previews: Journal cover thumbnails with glassmorphic overlays

---

## Page Layouts

### Landing Page
Full-screen hero with dramatic imagery, headline (serif, text-7xl), subheading, dual CTAs (primary warm accent, secondary outline). Premium features grid (3-col glassmorphic cards with icons, titles, descriptions). Data-rich showcase (publication preview cards, live citation metrics, research impact visualization). Social proof (institutional partner logos, researcher testimonials with photos in glassmorphic frames). Pricing tiers (3-col comparison cards with gradient backgrounds). Footer with newsletter signup (glassmorphic input), social links, navigation columns.

### Profile Page
Sticky glassmorphic sidebar: large profile photo, researcher name (serif, text-3xl), title/affiliation, contact links, quick impact metrics (h-index, total citations, publications count) with mini sparklines. Main content: About section (serif headings, generous line-height), publications infinite scroll (glassmorphic cards with filters), interactive analytics charts (stacked area for citations over time, bar for publications by year, network graph for collaborators), research topics tag cloud, featured collaborators grid (photos in circular frames).

### Search/Directory
Glassmorphic filter sidebar (institution, field, metrics sliders), main results (2-col researcher cards with photos, names, affiliations, key metrics), sort controls (dropdown with glassmorphic styling), pagination with elegant page indicators.

---

## Micro-Interactions

Magnetic buttons (cursor-follow hover), scroll-triggered fade-in animations (stagger child elements), smooth parallax on hero imagery, data count-up animations on metrics, sparkline charts animate on viewport entry, glassmorphic cards glow on hover, smooth color transitions (300ms ease), skeleton loaders with shimmer gradients.

---

## Accessibility

WCAG AA contrast maintained (dark text on platinum, white on midnight). Keyboard navigation with visible focus rings (2px sage green). Reduced motion media queries disable animations. Semantic HTML5 structure. ARIA labels for all interactive charts and data visualizations. Responsive breakpoints: mobile-first, sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px).