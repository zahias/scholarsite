# Pre-launch review — 2026-10-12

Whole-site review of scholar.name across content, SEO, security, privacy/legal,
payments, infrastructure, performance, and mobile UX. Method: live probes of
https://scholar.name (curl, DNS, TLS, in-app browser at desktop + 375px) plus a
read of the server code. Ordered by launch risk.

## Blockers — fix before launch

### 1. Every page's canonical tag points to the homepage
`client/index.html` hard-codes `<link rel="canonical" href="https://scholar.name" />`,
and only `/` and `/researcher/:id` go through `renderIndexHtml`. So `/pricing`,
`/features`, `/faq`, every `/blog/*` post, `/privacy` etc. are served to crawlers
with the homepage's title, description and canonical. Google treats them as
duplicates of `/` and will mostly not index them — the blog posts in the sitemap
are effectively invisible. (The client-side `SEO.tsx` fixes it after JS runs,
but the server HTML is what's authoritative for many crawlers and all link
previews.)
**Fix:** route all marketing/blog paths through `renderIndexHtml` with per-route
meta (a small route → {title, description} map), or at minimum set canonical to
the request URL.

### 2. Anyone can claim any researcher's profile
`POST /api/auth/register` accepts any `openalexId`, creates an **active** tenant
immediately (`createTrialTenant` → `status: "active"`), and publishes a public
site — before email verification and with no proof the person *is* that
researcher. The "Claim This Profile" button on every preview invites this.
Consequences: impersonation (custom bio/photo/CV on a real academic's name), and
squatting — the real researcher then gets "This researcher profile is already
registered".
**Fix:** require verified email before the site goes public, plus an ownership
check — ORCID OAuth (OpenAlex exposes the author's ORCID), or institutional email
domain matching the OpenAlex affiliation, with manual admin review as fallback.
Add a "report impersonation / dispute claim" path.

### 3. Paid checkout is not live
`GET /api/checkout/config` → `{"isConfigured":false}`. Trials end after 14 days
and sites go inactive, with no way to pay. Also verify the webhook scheme: the
handler expects an HMAC-SHA256 of `JSON.stringify(req.body)` in an
`x-webhook-signature` header; confirm that matches what MontyPay actually sends
(re-serialised JSON rarely byte-matches the signed payload). Run one real
sandbox payment end-to-end before launch.

### 4. Legal pages promise features that don't exist
- Privacy & Terms: "delete your account in Settings → Account" and "export your
  data from Settings" — the dashboard Settings tab has no delete or export.
- Privacy: "analytics cookies… you can disable analytics cookies in Settings" —
  no such toggle; and no GA ID is compiled into the production bundle, so there
  are no analytics at all.
- Terms name plans "Scholar Pro" / "Institution"; the pricing page sells
  Starter / Pro.
**Fix:** build account deletion + JSON export (GDPR obligation, and you've
promised it), and make the policy describe what actually runs.

### 5. Confirm deploys can't wipe user uploads, and set up backups
Local uploads are written to `<app>/public/uploads/...` (`saveFileLocally`).
`deploy.yml` runs `git reset --hard && git clean -fd` in `A2_PATH`. If `A2_PATH`
is the app directory itself, every deploy deletes all uploaded photos/CVs/PDFs
(neither `uploads` nor `public/` is gitignored, so they're "untracked"). Check
the secret's value. Separately, there is no documented DB/uploads backup —
set up a nightly `pg_dump` + uploads archive and do one test restore.

## High

6. **HTTP is not redirected to HTTPS.** `http://scholar.name/` returns 200.
   Because the session cookie is `secure: true`, logging in over http silently
   fails. Add a 301 to https (LiteSpeed `.htaccess` or Express middleware).
7. **www is not redirected** — `www.scholar.name` serves a duplicate site. 301 to apex.
8. **Soft 404s + missing icons.** Unknown paths return 200 + the homepage
   (e.g. `/this-does-not-exist`). `index.html` references `/favicon.svg`, which
   doesn't exist (returns HTML), and `/favicon.ico` also returns HTML → no
   favicon. `og:image` is `/og-image.svg`; Facebook, LinkedIn, X and WhatsApp
   don't render SVG, so shared marketing links have no image. Ship
   `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, and a 1200×630
   `og-image.png`; return 404 status for unknown routes.
9. **Stale PWA manifest** — name "Research Profile Platform", short name
   "ResearchHub", blue `#3b82f6` theme, shortcut to `/researcher`. That's what
   users see if they "Add to Home Screen".
10. **Session hardening** (docs claim these exist; code doesn't):
    - No `session.regenerate()` on login/register (session fixation).
    - Password reset doesn't invalidate the user's other sessions.
    - `SESSION_SECRET` falls back to a hard-coded string — and the repo is
      public, so if the env var is ever missing, anyone can forge admin
      sessions. Refuse to start in production without it.
11. **Render path is serial.** Nothing paints until all JS — including the
    101 KB (brotli) charts vendor chunk, modulepreloaded on every page — has
    loaded, and only *then* does `/api/site-context` start; the page waits on
    that too. The LCP hero is a 175 KB Unsplash hotlink. Lazy-load the charts
    chunk, don't block first paint on site-context (or inline it into the HTML
    server-side), self-host the hero as AVIF/WebP.
    *(Absolute timings not measured — this machine's link was ~8 KB/s and the
    PageSpeed API quota was exhausted. Re-run PageSpeed Insights.)*
12. **No Content-Security-Policy**, and `X-Powered-By: Express` is exposed.
    Add CSP (start in report-only) and `app.disable('x-powered-by')`.

## Medium

13. Preview profiles display a handle like `jasonrpriem.scholar.name` that
    404s; real signups get `jason-priem-a1b2c3.scholar.name`. Don't advertise a
    URL the user won't get. The preview subtitle also showed "OpenAlex" where an
    affiliation would be expected.
14. Mobile profile (375px): the "Claim your profile" banner and bottom nav are
    both fixed and stack to ~200px, covering content. Footer links are 17px
    tall (WCAG 2.2 target size is 24px).
15. Unclaimed preview pages exist for every OpenAlex author, are indexable, and
    self-canonical — a large thin-content surface and pages about real people
    who never signed up. Consider `noindex` on unclaimed previews.
16. 500 responses return `err.message` to the client (`index-production.ts`
    error handler) — return a generic message.
17. Email/DNS: DMARC is `p=none` (move to `quarantine` once reports look
    clean); no CAA record; no IPv6. Send a test to mail-tester.com for the
    verification/reset emails.
18. Monitoring: `/api/health` is good — point an external uptime monitor at it
    and add error alerting (errors only go to console logs today). Turn
    analytics on (privacy-friendly) so you can measure launch.
19. Repo is public and carries screenshots, Replit paste dumps, and many
    obsolete deploy guides; hosting username and SSH port are visible. Git
    history was scanned — only placeholder credentials, no real secrets.

## Passed

- TLS 1.3 only; Let's Encrypt wildcard valid to 2027-01-04; HSTS 2 years.
- `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` set.
- Hashed assets: brotli + 7-day cache.
- SPF, DKIM, DMARC records present.
- robots.txt and sitemap.xml are valid and served dynamically.
- Profile pages: server-rendered title/OG/canonical + `Person` JSON-LD.
- Real 404s for unknown researcher, unknown subdomain, unknown `/api/*`.
- Ownership checks on section/publication edits (no IDOR found).
- SVG uploads blocked, size limits on uploads.
- Rate limits on login, register, forgot-password, contact, analytics.
- Reset tokens are 32 random bytes, 1-hour, single-use; forgot-password
  doesn't enumerate emails.
- Payment webhook fails closed without a secret.
- No horizontal scroll at 375px; one H1 per page; `lang="en"`.

## Not covered

`npm audit` (registry timed out), Lighthouse scores, contrast + screen-reader
pass, Safari/iOS and Firefox, actual email delivery, admin panel walkthrough,
contact-form submission (sends real mail), load testing (careful — A2 NPROC).
