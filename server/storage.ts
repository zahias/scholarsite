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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne } from "drizzle-orm";

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
    const [result] = await db.insert(tenants).values(tenant).returning();
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
          tenantId,
          openalexId: updates.openalexId || null,
          displayName: updates.displayName || null,
          title: updates.title || null,
          bio: updates.bio || null,
          customCss: updates.customCss || null,
          socialLinks: updates.socialLinks || null,
          featuredWorks: updates.featuredWorks || null,
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
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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
    const [result] = await db
      .insert(researcherProfiles)
      .values(profile)
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
      .values(data)
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
    
    // Insert new topics
    await db.insert(researchTopics).values(topics);
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
    
    // Insert new publications
    await db.insert(publications).values(pubs);
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
    
    // Insert new affiliations
    await db.insert(affiliations).values(affs);
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
      .values({ settingKey: key, settingValue: value })
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
}

export const storage = new DatabaseStorage();
