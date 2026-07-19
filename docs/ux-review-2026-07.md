# Scholar.name UX / Design / Content Review — July 2026

Full-site review conducted 2026-07-18/19 against the live production site.
Surfaces covered: marketing site (desktop + mobile), unclaimed-profile preview
(`/researcher/A5037710835`, Feynman demo), a real claimed profile
(`zahi.scholar.name`), signup/login/admin entry pages, a code-level review of
the researcher dashboard, and a live authenticated walkthrough of the admin
portal and the researcher dashboard (both 2026-07-19).

Legend: 🔴 critical · 🟠 high · 🟡 moderate · 🟢 hygiene

---

## A. Cross-cutting / platform

| # | Sev | Issue | Detail / evidence | Suggested fix |
|---|-----|-------|-------------------|---------------|
| A1 | 🔴 | No server-rendered meta for profile pages | Raw HTML of `/researcher/A5037710835` and `zahi.scholar.name` contains zero researcher content — title/description/OG are set client-side only. Link-preview bots (LinkedIn, X, Slack, WhatsApp) don't run JS → **sharing a profile produces a blank/generic card**. Features page explicitly promises "social previews." | Inject title/description/OG server-side in the Express HTML response for profile routes and tenant subdomains. |
| A2 | 🔴 | og:image broken twice over | On the real profile the client-set `og:image` is a **relative URL** (`/uploads/profile-images/…`) — invalid for scrapers even with SSR. On the demo it's a random **Unsplash stock photo** with alt "Richard P. Feynman profile picture." | Absolute URLs; generate a branded 1200×630 OG card (name, affiliation, stats on navy/gold template). |
| A3 | 🔴 | Suggested profile URL has broken SSL | Preview banner says "Create yours at `richardp.feynman.scholar.name`" — a two-level subdomain not covered by the wildcard cert; browsers show a security error. (Profile header simultaneously shows `richardpfeynman.scholar.name` — inconsistent.) | Always generate single-label subdomains; show the canonical claimed URL. |
| A4 | 🟠 | Site navigation is `<button>`s, not links | Homepage: 32 buttons vs 4 `<a>` tags. Nav, footer (even Privacy/Terms), all CTAs are JS buttons → no open-in-new-tab, no crawler discovery of internal pages, weak screen-reader semantics. (Admin portal does this correctly with `<Link>` — port the pattern.) | Use `<a href>` / wouter `Link` everywhere; keep styling. |
| A5 | 🟠 | Sitemap missing key pages | `sitemap.xml` has 7 URLs; omits `/pricing`, `/features`, `/faq`, `/blog` and all 5 blog-post routes. | Generate sitemap from route table + published tenant subdomains. |
| A6 | 🟠 | Unclaimed subdomains serve the full marketing homepage | `feynman.scholar.name` (unclaimed) renders the landing page on that origin → disorienting for visitors, infinite duplicate content for crawlers. | Dedicated "No portfolio here yet — search or claim this address" page with 404 status. |
| A7 | 🟢 | Soft 404s | Unknown routes and unknown researcher IDs return HTTP 200 with a client-rendered 404 page. | Return real 404 status server-side where determinable. |
| A8 | 🟢 | `maximum-scale=1` viewport meta | Blocks pinch-zoom on iOS (WCAG 1.4.4). | Remove `maximum-scale`. |
| A9 | 🟡 | Three styling systems | Marketing = Tailwind classes; researcher dashboard = 2,400 lines of inline style objects with hardcoded hex; admin = shadcn/Tailwind tokens (with raw `blue-600`/`amber-500` that DESIGN_SYSTEM.md forbids). Consistency and dark-mode support all diverge. | Converge on the token system in DESIGN_SYSTEM.md. |
| A10 | 🟡 | Brand inconsistencies | Book-icon logo (marketing) vs yellow "S" square (signup, 404, subdomain header); X icon labeled "Twitter"; monospace subdomain font in profile hero. | Pick one logo lockup; "X" or "X (Twitter)". |

## B. Homepage & marketing pages

| # | Sev | Issue | Detail | Fix |
|---|-----|-------|--------|-----|
| B1 | 🔴 | Hero search returns wrong people for famous names | "Marie Curie" → Claude Le Bris, Assunta Pelosi, etc. (affiliation matches ranked above author-name matches). First interactive element on the site. | Rank author-name matches first (OpenAlex autocomplete endpoint behavior); show affiliation as secondary text only. |
| B2 | 🟠 | Zero authentic social proof | Only testimonial site-wide is signup's *"…" — A. Researcher, MIT* (reads as fabricated). Homepage mockup uses **Jennifer Doudna's** name/metrics without consent — legal + trust risk. "Join researchers who've…" names no numbers/institutions. | Real consented user or clearly fictional persona in mockup; 2–3 real quotes with names/photos; defensible counters. |
| B3 | 🟠 | Homepage pricing cards look unfinished | Only name + price + one floating checkmark; real feature lists exist only on `/pricing`. Pro also relists "Monthly data sync" already included in Starter. | Show 4–5 feature bullets per card on homepage; dedupe Pro list; one-line explainer for "Research Passport". |
| B4 | 🟡 | Analytics section legend mismatch | Dark "Your impact, measured with care" chart shows one bar series but legend lists "Citations this year" + "h-index growth". | Match legend to series or add the second series. |
| B5 | 🟡 | Blog metadata looks auto-generated | All 5 posts dated April 2, 2026; author avatar "J" with no name. Newsletter promises a monthly digest (verify it sends). | Real dates, named author with photo. |
| B6 | 🟢 | Mobile search placeholder truncates | "Search for any research…" at 375px. | Shorten to "Search researchers…". |

## C. Public researcher profile (demo preview + claimed subdomains)

| # | Sev | Issue | Detail | Fix |
|---|-----|-------|--------|-----|
| C1 | 🔴 | Demo profile showcases failure modes | Feynman demo: default year-desc sort surfaces 2023 reissues with 0 citations and a misattributed musicology/Beckett volume; "Milestone: 500 citations in 1939"; career span "1939–2026"; topic "Computational Physics **and Python Applications**". Landmark papers (7.5k citations) buried. | Citations-desc default sort; pick a clean-data demo researcher; suppress anomalous derived stats. |
| C2 | 🔴 | Journey chart renders empty on the demo | Axes + rocket/star icons, no data series, on the page every prospect sees. (Renders fine on zahi.scholar.name → data-specific rendering bug.) | Debug cumulative-series computation for pre-digital-era publication years. |
| C3 | 🟠 | Names render in raw OpenAlex casing | `zahi.scholar.name` shows "zahi abdul sater" lowercase in header, hero, and `<title>`. | Title-case display names by default; allow owner override in dashboard. |
| C4 | 🟠 | User-entered website URL not normalized | Profile "Website" link href is literally `scholar.name` → resolves to `zahi.scholar.name/scholar.name` (broken relative link). | Prepend `https://` on save/render; validate URLs in dashboard. |
| C5 | 🟠 | Junk/custom sections publish with zero guardrails | A section titled "test" with body "test" is live on the founder's public profile **and appears as a nav tab labeled "test"**. | Add a preview-before-publish step or per-section draft/visibility default = hidden; warn when publishing near-empty sections. |
| C6 | 🟠 | Preview banner mixes two audiences | "Create yours at `<feynman's URL>`" + button "Claim This Profile" (mobile: "Like what you see? Create your own portfolio!" → "Claim This Profile"). | Primary: "This is you? Claim this profile." Secondary: "Create your own portfolio." |
| C7 | 🟠 | Hero shows a subdomain that doesn't exist | Visiting `zahi.scholar.name`, the hero displays `zahiabdulsater.scholar.name` — which is **not in the tenant's domains table** (registered: `zahi.scholar.name`, `zahi-abdulsater-0a1666.scholar.name`). The displayed URL is fabricated from the name; visitors who type it get the marketing homepage. | Display the primary domain from the domains table. |
| C8 | 🟡 | Empty About shows editor placeholder publicly (preview profiles) | Demo shows italic instruction text "Share your research journey…". | Hide empty sections on public view. |
| C9 | 🟡 | Publication cards emphasize "0" | Giant right-aligned citation count makes zero-citation papers shout "0"; topic chips louder than titles. | Small gray "no citations yet"; cap chips at 2 + overflow. |
| C10 | 🟡 | Honorific separator | "Dr. · Associate Professor …" reads as a list item. | Attach honorific to name ("Dr. Zahi Abdul Sater"). |
| C11 | 🟡 | Dead/disabled controls on public pages | Grayed "Download CV" and "Report Issue" buttons visible to visitors when unavailable. | Hide unavailable actions publicly. |
| C12 | 🟡 | Mobile "About" tab is a dead button when About is empty; active-tab highlight stays on "Insights" | Tapping About does nothing on zahi.scholar.name; initial load lands mid-page with Insights active instead of Overview at top. | Hide tabs for absent sections; fix scrollspy/initial anchor. |
| C13 | 🟢 | Bottom-nav buttons lack accessible names | Tab buttons expose no aria-label/text to the accessibility tree. | Add labels. |

## D. Researcher dashboard (live authenticated walkthrough)

Overall: good bones — trial banner with days remaining, completion checklist,
clear tab structure (Profile / Publications / Sections / Sync / Settings), a
capable WYSIWYG section editor with visibility/edit/delete controls, honest
visibility toggle copy, per-publication PDF upload, QR code, preview link.
Issues found live:

| # | Sev | Issue | Detail | Fix |
|---|-----|-------|--------|-----|
| D1 | 🟠 | Completion checklist "Upload a photo" never completes | Confirmed live: photo is uploaded and visible on the same page, checklist stuck at 50% with photo step unchecked. Root cause `ResearcherDashboard.tsx:1365` checks `profile.photoUrl`; field is `profileImageUrl`. | Fix field name. |
| D2 | 🟠 | Checklist "Add a custom domain" links to a 404 | `href="/dashboard/domains"` — route doesn't exist. Worse: **no customer-facing domain management exists at all** (Settings only shows "Your Domain" read-only; domains are added in the admin portal). | Point the step somewhere real; build or descope the feature. |
| D3 | 🟡 | Checklist unfinishable on Starter/Free | Custom-domain step is Pro-only → completion capped at 75%. | Plan-aware steps. |
| D4 | 🟡 | "No themes available. Contact your administrator." empty state | 5 active themes exist, so this message = failed fetch misreported; and users have no "administrator." | Error-state copy + retry. |
| D5 | 🟡 | New sections publish live immediately | Visibility eye-toggle exists per section, but "test"/"test" went straight to the public site and its nav. | Default new sections to hidden, or add an explicit publish step. |
| D6 | 🟢 | Inline-styles monolith | 2,403-line component, hardcoded hex, no dark mode. | Incremental extraction to tokens. |
| D7 | 🔴 | Greeting: "Welcome back, *sater*." | Naive `displayName.split(" ").slice(-1)` grabs the last word of a lowercase multi-word name — greets the founder with half his surname. | Greet with first name from the account (`user.firstName`), title-cased. |
| D8 | 🟠 | Three surfaces, three sync stories | Dashboard header: "Last synced: 7/7/2026". Public profile footer: "Last sync: Jul 18, 2026 11:04 PM". Dashboard Sync tab + admin: "No sync history yet". Customer can't tell what's true. | One sync log table, rendered everywhere. |
| D9 | 🟠 | Citation counts disagree with the public site | Dashboard stats say **707** citations (live OpenAlex fetch); the public profile says **696** (synced DB). Undermines "always up to date" from the owner's own vantage. | Show synced values + "X new since last sync" delta, or sync on dashboard load. |
| D10 | 🟠 | "0 featured" in dashboard, 3 Featured Works shown publicly | Publications tab says 0 featured of 56; the public page displays 3 "Featured Works" (top-cited fallback). Owner has no way to know what visitors actually see. | Label the fallback in-dashboard ("Auto-selected by citations — pick your own"). |
| D11 | 🟡 | Settings plan row contradicts the upgrade banner | Banner: "3 days left… Upgrade now" (self-serve checkout). Settings: "Plan: Free — Contact support to change your plan," plus "Cancel Subscription / Request cancellation" for a not-yet-paying trial user. Admin shows the same account as "Free Trial". | One plan model, one upgrade path, consistent labels. |
| D12 | 🟡 | Theme picker: indistinguishable swatches, no active indicator | All 5 swatches render as near-identical navy cards; nothing marks the currently applied theme. | True-color swatches + selected state (also admin, E7). |
| D13 | 🟡 | Off-palette action buttons | "Preview" is generic blue, "Download QR" purple — brand is navy/gold (same drift class as E2/E7). | Token-based buttons. |
| D14 | 🟡 | CV dead-button root cause confirmed | Settings: "No CV uploaded yet" → public page still renders a disabled "Download CV" button (C11). | Hide the public button when no CV. |
| D15 | 🟢 | Tab state isn't in the URL; `<title>` stuck on "Sign In — Scholar.name" | Refresh loses your tab; browser history/title never update inside the dashboard (admin has the same title bug, E8). | Route-per-tab + per-route titles. |
| D16 | 🟢 | Customers get no analytics | Admin sees per-customer views/clicks (currently zeros, E5); customers see nothing. Traffic stats are a classic retention/upgrade lever ("your profile got 40 views this month"). | Surface analytics in the dashboard once E5 is fixed. |

## E. Admin portal (live authenticated walkthrough)

Overall: the strongest surface. Solid IA (sidebar: Home/Customers/Billing/Sync +
Platform group with Themes/Users), a genuinely useful "Needs Attention" triage
card (trial expirations show correctly), a well-organized customer-detail page
(Overview / Domains & Site / Billing / Sync & Data / Users tabs, status actions
with reason-to-notes, danger zone separated), and an OpenAlex-ID rebind tool.
Uses real links. Issues found live:

| # | Sev | Issue | Detail | Fix |
|---|-----|-------|--------|-----|
| E1 | 🟡 | Admin login publicly discoverable at `/admin` with product branding and `admin@scholar.name` placeholder | The placeholder matches the real admin account email (confirmed on Platform Users page) — gift to attackers. Admin UI code also ships in the public JS bundle. | Neutral placeholder; consider unlinked path + rate limiting (verify server-side rate limit applies to admin login). |
| E2 | 🟡 | Raw Tailwind palette colors | `text-blue-600`, `amber-500/10`, etc. — DESIGN_SYSTEM.md explicitly retires generic blues/ambers. | Map to theme tokens. |
| E3 | 🟢 | Split-screen admin login leaves dead white column at narrow widths | Seen at 375px: dark panel + empty white gutter. | Stack/center at small widths. |
| E4 | 🟠 | Sync history is empty despite real syncs | Customer "Sync & Data" tab and the Sync Health board both say "No sync activity recorded yet," while the tenant's public profile footer shows "Last sync: Jul 18, 2026, 11:04 PM." Initial/manual syncs aren't logged → the sync-health board can't be trusted for support. | Log every sync run (manual, initial, scheduled) to the same table. |
| E5 | 🟠 | Profile analytics record nothing | Customer detail "Analytics (last 30 days)" shows 0 views / 0 visitors / 0 clicks / 0 downloads despite repeated real visits to `zahi.scholar.name` on Jul 18–19. Tracking is not firing on public profiles (or writes fail silently). | Debug the analytics event pipeline end-to-end. |
| E6 | 🟠 | Domain SSL status stuck at "pending" | Both domains show "SSL: pending" badge while `zahi.scholar.name` demonstrably serves valid HTTPS (wildcard cert). Stale/never-updated status makes the panel misleading. | Verify SSL programmatically or drop the badge for wildcard-covered subdomains. |
| E7 | 🟡 | Theme Management page breaks admin conventions | No AdminShell sidebar (only "Back to Dashboard"), primary button is **purple** (off-palette), and theme preview swatches are near-identical dark rectangles (Imperial Garnet's swatch doesn't look burgundy). | Wrap in AdminShell; brand-colored button; larger true-color swatches. |
| E8 | 🟢 | Document `<title>` stuck on "Admin Sign In — Scholar.name" | Title never updates across admin routes after login. | Set per-route titles. |
| E9 | 🟢 | "Welcome, Platform" greeting | Home greets by `firstName` of the "Platform Admin" account. | Fall back to full name or "Welcome back." |
| E10 | 🟢 | Sidebar nav links lack accessible names | Icon links expose no text to the accessibility tree (also true of profile bottom-nav, C13). | Add aria-labels/visible text association. |

Cross-check note: the researcher dashboard's themes empty-state (D4) says "No
themes available" — 5 active themes exist in admin, so if a user ever sees that
message it's a fetch failure, not a data gap; the copy misdiagnoses it either way.

## F. Functional / write-path testing (live, authenticated, 2026-07-19)

Exercised end-to-end on the founder's own account with clearly-labeled test data,
all reverted afterward (final state verified: bio null, no CV, public, 0 featured,
only the pre-existing "test" section remains). Not exercised: signup/email
verification (won't create accounts), dashboard password change (would change the
real password), admin suspend/cancel/plan/notes (destructive to the live account),
real payment (checkout is disabled anyway — see F1).

**Confirmed working:** profile bio save + public propagation (unicode/Arabic/accents
OK, HTML escaped); CV upload; section create/visibility-toggle/delete; publication
feature/unfeature (propagates to public Featured Works); publication PDF upload;
manual "Sync Now" (writes a sync log, updates counts); public/private toggle
(hides the profile); password reset (enumeration-safe "if registered" copy); QR
code (PNG); bibliography export (valid BibTeX, correct filename).

| # | Sev | Issue | Evidence | Fix |
|---|-----|-------|----------|-----|
| F1 | 🔴 | **The entire paid-conversion path is a dead end.** `/checkout` shows "Payment Coming Soon"; `/api/checkout/config` → `isConfigured:false`. Its only CTA is "Contact Us" → the contact form, which is **also broken (F2)**. Meanwhile the dashboard banner says "Upgrade now," pricing pages say "Get Started/Start free trial," and Settings says "Contact support to change your plan." Four entry points, zero that complete. | Live probes 2026-07-19. | Ship MontyPay checkout, or make every upgrade CTA honestly say "coming soon" and route to a **working** contact channel. Resolve the D11 four-way copy conflict at the same time. |
| F2 | 🔴 | **Enterprise/contact form can never submit** — client/server field-name mismatch. Client `ContactPage.tsx` sends `{fullName, email, institutionName, teamSize, message, planInterest}`; server `routes.ts:1258` requires `fullName, email, planInterest, biography`. `biography`/`institution`/`estimatedProfiles` are never sent → **every** submission returns HTTP 400 "Missing required fields." User sees "Submission Failed." | POST `/api/contact` → 400, reproduced. | Align field names (map `message`→`biography` or change the server contract); add an integration test; verify SMTP is configured (handler also hard-requires `SMTP_PASSWORD`). This is the only institutional-sales lead channel. |
| F3 | 🟠 | **Deleting a CV or publication PDF orphans the file on disk.** After "Remove CV" and "Remove PDF," the DB `cvUrl`/`pdfUrl` is nulled but the old file at `/uploads/...` still returns HTTP 200 — publicly, forever. Same on re-upload (old file never cleaned). Slow disk leak on constrained A2 storage + privacy issue (a "deleted" CV stays public at a guessable-ish URL). | `oldFileStatus: 200` after delete. | Unlink the previous file on delete and on replace. Sweep existing orphans. |
| F4 | 🟠 | **D9 mechanism confirmed — public profiles serve stale data with no auto-refresh.** Before a manual sync the public page showed 696 citations vs the dashboard's live 707; after clicking "Sync Now" the public page updated to 707. So the 30-day sync cadence means a profile can advertise months-old numbers, silently, against the "always up to date" promise. | Reproduced via sync. | Shorten cadence or sync-on-view with a short TTL cache; show "as of <date>" on public stats; see WS3. |
| F5 | 🟡 | **Sync log `itemsProcessed` is always 0 / meaningless.** The manual sync changed citations 696→707 but the sync-log row recorded `itemsProcessed: 0, itemsTotal: null`. The admin Sync Health board and dashboard history can't show what a sync actually did. | Sync-log API row. | Populate real counts (works added/updated, citation delta). |
| F6 | 🟡 | **D5 proven live: new sections publish instantly, no confirmation.** Creating "Claude Review Test Section" made it visible on the public site and its nav immediately (`isVisible:true` default); the per-section eye-toggle then correctly hides it. So the guardrail exists but defaults the wrong way. | Reproduced. | Default `isVisible:false` on create, or add a publish step. |
| F7 | 🟢 | Bibliography BibTeX minor quality: citation keys collide-prone (`article20261` = year+index mashed) and author diacritics are stripped (`Abu Sittah` vs `Abu‐Sittah`). | Export inspected. | Use `authorYearLetter` keys; preserve UTF-8 in the BibTeX writer. |

## Remediation plan

**WS0 — Revenue & lead-capture unblock (F1, F2, D11) · ~1 day · do first.**
Two 🔴 bugs sit on the money path and were only found by driving it live: the
contact form 400s on every submit (client/server field mismatch —
`message`/`institutionName`/`teamSize` vs `biography`/`institution`/
`estimatedProfiles`), and checkout is disabled with its only fallback pointing
at that broken form. Fix the field mapping + add an integration test; then
decide the upgrade story (ship MontyPay, or make every "Upgrade"/"Get Started"
CTA honestly read "coming soon" and route to a channel that works) and unify
the four contradictory plan-copy strings. Nothing else matters if a ready-to-pay
customer or institution literally cannot reach you.

Then the seven workstreams below, ordered. Each is independently shippable
through the normal `deploy.sh` → push pipeline. Everything below respects the A2 constraint
(single-threaded, no new server processes, no SSR framework — just string
templating in the existing Express handler).

### WS1 — Shareability & SEO (A1, A2, A4, A5, A6, A7) · ~2–3 days · highest impact

The catch-all in `server/static.ts` currently `sendFile`s a static `index.html`
for every route. Replace it with a template handler:

1. **Meta injection**: read `index.html` once at boot, split around the
   `<head>` insertion point. For requests matching a tenant host (reuse
   `tenantMiddleware` resolution) or `/researcher/:id`, look up the profile
   (one indexed DB query, cache in-memory for ~5 min) and interpolate
   `<title>`, `meta description`, canonical, and OG/Twitter tags
   server-side. Escape all interpolated values. All other routes get the
   static per-page defaults (title/description per marketing route from a
   small map).
2. **OG image**: Phase A (same day): make `og:image` an **absolute** URL —
   profile photo when present, else a static branded 1200×630 PNG committed to
   the repo. Phase B (later): pre-render a per-profile card (name, affiliation,
   stats on the navy/gold template) at **sync time** — SVG template →
   `sharp` with `sharp.concurrency(1)` → cached `uploads/og/<tenant>.png`.
   Never generate per-request.
3. **Real 404 status**: the same handler returns `res.status(404)` for
   unknown researcher IDs and unmatched subdomains (fixes A6/A7) while still
   rendering the SPA shell so the client 404 page shows.
4. **Unclaimed subdomains** (A6): instead of the marketing page, serve the
   shell with a `window.__TENANT_STATE__ = "unclaimed"` flag; client renders
   the "No portfolio here yet — search or claim" page.
5. **Sitemap** (A5): replace the static `client/public/sitemap.xml` with an
   Express `GET /sitemap.xml` that enumerates the marketing route map, blog
   routes from `App.tsx`'s list, and public tenant primary domains from the DB.
6. **Links** (A4): mechanical sweep of `LandingPage.tsx`, `GlobalNav.tsx`,
   `GlobalFooter.tsx`, marketing pages — replace `onClick={() => navigate(x)}`
   buttons with wouter `<Link>`; keep styles.

### WS2 — Identity & input hygiene (C3, C4, C7, C10, D7) · ~1 day

1. `shared/formatName.ts`: `titleCaseName()` used everywhere a display name
   renders (public hero, header, `<title>`, dashboard greeting, admin tables).
   Apply at render, and also normalize once at save/import.
2. Greeting (D7): use `user.firstName` (account field, already capitalized at
   signup), never `displayName.split(" ")`.
3. URL normalization (C4): on profile save (server side), prepend `https://`
   when scheme is missing, validate with `new URL()`, reject garbage; one-time
   data fix for existing rows.
4. Domain display (C7): public hero + dashboard read the tenant's **primary
   domain from the domains table** — delete the name-derived string entirely.
5. Honorific (C10): render `title + displayName` as one unit ("Dr. Zahi Abdul
   Sater"), not as a separator-delimited list item.

### WS3 — One sync story (D8, D9, D10, E4, F4, F5) · ~1–2 days

1. Single `sync_logs` write path: every sync (initial connect, dashboard
   "Sync Now"/"Refresh Data", admin "Sync Now", scheduled job in
   `syncScheduler.ts`) inserts a row (tenantId, trigger, status, counts,
   startedAt/finishedAt). One `getSyncHistory(tenantId)` API feeds the
   dashboard Sync tab, admin Sync Health board, and customer detail tab.
2. "Last synced" everywhere reads `MAX(finishedAt)` from that table — kills
   the 7/7 vs 7/18 vs "never" contradiction.
3. Citations (D9): dashboard stat cards show the **synced** numbers the public
   sees, plus a subtle "+11 on OpenAlex since last sync — Sync now" delta from
   the live fetch, turning the discrepancy into a feature.
4. Featured works (D10): dashboard Publications tab shows the same fallback the
   public page uses, labeled "Auto-selected (top-cited) — star publications to
   choose your own."

### WS4 — Analytics pipeline (E5, D16) · ~1 day

1. Root cause (confirmed): tracking is only called from
   `ResearcherProfile.tsx` (the `/researcher/:id` preview); the tenant
   subdomain page (`TenantProfilePage` → `ResearcherProfileContent`) never
   fires `POST /api/analytics/track`. Move the tracking hook into the shared
   profile content component; verify the admin per-tenant analytics query joins
   on the ID the tracker writes.
2. Then (D16): "Views this month" card in the dashboard from the same summary
   endpoint — cheap retention lever.

### WS5 — Demo & first impressions (B1, C1, C2) · ~1–2 days

1. Search (B1): switch the proxy at `routes.ts:1141` from
   `/authors?search=` (matches affiliations too) to
   `/autocomplete/authors?q=` (name-focused, relevance-ranked), or add
   `filter=display_name.search:`. Show affiliation as secondary text.
2. Demo (C1): default publications sort = citations-desc (one flag in
   `Publications.tsx`); pick a demo researcher with clean modern data (or a
   consenting real user) and update the homepage "View a demo profile" target;
   suppress derived stats when they're anomalous (milestone year < 1970,
   career span ending in the current year for authors with no works in 5+
   years).
3. Journey chart (C2): debug cumulative-series building against Feynman's
   sparse/pre-digital years (likely null/era years breaking the series);
   add a "not enough data" fallback rather than an empty plot.

### WS6 — Dashboard & admin coherence (D1–D5, D12–D15, E6–E10, F3, F6, F7) · ~2 days

Small fixes, one pass each surface: checklist field name (`photoUrl` →
`profileImageUrl`) and dead link; plan-aware checklist steps; sections default
to hidden on create (F6) with a "publish" nudge; **unlink files on CV/PDF delete
and replace, sweep existing orphans (F3)**; BibTeX key/diacritics fix (F7);
billing copy unified in WS0 (no "cancel subscription" for unpaid trials);
theme swatches rendered from actual theme tokens with a selected state (shared
component for dashboard + admin); replace off-palette blue/purple buttons with
token styles; route-per-tab + document titles in dashboard and admin; SSL badge
either verified or removed for wildcard subdomains; neutral admin login
placeholder; sidebar/bottom-nav aria-labels; `maximum-scale` removed (A8).

### WS7 — Marketing trust & content (B2–B6, A10) · ~1–2 days + async outreach

Replace the Doudna mockup with a fictional-but-plausible researcher (or a
consenting user) and delete the "A. Researcher, MIT" quote immediately (both
are trust liabilities shipping today); homepage pricing cards get the real
5-line feature lists; fix the analytics-section legend; blog posts get real
dates and a named author; single logo lockup + "X" label; shorten the mobile
search placeholder.

### Sequencing

| Phase | Ships | Content |
|-------|-------|---------|
| 0 (day 1) | one PR | WS0 — contact-form fix + upgrade-CTA honesty (two 🔴 on the revenue path) |
| 1 | one PR | WS2 + D1/D2 + F3 + B2's quote/mockup removal — "founder-embarrassment" + file-leak batch, all small |
| 2 | one PR | WS1 (SSR meta + OG Phase A + sitemap + links + 404s) |
| 3 | one PR | WS3 + WS4 — the data-trust batch |
| 4 | one PR | WS5 — demo/search first impressions |
| 5 | 1–2 PRs | WS6 + WS7 + OG Phase B |

## Priority order

0. **F1 + F2 + D11** — unblock the revenue/lead path: fix the contact form (400s on every submit) and the upgrade CTAs (checkout disabled, all four entry points dead-end). Found only by driving it live; nothing else matters if customers can't reach you or pay you.
1. **A1 + A2** — SSR meta + real OG images (sharing is the product's core promise).
2. **A3** — stop advertising SSL-broken URLs.
3. **B1** — fix hero search ranking.
4. **C1 + C2** — demo profile: sort default, clean demo researcher, fix empty chart.
5. **C3 + C4 + C5 + C7 + D7** — name handling batch: title-casing, greeting, URL normalization, section guardrails, real primary domain (the founder's own account currently shows all of these).
6. **D8 + D9 + D10 + E4** — one coherent sync/data story: single sync log, consistent citation counts, labeled featured-works fallback.
7. **E5 (+D16)** — fix analytics pipeline, then surface stats to customers.
8. **D1 + D2** — dashboard checklist bugs (two-line fixes).
9. **A4 + A5** — real links + complete sitemap.
10. **B2** — real social proof; **B3** homepage pricing cards; **D11** plan-copy consistency; **E6** SSL badge; remaining 🟡/🟢 hygiene items.
