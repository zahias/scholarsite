# Lessons

## 2026-06-10 Design Cleanup

- Do not render support chat on high-focus form or profile routes unless explicitly approved; it competes with auth, checkout, contact intent, and profile navigation.
- Auth surfaces should use one shared shell language: `.auth-page-shell`, `.auth-center`, `.auth-card`, `.auth-mark`, `.auth-title`, and `.auth-copy`.
- Empty states should feel intentional, with a clear panel, Lucide icon, concise explanation, and one useful action where appropriate.
- Avoid generic utility color systems such as blue info banners on branded public pages; use Scholar palette tokens or documented helper classes.
- The active display serif in the app is Newsreader. Do not introduce another serif family without a deliberate design-system update.
- Public subpages should use `.public-masthead`, `.public-section`, `.public-card`, and `.public-cta-band` helpers instead of recreating hero/card styles inline.
- Editorial/category colors should stay inside the Scholar palette unless a full illustration or editorial system is approved.
