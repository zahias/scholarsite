import { storage } from "../storage";
import { OpenAlexService } from "./openalexApi";

const openalexService = new OpenAlexService();

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

const syncLogs: SyncLog[] = [];
const MAX_LOGS = 100;

function addSyncLog(log: SyncLog) {
  syncLogs.unshift(log);
  if (syncLogs.length > MAX_LOGS) {
    syncLogs.pop();
  }
}

export function getSyncLogs(): SyncLog[] {
  return [...syncLogs];
}

function getSyncIntervalMs(frequency: string): number {
  switch (frequency) {
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function isDueForSync(lastSyncedAt: Date | null, frequency: string): boolean {
  if (!lastSyncedAt) {
    return true;
  }

  const intervalMs = getSyncIntervalMs(frequency);
  const now = new Date().getTime();
  const lastSync = new Date(lastSyncedAt).getTime();

  return (now - lastSync) >= intervalMs;
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

export async function runScheduledSync(): Promise<{ synced: number; skipped: number; errors: number }> {
  console.log('[SyncScheduler] Starting scheduled sync check...');
  
  const stats = { synced: 0, skipped: 0, errors: 0 };

  try {
    const allTenants = await storage.getAllTenants();
    const activeTenants = allTenants.filter(t => t.status === 'active');

    console.log(`[SyncScheduler] Found ${activeTenants.length} active tenants to check`);

    for (const tenant of activeTenants) {
      const profile = await storage.getResearcherProfileByTenant(tenant.id);
      
      if (!profile || !profile.openalexId) {
        const skipLog: SyncLog = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          openalexId: '',
          syncFrequency: tenant.syncFrequency || 'monthly',
          lastSyncedAt: null,
          status: 'skipped',
          message: 'No OpenAlex ID configured',
          timestamp: new Date(),
        };
        addSyncLog(skipLog);
        stats.skipped++;
        continue;
      }

      const syncFrequency = tenant.syncFrequency || 'monthly';
      const lastSyncedAt = profile.lastSyncedAt;

      if (!isDueForSync(lastSyncedAt, syncFrequency)) {
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
        addSyncLog(skipLog);
        stats.skipped++;
        continue;
      }

      const log = await syncTenant(tenant.id, tenant.name, profile.openalexId, syncFrequency);
      addSyncLog(log);

      if (log.status === 'success') {
        stats.synced++;
      } else {
        stats.errors++;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`[SyncScheduler] Sync check complete. Synced: ${stats.synced}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  } catch (error) {
    console.error('[SyncScheduler] Error running scheduled sync:', error);
  }

  return stats;
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startSyncScheduler(intervalHours: number = 1): void {
  if (schedulerInterval) {
    console.log('[SyncScheduler] Scheduler already running');
    return;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`[SyncScheduler] Starting scheduler with ${intervalHours} hour interval`);

  setTimeout(() => {
    runScheduledSync();
  }, 60000);

  schedulerInterval = setInterval(() => {
    runScheduledSync();
  }, intervalMs);

  console.log('[SyncScheduler] Scheduler started');
}

export function stopSyncScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[SyncScheduler] Scheduler stopped');
  }
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
      syncFrequency: tenant.syncFrequency || 'monthly',
      lastSyncedAt: null,
      status: 'error',
      message: 'No OpenAlex ID configured',
      timestamp: new Date(),
    };
  }

  const log = await syncTenant(tenantId, tenant.name, profile.openalexId, tenant.syncFrequency || 'monthly');
  addSyncLog(log);
  return log;
}
