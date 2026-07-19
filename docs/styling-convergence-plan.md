# Styling System Convergence — Phased Plan

Planning only, no code changes yet (per 2026-07-19 alignment conversation).
Confirms and quantifies the A9/D6 findings from the UX review with real
numbers so the phases below are scoped against reality, not a guess.

## What's actually there

```
grep -rc "style={{" client/src → 1,080 instances total
```

But the distribution is uneven, and the finding "three styling systems" is
more precise than it first sounds — it's really **one clean system (admin)
and everything else bypassing it with hardcoded hex**:

| Area | Inline-style instances | Pattern |
|---|---|---|
| **Admin** (`pages/admin/*`, `AdminDashboard`, `AdminUsers`, `AdminLogin`, `components/admin/*`) | **0** | Pure Tailwind + shadcn tokens. This is the reference pattern — not a rewrite target. |
| **`ResearcherDashboard.tsx`** | **279** (worst single file) | ~101 already call 11 shared style-object helpers defined in the file (`cardStyle`, `btnPrimary()`, `chip()`, etc.); ~178 are one-off raw literals. |
| **Marketing/content pages** (Terms, Privacy, Signup, Landing, About, Blog*, Checkout*, Login, Pricing, Faq, ForgotPassword, VerifyEmail, not-found) | 13–92 each, ~600 combined | Same hand-styled pattern as the dashboard, just less concentrated. |
| **Shared profile components** (`ResearcherProfileContent`, `ResearchPassport`, `StatsOverview`, `CollapsibleSection`, `CareerTimeline`, etc.) | 1–12 each | Mostly legitimate — runtime-computed values (theme colors, chart percentages) that Tailwind utility classes can't express. Not real debt; needs an audit pass to confirm, not a rewrite.

**The good news:** a real token bridge already exists. `index.css` defines
~102 CSS custom properties, and shadcn's own tokens already reference them
at the root (`--primary: var(--theme-primary);`). The problem isn't "two
incompatible systems needing reconciliation" — it's that ~1,000+ inline
`style={{ color: "#0B1F3A" }}`-style literals hardcode hex values directly
instead of using `var(--theme-midnight)` or a `bg-primary`/`text-primary`
Tailwind class that already resolves to the same color. This is mechanical
conversion work, not a redesign.

## Phased approach

### Phase 0 — Token audit (½ day)
Confirm every hardcoded hex value in play (`#0B1F3A`, `#FFC72E`, `#F2994A`,
`#142850`, etc. — the DESIGN_SYSTEM.md palette) has a corresponding
`--theme-*` CSS var and, where missing, a Tailwind config entry so it's
usable as a utility class (`bg-midnight`, `text-warm`, etc. — some of these
already exist per `tailwind.config.ts`, some don't). Fix gaps here first;
everything downstream depends on the token set being complete.

### Phase 1 — Low-risk marketing pages (~2–3 days)
Convert the lowest-traffic, lowest-interactivity pages first as a proof of
pattern with minimal regression risk: `TermsPage`, `PrivacyPage`,
`FaqPage`, `AboutPage`, `not-found`. These are static content — no forms,
no mutations, easy to visually diff before/after. Establishes the
find-replace conventions (hex → Tailwind class or `var(--theme-*)`) used in
every later phase.

### Phase 2 — `ResearcherDashboard.tsx` (~1 week, highest risk)
The single biggest file and the one real paying customers use daily.
Sequence:
1. Convert the 11 existing shared helpers (`cardStyle`, `btnPrimary()`,
   `chip()`, etc.) to Tailwind utility strings or a small `@layer
   components` block in `index.css`. This alone converts ~101 of the 279
   call sites with one change per helper.
2. Work through the remaining ~178 one-off literals tab by tab (Profile →
   Publications → Sections → Sync → Settings), verifying visually after
   each tab given this is live, revenue-generating surface.
3. Do NOT attempt this in one PR — one tab per PR, each independently
   deployable and revertible.

### Phase 3 — Remaining marketing/funnel pages (~2–3 days)
`SignupPage`, `LoginPage`, `PricingPage`, `LandingPage`, `Checkout*`,
`Blog*` — same mechanical conversion, ordered roughly by how much this
session already touched them (Landing/Signup had targeted fixes this round,
so should need less rework than untouched pages like Checkout*).

### Phase 4 — Component audit (~1 day)
Go through the lighter-touch shared components (`ResearchPassport`,
`StatsOverview`, `CollapsibleSection`, `CareerTimeline`, `ThemePreviewSwatch`,
`SectionEditor`) and explicitly classify each remaining `style={{}}` as
either (a) real debt to convert, or (b) a legitimate runtime-computed value
(chart percentages, theme-driven colors) that inline style is the *correct*
tool for — Tailwind's arbitrary-value classes can express these too
(`w-[${pct}%]`) but only safely with care around JIT purging; don't force a
conversion that trades one class of bug for another.

## Sequencing note

Recommend running this as its own dedicated track, not interleaved with
feature work — each phase is a clean, independently-revertible PR, so it can
be picked up incrementally whenever there's a slow week, without blocking
anything else. Phase 2 (the dashboard) is the one phase that genuinely
needs focused attention given the live-customer risk; the others are
lower-stakes and could even be delegated/batched.

## Out of scope for this plan

- No visual redesign — this converges *implementation*, not *appearance*.
  Every page should look pixel-identical before and after.
- Not attempting to eliminate 100% of inline styles — Phase 4 explicitly
  carves out legitimate runtime-value cases.
