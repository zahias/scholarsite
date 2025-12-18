import {
  users,
  researcherProfiles,
  openalexData,
  researchTopics,
  publications,
  affiliations,
  siteSettings,
  tenants,
  domains,
  themes,
  payments,
  type User,
  type UpsertUser,
  type SafeUser,
  type UserRole,
  type ResearcherProfile,
  type InsertResearcherProfile,
  type OpenalexData,
  type InsertOpenalexData,
  type ResearchTopic,
  type InsertResearchTopic,
  type Publication,
  type InsertPublication,
  type Affiliation,
  type InsertAffiliation,
  type SiteSetting,
  type InsertSiteSetting,
  type Tenant,
  type InsertTenant,
  type Domain,
  type InsertDomain,
  type Theme,
  type InsertTheme,
  type Payment,
  type InsertPayment,
  type PaymentStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, inArray } from "drizzle-orm";
import crypto from "crypto";

function generateUUID(): string {
  return crypto.randomUUID();
}

export interface TenantWithDetails extends Tenant {
  domains: Domain[];
  users: SafeUser[];
  profile: ResearcherProfile | null;
}

export interface IStorage {
  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantWithDetails(id: string): Promise<TenantWithDetails | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<void>;
  updateTenantProfile(tenantId: string, updates: Partial<ResearcherProfile>): Promise<ResearcherProfile | undefined>;
  
  // Domain operations
  getDomain(id: string): Promise<Domain | undefined>;
  getDomainByHostname(hostname: string): Promise<Domain | undefined>;
  getDomainsByTenant(tenantId: string): Promise<Domain[]>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: string, updates: Partial<Domain>): Promise<Domain | undefined>;
  deleteDomain(id: string): Promise<void>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<SafeUser[]>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<SafeUser[]>;
  getUsersByRole(role: UserRole): Promise<SafeUser[]>;
  
  // Researcher profile operations
  getResearcherProfileByTenant(tenantId: string): Promise<ResearcherProfile | undefined>;
  getResearcherProfileByOpenalexId(openalexId: string): Promise<ResearcherProfile | undefined>;
  getAllPublicResearcherProfiles(): Promise<ResearcherProfile[]>;
  upsertResearcherProfile(profile: InsertResearcherProfile): Promise<ResearcherProfile>;
  updateResearcherProfile(id: string, updates: Partial<ResearcherProfile>): Promise<ResearcherProfile>;
  deleteResearcherProfile(openalexId: string): Promise<void>;
  
  // OpenAlex data cache operations
  getOpenalexData(openalexId: string, dataType: string): Promise<OpenalexData | undefined>;
  upsertOpenalexData(data: InsertOpenalexData): Promise<OpenalexData>;
  
  // Research topics operations
  getResearchTopics(openalexId: string): Promise<ResearchTopic[]>;
  upsertResearchTopics(topics: InsertResearchTopic[]): Promise<void>;
  
  // Publications operations
  getPublications(openalexId: string, limit?: number): Promise<Publication[]>;
  upsertPublications(publications: InsertPublication[]): Promise<void>;
  
  // Affiliations operations
  getAffiliations(openalexId: string): Promise<Affiliation[]>;
  upsertAffiliations(affiliations: InsertAffiliation[]): Promise<void>;
  
  // Site settings operations
  getSetting(key: string): Promise<SiteSetting | undefined>;
  getAllSettings(): Promise<SiteSetting[]>;
  upsertSetting(key: string, value: string): Promise<SiteSetting>;
  
  // Theme operations
  getTheme(id: string): Promise<Theme | undefined>;
  getThemeByName(name: string): Promise<Theme | undefined>;
  getAllThemes(): Promise<Theme[]>;
  getActiveThemes(): Promise<Theme[]>;
  getDefaultTheme(): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | undefined>;
  deleteTheme(id: string): Promise<void>;
  setDefaultTheme(id: string): Promise<Theme | undefined>;
  bulkApplyThemeToTenants(themeId: string, tenantIds?: string[]): Promise<{ updated: number }>;
  getTenantsWithThemeInfo(): Promise<Array<{ id: string; name: string; currentThemeId: string | null; currentThemeName: string | null }>>;
}

export class DatabaseStorage implements IStorage {
  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [result] = await db.insert(tenants).values({
      ...tenant,
      id: generateUUID(),
    }).returning();
    return result;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | undefined> {
    const [result] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return result;
  }

  async deleteTenant(id: string): Promise<void> {
    // Delete in order: domains, users, profiles, then tenant
    await db.transaction(async (tx) => {
      // Get the profile to delete related OpenAlex data
      const [profile] = await tx.select().from(researcherProfiles).where(eq(researcherProfiles.tenantId, id));
      if (profile && profile.openalexId) {
        await tx.delete(openalexData).where(eq(openalexData.openalexId, profile.openalexId));
        await tx.delete(researchTopics).where(eq(researchTopics.openalexId, profile.openalexId));
        await tx.delete(publications).where(eq(publications.openalexId, profile.openalexId));
        await tx.delete(affiliations).where(eq(affiliations.openalexId, profile.openalexId));
      }
      await tx.delete(domains).where(eq(domains.tenantId, id));
      await tx.delete(users).where(eq(users.tenantId, id));
      await tx.delete(researcherProfiles).where(eq(researcherProfiles.tenantId, id));
      await tx.delete(tenants).where(eq(tenants.id, id));
    });
  }

  async getTenantWithDetails(id: string): Promise<TenantWithDetails | undefined> {
    const tenant = await this.getTenant(id);
    if (!tenant) return undefined;

    const [tenantDomains, tenantUsers, profile] = await Promise.all([
      this.getDomainsByTenant(id),
      this.getUsersByTenant(id),
      this.getResearcherProfileByTenant(id),
    ]);

    return {
      ...tenant,
      domains: tenantDomains,
      users: tenantUsers,
      profile: profile || null,
    };
  }

  async updateTenantProfile(tenantId: string, updates: Partial<ResearcherProfile>): Promise<ResearcherProfile | undefined> {
    let profile = await this.getResearcherProfileByTenant(tenantId);
    
    if (!profile) {
      const [newProfile] = await db
        .insert(researcherProfiles)
        .values({
          id: generateUUID(),
          tenantId,
          openalexId: updates.openalexId || null,
          displayName: updates.displayName || null,
          title: updates.title || null,
          bio: updates.bio || null,
          profileImageUrl: updates.profileImageUrl || null,
          email: updates.email || null,
          lastSyncedAt: updates.lastSyncedAt ? new Date(updates.lastSyncedAt) : null,
        })
        .returning();
      return newProfile;
    }

    const [updatedProfile] = await db
      .update(researcherProfiles)
      .set({
        ...updates,
        lastSyncedAt: updates.lastSyncedAt ? new Date(updates.lastSyncedAt) : profile.lastSyncedAt,
        updatedAt: new Date(),
      })
      .where(eq(researcherProfiles.tenantId, tenantId))
      .returning();
    
    return updatedProfile;
  }

  // Domain operations
  async getDomain(id: string): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    return domain;
  }

  async getDomainByHostname(hostname: string): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.hostname, hostname.toLowerCase()));
    return domain;
  }

  async getDomainsByTenant(tenantId: string): Promise<Domain[]> {
    return await db.select().from(domains).where(eq(domains.tenantId, tenantId));
  }

  async createDomain(domain: InsertDomain): Promise<Domain> {
    const [result] = await db.insert(domains).values({
      ...domain,
      id: generateUUID(),
      hostname: domain.hostname.toLowerCase(),
    }).returning();
    return result;
  }

  async updateDomain(id: string, updates: Partial<Domain>): Promise<Domain | undefined> {
    const updateData = { ...updates };
    if (updates.hostname) {
      updateData.hostname = updates.hostname.toLowerCase();
    }
    const [result] = await db
      .update(domains)
      .set(updateData)
      .where(eq(domains.id, id))
      .returning();
    return result;
  }

  async deleteDomain(id: string): Promise<void> {
    await db.delete(domains).where(eq(domains.id, id));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByTenant(tenantId: string): Promise<SafeUser[]> {
    const tenantUsers = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(users.createdAt));
    return tenantUsers as SafeUser[];
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: generateUUID(),
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const dataWithId = {
      ...userData,
      id: userData.id || generateUUID(),
    };
    const [user] = await db
      .insert(users)
      .values(dataWithId)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<SafeUser[]> {
    const allUsers = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers as SafeUser[];
  }

  async getUsersByRole(role: UserRole): Promise<SafeUser[]> {
    const roleUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.role, role))
      .orderBy(desc(users.createdAt));
    return roleUsers as SafeUser[];
  }

  // Researcher profile operations
  async getResearcherProfileByTenant(tenantId: string): Promise<ResearcherProfile | undefined> {
    const [profile] = await db
      .select()
      .from(researcherProfiles)
      .where(eq(researcherProfiles.tenantId, tenantId));
    return profile;
  }

  async getResearcherProfileByOpenalexId(openalexId: string): Promise<ResearcherProfile | undefined> {
    const [profile] = await db
      .select()
      .from(researcherProfiles)
      .where(eq(researcherProfiles.openalexId, openalexId));
    return profile;
  }

  async getAllPublicResearcherProfiles(): Promise<ResearcherProfile[]> {
    return await db
      .select()
      .from(researcherProfiles)
      .where(eq(researcherProfiles.isPublic, true))
      .orderBy(desc(researcherProfiles.updatedAt));
  }

  async upsertResearcherProfile(profile: InsertResearcherProfile): Promise<ResearcherProfile> {
    const profileWithId = {
      ...profile,
      id: generateUUID(),
    };
    const [result] = await db
      .insert(researcherProfiles)
      .values(profileWithId)
      .onConflictDoUpdate({
        target: researcherProfiles.openalexId,
        set: {
          ...profile,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async updateResearcherProfile(id: string, updates: Partial<ResearcherProfile>): Promise<ResearcherProfile> {
    const [result] = await db
      .update(researcherProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(researcherProfiles.id, id))
      .returning();
    return result;
  }

  async deleteResearcherProfile(openalexId: string): Promise<void> {
    // Use transaction to ensure all deletes complete atomically
    await db.transaction(async (tx) => {
      // Delete all related data for this researcher
      await tx.delete(openalexData).where(eq(openalexData.openalexId, openalexId));
      await tx.delete(researchTopics).where(eq(researchTopics.openalexId, openalexId));
      await tx.delete(publications).where(eq(publications.openalexId, openalexId));
      await tx.delete(affiliations).where(eq(affiliations.openalexId, openalexId));
      // Finally delete the profile
      await tx.delete(researcherProfiles).where(eq(researcherProfiles.openalexId, openalexId));
    });
  }

  // OpenAlex data cache operations
  async getOpenalexData(openalexId: string, dataType: string): Promise<OpenalexData | undefined> {
    const [data] = await db
      .select()
      .from(openalexData)
      .where(and(
        eq(openalexData.openalexId, openalexId),
        eq(openalexData.dataType, dataType)
      ))
      .orderBy(desc(openalexData.lastUpdated))
      .limit(1);
    return data;
  }

  async upsertOpenalexData(data: InsertOpenalexData): Promise<OpenalexData> {
    const [result] = await db
      .insert(openalexData)
      .values({
        ...data,
        id: generateUUID(),
      })
      .onConflictDoUpdate({
        target: [openalexData.openalexId, openalexData.dataType],
        set: {
          data: data.data,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Research topics operations
  async getResearchTopics(openalexId: string): Promise<ResearchTopic[]> {
    return await db
      .select()
      .from(researchTopics)
      .where(eq(researchTopics.openalexId, openalexId))
      .orderBy(desc(researchTopics.count));
  }

  async upsertResearchTopics(topics: InsertResearchTopic[]): Promise<void> {
    if (topics.length === 0) return;
    
    // Delete existing topics for this researcher
    await db
      .delete(researchTopics)
      .where(eq(researchTopics.openalexId, topics[0].openalexId));
    
    // Insert new topics with generated IDs
    const topicsWithIds = topics.map(topic => ({
      ...topic,
      id: generateUUID(),
    }));
    await db.insert(researchTopics).values(topicsWithIds);
  }

  // Publications operations
  async getPublications(openalexId: string, limit?: number): Promise<Publication[]> {
    const query = db
      .select()
      .from(publications)
      .where(eq(publications.openalexId, openalexId))
      .orderBy(desc(publications.publicationYear), desc(publications.citationCount));
    
    // Only apply limit if explicitly provided
    if (limit !== undefined) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async upsertPublications(pubs: InsertPublication[]): Promise<void> {
    if (pubs.length === 0) return;
    
    // Delete existing publications for this researcher
    await db
      .delete(publications)
      .where(eq(publications.openalexId, pubs[0].openalexId));
    
    // Insert new publications with generated IDs
    const pubsWithIds = pubs.map(pub => ({
      ...pub,
      id: generateUUID(),
    }));
    await db.insert(publications).values(pubsWithIds);
  }

  // Affiliations operations
  async getAffiliations(openalexId: string): Promise<Affiliation[]> {
    return await db
      .select()
      .from(affiliations)
      .where(eq(affiliations.openalexId, openalexId))
      .orderBy(desc(affiliations.startYear));
  }

  async upsertAffiliations(affs: InsertAffiliation[]): Promise<void> {
    if (affs.length === 0) return;
    
    // Delete existing affiliations for this researcher
    await db
      .delete(affiliations)
      .where(eq(affiliations.openalexId, affs[0].openalexId));
    
    // Insert new affiliations with generated IDs
    const affsWithIds = affs.map(aff => ({
      ...aff,
      id: generateUUID(),
    }));
    await db.insert(affiliations).values(affsWithIds);
  }

  // Site settings operations
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.settingKey, key));
    return setting;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async upsertSetting(key: string, value: string): Promise<SiteSetting> {
    const [setting] = await db
      .insert(siteSettings)
      .values({ id: generateUUID(), settingKey: key, settingValue: value })
      .onConflictDoUpdate({
        target: siteSettings.settingKey,
        set: {
          settingValue: value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  // Theme operations
  async getTheme(id: string): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.id, id));
    return theme;
  }

  async getThemeByName(name: string): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.name, name));
    return theme;
  }

  async getAllThemes(): Promise<Theme[]> {
    return await db.select().from(themes).orderBy(themes.sortOrder, themes.name);
  }

  async getActiveThemes(): Promise<Theme[]> {
    return await db
      .select()
      .from(themes)
      .where(eq(themes.isActive, true))
      .orderBy(themes.sortOrder, themes.name);
  }

  async getDefaultTheme(): Promise<Theme | undefined> {
    const [theme] = await db
      .select()
      .from(themes)
      .where(and(eq(themes.isDefault, true), eq(themes.isActive, true)));
    return theme;
  }

  async createTheme(theme: InsertTheme): Promise<Theme> {
    const [result] = await db
      .insert(themes)
      .values({
        ...theme,
        id: generateUUID(),
      })
      .returning();
    return result;
  }

  async updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | undefined> {
    const [result] = await db
      .update(themes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();
    return result;
  }

  async deleteTheme(id: string): Promise<void> {
    await db.delete(themes).where(eq(themes.id, id));
  }

  async setDefaultTheme(id: string): Promise<Theme | undefined> {
    // First, unset any existing default theme
    await db.update(themes).set({ isDefault: false }).where(eq(themes.isDefault, true));
    // Then set the new default
    const [result] = await db
      .update(themes)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();
    return result;
  }

  async bulkApplyThemeToTenants(themeId: string, tenantIds?: string[]): Promise<{ updated: number }> {
    let query = db
      .update(tenants)
      .set({ selectedThemeId: themeId, updatedAt: new Date() });
    
    if (tenantIds && tenantIds.length > 0) {
      query = query.where(inArray(tenants.id, tenantIds)) as typeof query;
    }
    
    const result = await query;
    return { updated: (result as any).rowCount || 0 };
  }

  async getTenantsWithThemeInfo(): Promise<Array<{ id: string; name: string; currentThemeId: string | null; currentThemeName: string | null }>> {
    const results = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        currentThemeId: tenants.selectedThemeId,
        currentThemeName: themes.name,
      })
      .from(tenants)
      .leftJoin(themes, eq(tenants.selectedThemeId, themes.id))
      .orderBy(tenants.name);
    
    return results;
  }

  // Payment operations
  async createPayment(payment: Omit<InsertPayment, 'id'>): Promise<Payment> {
    const [result] = await db.insert(payments).values({
      ...payment,
      id: generateUUID(),
    }).returning();
    return result;
  }

  async getPaymentByOrderNumber(orderNumber: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderNumber, orderNumber));
    return payment;
  }

  async getPaymentsByEmail(email: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.customerEmail, email)).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(orderNumber: string, status: PaymentStatus, transactionId?: string): Promise<Payment | undefined> {
    const updates: Partial<Payment> = { status };
    if (transactionId) {
      updates.montyPayTransactionId = transactionId;
    }
    if (status === 'completed') {
      updates.completedAt = new Date();
    }
    const [result] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.orderNumber, orderNumber))
      .returning();
    return result;
  }

  async updatePaymentSessionId(orderNumber: string, sessionId: string): Promise<Payment | undefined> {
    const [result] = await db
      .update(payments)
      .set({ montyPaySessionId: sessionId })
      .where(eq(payments.orderNumber, orderNumber))
      .returning();
    return result;
  }

  async provisionTenantFromPayment(paymentId: string): Promise<Tenant | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    if (!payment || payment.status !== 'completed') return undefined;

    const tenantName = payment.customerName.split(' ')[0].toLowerCase() + '-portfolio';
    const subdomain = tenantName.replace(/[^a-z0-9-]/g, '');

    const tenant = await this.createTenant({
      name: payment.customerName,
      plan: payment.plan as 'starter' | 'professional' | 'institution',
      status: 'active',
      contactEmail: payment.customerEmail,
      subscriptionStartDate: new Date(),
    });

    await db.update(payments).set({ tenantId: tenant.id }).where(eq(payments.id, paymentId));

    await this.createDomain({
      tenantId: tenant.id,
      hostname: `${subdomain}.scholar.name`,
      isPrimary: true,
      isSubdomain: true,
    });

    return tenant;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }
}

export const storage = new DatabaseStorage();
