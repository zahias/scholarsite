# A2 NPROC Stabilization Runbook

## Deployment safeguards

- Build locally with `./deploy.sh`; never run npm or the application build on A2.
- Commit `production/` and push `main`; GitHub Actions serializes deployments.
- The web process does not run scheduled OpenAlex synchronization or hold SSE connections.
- GitHub Actions calls the protected synchronization endpoint daily. Profiles are synchronized only when their last successful check is at least 30 days old.

## Required configuration

Set the same strong random `SYNC_JOB_TOKEN` value in:

1. The Scholar.name cPanel Node.js application environment.
2. The GitHub repository Actions secret named `SYNC_JOB_TOKEN`.

Restart the application once after adding the cPanel variable.

## One-time A2 recovery

1. Stop Scholar.name from cPanel.
2. Ask A2 support to terminate only stale Passenger workers for `/home/bannwebs/scholarsite/` and report current NPROC usage.
3. Ask A2 to cap Scholar.name at one Passenger application instance, or provide its supported cPanel equivalent.
4. Do not run account-wide `pkill -f node` or install a recurring `pkill` cron job.
5. Start Scholar.name once and verify `https://scholar.name/api/health` returns HTTP 200.
6. Retry a failed deployment workflow only once after health is restored.

If health returns `Database unreachable`, repair `DATABASE_URL` or PostgreSQL availability before running synchronization.
