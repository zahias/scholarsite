# Scholar.name Production Environment Checklist

This app deploys through the tracked `production/` folder:

1. Run local validation and `./deploy.sh`.
2. Commit source changes plus refreshed `production/` artifacts.
3. Push to `main`.
4. GitHub Actions copies `production/*` into `/home/bannwebs/scholarsite/` on A2 and touches `tmp/restart.txt`.

Do not manually edit the live server as the normal deployment path. Manual changes are only for recovery after a failed deploy.

## Required A2 Environment

Set these in the A2 Node.js app environment or in the live `.env` loaded by the Node app:

```bash
NODE_ENV=production
BASE_URL=https://scholar.name
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SESSION_SECRET=<long-random-secret>
```

Launch-critical auth and signup will fail if `DATABASE_URL` cannot connect. A healthy deployment should return `200` from `/api/health`.

## Email

Email-backed flows need SMTP settings:

```bash
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password>
SMTP_FROM=<sender-email>
```

If SMTP is missing, signup can still create accounts when the database is healthy, but verification, password reset, and contact notifications may not work as intended.

## Payments

Paid checkout needs MontyPay settings:

```bash
MONTYPAY_MERCHANT_KEY=<merchant-key>
MONTYPAY_SECRET_KEY=<secret-key>
MONTYPAY_WEBHOOK_SECRET=<webhook-secret>
```

If these are missing, `/api/checkout/config` should report that checkout is not configured and pricing/upgrade flows must avoid promising a working paid checkout.

## Post-Deploy Smoke Checks

Run these after GitHub Actions completes:

```bash
curl -i https://scholar.name/api/health
curl -i -X POST https://scholar.name/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"codex-smoke-test@example.invalid","password":"not-a-real-password"}'
curl -i https://scholar.name/api/checkout/config
```

Expected results:

- `/api/health` returns `200`.
- Fake login returns `401 Invalid credentials`, not `500 Login failed`.
- `/api/checkout/config` returns `isConfigured: true` only when paid checkout is ready.

If `/api/health` is `503 Database unreachable`, fix A2 database credentials, database grants, host/port reachability, or database availability before debugging the frontend.
