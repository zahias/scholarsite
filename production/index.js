var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index-production.ts
import "dotenv/config";
import express2 from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// server/routes.ts
import { createServer } from "http";
import { EventEmitter } from "events";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  affiliations: () => affiliations,
  domains: () => domains,
  insertDomainSchema: () => insertDomainSchema,
  insertResearcherProfileSchema: () => insertResearcherProfileSchema,
  insertTenantSchema: () => insertTenantSchema,
  loginUserSchema: () => loginUserSchema,
  openalexData: () => openalexData,
  publications: () => publications,
  registerUserSchema: () => registerUserSchema,
  researchTopics: () => researchTopics,
  researcherProfiles: () => researcherProfiles,
  siteSettings: () => siteSettings,
  tenants: () => tenants,
  updateDomainSchema: () => updateDomainSchema,
  updateResearcherProfileSchema: () => updateResearcherProfileSchema,
  updateTenantSchema: () => updateTenantSchema,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  date,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  // Display name for the tenant/site
  plan: varchar("plan").$type().default("starter").notNull(),
  status: varchar("status").$type().default("pending").notNull(),
  // Billing info
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  // Sync settings based on plan
  lastSyncAt: timestamp("last_sync_at"),
  syncFrequency: varchar("sync_frequency").default("monthly"),
  // monthly, weekly, daily
  // Branding
  primaryColor: varchar("primary_color").default("#0B1F3A"),
  accentColor: varchar("accent_color").default("#F2994A"),
  logoUrl: varchar("logo_url"),
  // Contact
  contactEmail: varchar("contact_email"),
  notes: text("notes"),
  // Admin notes about this tenant
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var domains = pgTable("domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  hostname: varchar("hostname").unique().notNull(),
  // e.g., "dr-smith.com" or "smith.scholarsite.com"
  isPrimary: boolean("is_primary").default(false).notNull(),
  // Primary domain for this tenant
  isSubdomain: boolean("is_subdomain").default(false).notNull(),
  // true if *.scholarsite.com
  sslStatus: varchar("ssl_status").default("pending"),
  // pending, active, failed
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  // null for platform admins
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").$type().default("researcher").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var researcherProfiles = pgTable("researcher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  openalexId: varchar("openalex_id").unique(),
  displayName: text("display_name"),
  title: text("title"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  cvUrl: varchar("cv_url"),
  // Current affiliation fields (manually entered)
  currentAffiliation: text("current_affiliation"),
  currentPosition: text("current_position"),
  currentAffiliationUrl: varchar("current_affiliation_url"),
  currentAffiliationStartDate: date("current_affiliation_start_date"),
  email: varchar("email"),
  // Contact email for the researcher
  isPublic: boolean("is_public").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var openalexData = pgTable("openalex_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  dataType: varchar("data_type").notNull(),
  // 'researcher', 'works', 'topics'
  data: jsonb("data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow()
}, (table) => ({
  uniqueOpenalexDataType: unique().on(table.openalexId, table.dataType)
}));
var researchTopics = pgTable("research_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  displayName: text("display_name").notNull(),
  count: integer("count").notNull(),
  subfield: text("subfield"),
  field: text("field"),
  domain: text("domain"),
  value: varchar("value")
  // topic share value
});
var publications = pgTable("publications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  workId: varchar("work_id").notNull(),
  title: text("title").notNull(),
  authorNames: text("author_names"),
  journal: text("journal"),
  publicationYear: integer("publication_year"),
  citationCount: integer("citation_count").default(0),
  topics: jsonb("topics"),
  // array of topic tags
  doi: varchar("doi"),
  isOpenAccess: boolean("is_open_access").default(false),
  publicationType: varchar("publication_type"),
  // article, book-chapter, etc.
  isReviewArticle: boolean("is_review_article").default(false)
});
var affiliations = pgTable("affiliations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  institutionName: text("institution_name").notNull(),
  institutionType: varchar("institution_type"),
  countryCode: varchar("country_code"),
  years: jsonb("years"),
  // array of years
  startYear: integer("start_year"),
  endYear: integer("end_year")
});
var registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required")
});
var loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key").unique().notNull(),
  // e.g., 'theme', 'contact_email', 'platform_name'
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertResearcherProfileSchema = createInsertSchema(researcherProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  openalexId: z.string().transform((val) => {
    const trimmed = val.trim();
    if (trimmed.toLowerCase().startsWith("a") && !trimmed.startsWith("A")) {
      return "A" + trimmed.slice(1);
    }
    return trimmed.startsWith("A") ? trimmed : `A${trimmed}`;
  }).refine((val) => /^A\d+$/.test(val), {
    message: "OpenAlex ID must start with 'A' followed by numbers (e.g., A5056485484)"
  }),
  currentAffiliationStartDate: z.string().transform((val) => {
    return val === "" ? null : val;
  }).nullable()
});
var updateResearcherProfileSchema = insertResearcherProfileSchema.partial().extend({
  id: z.string()
});
var insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateTenantSchema = insertTenantSchema.partial().extend({
  id: z.string()
});
var insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true
});
var updateDomainSchema = insertDomainSchema.partial().extend({
  id: z.string()
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var connectionString = process.env.DATABASE_URL || "";
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, "").replace(/[?&]ssl=[^&]*/gi, "");
console.log("Database connection initialized (SSL disabled for A2 Hosting compatibility)");
var pool = new Pool({
  connectionString,
  ssl: false
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, and } from "drizzle-orm";
var DatabaseStorage = class {
  // Tenant operations
  async getTenant(id) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }
  async getAllTenants() {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }
  async createTenant(tenant) {
    const [result] = await db.insert(tenants).values(tenant).returning();
    return result;
  }
  async updateTenant(id, updates) {
    const [result] = await db.update(tenants).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tenants.id, id)).returning();
    return result;
  }
  async deleteTenant(id) {
    await db.transaction(async (tx) => {
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
  async getTenantWithDetails(id) {
    const tenant = await this.getTenant(id);
    if (!tenant) return void 0;
    const [tenantDomains, tenantUsers, profile] = await Promise.all([
      this.getDomainsByTenant(id),
      this.getUsersByTenant(id),
      this.getResearcherProfileByTenant(id)
    ]);
    return {
      ...tenant,
      domains: tenantDomains,
      users: tenantUsers,
      profile: profile || null
    };
  }
  async updateTenantProfile(tenantId, updates) {
    let profile = await this.getResearcherProfileByTenant(tenantId);
    if (!profile) {
      const [newProfile] = await db.insert(researcherProfiles).values({
        tenantId,
        openalexId: updates.openalexId || null,
        displayName: updates.displayName || null,
        title: updates.title || null,
        bio: updates.bio || null,
        profileImageUrl: updates.profileImageUrl || null,
        email: updates.email || null,
        lastSyncedAt: updates.lastSyncedAt ? new Date(updates.lastSyncedAt) : null
      }).returning();
      return newProfile;
    }
    const [updatedProfile] = await db.update(researcherProfiles).set({
      ...updates,
      lastSyncedAt: updates.lastSyncedAt ? new Date(updates.lastSyncedAt) : profile.lastSyncedAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(researcherProfiles.tenantId, tenantId)).returning();
    return updatedProfile;
  }
  // Domain operations
  async getDomain(id) {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    return domain;
  }
  async getDomainByHostname(hostname) {
    const [domain] = await db.select().from(domains).where(eq(domains.hostname, hostname.toLowerCase()));
    return domain;
  }
  async getDomainsByTenant(tenantId) {
    return await db.select().from(domains).where(eq(domains.tenantId, tenantId));
  }
  async createDomain(domain) {
    const [result] = await db.insert(domains).values({
      ...domain,
      hostname: domain.hostname.toLowerCase()
    }).returning();
    return result;
  }
  async updateDomain(id, updates) {
    const updateData = { ...updates };
    if (updates.hostname) {
      updateData.hostname = updates.hostname.toLowerCase();
    }
    const [result] = await db.update(domains).set(updateData).where(eq(domains.id, id)).returning();
    return result;
  }
  async deleteDomain(id) {
    await db.delete(domains).where(eq(domains.id, id));
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUsersByTenant(tenantId) {
    const tenantUsers = await db.select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.tenantId, tenantId)).orderBy(desc(users.createdAt));
    return tenantUsers;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  async getAllUsers() {
    const allUsers = await db.select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }
  async getUsersByRole(role) {
    const roleUsers = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
    return roleUsers;
  }
  // Researcher profile operations
  async getResearcherProfileByTenant(tenantId) {
    const [profile] = await db.select().from(researcherProfiles).where(eq(researcherProfiles.tenantId, tenantId));
    return profile;
  }
  async getResearcherProfileByOpenalexId(openalexId) {
    const [profile] = await db.select().from(researcherProfiles).where(eq(researcherProfiles.openalexId, openalexId));
    return profile;
  }
  async getAllPublicResearcherProfiles() {
    return await db.select().from(researcherProfiles).where(eq(researcherProfiles.isPublic, true)).orderBy(desc(researcherProfiles.updatedAt));
  }
  async upsertResearcherProfile(profile) {
    const [result] = await db.insert(researcherProfiles).values(profile).onConflictDoUpdate({
      target: researcherProfiles.openalexId,
      set: {
        ...profile,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result;
  }
  async updateResearcherProfile(id, updates) {
    const [result] = await db.update(researcherProfiles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(researcherProfiles.id, id)).returning();
    return result;
  }
  async deleteResearcherProfile(openalexId) {
    await db.transaction(async (tx) => {
      await tx.delete(openalexData).where(eq(openalexData.openalexId, openalexId));
      await tx.delete(researchTopics).where(eq(researchTopics.openalexId, openalexId));
      await tx.delete(publications).where(eq(publications.openalexId, openalexId));
      await tx.delete(affiliations).where(eq(affiliations.openalexId, openalexId));
      await tx.delete(researcherProfiles).where(eq(researcherProfiles.openalexId, openalexId));
    });
  }
  // OpenAlex data cache operations
  async getOpenalexData(openalexId, dataType) {
    const [data] = await db.select().from(openalexData).where(and(
      eq(openalexData.openalexId, openalexId),
      eq(openalexData.dataType, dataType)
    )).orderBy(desc(openalexData.lastUpdated)).limit(1);
    return data;
  }
  async upsertOpenalexData(data) {
    const [result] = await db.insert(openalexData).values(data).onConflictDoUpdate({
      target: [openalexData.openalexId, openalexData.dataType],
      set: {
        data: data.data,
        lastUpdated: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result;
  }
  // Research topics operations
  async getResearchTopics(openalexId) {
    return await db.select().from(researchTopics).where(eq(researchTopics.openalexId, openalexId)).orderBy(desc(researchTopics.count));
  }
  async upsertResearchTopics(topics) {
    if (topics.length === 0) return;
    await db.delete(researchTopics).where(eq(researchTopics.openalexId, topics[0].openalexId));
    await db.insert(researchTopics).values(topics);
  }
  // Publications operations
  async getPublications(openalexId, limit) {
    const query = db.select().from(publications).where(eq(publications.openalexId, openalexId)).orderBy(desc(publications.publicationYear), desc(publications.citationCount));
    if (limit !== void 0) {
      return await query.limit(limit);
    }
    return await query;
  }
  async upsertPublications(pubs) {
    if (pubs.length === 0) return;
    await db.delete(publications).where(eq(publications.openalexId, pubs[0].openalexId));
    await db.insert(publications).values(pubs);
  }
  // Affiliations operations
  async getAffiliations(openalexId) {
    return await db.select().from(affiliations).where(eq(affiliations.openalexId, openalexId)).orderBy(desc(affiliations.startYear));
  }
  async upsertAffiliations(affs) {
    if (affs.length === 0) return;
    await db.delete(affiliations).where(eq(affiliations.openalexId, affs[0].openalexId));
    await db.insert(affiliations).values(affs);
  }
  // Site settings operations
  async getSetting(key) {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key));
    return setting;
  }
  async getAllSettings() {
    return await db.select().from(siteSettings);
  }
  async upsertSetting(key, value) {
    const [setting] = await db.insert(siteSettings).values({ settingKey: key, settingValue: value }).onConflictDoUpdate({
      target: siteSettings.settingKey,
      set: {
        settingValue: value,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return setting;
  }
};
var storage = new DatabaseStorage();

// server/services/openalexApi.ts
import fetch2 from "node-fetch";
var OpenAlexService = class {
  baseUrl = "https://api.openalex.org";
  async getResearcher(openalexId) {
    const cleanId = openalexId.startsWith("A") ? openalexId : `A${openalexId}`;
    const url = `${this.baseUrl}/people/${cleanId}`;
    const response = await fetch2(url);
    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }
  async getResearcherWorks(openalexId) {
    const cleanId = openalexId.startsWith("A") ? openalexId : `A${openalexId}`;
    let allResults = [];
    let page = 1;
    let totalCount = 0;
    const perPage = 200;
    let hasMoreResults = true;
    while (hasMoreResults) {
      const url = `${this.baseUrl}/works?filter=author.id:${cleanId}&per-page=${perPage}&page=${page}&sort=cited_by_count:desc`;
      const response = await fetch2(url);
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      allResults = allResults.concat(data.results);
      totalCount = data.meta.count;
      console.log(`Fetched ${allResults.length} of ${totalCount} publications for ${cleanId} (page ${page})`);
      page++;
      hasMoreResults = allResults.length < totalCount && data.results.length > 0;
    }
    return {
      results: allResults,
      meta: {
        count: totalCount
      }
    };
  }
  async syncResearcherData(openalexId) {
    try {
      console.log(`Starting sync for researcher: ${openalexId}`);
      let researcher;
      try {
        researcher = await this.getResearcher(openalexId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          console.log(`OpenAlex researcher ${openalexId} not found (404) - skipping sync`);
          return;
        }
        throw error;
      }
      await storage.upsertOpenalexData({
        openalexId,
        dataType: "researcher",
        data: researcher
      });
      if (researcher.topics && researcher.topics.length > 0) {
        const topics = researcher.topics.map((topic) => ({
          openalexId,
          topicId: topic.id,
          displayName: topic.display_name,
          count: topic.count,
          subfield: topic.subfield.display_name,
          field: topic.field.display_name,
          domain: topic.domain.display_name
        }));
        await storage.upsertResearchTopics(topics);
      }
      if (researcher.affiliations && researcher.affiliations.length > 0) {
        const affiliations2 = researcher.affiliations.map((affiliation) => {
          const sortedYears = affiliation.years.sort((a, b) => a - b);
          return {
            openalexId,
            institutionId: affiliation.institution.id,
            institutionName: affiliation.institution.display_name,
            institutionType: affiliation.institution.type,
            countryCode: affiliation.institution.country_code,
            years: affiliation.years,
            startYear: sortedYears[0],
            endYear: sortedYears[sortedYears.length - 1]
          };
        });
        await storage.upsertAffiliations(affiliations2);
      }
      let worksResponse;
      try {
        worksResponse = await this.getResearcherWorks(openalexId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          console.log(`OpenAlex works for ${openalexId} not found (404) - skipping works sync`);
          return;
        }
        throw error;
      }
      if (worksResponse.results && worksResponse.results.length > 0) {
        const publications2 = worksResponse.results.filter((work) => work.title && work.title.trim() !== "").map((work) => {
          const publicationType = work.type ? work.type.split("/").pop() || null : null;
          return {
            openalexId,
            workId: work.id,
            title: work.title,
            authorNames: work.authorships.map((a) => a.author.display_name).join(", "),
            journal: work.primary_location?.source?.display_name || null,
            publicationYear: work.publication_year || null,
            citationCount: work.cited_by_count || 0,
            topics: work.topics ? work.topics.map((t) => t.display_name) : null,
            doi: work.doi || null,
            isOpenAccess: work.open_access?.is_oa || false,
            publicationType,
            isReviewArticle: publicationType === "review"
          };
        });
        console.log(`Processed ${publications2.length} valid publications (filtered out ${worksResponse.results.length - publications2.length} without titles)`);
        if (publications2.length > 0) {
          await storage.upsertPublications(publications2);
        }
      }
      await storage.upsertOpenalexData({
        openalexId,
        dataType: "works",
        data: worksResponse
      });
      console.log(`Successfully synced data for researcher: ${openalexId}`);
    } catch (error) {
      console.error(`Error syncing researcher data for ${openalexId}:`, error);
      throw error;
    }
  }
};

// server/routes.ts
import { z as z6 } from "zod";
import multer2 from "multer";
import { Client as ObjectStorageClient2 } from "@replit/object-storage";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path2) => path2.trim()).filter((path2) => path2.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the upload URL for CV files specifically
  async getCVUploadURL(userId, filename) {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = `cv-${userId}-${randomUUID()}`;
    const extension = filename.split(".").pop() || "pdf";
    const fullPath = `${privateObjectDir}/cvs/${objectId}.${extension}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z as z2 } from "zod";
var router = Router();
function toSafeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
function isAuthenticated(req, res, next) {
  if (req.session?.userId && req.session?.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}
function isAdmin(req, res, next) {
  if (req.session?.userId && req.session?.isAuthenticated && req.session?.userRole === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}
async function getCurrentUser(req) {
  if (!req.session?.userId) {
    return null;
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isActive) {
    return null;
  }
  return toSafeUser(user);
}
router.post("/register", async (req, res) => {
  try {
    const validatedData = registerUserSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: "researcher"
    });
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Registration failed" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.isAuthenticated = true;
      return res.status(201).json({
        message: "Registration successful",
        user: toSafeUser(user)
      });
    });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const validatedData = loginUserSchema.parse(req.body);
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }
    if (user.passwordHash === "NEEDS_RESET") {
      return res.status(403).json({
        message: "Password reset required. Please contact administrator.",
        requiresReset: true
      });
    }
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      return res.json({
        message: "Login successful",
        user: toSafeUser(user)
      });
    });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
});
router.get("/me", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Failed to get user info" });
  }
});
router.patch("/profile", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const updateSchema = z2.object({
      firstName: z2.string().min(1).optional(),
      lastName: z2.string().min(1).optional(),
      profileImageUrl: z2.string().url().optional().nullable()
    });
    const validatedData = updateSchema.parse(req.body);
    const updatedUser = await storage.updateUser(userId, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      message: "Profile updated",
      user: toSafeUser(updatedUser)
    });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});
router.patch("/password", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const passwordSchema = z2.object({
      currentPassword: z2.string().min(1),
      newPassword: z2.string().min(8)
    });
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(userId, { passwordHash: newPasswordHash });
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error after password change:", err);
      }
      req.session.userId = userId;
      req.session.userRole = user.role;
      req.session.isAuthenticated = true;
      return res.json({ message: "Password updated successfully" });
    });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Password update error:", error);
    return res.status(500).json({ message: "Failed to update password" });
  }
});
var authRouter = router;

// server/adminRoutes.ts
import { Router as Router2 } from "express";
import bcrypt2 from "bcryptjs";
import { z as z3 } from "zod";
var router2 = Router2();
router2.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users2 = await storage.getAllUsers();
    return res.json({ users: users2 });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Failed to get users" });
  }
});
router2.get("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Failed to get user" });
  }
});
router2.patch("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updateSchema = z3.object({
      email: z3.string().email().optional(),
      firstName: z3.string().min(1).optional(),
      lastName: z3.string().min(1).optional(),
      role: z3.enum(["admin", "researcher"]).optional(),
      isActive: z3.boolean().optional()
    });
    const validatedData = updateSchema.parse(req.body);
    if (req.params.id === req.session.userId && validatedData.role && validatedData.role !== "admin") {
      return res.status(400).json({ message: "Cannot demote yourself" });
    }
    if (req.params.id === req.session.userId && validatedData.isActive === false) {
      return res.status(400).json({ message: "Cannot deactivate yourself" });
    }
    const updatedUser = await storage.updateUser(req.params.id, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const { passwordHash, ...safeUser } = updatedUser;
    return res.json({
      message: "User updated",
      user: safeUser
    });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
});
router2.post("/users/:id/reset-password", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const passwordSchema = z3.object({
      newPassword: z3.string().min(8)
    });
    const { newPassword } = passwordSchema.parse(req.body);
    const passwordHash = await bcrypt2.hash(newPassword, 12);
    const updatedUser = await storage.updateUser(req.params.id, { passwordHash });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});
router2.delete("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await storage.deleteUser(req.params.id);
    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
});
router2.post("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const createSchema = z3.object({
      email: z3.string().email(),
      password: z3.string().min(8),
      firstName: z3.string().min(1),
      lastName: z3.string().min(1),
      role: z3.enum(["admin", "researcher"]).default("researcher")
    });
    const validatedData = createSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt2.hash(validatedData.password, 12);
    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: validatedData.role
    });
    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json({
      message: "User created",
      user: safeUser
    });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
});
router2.get("/stats", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const allUsers = await storage.getAllUsers();
    const admins = allUsers.filter((u) => u.role === "admin");
    const researchers = allUsers.filter((u) => u.role === "researcher");
    const activeUsers = allUsers.filter((u) => u.isActive);
    return res.json({
      stats: {
        totalUsers: allUsers.length,
        adminCount: admins.length,
        researcherCount: researchers.length,
        activeUserCount: activeUsers.length
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ message: "Failed to get stats" });
  }
});
var adminRouter = router2;

// server/tenantRoutes.ts
import { Router as Router3 } from "express";
import { z as z4 } from "zod";
import bcrypt3 from "bcryptjs";

// server/services/syncScheduler.ts
var openalexService = new OpenAlexService();
var syncLogs = [];
var MAX_LOGS = 100;
function addSyncLog(log2) {
  syncLogs.unshift(log2);
  if (syncLogs.length > MAX_LOGS) {
    syncLogs.pop();
  }
}
function getSyncLogs() {
  return [...syncLogs];
}
function getSyncIntervalMs(frequency) {
  switch (frequency) {
    case "daily":
      return 24 * 60 * 60 * 1e3;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1e3;
    case "monthly":
    default:
      return 30 * 24 * 60 * 60 * 1e3;
  }
}
function isDueForSync(lastSyncedAt, frequency) {
  if (!lastSyncedAt) {
    return true;
  }
  const intervalMs = getSyncIntervalMs(frequency);
  const now = (/* @__PURE__ */ new Date()).getTime();
  const lastSync = new Date(lastSyncedAt).getTime();
  return now - lastSync >= intervalMs;
}
async function syncTenant(tenantId, tenantName, openalexId, syncFrequency) {
  const log2 = {
    tenantId,
    tenantName,
    openalexId,
    syncFrequency,
    lastSyncedAt: null,
    status: "success",
    message: "",
    timestamp: /* @__PURE__ */ new Date()
  };
  try {
    console.log(`[SyncScheduler] Starting sync for tenant: ${tenantName} (${openalexId})`);
    await openalexService.syncResearcherData(openalexId);
    const profile = await storage.getResearcherProfileByTenant(tenantId);
    if (profile) {
      await storage.updateResearcherProfile(profile.id, {
        lastSyncedAt: /* @__PURE__ */ new Date()
      });
    }
    await storage.updateTenant(tenantId, {
      lastSyncAt: /* @__PURE__ */ new Date()
    });
    log2.status = "success";
    log2.message = "Data synced successfully from OpenAlex";
    log2.lastSyncedAt = /* @__PURE__ */ new Date();
    console.log(`[SyncScheduler] Completed sync for tenant: ${tenantName}`);
  } catch (error) {
    log2.status = "error";
    log2.message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SyncScheduler] Error syncing tenant ${tenantName}:`, error);
  }
  return log2;
}
async function runScheduledSync() {
  console.log("[SyncScheduler] Starting scheduled sync check...");
  const stats = { synced: 0, skipped: 0, errors: 0 };
  try {
    const allTenants = await storage.getAllTenants();
    const activeTenants = allTenants.filter((t) => t.status === "active");
    console.log(`[SyncScheduler] Found ${activeTenants.length} active tenants to check`);
    for (const tenant of activeTenants) {
      const profile = await storage.getResearcherProfileByTenant(tenant.id);
      if (!profile || !profile.openalexId) {
        const skipLog = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          openalexId: "",
          syncFrequency: tenant.syncFrequency || "monthly",
          lastSyncedAt: null,
          status: "skipped",
          message: "No OpenAlex ID configured",
          timestamp: /* @__PURE__ */ new Date()
        };
        addSyncLog(skipLog);
        stats.skipped++;
        continue;
      }
      const syncFrequency = tenant.syncFrequency || "monthly";
      const lastSyncedAt = profile.lastSyncedAt;
      if (!isDueForSync(lastSyncedAt, syncFrequency)) {
        const skipLog = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          openalexId: profile.openalexId,
          syncFrequency,
          lastSyncedAt,
          status: "skipped",
          message: `Not due for sync (last synced: ${lastSyncedAt?.toISOString()})`,
          timestamp: /* @__PURE__ */ new Date()
        };
        addSyncLog(skipLog);
        stats.skipped++;
        continue;
      }
      const log2 = await syncTenant(tenant.id, tenant.name, profile.openalexId, syncFrequency);
      addSyncLog(log2);
      if (log2.status === "success") {
        stats.synced++;
      } else {
        stats.errors++;
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    }
    console.log(`[SyncScheduler] Sync check complete. Synced: ${stats.synced}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  } catch (error) {
    console.error("[SyncScheduler] Error running scheduled sync:", error);
  }
  return stats;
}
var schedulerInterval = null;
function startSyncScheduler(intervalHours = 1) {
  if (schedulerInterval) {
    console.log("[SyncScheduler] Scheduler already running");
    return;
  }
  const intervalMs = intervalHours * 60 * 60 * 1e3;
  console.log(`[SyncScheduler] Starting scheduler with ${intervalHours} hour interval`);
  setTimeout(() => {
    runScheduledSync();
  }, 6e4);
  schedulerInterval = setInterval(() => {
    runScheduledSync();
  }, intervalMs);
  console.log("[SyncScheduler] Scheduler started");
}
async function forceSyncTenant(tenantId) {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    return null;
  }
  const profile = await storage.getResearcherProfileByTenant(tenantId);
  if (!profile || !profile.openalexId) {
    return {
      tenantId,
      tenantName: tenant.name,
      openalexId: "",
      syncFrequency: tenant.syncFrequency || "monthly",
      lastSyncedAt: null,
      status: "error",
      message: "No OpenAlex ID configured",
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  const log2 = await syncTenant(tenantId, tenant.name, profile.openalexId, tenant.syncFrequency || "monthly");
  addSyncLog(log2);
  return log2;
}

// server/tenantRoutes.ts
var router3 = Router3();
var adminLoginSchema = z4.object({
  email: z4.string().email("Invalid email"),
  password: z4.string().min(1, "Password is required")
});
router3.post("/login", async (req, res) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }
    const isValid = await bcrypt3.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    });
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});
router3.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
});
router3.get("/me", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Get admin user error:", error);
    return res.status(500).json({ message: "Failed to get user info" });
  }
});
var createTenantSchema = z4.object({
  name: z4.string().min(1, "Name is required"),
  plan: z4.enum(["starter", "professional", "institution"]).default("starter"),
  contactEmail: z4.string().email().optional().or(z4.literal("")),
  primaryColor: z4.string().optional(),
  accentColor: z4.string().optional(),
  notes: z4.string().optional()
});
var createDomainSchema = z4.object({
  hostname: z4.string().min(1, "Hostname is required"),
  isPrimary: z4.boolean().default(false),
  isSubdomain: z4.boolean().default(false)
});
var createTenantUserSchema = z4.object({
  email: z4.string().email("Invalid email"),
  password: z4.string().min(8, "Password must be at least 8 characters"),
  firstName: z4.string().min(1, "First name is required"),
  lastName: z4.string().min(1, "Last name is required")
});
router3.get("/tenants", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const allTenants = await storage.getAllTenants();
    const tenantsWithDetails = await Promise.all(
      allTenants.map(async (tenant) => {
        const domainsList = await storage.getDomainsByTenant(tenant.id);
        const usersList = await storage.getUsersByTenant(tenant.id);
        const profile = await storage.getResearcherProfileByTenant(tenant.id);
        return {
          ...tenant,
          domains: domainsList,
          users: usersList,
          profile: profile || null
        };
      })
    );
    return res.json({ tenants: tenantsWithDetails });
  } catch (error) {
    console.error("Get tenants error:", error);
    return res.status(500).json({ message: "Failed to fetch tenants" });
  }
});
router3.get("/tenants/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const domainsList = await storage.getDomainsByTenant(tenant.id);
    const usersList = await storage.getUsersByTenant(tenant.id);
    const profile = await storage.getResearcherProfileByTenant(tenant.id);
    return res.json({
      tenant: {
        ...tenant,
        domains: domainsList,
        users: usersList,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error("Get tenant error:", error);
    return res.status(500).json({ message: "Failed to fetch tenant" });
  }
});
router3.post("/tenants", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = createTenantSchema.parse(req.body);
    const tenant = await storage.createTenant({
      ...validatedData,
      status: "pending",
      plan: validatedData.plan,
      syncFrequency: validatedData.plan === "institution" ? "daily" : validatedData.plan === "professional" ? "weekly" : "monthly"
    });
    await storage.upsertResearcherProfile({
      tenantId: tenant.id,
      openalexId: void 0,
      displayName: validatedData.name,
      isPublic: false
    });
    return res.status(201).json({
      message: "Tenant created successfully",
      tenant
    });
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Create tenant error:", error);
    return res.status(500).json({ message: "Failed to create tenant" });
  }
});
router3.patch("/tenants/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updateSchema = z4.object({
      name: z4.string().min(1).optional(),
      plan: z4.enum(["starter", "professional", "institution"]).optional(),
      status: z4.enum(["active", "suspended", "cancelled", "pending"]).optional(),
      contactEmail: z4.string().email().optional().nullable(),
      primaryColor: z4.string().optional(),
      accentColor: z4.string().optional(),
      logoUrl: z4.string().optional().nullable(),
      notes: z4.string().optional().nullable(),
      subscriptionStartDate: z4.string().optional().nullable(),
      subscriptionEndDate: z4.string().optional().nullable()
    });
    const validatedData = updateSchema.parse(req.body);
    const updateData = { ...validatedData };
    if (validatedData.plan) {
      updateData.syncFrequency = validatedData.plan === "institution" ? "daily" : validatedData.plan === "professional" ? "weekly" : "monthly";
    }
    if (validatedData.subscriptionStartDate) {
      updateData.subscriptionStartDate = new Date(validatedData.subscriptionStartDate);
    }
    if (validatedData.subscriptionEndDate) {
      updateData.subscriptionEndDate = new Date(validatedData.subscriptionEndDate);
    }
    const tenant = await storage.updateTenant(req.params.id, updateData);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    return res.json({
      message: "Tenant updated",
      tenant
    });
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Update tenant error:", error);
    return res.status(500).json({ message: "Failed to update tenant" });
  }
});
router3.delete("/tenants/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    await storage.deleteTenant(req.params.id);
    return res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Delete tenant error:", error);
    return res.status(500).json({ message: "Failed to delete tenant" });
  }
});
router3.post("/tenants/:id/domains", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const validatedData = createDomainSchema.parse(req.body);
    const existingDomain = await storage.getDomainByHostname(validatedData.hostname);
    if (existingDomain) {
      return res.status(400).json({ message: "Domain already exists" });
    }
    if (validatedData.isPrimary) {
      const existingDomains = await storage.getDomainsByTenant(req.params.id);
      for (const d of existingDomains) {
        if (d.isPrimary) {
          await storage.updateDomain(d.id, { isPrimary: false });
        }
      }
    }
    const domain = await storage.createDomain({
      tenantId: req.params.id,
      ...validatedData
    });
    return res.status(201).json({
      message: "Domain added",
      domain
    });
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Add domain error:", error);
    return res.status(500).json({ message: "Failed to add domain" });
  }
});
router3.delete("/tenants/:tenantId/domains/:domainId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const domain = await storage.getDomain(req.params.domainId);
    if (!domain || domain.tenantId !== req.params.tenantId) {
      return res.status(404).json({ message: "Domain not found" });
    }
    await storage.deleteDomain(req.params.domainId);
    return res.json({ message: "Domain deleted" });
  } catch (error) {
    console.error("Delete domain error:", error);
    return res.status(500).json({ message: "Failed to delete domain" });
  }
});
router3.post("/tenants/:id/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const validatedData = createTenantUserSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const passwordHash = await bcrypt3.hash(validatedData.password, 12);
    const user = await storage.createUser({
      tenantId: req.params.id,
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: "researcher",
      isActive: true
    });
    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json({
      message: "User created",
      user: safeUser
    });
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Create tenant user error:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
});
router3.post("/tenants/:id/activate", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const domainsList = await storage.getDomainsByTenant(req.params.id);
    if (domainsList.length === 0) {
      return res.status(400).json({ message: "Add at least one domain before activating" });
    }
    const usersList = await storage.getUsersByTenant(req.params.id);
    if (usersList.length === 0) {
      return res.status(400).json({ message: "Create at least one user before activating" });
    }
    const updatedTenant = await storage.updateTenant(req.params.id, {
      status: "active",
      subscriptionStartDate: /* @__PURE__ */ new Date()
    });
    return res.json({
      message: "Tenant activated",
      tenant: updatedTenant
    });
  } catch (error) {
    console.error("Activate tenant error:", error);
    return res.status(500).json({ message: "Failed to activate tenant" });
  }
});
router3.get("/sync/logs", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const logs = getSyncLogs();
    return res.json({ logs });
  } catch (error) {
    console.error("Get sync logs error:", error);
    return res.status(500).json({ message: "Failed to get sync logs" });
  }
});
router3.post("/sync/run", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const stats = await runScheduledSync();
    return res.json({
      message: "Scheduled sync completed",
      stats
    });
  } catch (error) {
    console.error("Run sync error:", error);
    return res.status(500).json({ message: "Failed to run sync" });
  }
});
router3.post("/tenants/:id/sync", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const log2 = await forceSyncTenant(req.params.id);
    if (!log2) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    return res.json({
      message: log2.status === "success" ? "Sync completed successfully" : log2.message,
      log: log2
    });
  } catch (error) {
    console.error("Force sync error:", error);
    return res.status(500).json({ message: "Failed to sync tenant" });
  }
});
var tenantRoutes_default = router3;

// server/researcherRoutes.ts
import { Router as Router4 } from "express";
import { z as z5 } from "zod";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
var router4 = Router4();
var openalexService2 = new OpenAlexService();
var uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
function isAuthenticated2(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}
router4.get("/my-tenant", isAuthenticated2, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json({ tenant });
  } catch (error) {
    console.error("Error getting tenant:", error);
    res.status(500).json({ message: "Failed to get tenant" });
  }
});
var updateProfileSchema = z5.object({
  openalexId: z5.string().optional(),
  displayName: z5.string().nullable().optional(),
  title: z5.string().nullable().optional(),
  bio: z5.string().nullable().optional(),
  customCss: z5.string().nullable().optional(),
  socialLinks: z5.record(z5.string()).nullable().optional(),
  featuredWorks: z5.array(z5.string()).nullable().optional()
});
router4.patch("/profile", isAuthenticated2, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.error.errors
      });
    }
    const profile = await storage.updateTenantProfile(user.tenantId, validation.data);
    res.json({ profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});
router4.post("/sync", isAuthenticated2, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    if (!tenant?.profile?.openalexId) {
      return res.status(400).json({ message: "No OpenAlex ID configured" });
    }
    await openalexService2.syncResearcherData(tenant.profile.openalexId);
    const profile = await storage.updateTenantProfile(user.tenantId, {
      lastSyncedAt: /* @__PURE__ */ new Date()
    });
    res.json({ profile, message: "Sync completed - your data has been refreshed from OpenAlex" });
  } catch (error) {
    console.error("Error syncing profile:", error);
    res.status(500).json({ message: "Failed to sync profile" });
  }
});
router4.post("/upload-photo", isAuthenticated2, uploadImage.single("photo"), async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!storageBucketId) {
      return res.status(500).json({ message: "Object storage not configured" });
    }
    const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
    const fileExtension = req.file.mimetype.split("/")[1];
    const filename = `public/profile-images/${user.tenantId}-profile-${Date.now()}.${fileExtension}`;
    const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);
    if (!uploadResult.ok) {
      console.error("Object storage upload error:", uploadResult.error);
      return res.status(500).json({ message: "Failed to upload file to storage" });
    }
    const publicPath = filename.replace("public/", "");
    const profileImageUrl = `/public-objects/${publicPath}`;
    await storage.updateTenantProfile(user.tenantId, {
      profileImageUrl
    });
    res.json({
      message: "Profile photo uploaded successfully",
      profileImageUrl
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({ message: "Failed to upload profile photo" });
  }
});
var researcherRoutes_default = router4;

// server/tenantMiddleware.ts
var MARKETING_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "scholarsite.com",
  "www.scholarsite.com"
];
async function tenantResolver(req, res, next) {
  try {
    const host = req.hostname || req.headers.host || "";
    const hostname = host.split(":")[0].toLowerCase();
    if (MARKETING_DOMAINS.includes(hostname) || hostname.endsWith(".replit.dev") || hostname.endsWith(".replit.app") || hostname.endsWith(".repl.co")) {
      req.isMarketingSite = true;
      return next();
    }
    const domain = await storage.getDomainByHostname(hostname);
    if (!domain) {
      req.isMarketingSite = true;
      return next();
    }
    const tenant = await storage.getTenant(domain.tenantId);
    if (!tenant || tenant.status === "cancelled" || tenant.status === "suspended") {
      req.isMarketingSite = true;
      return next();
    }
    req.tenant = tenant;
    req.domain = domain;
    req.isMarketingSite = false;
    next();
  } catch (error) {
    console.error("Tenant resolution error:", error);
    req.isMarketingSite = true;
    next();
  }
}

// server/routes.ts
import fetch3 from "node-fetch";
var updateEmitter = new EventEmitter();
var sseConnections = /* @__PURE__ */ new Set();
function adminSessionAuthMiddleware(req, res, next) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    console.error("ADMIN_API_TOKEN environment variable not set");
    return res.status(500).json({ message: "Admin authentication not configured" });
  }
  if (req.session?.isAdmin) {
    console.log(`Admin web access: ${req.method} ${req.path} from ${req.ip}`);
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token === adminToken) {
      req.session.isAdmin = true;
      console.log(`Admin operation: ${req.method} ${req.path} from ${req.ip}`);
      return next();
    }
  }
  return next();
}
function isAuthenticated3(req) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) return false;
  if (req.session?.isAdmin) {
    return true;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return token === adminToken;
  }
  return false;
}
var adminRateLimit = (() => {
  const requests = /* @__PURE__ */ new Map();
  const WINDOW_MS = 15 * 60 * 1e3;
  const MAX_REQUESTS = 100;
  return (req, res, next) => {
    const clientIP = req.ip || "unknown";
    const now = Date.now();
    const clientData = requests.get(clientIP);
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }
    if (clientData.count >= MAX_REQUESTS) {
      console.warn(`Admin rate limit exceeded for IP ${clientIP}`);
      return res.status(429).json({ message: "Rate limit exceeded for admin operations" });
    }
    clientData.count++;
    next();
  };
})();
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeHtmlAttribute(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\n/g, " ").replace(/\r/g, " ").replace(/\t/g, " ");
}
function validateAndSanitizeUrl(url) {
  if (!url) return "#";
  const sanitized = String(url).replace(/[<>"']/g, "");
  try {
    const urlObj = new URL(sanitized, "https://example.com");
    if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
      return sanitized;
    }
  } catch {
    if (sanitized.startsWith("/") || sanitized.startsWith("#")) {
      return sanitized;
    }
  }
  return "#";
}
function generateStaticHTML(data) {
  const { profile, researcher, topics, publications: publications2, affiliations: affiliations2, exportedAt, exportUrl } = data;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtmlAttribute(profile.displayName) || "Researcher Profile"} - Academic Profile</title>
    <meta name="description" content="${escapeHtmlAttribute(profile.bio) || `Academic profile of ${escapeHtmlAttribute(profile.displayName) || "researcher"} with publications, research topics, and career information.`}">
    <meta name="author" content="${escapeHtmlAttribute(profile.displayName) || "Researcher"}">
    
    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${escapeHtmlAttribute(profile.displayName) || "Researcher Profile"} - Academic Profile">
    <meta property="og:description" content="${escapeHtmlAttribute(profile.bio) || `Academic profile with ${publications2?.length || 0} publications and ${researcher?.cited_by_count || 0} citations.`}">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${validateAndSanitizeUrl(exportUrl)}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .stats-card { backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); }
        .publication-card { transition: all 0.3s ease; }
        .publication-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    <!-- Header -->
    <header class="gradient-bg text-white py-20">
        <div class="max-w-6xl mx-auto px-6">
            <div class="text-center">
                <div class="w-32 h-32 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
                    <span class="text-4xl font-bold text-white">${escapeHtml((profile.displayName || "R").charAt(0))}</span>
                </div>
                <h1 class="text-5xl font-bold mb-4">${escapeHtml(profile.displayName) || "Researcher Profile"}</h1>
                ${profile.title ? `<p class="text-xl mb-4 text-white/90">${escapeHtml(profile.title)}</p>` : ""}
                ${profile.currentAffiliation ? `<p class="text-lg text-white/80">${escapeHtml(profile.currentAffiliation)}</p>` : ""}
                ${profile.bio ? `<p class="mt-6 text-white/90 max-w-3xl mx-auto leading-relaxed">${escapeHtml(profile.bio)}</p>` : ""}
            </div>
        </div>
    </header>

    <!-- Stats Overview -->
    <section class="py-16 -mt-10 relative z-10">
        <div class="max-w-6xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${publications2?.length || 0}</div>
                    <div class="text-sm opacity-80">Publications</div>
                </div>
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${researcher?.cited_by_count || 0}</div>
                    <div class="text-sm opacity-80">Citations</div>
                </div>
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${researcher?.summary_stats?.h_index || 0}</div>
                    <div class="text-sm opacity-80">h-index</div>
                </div>
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${researcher?.summary_stats?.i10_index || 0}</div>
                    <div class="text-sm opacity-80">i10-index</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Research Topics -->
    ${topics && topics.length > 0 ? `
    <section class="py-16 bg-white">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8 text-center">Research Areas</h2>
            <div class="flex flex-wrap gap-3 justify-center">
                ${topics.slice(0, 15).map((topic) => `
                    <span class="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        ${escapeHtml(topic.displayName)} (${escapeHtml(String(topic.count))})
                    </span>
                `).join("")}
            </div>
        </div>
    </section>
    ` : ""}

    <!-- Publications -->
    ${publications2 && publications2.length > 0 ? `
    <section class="py-16 bg-gray-50">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8 text-center">Recent Publications</h2>
            <div class="space-y-6">
                ${publications2.slice(0, 10).map((pub) => `
                    <div class="publication-card bg-white rounded-lg p-6 shadow-sm border">
                        <h3 class="text-xl font-semibold mb-2 text-gray-900">${escapeHtml(pub.title)}</h3>
                        ${pub.authorNames ? `<p class="text-gray-600 mb-2">${escapeHtml(pub.authorNames)}</p>` : ""}
                        <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                            ${pub.journal ? `<span>\u{1F4D6} ${escapeHtml(pub.journal)}</span>` : ""}
                            ${pub.publicationYear ? `<span>\u{1F4C5} ${escapeHtml(String(pub.publicationYear))}</span>` : ""}
                            ${pub.citationCount ? `<span>\u{1F4CA} ${escapeHtml(String(pub.citationCount))} citations</span>` : ""}
                            ${pub.isOpenAccess ? '<span class="text-green-600">\u{1F513} Open Access</span>' : ""}
                        </div>
                        ${pub.doi ? `<p class="mt-2 text-xs text-gray-400">DOI: ${escapeHtml(pub.doi)}</p>` : ""}
                    </div>
                `).join("")}
            </div>
        </div>
    </section>
    ` : ""}

    <!-- Affiliations -->
    ${affiliations2 && affiliations2.length > 0 ? `
    <section class="py-16 bg-white">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8 text-center">Institutional Affiliations</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${affiliations2.map((aff) => `
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="font-semibold text-lg mb-2">${escapeHtml(aff.institutionName)}</h3>
                        ${aff.institutionType ? `<p class="text-gray-600 mb-2">${escapeHtml(aff.institutionType)}</p>` : ""}
                        ${aff.countryCode ? `<p class="text-sm text-gray-500">\u{1F4CD} ${escapeHtml(aff.countryCode)}</p>` : ""}
                        ${aff.startYear || aff.endYear ? `
                            <p class="text-sm text-gray-500 mt-2">
                                ${escapeHtml(String(aff.startYear || "?"))} - ${escapeHtml(String(aff.endYear || "Present"))}
                            </p>
                        ` : ""}
                    </div>
                `).join("")}
            </div>
        </div>
    </section>
    ` : ""}

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-6xl mx-auto px-6 text-center">
            <p class="text-gray-400 mb-4">
                This profile was generated from OpenAlex data on ${escapeHtml(new Date(exportedAt).toLocaleDateString())}.
            </p>
            <p class="text-gray-500 text-sm">
                Data sourced from <a href="https://openalex.org" class="text-blue-400 hover:underline">OpenAlex</a> \u2022 
                Generated by Research Profile Platform
            </p>
            <div class="mt-6 no-print">
                <a href="${validateAndSanitizeUrl(exportUrl)}" class="text-blue-400 hover:underline">View Live Profile</a>
            </div>
        </div>
    </footer>

    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scroll for any anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        });
    </script>
</body>
</html>`;
}
function broadcastResearcherUpdate(openalexId, updateType) {
  updateEmitter.emit("researcher-update", { openalexId, updateType, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  const message = JSON.stringify({ openalexId, updateType, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  for (const connection of Array.from(sseConnections)) {
    try {
      connection.res.write(`data: ${message}

`);
    } catch (error) {
      sseConnections.delete(connection);
    }
  }
}
function cleanupSSEConnections() {
  for (const connection of Array.from(sseConnections)) {
    if (connection.res.destroyed || connection.res.finished) {
      sseConnections.delete(connection);
    }
  }
}
setInterval(cleanupSSEConnections, 3e4);
function generateBibTeX(publications2) {
  const bibtexTypeMap = {
    "article": "article",
    "journal-article": "article",
    "review": "article",
    "letter": "article",
    "editorial": "article",
    "book": "book",
    "book-chapter": "inbook",
    "monograph": "book",
    "proceedings": "proceedings",
    "proceedings-article": "inproceedings",
    "conference-paper": "inproceedings",
    "dataset": "misc",
    "preprint": "unpublished",
    "report": "techreport",
    "dissertation": "phdthesis",
    "patent": "misc",
    "other": "misc",
    "erratum": "misc",
    "paratext": "misc"
  };
  return publications2.map((pub, index2) => {
    const openalexType = pub.publicationType?.toLowerCase() || "article";
    const bibtexType = bibtexTypeMap[openalexType] || "misc";
    const key = `${bibtexType}${pub.publicationYear || "unknown"}${index2 + 1}`;
    const authors = pub.authorNames?.replace(/,/g, " and") || "Unknown Author";
    const title = pub.title || "Untitled";
    const year = pub.publicationYear || "";
    const journal = pub.journal || "";
    const doi = pub.doi || "";
    return `@${bibtexType}{${key},
  author = {${authors}},
  title = {${title}},
  journal = {${journal}},
  year = {${year}},
  doi = {${doi}},
  url = {https://doi.org/${doi}}
}`;
  }).join("\n\n");
}
function generateRIS(publications2) {
  return publications2.map((pub) => {
    const typeMap = {
      "article": "JOUR",
      "book": "BOOK",
      "book-chapter": "CHAP",
      "preprint": "UNPB",
      "review": "JOUR",
      "letter": "JOUR",
      "editorial": "JOUR"
    };
    const type = typeMap[pub.publicationType?.toLowerCase() || ""] || "GEN";
    const authors = (pub.authorNames || "").split(",").map((a) => a.trim()).filter((a) => a);
    let ris = `TY  - ${type}
`;
    authors.forEach((author) => {
      ris += `AU  - ${author}
`;
    });
    if (pub.title) ris += `TI  - ${pub.title}
`;
    if (pub.journal) ris += `JO  - ${pub.journal}
`;
    if (pub.publicationYear) ris += `PY  - ${pub.publicationYear}
`;
    if (pub.doi) ris += `DO  - ${pub.doi}
`;
    if (pub.doi) ris += `UR  - https://doi.org/${pub.doi}
`;
    ris += `ER  - 
`;
    return ris;
  }).join("\n");
}
function generateCSV(publications2) {
  const headers = ["Title", "Authors", "Journal", "Year", "Type", "Citations", "DOI", "Open Access", "Topics"];
  const rows = publications2.map((pub) => {
    return [
      escapeCSV(pub.title || ""),
      escapeCSV(pub.authorNames || ""),
      escapeCSV(pub.journal || ""),
      pub.publicationYear || "",
      escapeCSV(pub.publicationType || ""),
      pub.citationCount || 0,
      escapeCSV(pub.doi || ""),
      pub.isOpenAccess ? "Yes" : "No",
      escapeCSV(Array.isArray(pub.topics) ? pub.topics.join("; ") : "")
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
function escapeCSV(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
async function registerRoutes(app2) {
  const openalexService3 = new OpenAlexService();
  app2.use(tenantResolver);
  app2.use("/api/auth", authRouter);
  app2.use("/api/admin", adminRouter);
  app2.use("/api/admin", tenantRoutes_default);
  app2.use("/api/researcher", researcherRoutes_default);
  app2.get("/api/events", (req, res) => {
    console.log("\u{1F4E1} New SSE connection request from:", req.ip);
    try {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      });
      res.write(`data: ${JSON.stringify({ type: "connected", timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
      console.log("\u2705 SSE connection established, sent initial message");
      const connection = { res };
      sseConnections.add(connection);
      console.log(`\u{1F4CA} Total SSE connections: ${sseConnections.size}`);
      const heartbeat = setInterval(() => {
        try {
          if (!res.destroyed && !res.finished) {
            res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
          } else {
            console.log("\u{1F9F9} Cleaning up dead SSE connection");
            clearInterval(heartbeat);
            sseConnections.delete(connection);
          }
        } catch (error) {
          console.error("\u274C SSE heartbeat error:", error);
          clearInterval(heartbeat);
          sseConnections.delete(connection);
        }
      }, 15e3);
      req.on("close", () => {
        console.log("\u{1F50C} SSE client disconnected");
        clearInterval(heartbeat);
        sseConnections.delete(connection);
        console.log(`\u{1F4CA} Remaining SSE connections: ${sseConnections.size}`);
      });
      req.on("error", (error) => {
        console.error("\u274C SSE request error:", error);
        clearInterval(heartbeat);
        sseConnections.delete(connection);
      });
    } catch (error) {
      console.error("\u274C Failed to establish SSE connection:", error);
      res.status(500).end();
    }
  });
  app2.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/researcher/:openalexId/qr-code", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const { url } = req.query;
      const qrUrl = url || `${req.protocol}://${req.get("host")}/researcher/${openalexId}`;
      const QRCode = (await import("qrcode")).default;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });
  app2.get("/api/profile", async (req, res) => {
    try {
      const tenant = req.tenant;
      if (!tenant) {
        return res.status(404).json({ message: "No tenant found for this domain" });
      }
      const profile = await storage.getResearcherProfileByTenant(tenant.id);
      if (!profile || !profile.openalexId) {
        return res.status(404).json({
          message: "Profile not configured",
          tenantName: tenant.name,
          tenantStatus: tenant.status
        });
      }
      const researcherData = await storage.getOpenalexData(profile.openalexId, "researcher");
      const researchTopics2 = await storage.getResearchTopics(profile.openalexId);
      const publications2 = await storage.getPublications(profile.openalexId);
      const affiliations2 = await storage.getAffiliations(profile.openalexId);
      return res.json({
        profile: {
          ...profile
        },
        researcher: researcherData?.data || null,
        topics: researchTopics2,
        publications: publications2,
        affiliations: affiliations2,
        lastSynced: profile.lastSyncedAt,
        tenant: {
          name: tenant.name,
          plan: tenant.plan,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor
        },
        isPreview: false
      });
    } catch (error) {
      console.error("Error fetching tenant profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.get("/api/researcher/:openalexId/data", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const preview = req.query.preview === "true";
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (profile && profile.isPublic) {
        const researcherData = await storage.getOpenalexData(openalexId, "researcher");
        const researchTopics2 = await storage.getResearchTopics(openalexId);
        const publications2 = await storage.getPublications(openalexId);
        const affiliations2 = await storage.getAffiliations(openalexId);
        return res.json({
          profile,
          researcher: researcherData?.data || null,
          topics: researchTopics2,
          publications: publications2,
          affiliations: affiliations2,
          lastSynced: profile.lastSyncedAt,
          isPreview: false
        });
      }
      try {
        const researcher = await openalexService3.getResearcher(openalexId);
        const works = await openalexService3.getResearcherWorks(openalexId);
        const topics = (researcher.topics || []).slice(0, 10).map((topic) => ({
          displayName: topic.display_name,
          subfield: topic.subfield?.display_name || null,
          field: topic.field?.display_name || null,
          domain: topic.domain?.display_name || null
        }));
        const affiliations2 = (researcher.affiliations || []).slice(0, 5).map((aff) => ({
          institutionName: aff.institution?.display_name || "Unknown Institution",
          years: aff.years || []
        }));
        const normalizeTitle = (title) => {
          if (!title) return "Untitled";
          let cleaned = title.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#?\w+;/g, "").replace(/\s+/g, " ").trim();
          return cleaned || "Untitled";
        };
        const publications2 = works.results.slice(0, 100).map((work) => ({
          id: work.id || "",
          title: normalizeTitle(work.display_name || work.title),
          authorNames: work.authorships?.map((a) => a.author?.display_name).filter(Boolean).join(", ") || null,
          journal: work.primary_location?.source?.display_name || null,
          publicationYear: work.publication_year,
          citationCount: work.cited_by_count || 0,
          topics: work.topics?.slice(0, 5).map((t) => t.display_name) || [],
          doi: work.doi || null,
          isOpenAccess: work.open_access?.is_oa || false,
          publicationType: work.type || "article",
          openAccessUrl: work.open_access?.oa_url || null
        }));
        const institution = researcher.last_known_institutions?.[0];
        const orcid = researcher.orcid || null;
        const getAcademicTitle = (worksCount) => {
          if (worksCount > 500) return "Distinguished Professor";
          if (worksCount > 200) return "Full Professor";
          if (worksCount > 100) return "Associate Professor";
          if (worksCount > 50) return "Assistant Professor";
          if (worksCount > 20) return "Research Scientist";
          return "Researcher";
        };
        const previewProfile = {
          displayName: researcher.display_name,
          title: getAcademicTitle(researcher.works_count || 0),
          currentAffiliation: institution?.display_name || "Your University",
          department: institution?.type === "education" ? "Department of Research" : null,
          bio: `Distinguished researcher with ${researcher.works_count || 0} publications and ${researcher.cited_by_count || 0} citations. Research spans multiple disciplines with contributions to the academic community.`,
          profileImageUrl: null,
          // Will be handled on frontend with initials avatar
          cvUrl: "#cv-placeholder",
          contactEmail: "yourname@university.edu",
          phone: "+1 (555) 123-4567",
          officeLocation: "Building A, Room 123",
          location: institution?.display_name || "Your Institution",
          countryCode: institution?.country_code || null,
          orcidId: orcid,
          googleScholarUrl: "#scholar-placeholder",
          linkedinUrl: "#linkedin-placeholder",
          twitterHandle: "@yourhandle",
          websiteUrl: "#website-placeholder",
          researchInterests: topics.slice(0, 5).map((t) => t.displayName),
          isPublic: true,
          isPreview: true
        };
        return res.json({
          profile: previewProfile,
          researcher,
          topics,
          publications: publications2,
          affiliations: affiliations2,
          lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
          isPreview: true
        });
      } catch (openAlexError) {
        console.error("Error fetching from OpenAlex for preview:", openAlexError);
        return res.status(404).json({ message: "Researcher not found" });
      }
    } catch (error) {
      console.error("Error fetching researcher data:", error);
      res.status(500).json({ message: "Failed to fetch researcher data" });
    }
  });
  app2.post("/api/admin/researcher/profile", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    if (!isAuthenticated3(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      let systemUser = await storage.getUserByEmail("system@admin.local");
      if (!systemUser) {
        systemUser = await storage.createUser({
          email: "system@admin.local",
          passwordHash: "SYSTEM_USER_NO_LOGIN",
          firstName: "System",
          lastName: "Admin",
          role: "admin"
        });
      }
      const profileData = insertResearcherProfileSchema.parse({
        ...req.body,
        userId: systemUser.id
      });
      const profile = await storage.upsertResearcherProfile(profileData);
      if (profile.openalexId) {
        broadcastResearcherUpdate(profile.openalexId, "create");
        openalexService3.syncResearcherData(profile.openalexId).catch((error) => {
          console.error(`Failed to sync OpenAlex data for ${profile.openalexId}:`, error);
        });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error creating researcher profile:", error);
      if (error instanceof z6.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create researcher profile" });
      }
    }
  });
  app2.put("/api/admin/researcher/profile/:openalexId", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    if (!isAuthenticated3(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      const updates = updateResearcherProfileSchema.parse({
        ...req.body,
        id: profile.id
      });
      const updatedProfile = await storage.updateResearcherProfile(profile.id, updates);
      broadcastResearcherUpdate(openalexId, "profile");
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating researcher profile:", error);
      if (error instanceof z6.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update researcher profile" });
      }
    }
  });
  app2.get("/api/admin/researcher/profile/:openalexId", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    if (!isAuthenticated3(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching researcher profile:", error);
      res.status(500).json({ message: "Failed to fetch researcher profile" });
    }
  });
  app2.post("/api/admin/researcher/:openalexId/sync", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    if (!isAuthenticated3(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      if (profile.openalexId) {
        await openalexService3.syncResearcherData(profile.openalexId);
      }
      await storage.updateResearcherProfile(profile.id, {
        lastSyncedAt: /* @__PURE__ */ new Date()
      });
      broadcastResearcherUpdate(openalexId, "sync");
      res.json({ message: "Data sync completed successfully" });
    } catch (error) {
      console.error("Error syncing researcher data:", error);
      res.status(500).json({ message: "Failed to sync researcher data" });
    }
  });
  app2.delete("/api/admin/researcher/:openalexId", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    if (!isAuthenticated3(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      await storage.deleteResearcherProfile(openalexId);
      res.json({ message: "Researcher profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting researcher profile:", error);
      res.status(500).json({ message: "Failed to delete researcher profile" });
    }
  });
  app2.post("/api/test/broadcast/:openalexId", (req, res) => {
    const { openalexId } = req.params;
    console.log(`\u{1F9EA} Test broadcast triggered for researcher: ${openalexId}`);
    broadcastResearcherUpdate(openalexId, "profile");
    res.json({
      message: `Test broadcast sent for researcher ${openalexId}`,
      connectionsNotified: sseConnections.size,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/openalex/search/:openalexId", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const data = await openalexService3.getResearcher(openalexId);
      res.json(data);
    } catch (error) {
      console.error("Error searching OpenAlex:", error);
      res.status(500).json({ message: "Failed to search OpenAlex" });
    }
  });
  app2.get("/api/openalex/author/:openalexId", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const data = await openalexService3.getResearcher(openalexId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching OpenAlex author:", error);
      if (error instanceof Error && error.message.includes("404")) {
        return res.status(404).json({ message: "Researcher not found in OpenAlex" });
      }
      res.status(500).json({ message: "Failed to fetch author data" });
    }
  });
  app2.get("/api/openalex/autocomplete", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }
      const response = await fetch3(
        `https://api.openalex.org/authors?search=${encodeURIComponent(query)}&sort=works_count:desc&per_page=10`
      );
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`);
      }
      const data = await response.json();
      const results = data.results.map((author) => ({
        id: author.id.replace("https://openalex.org/", ""),
        display_name: author.display_name,
        hint: author.last_known_institutions?.[0]?.display_name || "",
        works_count: author.works_count || 0,
        cited_by_count: author.cited_by_count || 0
      }));
      res.json({ results });
    } catch (error) {
      console.error("Error searching OpenAlex authors:", error);
      res.status(500).json({ message: "Failed to search authors" });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const { fullName, email, institution, role, planInterest, researchField, openalexId, estimatedProfiles, biography } = req.body;
      if (!fullName || !email || !planInterest || !biography) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      console.log("New contact inquiry received:");
      console.log({
        fullName,
        email,
        institution,
        role,
        planInterest,
        researchField,
        openalexId,
        estimatedProfiles,
        biography,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({
        success: true,
        message: "Inquiry submitted successfully"
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to process inquiry" });
    }
  });
  app2.get("/api/researcher/:openalexId/export-bibliography", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const format = req.query.format || "bibtex";
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile || !profile.isPublic) {
        return res.status(404).json({ message: "Researcher not found or not public" });
      }
      const publications2 = await storage.getPublications(openalexId);
      if (publications2.length === 0) {
        return res.status(404).json({ message: "No publications found" });
      }
      let content;
      let filename;
      let contentType;
      const sanitizedName = (profile.displayName || "researcher").replace(/[^a-zA-Z0-9-_]/g, "_");
      switch (format.toLowerCase()) {
        case "bibtex":
          content = generateBibTeX(publications2);
          filename = `${sanitizedName}_bibliography.bib`;
          contentType = "application/x-bibtex";
          break;
        case "ris":
          content = generateRIS(publications2);
          filename = `${sanitizedName}_bibliography.ris`;
          contentType = "application/x-research-info-systems";
          break;
        case "csv":
          content = generateCSV(publications2);
          filename = `${sanitizedName}_bibliography.csv`;
          contentType = "text/csv";
          break;
        case "json":
          content = JSON.stringify(publications2, null, 2);
          filename = `${sanitizedName}_bibliography.json`;
          contentType = "application/json";
          break;
        default:
          return res.status(400).json({ message: "Invalid format. Supported formats: bibtex, ris, csv, json" });
      }
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Error exporting bibliography:", error);
      res.status(500).json({ message: "Failed to export bibliography" });
    }
  });
  app2.get("/api/researcher/:openalexId/export", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile || !profile.isPublic) {
        return res.status(404).json({ message: "Researcher not found or not public" });
      }
      const researcherData = await storage.getOpenalexData(openalexId, "researcher");
      const researchTopics2 = await storage.getResearchTopics(openalexId);
      const publications2 = await storage.getPublications(openalexId);
      const affiliations2 = await storage.getAffiliations(openalexId);
      const exportData = {
        profile,
        researcher: researcherData?.data || null,
        topics: researchTopics2,
        publications: publications2,
        affiliations: affiliations2,
        lastSynced: profile.lastSyncedAt,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        exportUrl: `${req.protocol}://${req.get("host")}/researcher/${openalexId}`
      };
      const staticHTML = generateStaticHTML(exportData);
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="${profile.displayName || "researcher"}-profile.html"`);
      res.send(staticHTML);
    } catch (error) {
      console.error("Error exporting researcher profile:", error);
      res.status(500).json({ message: "Failed to export researcher profile" });
    }
  });
  const upload = multer2({
    storage: multer2.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024
      // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed"));
      }
    }
  });
  app2.post("/api/admin/researcher/:openalexId/upload-cv", adminRateLimit, adminSessionAuthMiddleware, upload.single("cv"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!storageBucketId) {
        return res.status(500).json({ message: "Object storage not configured" });
      }
      const objectStorage = new ObjectStorageClient2({ bucketId: storageBucketId });
      const filename = `public/cv/${openalexId}-cv-${Date.now()}.pdf`;
      const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);
      if (!uploadResult.ok) {
        console.error("Object storage upload error:", uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
      const publicPath = filename.replace("public/", "");
      const cvUrl = `/public-objects/${publicPath}`;
      await storage.updateResearcherProfile(profile.id, {
        cvUrl
      });
      broadcastResearcherUpdate(openalexId, "profile");
      res.json({
        message: "CV uploaded successfully",
        cvUrl
      });
    } catch (error) {
      console.error("Error uploading CV:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to upload CV"
      });
    }
  });
  const uploadImage2 = multer2({
    storage: multer2.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024
      // 5MB limit for images
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  app2.post("/api/admin/researcher/:openalexId/upload-profile-image", adminRateLimit, adminSessionAuthMiddleware, uploadImage2.single("profileImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!storageBucketId) {
        return res.status(500).json({ message: "Object storage not configured" });
      }
      const objectStorage = new ObjectStorageClient2({ bucketId: storageBucketId });
      const fileExtension = req.file.mimetype.split("/")[1];
      const filename = `public/profile-images/${openalexId}-profile-${Date.now()}.${fileExtension}`;
      const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);
      if (!uploadResult.ok) {
        console.error("Object storage upload error:", uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
      const publicPath = filename.replace("public/", "");
      const profileImageUrl = `/public-objects/${publicPath}`;
      await storage.updateResearcherProfile(profile.id, {
        profileImageUrl
      });
      broadcastResearcherUpdate(openalexId, "profile");
      res.json({
        message: "Profile image uploaded successfully",
        profileImageUrl
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to upload profile image"
      });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.put("/api/admin/settings", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const settings = req.body;
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "string") {
          await storage.upsertSetting(key, value);
        }
      }
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/static.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
function serveStatic(app2) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/index-production.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: true }));
var PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    tableName: "sessions",
    createTableIfMissing: false
  }),
  secret: process.env.SESSION_SECRET || "research-profile-admin-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  serveStatic(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
    startSyncScheduler(1);
    log("Sync scheduler started - checking tenants hourly");
  });
})();
