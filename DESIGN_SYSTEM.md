# Scholar.name Design System

> Every element must justify its existence. Remove clutter, unify the inconsistent, elevate the essential.

---

## Brand

| Property | Value | Notes |
|----------|-------|-------|
| **Name** | Scholar.name | Capital S, period, lowercase n. Never "ScholarName" or "scholar.name" in UI |
| **Tagline** | Your research, one link, always up to date | Landing hero |
| **Domain** | scholar.name | Subdomains: `yourname.scholar.name` |

---

## Color Palette

### Theme Tokens (CSS Custom Properties)

Colors are applied via `--theme-*` variables on `:root`, managed by `ThemeContext.tsx`.

| Token | Default | Usage |
|-------|---------|-------|
| `--theme-primary` | `#1e3a5f` | Navy — headings, nav, buttons, chart strokes |
| `--theme-accent` | `#c9a227` | Gold — highlights, citations, secondary charts |
| `--theme-background` | `#fafbfc` | Page background |
| `--theme-surface` | `#ffffff` | Card/container backgrounds |
| `--theme-text` | `#1a1a2e` | Body text |
| `--theme-text-secondary` | `#64748b` | Muted/secondary text |
| `--theme-border` | `#e2e8f0` | Borders and dividers |

### Retired Colors — Do NOT Use

| Old Value | Replacement |
|-----------|-------------|
| `#0B1F3A` | `var(--theme-primary)` or Tailwind `text-primary` |
| `#D4AF37` | `var(--theme-accent)` or Tailwind `text-accent` |
| `#1a3a5c` | `var(--theme-primary)` with opacity |

### Dark Mode Rule

Never use raw Tailwind color classes without a `dark:` variant:

```
❌  bg-blue-50
✅  bg-blue-50 dark:bg-blue-950/30
```

---

## Typography

| Role | Font | Weight | Size Range |
|------|------|--------|------------|
| UI text | Inter | 400, 500, 600, 700 | System scale |
| Publication titles | Source Serif 4 | 600 | `text-lg` |
| Headings | Inter | 700 | `text-xl` → `text-4xl` |
| Body | Inter | 400 | `text-sm` → `text-base` |
| Captions | Inter | 500 | `text-xs` |

Fonts loaded via Google Fonts `@import` in `client/src/index.css`.

---

## Spacing

| Context | Value | Tailwind |
|---------|-------|----------|
| Section padding | 48px vertical | `py-12` |
| Section padding (compact) | 24–32px | `py-6 md:py-8` |
| Card padding | 16–24px | `p-4 md:p-6` |
| Grid gap | 16–24px | `gap-4 md:gap-6` |
| Base unit | 4px | Tailwind default |

---

## Layout Containers

| Use Case | Width | Class |
|----------|-------|-------|
| Landing hero, nav, footer | 72rem | `max-w-6xl` |
| Profile content, charts | 80rem | `max-w-7xl` |
| Text-heavy pages (legal, about) | 56rem | `max-w-4xl` |
| Auth forms (login, signup) | 28rem | `max-w-md` |

---

## Component Patterns

### Loading States

Use `<Skeleton />` from shadcn/ui for all data-loading components. Never use standalone spinner icons for page-level loading.

### Empty States

Centered card with:
- Emoji or Lucide icon (4xl)
- Title (`text-lg font-semibold`)
- Description (`text-muted-foreground text-sm`)
- Optional action button

### Icons

- **UI icons**: Lucide React (`lucide-react`)
- **Social icons**: `react-icons/si` for ORCID, Google Scholar, ResearchGate
- **Never**: Font Awesome class names (`fas fa-*`)

### Collapsible Sections

- Component: `CollapsibleSection.tsx`
- Animation: CSS grid `grid-template-rows: 0fr → 1fr` (no `max-height` hacks)
- Heading: `<h2>` wraps `<button>` (WAI-ARIA disclosure pattern)
- Default: open on desktop, collapsed on mobile

### Buttons

| Type | Class/Variant | Usage |
|------|--------------|-------|
| Primary CTA | `.btn-premium` | Hero, signup |
| Secondary | `variant="outline"` | Supporting actions |
| Ghost | `variant="ghost"` | Nav, back links |

---

## Motion

| Property | Value |
|----------|-------|
| Transition duration | 200ms (default), 300ms (expand/collapse) |
| Easing | `ease-in-out` |
| Reduced motion | Respect `prefers-reduced-motion` for counters and animations |

---

## Navigation

### Desktop Profile Nav (Navigation.tsx)

4 items: **Overview** · **Impact** · **Research** · **Publications**

### Mobile Bottom Nav (MobileBottomNav.tsx)

Same 4 items, same labels. Labels must always match between desktop and mobile.

### GlobalNav Modes

| Mode | Appearance | Use |
|------|-----------|-----|
| `landing` | Dark premium nav | Public pages |
| `app` | White with border | Dashboard |
| `auth` | White, minimal + "← Back to Home" | Login, signup |

---

## Mobile Stacking Order (bottom-up)

| Z-index | Element | Visibility |
|---------|---------|------------|
| z-50 | `MobileBottomNav` | Always on profile pages |
| z-40 | Claim CTA banner | Preview mode only, above nav |
| z-40 | `ThemeSwitcher` | Floating button, right side |

---

## Security

- **No `dangerouslySetInnerHTML`** for user content. Use safe text parsing (regex split + React elements).
- Sanitize all user-supplied strings before rendering.

---

## File Conventions

| Pattern | Example |
|---------|---------|
| Pages | `client/src/pages/LoginPage.tsx` — PascalCase + "Page" suffix |
| Components | `client/src/components/GlobalNav.tsx` — PascalCase |
| Hooks | `client/src/hooks/useRealtimeUpdates.ts` — camelCase, "use" prefix |
| Context | `client/src/context/ThemeContext.tsx` — PascalCase + "Context" suffix |

---

## Deployment Constraints

- **Hosting**: A2 Shared Hosting, Node 18.20.8
- **Cannot run `npm install`** — pthread limits on shared hosting
- **Build**: `npm run build` locally → `git push` → GitHub Actions auto-deploy
- **Bundle**: `esbuild --packages=external` — `node_modules` frozen on server
- **No new packages** without explicit approval and manual server upload
