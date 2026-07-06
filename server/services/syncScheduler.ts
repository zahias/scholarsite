import { storage } from "../storage";
import { pool } from "../db";
import { OpenAlexService } from "./openalexApi";

const openalexService = new OpenAlexService();

// Sync history used to live only in an in-memory array, which reset to empty
// on every server restart — meaning the admin dashboard's "sync history" was
// wiped by every deploy, while the actual sync_logs table sat unused. Every
// sync attempt below is now persisted there via storage.createSyncLog so the
// history survives restarts and matches what the DB actually recorded.
interface SyncLog {
  tenantId: string;
  tenantName: string;
  openalexId: string;
  syncFrequency: string;
  lastSyncedAt: Date | null;
  status: 'success' | 'skipped' | 'error';
  message: string;
  timestamp: Date;
}

let isSyncRunning = false;
const SYNC_LOCK_NAMESPACE = 193648267;
const SYNC_LOCK_ID = 1;

export interface ScheduledSyncStats {
  synced: number;
  skipped: number;
  errors: number;
  alreadyRunning: boolean;
}

async function persistSyncLog(tenantId: string, profileId: string | undefined, log: SyncLog): Promise<void> {
  try {
    await storage.createSyncLog({
      tenantId,
      profileId,
      syncType: 'full',
      status: log.status === 'success' ? 'completed' : log.status === 'skipped' ? 'skipped' : 'failed',
      errorMessage: log.status === 'error' ? log.message : null,
      startedAt: log.timestamp,
      completedAt: log.status === 'skipped' ? log.timestamp : new Date(),
    } as any);
  } catch (error) {
    console.error('[SyncScheduler] Failed to persist sync log:', error);
  }
}

const MONTHLY_SYNC_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

function isDueForSync(lastSyncedAt: Date | null): boolean {
  if (!lastSyncedAt) {
    return true;
  }

  const now = new Date().getTime();
  const lastSync = new Date(lastSyncedAt).getTime();

  return (now - lastSync) >= MONTHLY_SYNC_INTERVAL_MS;
}

async function syncTenant(tenantId: string, tenantName: string, openalexId: string, syncFrequency: string): Promise<SyncLog> {
  const log: SyncLog = {
    tenantId,
    tenantName,
    openalexId,
    syncFrequency,
    lastSyncedAt: null,
    status: 'success',
    message: '',
    timestamp: new Date(),
  };

  try {
    console.log(`[SyncScheduler] Starting sync for tenant: ${tenantName} (${openalexId})`);

    await openalexService.syncResearcherData(openalexId);

    const profile = await storage.getResearcherProfileByTenant(tenantId);
    if (profile) {
      await storage.updateResearcherProfile(profile.id, {
        lastSyncedAt: new Date()
      });
    }

    await storage.updateTenant(tenantId, {
      lastSyncAt: new Date()
    });

    log.status = 'success';
    log.message = 'Data synced successfully from OpenAlex';
    log.lastSyncedAt = new Date();
    console.log(`[SyncScheduler] Completed sync for tenant: ${tenantName}`);
  } catch (error) {
    log.status = 'error';
    log.message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SyncScheduler] Error syncing tenant ${tenantName}:`, error);
  }

  return log;
}

export async function runScheduledSync(): Promise<ScheduledSyncStats> {
  if (isSyncRunning) {
    console.log('[SyncScheduler] Sync already running, skipping this tick');
    return { synced: 0, skipped: 0, errors: 0, alreadyRunning: true };
  }

  if (!pool) {
    throw new Error('Database unavailable for scheduled synchronization');
  }

  const lockClient = await pool.connect();
  let lockAcquired = false;

  try {
    const lockResult = await lockClient.query(
      'SELECT pg_try_advisory_lock($1, $2) AS acquired',
      [SYNC_LOCK_NAMESPACE, SYNC_LOCK_ID],
    );
    lockAcquired = lockResult.rows[0]?.acquired === true;
  } catch (error) {
    lockClient.release();
    throw error;
  }

  if (!lockAcquired) {
    lockClient.release();
    console.log('[SyncScheduler] Another process owns the synchronization lock');
    return { synced: 0, skipped: 0, errors: 0, alreadyRunning: true };
  }

  console.log('[SyncScheduler] Starting scheduled sync check...');
  isSyncRunning = true;

  const stats: ScheduledSyncStats = { synced: 0, skipped: 0, errors: 0, alreadyRunning: false };

  try {
    const allTenants = await storage.getAllTenants();
    const activeTenants = allTenants.filter((t: any) => t.status === 'active');

    console.log(`[SyncScheduler] Found ${activeTenants.length} active tenants to check`);

    for (const tenant of activeTenants) {
      const profile = await storage.getResearcherProfileByTenant(tenant.id);

      if (!profile || !profile.openalexId) {
        const skipLog: SyncLog = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          openalexId: '',
          syncFrequency: 'monthly',
          lastSyncedAt: null,
          status: 'skipped',
          message: 'No OpenAlex ID configured',
          timestamp: new Date(),
        };
        await persistSyncLog(tenant.id, profile?.id, skipLog);
        stats.skipped++;
        continue;
      }

      const syncFrequency = 'monthly';
      const lastSyncedAt = profile.lastSyncedAt;

      if (!isDueForSync(lastSyncedAt)) {
        const skipLog: SyncLog = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          openalexId: profile.openalexId,
          syncFrequency,
          lastSyncedAt,
          status: 'skipped',
          message: `Not due for sync (last synced: ${lastSyncedAt?.toISOString()})`,
          timestamp: new Date(),
        };
        await persistSyncLog(tenant.id, profile.id, skipLog);
        stats.skipped++;
        continue;
      }

      const log = await syncTenant(tenant.id, tenant.name, profile.openalexId, syncFrequency);
      await persistSyncLog(tenant.id, profile.id, log);

      if (log.status === 'success') {
        stats.synced++;
      } else {
        stats.errors++;
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s between tenants to reduce server load
    }

    console.log(`[SyncScheduler] Sync check complete. Synced: ${stats.synced}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  } catch (error) {
    console.error('[SyncScheduler] Error running scheduled sync:', error);
    throw error;
  } finally {
    isSyncRunning = false;
    try {
      await lockClient.query('SELECT pg_advisory_unlock($1, $2)', [SYNC_LOCK_NAMESPACE, SYNC_LOCK_ID]);
    } finally {
      lockClient.release();
    }
  }

  return stats;
}

export async function forceSyncTenant(tenantId: string): Promise<SyncLog | null> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    return null;
  }

  const profile = await storage.getResearcherProfileByTenant(tenantId);
  if (!profile || !profile.openalexId) {
    return {
      tenantId,
      tenantName: tenant.name,
      openalexId: '',
      syncFrequency: 'monthly',
      lastSyncedAt: null,
      status: 'error',
      message: 'No OpenAlex ID configured',
      timestamp: new Date(),
    };
  }

  const log = await syncTenant(tenantId, tenant.name, profile.openalexId, 'monthly');
  await persistSyncLog(tenantId, profile.id, log);
  return log;
}
