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
  checkoutSessionSchema: () => checkoutSessionSchema,
  domains: () => domains,
  forgotPasswordSchema: () => forgotPasswordSchema,
  insertDomainSchema: () => insertDomainSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertProfileSectionSchema: () => insertProfileSectionSchema,
  insertResearcherProfileSchema: () => insertResearcherProfileSchema,
  insertTenantSchema: () => insertTenantSchema,
  insertThemeSchema: () => insertThemeSchema,
  loginUserSchema: () => loginUserSchema,
  openalexData: () => openalexData,
  passwordResetTokens: () => passwordResetTokens,
  payments: () => payments,
  profileAnalytics: () => profileAnalytics,
  profileAnalyticsDaily: () => profileAnalyticsDaily,
  profileSections: () => profileSections,
  publications: () => publications,
  registerUserSchema: () => registerUserSchema,
  researchTopics: () => researchTopics,
  researcherProfiles: () => researcherProfiles,
  resetPasswordSchema: () => resetPasswordSchema,
  siteSettings: () => siteSettings,
  syncLogs: () => syncLogs,
  tenants: () => tenants,
  themeConfigSchema: () => themeConfigSchema,
  themes: () => themes,
  updateDomainSchema: () => updateDomainSchema,
  updateProfileSectionSchema: () => updateProfileSectionSchema,
  updateResearcherProfileSchema: () => updateResearcherProfileSchema,
  updateTenantSchema: () => updateTenantSchema,
  updateThemeSchema: () => updateThemeSchema,
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
  selectedThemeId: varchar("selected_theme_id"),
  // Reference to themes table
  // Trial
  trialEndsAt: timestamp("trial_ends_at"),
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
  emailVerifiedAt: timestamp("email_verified_at"),
  emailVerificationToken: varchar("email_verification_token", { length: 64 }),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow()
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
  // Social/Academic profile links
  orcidUrl: varchar("orcid_url"),
  googleScholarUrl: varchar("google_scholar_url"),
  researchGateUrl: varchar("research_gate_url"),
  linkedinUrl: varchar("linkedin_url"),
  websiteUrl: varchar("website_url"),
  twitterUrl: varchar("twitter_url"),
  selectedThemeId: varchar("selected_theme_id"),
  // Reference to themes table
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
  isReviewArticle: boolean("is_review_article").default(false),
  isFeatured: boolean("is_featured").default(false),
  // Highlighted publications shown prominently
  pdfUrl: varchar("pdf_url")
  // URL to uploaded PDF file
}, (table) => ({
  uniqueOpenalexWork: unique().on(table.openalexId, table.workId)
}));
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
var profileSections = pgTable("profile_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").references(() => researcherProfiles.id).notNull(),
  title: varchar("title").notNull(),
  // Section heading
  content: text("content").notNull(),
  // Rich text / markdown content
  sectionType: varchar("section_type").default("custom").notNull(),
  // 'bio', 'research_interests', 'awards', 'custom'
  sortOrder: integer("sort_order").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertProfileSectionSchema = createInsertSchema(profileSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateProfileSectionSchema = insertProfileSectionSchema.partial().extend({
  id: z.string()
});
var syncLogs = pgTable("sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  profileId: varchar("profile_id").references(() => researcherProfiles.id),
  syncType: varchar("sync_type").notNull(),
  // 'full', 'publications', 'topics', 'affiliations'
  status: varchar("status").notNull(),
  // 'pending', 'in_progress', 'completed', 'failed'
  itemsProcessed: integer("items_processed").default(0),
  itemsTotal: integer("items_total"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var profileAnalytics = pgTable("profile_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").references(() => researcherProfiles.id),
  openalexId: varchar("openalex_id").notNull(),
  eventType: varchar("event_type").notNull(),
  // 'view', 'click', 'share', 'download'
  eventTarget: varchar("event_target"),
  // 'publication', 'cv', 'linkedin', 'email', etc.
  visitorId: varchar("visitor_id"),
  // Anonymous visitor tracking
  referrer: varchar("referrer"),
  userAgent: varchar("user_agent"),
  country: varchar("country"),
  city: varchar("city"),
  createdAt: timestamp("created_at").defaultNow()
});
var profileAnalyticsDaily = pgTable("profile_analytics_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").references(() => researcherProfiles.id),
  openalexId: varchar("openalex_id").notNull(),
  date: date("date").notNull(),
  views: integer("views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  clicks: integer("clicks").default(0),
  shares: integer("shares").default(0),
  downloads: integer("downloads").default(0)
}, (table) => ({
  uniqueProfileDate: unique().on(table.openalexId, table.date)
}));
var registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  openalexId: z.string().optional(),
  affiliation: z.string().optional()
});
var loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});
var resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});
var siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key").unique().notNull(),
  // e.g., 'theme', 'contact_email', 'platform_name'
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var themeConfigSchema = z.object({
  colors: z.object({
    primary: z.string().min(1),
    primaryDark: z.string().min(1),
    accent: z.string().min(1),
    background: z.string().min(1),
    surface: z.string().min(1),
    text: z.string().min(1),
    textMuted: z.string().min(1)
  }),
  typography: z.object({
    headingFont: z.string().min(1).optional(),
    bodyFont: z.string().min(1).optional()
  }).optional()
});
var themes = pgTable("themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  config: jsonb("config").$type().notNull(),
  previewImageUrl: varchar("preview_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1),
  config: themeConfigSchema
});
var updateThemeSchema = insertThemeSchema.partial().extend({
  id: z.string()
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
var payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  orderNumber: varchar("order_number").unique().notNull(),
  amount: varchar("amount").notNull(),
  currency: varchar("currency").default("USD").notNull(),
  status: varchar("status").$type().default("pending").notNull(),
  plan: varchar("plan").$type().notNull(),
  billingPeriod: varchar("billing_period").default("monthly").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  montyPaySessionId: varchar("montypay_session_id"),
  montyPayTransactionId: varchar("montypay_transaction_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  completedAt: true
});
var checkoutSessionSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  billingPeriod: z.enum(["monthly", "yearly"]),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  openalexId: z.string().optional()
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var pool = void 0;
var db = void 0;
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - running in development fallback mode (no DB).");
} else {
  const connectionString = process.env.DATABASE_URL || "";
  const isNeonDatabase = connectionString.includes("neon.tech") || connectionString.includes("neon.com");
  console.log(`Database connection initialized (SSL ${isNeonDatabase ? "enabled" : "disabled"})`);
  pool = new Pool({
    connectionString,
    ssl: isNeonDatabase ? { rejectUnauthorized: false } : false,
    max: 3,
    idleTimeoutMillis: 1e4,
    connectionTimeoutMillis: 5e3
  });
  pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err.message);
  });
  db = drizzle(pool, { schema: schema_exports });
}

// server/storage.ts
import { eq, desc, and, inArray, asc, sql as sql2, gte, lte } from "drizzle-orm";
import crypto from "crypto";
function generateUUID() {
  return crypto.randomUUID();
}
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
    const [result] = await db.insert(tenants).values({
      ...tenant,
      id: generateUUID()
    }).returning();
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
        id: generateUUID(),
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
      id: generateUUID(),
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
    const [user] = await db.insert(users).values({
      ...userData,
      id: generateUUID()
    }).returning();
    return user;
  }
  async upsertUser(userData) {
    const dataWithId = {
      ...userData,
      id: userData.id || generateUUID()
    };
    const [user] = await db.insert(users).values(dataWithId).onConflictDoUpdate({
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
    const profileWithId = {
      ...profile,
      id: generateUUID()
    };
    const [result] = await db.insert(researcherProfiles).values(profileWithId).onConflictDoUpdate({
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
    const [result] = await db.insert(openalexData).values({
      ...data,
      id: generateUUID()
    }).onConflictDoUpdate({
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
    await db.transaction(async (tx) => {
      await tx.delete(researchTopics).where(eq(researchTopics.openalexId, topics[0].openalexId));
      const topicsWithIds = topics.map((topic) => ({
        ...topic,
        id: generateUUID()
      }));
      await tx.insert(researchTopics).values(topicsWithIds);
    });
  }
  // Publications operations
  async getPublications(openalexId, limit) {
    const query = db.select().from(publications).where(eq(publications.openalexId, openalexId)).orderBy(desc(publications.publicationYear), desc(publications.citationCount));
    if (limit !== void 0) {
      return await query.limit(limit);
    }
    return await query;
  }
  async getPublicationById(id) {
    const [result] = await db.select().from(publications).where(eq(publications.id, id));
    return result;
  }
  async getPublicationsByOpenalexId(openalexId) {
    return await db.select().from(publications).where(eq(publications.openalexId, openalexId)).orderBy(desc(publications.publicationYear), desc(publications.citationCount));
  }
  async upsertPublications(pubs) {
    if (pubs.length === 0) return;
    const pubsWithIds = pubs.map((pub) => ({
      ...pub,
      id: generateUUID()
    }));
    await db.insert(publications).values(pubsWithIds).onConflictDoUpdate({
      target: [publications.openalexId, publications.workId],
      set: {
        title: sql2`EXCLUDED.title`,
        authorNames: sql2`EXCLUDED.author_names`,
        journal: sql2`EXCLUDED.journal`,
        publicationYear: sql2`EXCLUDED.publication_year`,
        citationCount: sql2`EXCLUDED.citation_count`,
        topics: sql2`EXCLUDED.topics`,
        doi: sql2`EXCLUDED.doi`,
        isOpenAccess: sql2`EXCLUDED.is_open_access`,
        publicationType: sql2`EXCLUDED.publication_type`,
        isReviewArticle: sql2`EXCLUDED.is_review_article`
        // Note: isFeatured and pdfUrl are DELIBERATELY omitted from the SET list,
        // so if the row exists, the curated feature data is safely preserved!
      }
    });
  }
  async updatePublicationFeatured(publicationId, isFeatured) {
    const [result] = await db.update(publications).set({ isFeatured }).where(eq(publications.id, publicationId)).returning();
    return result;
  }
  async updatePublicationPdf(publicationId, pdfUrl) {
    const [result] = await db.update(publications).set({ pdfUrl }).where(eq(publications.id, publicationId)).returning();
    return result;
  }
  // Affiliations operations
  async getAffiliations(openalexId) {
    return await db.select().from(affiliations).where(eq(affiliations.openalexId, openalexId)).orderBy(desc(affiliations.startYear));
  }
  async upsertAffiliations(affs) {
    if (affs.length === 0) return;
    await db.transaction(async (tx) => {
      await tx.delete(affiliations).where(eq(affiliations.openalexId, affs[0].openalexId));
      const affsWithIds = affs.map((aff) => ({
        ...aff,
        id: generateUUID()
      }));
      await tx.insert(affiliations).values(affsWithIds);
    });
  }
  // Profile sections operations
  async getProfileSectionById(id) {
    const [result] = await db.select().from(profileSections).where(eq(profileSections.id, id));
    return result;
  }
  async getProfileSections(profileId) {
    return await db.select().from(profileSections).where(eq(profileSections.profileId, profileId)).orderBy(asc(profileSections.sortOrder));
  }
  async createProfileSection(section) {
    const [result] = await db.insert(profileSections).values({
      ...section,
      id: generateUUID()
    }).returning();
    return result;
  }
  async updateProfileSection(id, updates) {
    const [result] = await db.update(profileSections).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(profileSections.id, id)).returning();
    return result;
  }
  async deleteProfileSection(id) {
    await db.delete(profileSections).where(eq(profileSections.id, id));
  }
  async reorderProfileSections(sectionIds) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < sectionIds.length; i++) {
        await tx.update(profileSections).set({ sortOrder: i, updatedAt: /* @__PURE__ */ new Date() }).where(eq(profileSections.id, sectionIds[i]));
      }
    });
  }
  // Sync logs operations
  async getSyncLogs(profileId) {
    return await db.select().from(syncLogs).where(eq(syncLogs.profileId, profileId)).orderBy(desc(syncLogs.startedAt)).limit(50);
  }
  async createSyncLog(log2) {
    const [result] = await db.insert(syncLogs).values({
      ...log2,
      id: generateUUID()
    }).returning();
    return result;
  }
  async updateSyncLog(id, updates) {
    const [result] = await db.update(syncLogs).set(updates).where(eq(syncLogs.id, id)).returning();
    return result;
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
    const [setting] = await db.insert(siteSettings).values({ id: generateUUID(), settingKey: key, settingValue: value }).onConflictDoUpdate({
      target: siteSettings.settingKey,
      set: {
        settingValue: value,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return setting;
  }
  // Theme operations
  async getTheme(id) {
    const [theme] = await db.select().from(themes).where(eq(themes.id, id));
    return theme;
  }
  async getThemeByName(name) {
    const [theme] = await db.select().from(themes).where(eq(themes.name, name));
    return theme;
  }
  async getAllThemes() {
    return await db.select().from(themes).orderBy(themes.sortOrder, themes.name);
  }
  async getActiveThemes() {
    return await db.select().from(themes).where(eq(themes.isActive, true)).orderBy(themes.sortOrder, themes.name);
  }
  async getDefaultTheme() {
    const [theme] = await db.select().from(themes).where(and(eq(themes.isDefault, true), eq(themes.isActive, true)));
    return theme;
  }
  async createTheme(theme) {
    const [result] = await db.insert(themes).values({
      ...theme,
      id: generateUUID()
    }).returning();
    return result;
  }
  async updateTheme(id, updates) {
    const [result] = await db.update(themes).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(themes.id, id)).returning();
    return result;
  }
  async deleteTheme(id) {
    await db.delete(themes).where(eq(themes.id, id));
  }
  async setDefaultTheme(id) {
    const [result] = await db.transaction(async (tx) => {
      await tx.update(themes).set({ isDefault: false }).where(eq(themes.isDefault, true));
      return await tx.update(themes).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(themes.id, id)).returning();
    });
    return result;
  }
  async bulkApplyThemeToTenants(themeId, tenantIds) {
    let query = db.update(tenants).set({ selectedThemeId: themeId, updatedAt: /* @__PURE__ */ new Date() });
    if (tenantIds && tenantIds.length > 0) {
      query = query.where(inArray(tenants.id, tenantIds));
    }
    const result = await query;
    return { updated: result.rowCount || 0 };
  }
  async getTenantsWithThemeInfo() {
    const results = await db.select({
      id: tenants.id,
      name: tenants.name,
      currentThemeId: tenants.selectedThemeId,
      currentThemeName: themes.name
    }).from(tenants).leftJoin(themes, eq(tenants.selectedThemeId, themes.id)).orderBy(tenants.name);
    return results;
  }
  // Payment operations
  async createPayment(payment) {
    const [result] = await db.insert(payments).values({
      ...payment,
      id: generateUUID()
    }).returning();
    return result;
  }
  async getPaymentByOrderNumber(orderNumber) {
    const [payment] = await db.select().from(payments).where(eq(payments.orderNumber, orderNumber));
    return payment;
  }
  async getPaymentsByEmail(email) {
    return await db.select().from(payments).where(eq(payments.customerEmail, email)).orderBy(desc(payments.createdAt));
  }
  // ─── Password reset tokens ──────────────────────────────────────────────────
  async createPasswordResetToken(userId, token, expiresAt) {
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }
  async getPasswordResetToken(token) {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return row;
  }
  async markPasswordResetTokenUsed(token) {
    await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq(passwordResetTokens.token, token));
  }
  // ─── Email verification ──────────────────────────────────────────────────────
  async setEmailVerificationToken(userId, token, expiresAt) {
    await db.update(users).set({ emailVerificationToken: token, emailVerificationExpiresAt: expiresAt }).where(eq(users.id, userId));
  }
  async verifyEmailWithToken(token) {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    if (!user) return void 0;
    if (!user.emailVerificationExpiresAt || /* @__PURE__ */ new Date() > user.emailVerificationExpiresAt) return void 0;
    const [updated] = await db.update(users).set({
      emailVerifiedAt: /* @__PURE__ */ new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null
    }).where(eq(users.id, user.id)).returning();
    return updated;
  }
  async createTrialTenant(userId, firstName, lastName, email, options) {
    const base = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}${lastName ? `-${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}` : ""}`;
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const subdomain = `${base || "researcher"}-${uniqueSuffix}`.substring(0, 40);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3);
    const tenant = await this.createTenant({
      name: `${firstName} ${lastName}`.trim(),
      plan: "free",
      status: "active",
      contactEmail: email,
      trialEndsAt
    });
    await this.createDomain({
      tenantId: tenant.id,
      hostname: `${subdomain}.scholar.name`,
      isPrimary: true,
      isSubdomain: true
    });
    await this.updateTenantProfile(tenant.id, {
      tenantId: tenant.id,
      displayName: `${firstName} ${lastName}`.trim(),
      openalexId: options?.openalexId,
      currentAffiliation: options?.affiliation,
      email,
      isPublic: true
    });
    await this.updateUser(userId, { tenantId: tenant.id });
    return tenant;
  }
  async updatePaymentStatus(orderNumber, status, transactionId) {
    const updates = { status };
    if (transactionId) {
      updates.montyPayTransactionId = transactionId;
    }
    if (status === "completed") {
      updates.completedAt = /* @__PURE__ */ new Date();
    }
    const [result] = await db.update(payments).set(updates).where(eq(payments.orderNumber, orderNumber)).returning();
    return result;
  }
  async updatePaymentSessionId(orderNumber, sessionId) {
    const [result] = await db.update(payments).set({ montyPaySessionId: sessionId }).where(eq(payments.orderNumber, orderNumber)).returning();
    return result;
  }
  async provisionTenantFromPayment(paymentId) {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    if (!payment || payment.status !== "completed") return void 0;
    const metadata = payment.metadata;
    const existingUser = await this.getUserByEmail(payment.customerEmail);
    if (existingUser?.tenantId) {
      const subscriptionEnd2 = /* @__PURE__ */ new Date();
      if (payment.billingPeriod === "yearly") {
        subscriptionEnd2.setFullYear(subscriptionEnd2.getFullYear() + 1);
      } else {
        subscriptionEnd2.setMonth(subscriptionEnd2.getMonth() + 1);
      }
      const updatedTenant = await this.updateTenant(existingUser.tenantId, {
        plan: payment.plan,
        status: "active",
        subscriptionStartDate: /* @__PURE__ */ new Date(),
        subscriptionEndDate: subscriptionEnd2,
        trialEndsAt: null
      });
      if (metadata?.openalexId) {
        await this.updateTenantProfile(existingUser.tenantId, {
          openalexId: metadata.openalexId,
          currentAffiliation: metadata.affiliation,
          email: payment.customerEmail
        });
      }
      await db.update(payments).set({ tenantId: existingUser.tenantId }).where(eq(payments.id, paymentId));
      return updatedTenant;
    }
    const firstWord = payment.customerName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const subdomain = `${firstWord}-${uniqueSuffix}`.substring(0, 40);
    const subscriptionEnd = /* @__PURE__ */ new Date();
    if (payment.billingPeriod === "yearly") {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    } else {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    }
    const tenant = await this.createTenant({
      name: payment.customerName,
      plan: payment.plan,
      status: "active",
      contactEmail: payment.customerEmail,
      subscriptionStartDate: /* @__PURE__ */ new Date(),
      subscriptionEndDate: subscriptionEnd
    });
    await db.update(payments).set({ tenantId: tenant.id }).where(eq(payments.id, paymentId));
    await this.createDomain({
      tenantId: tenant.id,
      hostname: `${subdomain}.scholar.name`,
      isPrimary: true,
      isSubdomain: true
    });
    await this.updateTenantProfile(tenant.id, {
      tenantId: tenant.id,
      displayName: payment.customerName,
      openalexId: metadata?.openalexId,
      currentAffiliation: metadata?.affiliation,
      email: payment.customerEmail,
      isPublic: true
    });
    if (existingUser) {
      await this.updateUser(existingUser.id, { tenantId: tenant.id });
    }
    return tenant;
  }
  async getAllPayments() {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }
  // Analytics operations
  async trackAnalyticsEvent(event) {
    const [result] = await db.insert(profileAnalytics).values({
      ...event,
      id: generateUUID()
    }).returning();
    return result;
  }
  async getAnalyticsByOpenalexId(openalexId, startDate, endDate) {
    const conditions = [eq(profileAnalytics.openalexId, openalexId)];
    if (startDate) conditions.push(gte(profileAnalytics.createdAt, startDate));
    if (endDate) conditions.push(lte(profileAnalytics.createdAt, endDate));
    return await db.select().from(profileAnalytics).where(and(...conditions)).orderBy(desc(profileAnalytics.createdAt));
  }
  async getAnalyticsSummary(openalexId, days = 30) {
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const events = await this.getAnalyticsByOpenalexId(openalexId, startDate);
    const totalViews = events.filter((e) => e.eventType === "view").length;
    const uniqueVisitors = new Set(events.filter((e) => e.eventType === "view").map((e) => e.visitorId)).size;
    const totalClicks = events.filter((e) => e.eventType === "click").length;
    const totalShares = events.filter((e) => e.eventType === "share").length;
    const totalDownloads = events.filter((e) => e.eventType === "download").length;
    const viewsByDayMap = /* @__PURE__ */ new Map();
    events.filter((e) => e.eventType === "view").forEach((e) => {
      const date2 = e.createdAt ? new Date(e.createdAt).toISOString().split("T")[0] : "";
      if (!viewsByDayMap.has(date2)) {
        viewsByDayMap.set(date2, { views: 0, visitors: /* @__PURE__ */ new Set() });
      }
      const day = viewsByDayMap.get(date2);
      day.views++;
      if (e.visitorId) day.visitors.add(e.visitorId);
    });
    const viewsByDay = Array.from(viewsByDayMap.entries()).map(([date2, data]) => ({ date: date2, views: data.views, uniqueVisitors: data.visitors.size })).sort((a, b) => a.date.localeCompare(b.date));
    const referrerMap = /* @__PURE__ */ new Map();
    events.filter((e) => e.referrer).forEach((e) => {
      const ref = e.referrer || "Direct";
      referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
    });
    const topReferrers = Array.from(referrerMap.entries()).map(([referrer, count2]) => ({ referrer, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 10);
    const clickMap = /* @__PURE__ */ new Map();
    events.filter((e) => e.eventType === "click" && e.eventTarget).forEach((e) => {
      const target = e.eventTarget || "unknown";
      clickMap.set(target, (clickMap.get(target) || 0) + 1);
    });
    const clicksByTarget = Array.from(clickMap.entries()).map(([target, count2]) => ({ target, count: count2 })).sort((a, b) => b.count - a.count);
    return {
      totalViews,
      uniqueVisitors,
      totalClicks,
      totalShares,
      totalDownloads,
      viewsByDay,
      topReferrers,
      clicksByTarget
    };
  }
  async aggregateDailyAnalytics(openalexId, date2) {
    const startOfDay = new Date(date2);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date2);
    endOfDay.setHours(23, 59, 59, 999);
    const events = await this.getAnalyticsByOpenalexId(openalexId, startOfDay, endOfDay);
    const views = events.filter((e) => e.eventType === "view").length;
    const uniqueVisitors = new Set(events.filter((e) => e.eventType === "view").map((e) => e.visitorId)).size;
    const clicks = events.filter((e) => e.eventType === "click").length;
    const shares = events.filter((e) => e.eventType === "share").length;
    const downloads = events.filter((e) => e.eventType === "download").length;
    const profileId = events[0]?.profileId || null;
    await db.insert(profileAnalyticsDaily).values({
      id: generateUUID(),
      profileId,
      openalexId,
      date: date2,
      views,
      uniqueVisitors,
      clicks,
      shares,
      downloads
    }).onConflictDoUpdate({
      target: [profileAnalyticsDaily.openalexId, profileAnalyticsDaily.date],
      set: { views, uniqueVisitors, clicks, shares, downloads }
    });
  }
};
var MemoryStorage = class {
  // Minimal methods used by the public routes. Other methods return safe defaults.
  async getResearcherProfileByOpenalexId(_openalexId) {
    return void 0;
  }
  async getResearcherProfileByTenant(_tenantId) {
    return void 0;
  }
  async getAllPublicResearcherProfiles() {
    return [];
  }
  async upsertResearcherProfile(_profile) {
    return {};
  }
  async updateResearcherProfile(_id, _updates) {
    return {};
  }
  async deleteResearcherProfile(_openalexId) {
    return;
  }
  async getOpenalexData(_openalexId, _dataType) {
    return void 0;
  }
  async upsertOpenalexData(_data) {
    return {};
  }
  async getResearchTopics(_openalexId) {
    return [];
  }
  async upsertResearchTopics(_topics) {
    return;
  }
  async getPublications(_openalexId, _limit) {
    return [];
  }
  async getPublicationById(_id) {
    return void 0;
  }
  async getPublicationsByOpenalexId(_openalexId) {
    return [];
  }
  async upsertPublications(_publications) {
    return;
  }
  async updatePublicationFeatured(_publicationId, _isFeatured) {
    return void 0;
  }
  async updatePublicationPdf(_publicationId, _pdfUrl) {
    return void 0;
  }
  async getAffiliations(_openalexId) {
    return [];
  }
  async upsertAffiliations(_affiliations) {
    return;
  }
  async getProfileSectionById(_id) {
    return void 0;
  }
  async getProfileSections(_profileId) {
    return [];
  }
  async createProfileSection(_section) {
    return {};
  }
  async updateProfileSection(_id, _updates) {
    return void 0;
  }
  async deleteProfileSection(_id) {
    return;
  }
  async reorderProfileSections(_sectionIds) {
    return;
  }
  async getSyncLogs(_profileId) {
    return [];
  }
  async createSyncLog(_log) {
    return { id: "dev-sync-log" };
  }
  async updateSyncLog(_id, _updates) {
    return void 0;
  }
  // Tenant and user helper stubs
  async getTenantWithDetails(_id) {
    return void 0;
  }
  async getTenant(_id) {
    return void 0;
  }
  async getDomain(_id) {
    return void 0;
  }
  async getDomainByHostname(_hostname) {
    return void 0;
  }
  async getDomainsByTenant(_tenantId) {
    return [];
  }
  async createDomain(_domain) {
    return {};
  }
  async updateDomain(_id, _updates) {
    return void 0;
  }
  async deleteDomain(_id) {
    return;
  }
  async getUser(_id) {
    return void 0;
  }
  async getUserByEmail(_email) {
    return void 0;
  }
  async getUsersByTenant(_tenantId) {
    return [];
  }
  async createUser(_user) {
    return {};
  }
  async upsertUser(_user) {
    return {};
  }
  async updateUser(_id, _updates) {
    return void 0;
  }
  async deleteUser(_id) {
    return;
  }
  async getAllUsers() {
    return [];
  }
  async getUsersByRole(_role) {
    return [];
  }
  // No-op mutations
  async updateTenantProfile(_tenantId, updates) {
    return {
      id: "dev-tenant",
      displayName: updates.displayName || null,
      title: updates.title || null,
      bio: updates.bio || null,
      profileImageUrl: updates.profileImageUrl || null,
      openalexId: updates.openalexId || null,
      isPublic: false,
      lastSyncedAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  // Generic safe defaults for other calls
  async getAllTenants() {
    return [];
  }
  async createTenant(_t) {
    return {};
  }
  async updateTenant(_id, _u) {
    return void 0;
  }
  async deleteTenant(_id) {
    return;
  }
  async getAllSettings() {
    return [];
  }
  async getSetting(_key) {
    return void 0;
  }
  async upsertSetting(_k, _v) {
    return {};
  }
  async getTheme(_id) {
    return void 0;
  }
  async getThemeByName(_name) {
    return void 0;
  }
  async getAllThemes() {
    return [];
  }
  async getActiveThemes() {
    return [];
  }
  async getDefaultTheme() {
    return void 0;
  }
  async createTheme(_theme) {
    return {};
  }
  async updateTheme(_id, _updates) {
    return void 0;
  }
  async deleteTheme(_id) {
    return;
  }
  async setDefaultTheme(_id) {
    return void 0;
  }
  async bulkApplyThemeToTenants(_themeId, _tenantIds) {
    return { updated: 0 };
  }
  async getTenantsWithThemeInfo() {
    return [];
  }
  async getPaymentsByEmail(_email) {
    return [];
  }
  async getAllPayments() {
    return [];
  }
  async createPayment(_payment) {
    return {};
  }
  async getPaymentByOrderNumber(_orderNumber) {
    return void 0;
  }
  async updatePaymentStatus(_orderNumber, _status, _transactionId) {
    return void 0;
  }
  async updatePaymentSessionId(_orderNumber, _sessionId) {
    return void 0;
  }
  async provisionTenantFromPayment(_paymentId) {
    return void 0;
  }
  async trackAnalyticsEvent(_event) {
    return {};
  }
  async getAnalyticsByOpenalexId(_openalexId, _startDate, _endDate) {
    return [];
  }
  async getAnalyticsSummary(_openalexId, _days) {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      totalClicks: 0,
      totalShares: 0,
      totalDownloads: 0,
      viewsByDay: [],
      topReferrers: [],
      clicksByTarget: []
    };
  }
  async aggregateDailyAnalytics(_openalexId, _date) {
    return;
  }
  async createPasswordResetToken(_userId, _token, _expiresAt) {
    return;
  }
  async getPasswordResetToken(_token) {
    return void 0;
  }
  async markPasswordResetTokenUsed(_token) {
    return;
  }
  async setEmailVerificationToken(_userId, _token, _expiresAt) {
    return;
  }
  async verifyEmailWithToken(_token) {
    return void 0;
  }
  async createTrialTenant(_userId, _firstName, _lastName, _email) {
    return {};
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();

// server/services/openalexApi.ts
import fetch2 from "node-fetch";
var OpenAlexService = class {
  baseUrl = "https://api.openalex.org";
  async getResearcher(openalexId) {
    const cleanId = openalexId.startsWith("A") ? openalexId : `A${openalexId}`;
    const url = `${this.baseUrl}/people/${cleanId}`;
    const response = await fetch2(url, { signal: AbortSignal.timeout(3e4) });
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
    const MAX_PUBS = 500;
    let hasMoreResults = true;
    while (hasMoreResults) {
      const url = `${this.baseUrl}/works?filter=author.id:${cleanId}&per-page=${perPage}&page=${page}&sort=cited_by_count:desc`;
      const response = await fetch2(url, { signal: AbortSignal.timeout(3e4) });
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      allResults = allResults.concat(data.results);
      totalCount = data.meta.count;
      console.log(`Fetched ${allResults.length} of ${Math.min(totalCount, MAX_PUBS)} publications for ${cleanId} (page ${page})`);
      page++;
      hasMoreResults = allResults.length < Math.min(totalCount, MAX_PUBS) && data.results.length > 0;
      if (hasMoreResults) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
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
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
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
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
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
import crypto2 from "crypto";
import nodemailer from "nodemailer";
import { z as z2 } from "zod";
var router = Router();
var openalexService = new OpenAlexService();
function createTransporter() {
  if (!process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.scholar.name",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
    auth: {
      user: process.env.SMTP_USER || "noreply@scholar.name",
      pass: process.env.SMTP_PASSWORD
    },
    tls: { rejectUnauthorized: false }
  });
}
async function sendEmail(to, subject, text2) {
  const transporter = createTransporter();
  if (!transporter) return;
  const from = `"Scholar.name" <${process.env.SMTP_USER || "noreply@scholar.name"}>`;
  await transporter.sendMail({ from, to, subject, text: text2 });
}
async function sendSignupEmail(email, firstName, verificationToken) {
  const baseUrl = process.env.BASE_URL || "https://scholar.name";
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  await sendEmail(
    email,
    "Welcome to Scholar.name \u2014 please verify your email",
    [
      `Hi ${firstName},`,
      "",
      "Welcome to Scholar.name! Please verify your email address:",
      verifyUrl,
      "",
      "This link expires in 24 hours. If you didn't sign up, you can ignore this email.",
      "",
      "Once verified, log in to connect your OpenAlex profile and publish your portfolio.",
      "",
      "Log in at: https://scholar.name/dashboard/login",
      "",
      "The Scholar.name team"
    ].join("\n")
  );
}
async function sendPasswordResetEmail(email, firstName, resetToken) {
  const baseUrl = process.env.BASE_URL || "https://scholar.name";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  await sendEmail(
    email,
    "Reset your Scholar.name password",
    [
      `Hi ${firstName},`,
      "",
      "You requested a password reset. Click the link below to set a new password:",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
      "",
      "The Scholar.name team"
    ].join("\n")
  );
}
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
    const verificationToken = crypto2.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: "researcher",
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: verificationExpiry
    });
    sendSignupEmail(validatedData.email, validatedData.firstName, verificationToken).catch(
      (err) => console.error("[auth] Failed to send signup email:", err)
    );
    const tenant = await storage.createTrialTenant(user.id, validatedData.firstName, validatedData.lastName || "", validatedData.email, {
      openalexId: validatedData.openalexId,
      affiliation: validatedData.affiliation
    });
    if (validatedData.openalexId) {
      openalexService.syncResearcherData(validatedData.openalexId).then(() => storage.updateTenantProfile(tenant.id, { lastSyncedAt: /* @__PURE__ */ new Date() })).catch((err) => console.error("[auth] Failed to sync OpenAlex data after signup:", err));
    }
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error after register:", err);
        return res.status(500).json({ message: "Registration failed" });
      }
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
    req.session.userId = userId;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error after password change:", err);
        return res.status(500).json({ message: "Failed to update password" });
      }
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
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }
    const token = crypto2.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    await storage.createPasswordResetToken(user.id, token, expiresAt);
    sendPasswordResetEmail(email, user.firstName || "there", token).catch(
      (err) => console.error("[auth] Failed to send password reset email:", err)
    );
    return res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const resetToken = await storage.getPasswordResetToken(token);
    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }
    if (resetToken.usedAt) {
      return res.status(400).json({ message: "This reset link has already been used." });
    }
    if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(resetToken.userId, { passwordHash: newPasswordHash });
    await storage.markPasswordResetTokenUsed(token);
    return res.json({ message: "Password updated successfully. You can now log in." });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});
router.post("/send-verification", isAuthenticated, async (req, res) => {
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerifiedAt) return res.json({ message: "Email already verified." });
    const token = crypto2.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await storage.setEmailVerificationToken(user.id, token, expiresAt);
    sendSignupEmail(user.email, user.firstName || "there", token).catch(
      (err) => console.error("[auth] Failed to send verification email:", err)
    );
    return res.json({ message: "Verification email sent." });
  } catch (error) {
    console.error("Send verification error:", error);
    return res.status(500).json({ message: "Failed to send verification email" });
  }
});
router.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: "Missing token" });
    const user = await storage.verifyEmailWithToken(token);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }
    return res.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Failed to verify email" });
  }
});
var authRouter = router;

// server/adminRoutes.ts
import { Router as Router2 } from "express";
import bcrypt2 from "bcryptjs";
import { z as z3 } from "zod";
import { sql as sql3 } from "drizzle-orm";
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
    const statsQuery = await db.select({
      totalUsers: sql3`count(*)`,
      adminCount: sql3`count(*) filter (where ${users.role} = 'admin')`,
      researcherCount: sql3`count(*) filter (where ${users.role} = 'researcher')`,
      activeUserCount: sql3`count(*) filter (where ${users.isActive} = true)`
    }).from(users);
    return res.json({
      stats: {
        totalUsers: Number(statsQuery[0].totalUsers) || 0,
        adminCount: Number(statsQuery[0].adminCount) || 0,
        researcherCount: Number(statsQuery[0].researcherCount) || 0,
        activeUserCount: Number(statsQuery[0].activeUserCount) || 0
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ message: "Failed to get stats" });
  }
});
router2.get("/analytics", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [userStatsList, tenantStatsList] = await Promise.all([
      db.select({
        total: sql3`count(*)`,
        admin: sql3`count(*) filter (where ${users.role} = 'admin')`,
        researcher: sql3`count(*) filter (where ${users.role} = 'researcher')`,
        active: sql3`count(*) filter (where ${users.isActive} = true)`,
        newThisMonth: sql3`count(*) filter (where ${users.createdAt} >= now() - interval '30 days')`
      }).from(users),
      db.select({
        total: sql3`count(*)`,
        active: sql3`count(*) filter (where ${tenants.status} = 'active')`,
        pending: sql3`count(*) filter (where ${tenants.status} = 'pending')`,
        suspended: sql3`count(*) filter (where ${tenants.status} = 'suspended')`,
        cancelled: sql3`count(*) filter (where ${tenants.status} = 'cancelled')`,
        starter: sql3`count(*) filter (where ${tenants.plan} = 'starter')`,
        professional: sql3`count(*) filter (where ${tenants.plan} = 'professional')`,
        institution: sql3`count(*) filter (where ${tenants.plan} = 'institution')`,
        newThisMonth: sql3`count(*) filter (where ${tenants.createdAt} >= now() - interval '30 days')`
      }).from(tenants)
    ]);
    const userStats = userStatsList[0];
    const tenantStats = tenantStatsList[0];
    return res.json({
      analytics: {
        users: {
          total: Number(userStats.total) || 0,
          byRole: {
            admin: Number(userStats.admin) || 0,
            researcher: Number(userStats.researcher) || 0
          },
          active: Number(userStats.active) || 0,
          inactive: (Number(userStats.total) || 0) - (Number(userStats.active) || 0),
          newThisMonth: Number(userStats.newThisMonth) || 0
        },
        tenants: {
          total: Number(tenantStats.total) || 0,
          byStatus: {
            active: Number(tenantStats.active) || 0,
            pending: Number(tenantStats.pending) || 0,
            suspended: Number(tenantStats.suspended) || 0,
            cancelled: Number(tenantStats.cancelled) || 0
          },
          byPlan: {
            starter: Number(tenantStats.starter) || 0,
            professional: Number(tenantStats.professional) || 0,
            institution: Number(tenantStats.institution) || 0
          },
          newThisMonth: Number(tenantStats.newThisMonth) || 0
        },
        overview: {
          totalUsers: Number(userStats.total) || 0,
          totalTenants: Number(tenantStats.total) || 0,
          activeTenants: Number(tenantStats.active) || 0,
          activeUsers: Number(userStats.active) || 0
        }
      }
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(500).json({ message: "Failed to get analytics" });
  }
});
router2.get("/payments", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const payments2 = await storage.getAllPayments();
    return res.json({ payments: payments2 });
  } catch (error) {
    console.error("Get payments error:", error);
    return res.status(500).json({ message: "Failed to get payments" });
  }
});
var adminRouter = router2;

// server/tenantRoutes.ts
import { Router as Router3 } from "express";
import { z as z4 } from "zod";
import bcrypt3 from "bcryptjs";

// server/services/syncScheduler.ts
var openalexService2 = new OpenAlexService();
var syncLogs2 = [];
var MAX_LOGS = 100;
var isSyncRunning = false;
function addSyncLog(log2) {
  syncLogs2.unshift(log2);
  if (syncLogs2.length > MAX_LOGS) {
    syncLogs2.pop();
  }
}
function getSyncLogs() {
  return [...syncLogs2];
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
    await openalexService2.syncResearcherData(openalexId);
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
  if (isSyncRunning) {
    console.log("[SyncScheduler] Sync already running, skipping this tick");
    return { synced: 0, skipped: 0, errors: 0 };
  }
  console.log("[SyncScheduler] Starting scheduled sync check...");
  isSyncRunning = true;
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
      await new Promise((resolve) => setTimeout(resolve, 1e4));
    }
    console.log(`[SyncScheduler] Sync check complete. Synced: ${stats.synced}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  } catch (error) {
    console.error("[SyncScheduler] Error running scheduled sync:", error);
  } finally {
    isSyncRunning = false;
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
  }, 5 * 60 * 1e3).unref();
  schedulerInterval = setInterval(() => {
    runScheduledSync();
  }, intervalMs);
  schedulerInterval.unref();
  console.log("[SyncScheduler] Scheduler started");
}
function stopSyncScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SyncScheduler] Scheduler stopped");
  }
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
      req.session.isAuthenticated = true;
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
router3.patch("/tenants/:id/profile", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const updateProfileSchema2 = z4.object({
      openalexId: z4.string().optional().nullable()
    });
    const validatedData = updateProfileSchema2.parse(req.body);
    const profile = await storage.updateTenantProfile(req.params.id, {
      openalexId: validatedData.openalexId || null
    });
    return res.json({
      message: "Profile updated",
      profile
    });
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
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
import path from "path";
import fs from "fs/promises";

// server/billing.ts
function getTenantAccessState(tenant, now = /* @__PURE__ */ new Date()) {
  if (tenant.status === "cancelled") return "cancelled";
  if (tenant.status === "suspended") return "suspended";
  if (tenant.status === "pending") return "pending";
  if (tenant.plan === "free" && tenant.trialEndsAt && tenant.trialEndsAt <= now) {
    return "trial_expired";
  }
  if (tenant.plan !== "free" && tenant.subscriptionEndDate && tenant.subscriptionEndDate <= now) {
    return "subscription_expired";
  }
  return "active";
}
function tenantHasServiceAccess(tenant, now = /* @__PURE__ */ new Date()) {
  return getTenantAccessState(tenant, now) === "active";
}
function getTenantAccessMessage(state) {
  switch (state) {
    case "trial_expired":
      return "Your free trial has ended. Choose a paid plan to reactivate your public portfolio.";
    case "subscription_expired":
      return "Your subscription period has ended. Choose a plan to reactivate your public portfolio.";
    case "suspended":
      return "This portfolio is suspended. Contact support to reactivate it.";
    case "cancelled":
      return "This portfolio is cancelled.";
    case "pending":
      return "This portfolio is pending activation.";
    case "active":
    default:
      return "This portfolio is active.";
  }
}

// server/researcherRoutes.ts
var router4 = Router4();
var openalexService3 = new OpenAlexService();
async function requireResearcherServiceAccess(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const tenant = await storage.getTenant(user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const accessState = getTenantAccessState(tenant);
    if (!tenantHasServiceAccess(tenant)) {
      return res.status(402).json({
        message: getTenantAccessMessage(accessState),
        accessState,
        upgradeUrl: "/checkout?plan=starter&billing=monthly"
      });
    }
    next();
  } catch (error) {
    console.error("Error checking researcher service access:", error);
    res.status(500).json({ message: "Failed to check account status" });
  }
}
async function saveFileLocally(filename, buffer) {
  const publicDir = path.join(process.cwd(), "public");
  const fullPath = path.join(publicDir, filename);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return `/${filename}`;
}
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
router4.get("/my-tenant", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    let user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    if (!user.tenantId) {
      const userPayments = await storage.getPaymentsByEmail(user.email);
      const completedWithTenant = userPayments.find(
        (p) => p.status === "completed" && p.tenantId
      );
      if (completedWithTenant?.tenantId) {
        await storage.updateUser(user.id, { tenantId: completedWithTenant.tenantId });
        const refreshed = await storage.getUser(userId);
        if (!refreshed) {
          return res.status(404).json({ message: "User no longer exists" });
        }
        user = refreshed;
      }
    }
    if (!user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const accessState = getTenantAccessState(tenant);
    res.json({
      tenant: {
        ...tenant,
        accessState,
        accessMessage: getTenantAccessMessage(accessState),
        hasServiceAccess: tenantHasServiceAccess(tenant)
      }
    });
  } catch (error) {
    console.error("Error getting tenant:", error);
    res.status(500).json({ message: "Failed to get tenant" });
  }
});
router4.use((req, _res, next) => {
  if (/^\/[^/]+\/data$/.test(req.path)) {
    return next("router");
  }
  next();
});
router4.use(isAuthenticated, requireResearcherServiceAccess);
var updateProfileSchema = z5.object({
  openalexId: z5.string().optional(),
  displayName: z5.string().nullable().optional(),
  title: z5.string().nullable().optional(),
  bio: z5.string().nullable().optional(),
  customCss: z5.string().nullable().optional(),
  socialLinks: z5.record(z5.string()).nullable().optional(),
  featuredWorks: z5.array(z5.string()).nullable().optional(),
  orcidUrl: z5.string().nullable().optional(),
  googleScholarUrl: z5.string().nullable().optional(),
  researchGateUrl: z5.string().nullable().optional(),
  linkedinUrl: z5.string().nullable().optional(),
  websiteUrl: z5.string().nullable().optional(),
  twitterUrl: z5.string().nullable().optional(),
  // Phase 1 additions
  isPublic: z5.boolean().optional(),
  cvUrl: z5.string().nullable().optional(),
  selectedThemeId: z5.string().nullable().optional()
});
router4.patch("/profile", isAuthenticated, async (req, res) => {
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
router4.post("/sync", isAuthenticated, async (req, res) => {
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
    const dbProfile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!dbProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const syncLog = await storage.createSyncLog({
      tenantId: user.tenantId,
      profileId: dbProfile.id,
      syncType: "full",
      status: "in_progress"
    });
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Sync timed out after 45 seconds")), 45e3)
      );
      await Promise.race([
        openalexService3.syncResearcherData(tenant.profile.openalexId),
        timeoutPromise
      ]);
      await storage.updateSyncLog(syncLog.id, {
        status: "completed",
        completedAt: /* @__PURE__ */ new Date()
      });
      const profile = await storage.updateTenantProfile(user.tenantId, {
        lastSyncedAt: /* @__PURE__ */ new Date()
      });
      res.json({ profile, message: "Sync completed - your data has been refreshed from OpenAlex" });
    } catch (syncError) {
      const errorMsg = syncError instanceof Error ? syncError.message : "Unknown sync error";
      await storage.updateSyncLog(syncLog.id, {
        status: "failed",
        completedAt: /* @__PURE__ */ new Date(),
        errorMessage: errorMsg
      });
      throw syncError;
    }
  } catch (error) {
    console.error("Error syncing profile:", error);
    res.status(500).json({ message: "Failed to sync profile" });
  }
});
router4.post("/upload-photo", isAuthenticated, uploadImage.single("photo"), async (req, res) => {
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
    const fileExtension = req.file.mimetype.split("/")[1];
    const filename = `uploads/profile-images/${user.tenantId}-profile-${Date.now()}.${fileExtension}`;
    let profileImageUrl;
    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (storageBucketId) {
      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
      const objectFilename = `public/profile-images/${user.tenantId}-profile-${Date.now()}.${fileExtension}`;
      const uploadResult = await objectStorage.uploadFromBytes(objectFilename, req.file.buffer);
      if (!uploadResult.ok) {
        console.error("Object storage upload error:", uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
      const publicPath = objectFilename.replace("public/", "");
      profileImageUrl = `/public-objects/${publicPath}`;
    } else {
      profileImageUrl = await saveFileLocally(filename, req.file.buffer);
    }
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
var uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit for documents
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"));
    }
  }
});
router4.post("/upload-cv", isAuthenticated, uploadDocument.single("cv"), async (req, res) => {
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
    let fileExtension = "pdf";
    if (req.file.mimetype === "application/msword") {
      fileExtension = "doc";
    } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      fileExtension = "docx";
    }
    const filename = `uploads/cv-documents/${user.tenantId}-cv-${Date.now()}.${fileExtension}`;
    let cvUrl;
    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (storageBucketId) {
      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
      const objectFilename = `public/cv-documents/${user.tenantId}-cv-${Date.now()}.${fileExtension}`;
      const uploadResult = await objectStorage.uploadFromBytes(objectFilename, req.file.buffer);
      if (!uploadResult.ok) {
        console.error("Object storage upload error:", uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
      const publicPath = objectFilename.replace("public/", "");
      cvUrl = `/public-objects/${publicPath}`;
    } else {
      cvUrl = await saveFileLocally(filename, req.file.buffer);
    }
    await storage.updateTenantProfile(user.tenantId, {
      cvUrl
    });
    res.json({
      message: "CV uploaded successfully",
      cvUrl
    });
  } catch (error) {
    console.error("Error uploading CV:", error);
    res.status(500).json({ message: "Failed to upload CV" });
  }
});
router4.delete("/cv", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    await storage.updateTenantProfile(user.tenantId, {
      cvUrl: null
    });
    res.json({ message: "CV removed successfully" });
  } catch (error) {
    console.error("Error removing CV:", error);
    res.status(500).json({ message: "Failed to remove CV" });
  }
});
router4.get("/publications", isAuthenticated, async (req, res) => {
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
      return res.status(400).json({ message: "No OpenAlex ID configured", publications: [] });
    }
    const publications2 = await storage.getPublicationsByOpenalexId(tenant.profile.openalexId);
    res.json({ publications: publications2 });
  } catch (error) {
    console.error("Error getting publications:", error);
    res.status(500).json({ message: "Failed to get publications" });
  }
});
router4.patch("/publications/:publicationId/feature", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const { publicationId } = req.params;
    const { isFeatured } = req.body;
    if (typeof isFeatured !== "boolean") {
      return res.status(400).json({ message: "isFeatured must be a boolean" });
    }
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    const pub = await storage.getPublicationById(publicationId);
    if (!pub || !tenant?.profile?.openalexId || pub.openalexId !== tenant.profile.openalexId) {
      return res.status(403).json({ message: "Not authorized to modify this publication" });
    }
    const publication = await storage.updatePublicationFeatured(publicationId, isFeatured);
    res.json({ publication });
  } catch (error) {
    console.error("Error updating publication featured status:", error);
    res.status(500).json({ message: "Failed to update publication" });
  }
});
router4.post("/publications/:publicationId/upload-pdf", isAuthenticated, uploadDocument.single("pdf"), async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const { publicationId } = req.params;
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    const pub = await storage.getPublicationById(publicationId);
    if (!pub || !tenant?.profile?.openalexId || pub.openalexId !== tenant.profile.openalexId) {
      return res.status(403).json({ message: "Not authorized to modify this publication" });
    }
    const filename = `uploads/publication-pdfs/${user.tenantId}-${publicationId}-${Date.now()}.pdf`;
    let pdfUrl;
    const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (storageBucketId) {
      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });
      const objectFilename = `public/publication-pdfs/${user.tenantId}-${publicationId}-${Date.now()}.pdf`;
      const uploadResult = await objectStorage.uploadFromBytes(objectFilename, req.file.buffer);
      if (!uploadResult.ok) {
        console.error("Object storage upload error:", uploadResult.error);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
      const publicPath = objectFilename.replace("public/", "");
      pdfUrl = `/public-objects/${publicPath}`;
    } else {
      pdfUrl = await saveFileLocally(filename, req.file.buffer);
    }
    const publication = await storage.updatePublicationPdf(publicationId, pdfUrl);
    res.json({
      message: "PDF uploaded successfully",
      publication
    });
  } catch (error) {
    console.error("Error uploading publication PDF:", error);
    res.status(500).json({ message: "Failed to upload PDF" });
  }
});
router4.delete("/publications/:publicationId/pdf", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const { publicationId } = req.params;
    const tenant = await storage.getTenantWithDetails(user.tenantId);
    const pub = await storage.getPublicationById(publicationId);
    if (!pub || !tenant?.profile?.openalexId || pub.openalexId !== tenant.profile.openalexId) {
      return res.status(403).json({ message: "Not authorized to modify this publication" });
    }
    const publication = await storage.updatePublicationPdf(publicationId, null);
    res.json({ message: "PDF removed successfully", publication });
  } catch (error) {
    console.error("Error removing publication PDF:", error);
    res.status(500).json({ message: "Failed to remove PDF" });
  }
});
router4.get("/sections", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const sections = await storage.getProfileSections(profile.id);
    res.json({ sections });
  } catch (error) {
    console.error("Error getting profile sections:", error);
    res.status(500).json({ message: "Failed to get profile sections" });
  }
});
router4.post("/sections", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const { title, content, sectionType, sortOrder, isVisible } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }
    const section = await storage.createProfileSection({
      profileId: profile.id,
      title,
      content,
      sectionType: sectionType || "custom",
      sortOrder: sortOrder || 0,
      isVisible: isVisible !== false
    });
    res.json({ section });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : void 0;
    console.error("Error creating profile section:", errorMsg);
    console.error("Error stack:", errorStack);
    res.status(500).json({ message: "Failed to create profile section", error: errorMsg });
  }
});
router4.patch("/sections/:sectionId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const { sectionId } = req.params;
    const existingSection = await storage.getProfileSectionById(sectionId);
    if (!existingSection || existingSection.profileId !== profile.id) {
      return res.status(403).json({ message: "Not authorized to modify this section" });
    }
    const { title, content, sectionType, sortOrder, isVisible } = req.body;
    const section = await storage.updateProfileSection(sectionId, {
      title,
      content,
      sectionType,
      sortOrder,
      isVisible
    });
    res.json({ section });
  } catch (error) {
    console.error("Error updating profile section:", error);
    res.status(500).json({ message: "Failed to update profile section" });
  }
});
router4.delete("/sections/:sectionId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const { sectionId } = req.params;
    const existingSection = await storage.getProfileSectionById(sectionId);
    if (!existingSection || existingSection.profileId !== profile.id) {
      return res.status(403).json({ message: "Not authorized to delete this section" });
    }
    await storage.deleteProfileSection(sectionId);
    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile section:", error);
    res.status(500).json({ message: "Failed to delete profile section" });
  }
});
router4.post("/sections/reorder", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ message: "sectionIds must be an array" });
    }
    const userSections = await storage.getProfileSections(profile.id);
    const userSectionIds = new Set(userSections.map((s) => s.id));
    const unauthorized = sectionIds.filter((id) => !userSectionIds.has(id));
    if (unauthorized.length > 0) {
      return res.status(403).json({ message: "Not authorized to reorder these sections" });
    }
    await storage.reorderProfileSections(sectionIds);
    res.json({ message: "Sections reordered successfully" });
  } catch (error) {
    console.error("Error reordering sections:", error);
    res.status(500).json({ message: "Failed to reorder sections" });
  }
});
router4.get("/sync-logs", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.tenantId) {
      return res.status(404).json({ message: "No tenant associated with this user" });
    }
    const profile = await storage.getResearcherProfileByTenant(user.tenantId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const logs = await storage.getSyncLogs(profile.id);
    res.json({ logs });
  } catch (error) {
    console.error("Error getting sync logs:", error);
    res.status(500).json({ message: "Failed to get sync logs" });
  }
});
var researcherRoutes_default = router4;

// server/checkoutRoutes.ts
import { Router as Router5 } from "express";

// server/services/montypay.ts
import crypto3 from "crypto";
var MontyPayService = class {
  config;
  constructor() {
    this.config = {
      merchantKey: process.env.MONTYPAY_MERCHANT_KEY || "",
      secretKey: process.env.MONTYPAY_SECRET_KEY || "",
      checkoutHost: process.env.MONTYPAY_CHECKOUT_HOST || "https://checkout.montypay.com"
    };
  }
  generateHash(payload) {
    const sortedKeys = Object.keys(payload).sort();
    const dataString = sortedKeys.map((key) => {
      const value = payload[key];
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    }).join("");
    return crypto3.createHmac("sha256", this.config.secretKey).update(dataString + this.config.secretKey).digest("hex");
  }
  async createCheckoutSession(params) {
    if (!this.config.merchantKey || !this.config.secretKey) {
      console.warn("MontyPay credentials not configured");
      return {
        error: "CONFIGURATION_ERROR",
        error_message: "Payment gateway not configured. Please contact support."
      };
    }
    const payload = {
      merchant_key: this.config.merchantKey,
      operation: "purchase",
      methods: ["card"],
      order: {
        number: params.order.number,
        amount: params.order.amount,
        currency: params.order.currency,
        description: params.order.description
      },
      customer: {
        name: params.customer.name,
        email: params.customer.email
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl
    };
    if (params.notificationUrl) {
      payload.notification_url = params.notificationUrl;
    }
    if (params.billingAddress) {
      payload.billing_address = {
        country: params.billingAddress.country,
        city: params.billingAddress.city,
        address: params.billingAddress.address,
        zip: params.billingAddress.zip,
        phone: params.billingAddress.phone || "",
        state: params.billingAddress.state || ""
      };
    }
    payload.hash = this.generateHash(payload);
    try {
      const response = await fetch(`${this.config.checkoutHost}/api/v1/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15e3)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("MontyPay API error:", data);
        return {
          error: "API_ERROR",
          error_message: data.message || "Payment session creation failed"
        };
      }
      return data;
    } catch (error) {
      console.error("MontyPay request failed:", error);
      return {
        error: "NETWORK_ERROR",
        error_message: "Unable to connect to payment gateway"
      };
    }
  }
  verifyWebhookSignature(payload, signature) {
    const expectedHash = this.generateHash(payload);
    return expectedHash === signature;
  }
  isConfigured() {
    return !!(this.config.merchantKey && this.config.secretKey);
  }
};
var montyPayService = new MontyPayService();

// server/checkoutRoutes.ts
import crypto4 from "crypto";
import nodemailer2 from "nodemailer";
var router5 = Router5();
var PRICING = {
  starter: { monthly: 9.99, yearly: 95.88 },
  pro: { monthly: 19.99, yearly: 191.88 }
};
function generateOrderNumber() {
  const timestamp2 = Date.now().toString(36);
  const random = crypto4.randomBytes(4).toString("hex");
  return `SN-${timestamp2}-${random}`.toUpperCase();
}
async function sendWelcomeEmail(email, name, _tenantId) {
  if (!process.env.SMTP_PASSWORD) return;
  const smtpHost = process.env.SMTP_HOST || "mail.scholar.name";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || "noreply@scholar.name";
  const transporter = nodemailer2.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: process.env.SMTP_PASSWORD },
    tls: { rejectUnauthorized: false }
  });
  const firstName = name.split(" ")[0];
  await transporter.sendMail({
    from: `"Scholar.name" <${smtpUser}>`,
    to: email,
    subject: "Welcome to Scholar.name \u2014 your portfolio is active!",
    text: [
      `Hi ${firstName},`,
      "",
      "Your Scholar.name portfolio is now active. Log in to your dashboard to:",
      "  \u2022 Update your profile and bio",
      "  \u2022 Feature your best publications",
      "  \u2022 Track visitor analytics",
      "",
      "Log in at: https://scholar.name/dashboard/login",
      "",
      "Questions? Reply to this email.",
      "",
      "The Scholar.name team"
    ].join("\n")
  });
}
router5.post("/create-session", async (req, res) => {
  try {
    const validation = checkoutSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: validation.error.errors.map((e) => e.message).join(", ")
      });
    }
    const { plan, billingPeriod, customerName, customerEmail, openalexId } = validation.data;
    if (!montyPayService.isConfigured()) {
      return res.status(503).json({
        error: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        message: "Payment processing is currently unavailable. Please contact support.",
        fallbackUrl: "/contact"
      });
    }
    const amount = PRICING[plan][billingPeriod].toFixed(2);
    const orderNumber = generateOrderNumber();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const successUrl = `${baseUrl}/checkout/success?order=${orderNumber}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order=${orderNumber}`;
    const notificationUrl = `${baseUrl}/api/checkout/webhook`;
    const paymentRecord = await storage.createPayment({
      orderNumber,
      amount,
      currency: "USD",
      status: "pending",
      plan: plan === "pro" ? "professional" : "starter",
      billingPeriod,
      customerEmail,
      customerName,
      metadata: { openalexId }
    });
    const sessionResponse = await montyPayService.createCheckoutSession({
      order: {
        number: orderNumber,
        amount,
        currency: "USD",
        description: `ScholarName ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billingPeriod === "yearly" ? "Annual" : "Monthly"} Subscription`
      },
      customer: {
        name: customerName,
        email: customerEmail
      },
      successUrl,
      cancelUrl,
      notificationUrl
    });
    if (sessionResponse.error) {
      await storage.updatePaymentStatus(orderNumber, "failed");
      return res.status(400).json({
        error: sessionResponse.error,
        message: sessionResponse.error_message
      });
    }
    if (sessionResponse.session_id) {
      await storage.updatePaymentSessionId(orderNumber, sessionResponse.session_id);
    }
    res.json({
      redirectUrl: sessionResponse.redirect_url,
      orderNumber,
      sessionId: sessionResponse.session_id
    });
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to create checkout session"
    });
  }
});
router5.post("/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const rawSig = req.headers["x-webhook-signature"] || req.headers["x-signature"];
      const signature = Array.isArray(rawSig) ? rawSig[0] : rawSig;
      if (!signature) {
        console.warn("Webhook rejected: missing signature header");
        return res.status(403).send("Forbidden");
      }
      const expectedSig = crypto4.createHmac("sha256", webhookSecret).update(JSON.stringify(req.body)).digest("hex");
      const expectedBuf = Buffer.from(expectedSig, "hex");
      const receivedBuf = Buffer.from(signature, "hex");
      if (expectedBuf.length !== receivedBuf.length || !crypto4.timingSafeEqual(expectedBuf, receivedBuf)) {
        console.warn("Webhook rejected: invalid signature");
        return res.status(403).send("Forbidden");
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn("WARNING: WEBHOOK_SECRET not set \u2014 webhook signature verification disabled");
    }
    const payload = req.body;
    console.log("MontyPay webhook received:", JSON.stringify(payload, null, 2));
    const orderNumber = payload.order?.number;
    const status = payload.result || payload.status;
    const transactionId = payload.transaction_id;
    if (!orderNumber) {
      console.warn("Webhook missing order number");
      return res.send("OK");
    }
    const payment = await storage.getPaymentByOrderNumber(orderNumber);
    if (!payment) {
      console.warn(`Payment not found for order: ${orderNumber}`);
      return res.send("OK");
    }
    if (status === "SUCCESS" || status === "SETTLED") {
      await storage.updatePaymentStatus(orderNumber, "completed", transactionId);
      if (payment.tenantId) {
        console.log(`Tenant already provisioned for order ${orderNumber}, skipping`);
      } else {
        const tenant = await storage.provisionTenantFromPayment(payment.id);
        console.log(`Tenant provisioned for payment ${orderNumber}:`, tenant?.id);
        if (tenant) {
          sendWelcomeEmail(payment.customerEmail, payment.customerName, tenant.id).catch((err) => console.error("Welcome email failed:", err));
        }
      }
    } else if (status === "DECLINE" || status === "ERROR") {
      await storage.updatePaymentStatus(orderNumber, "failed", transactionId);
    }
    res.send("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.send("ERROR");
  }
});
router5.get("/status/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const payment = await storage.getPaymentByOrderNumber(orderNumber);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json({
      orderNumber: payment.orderNumber,
      status: payment.status,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      billingPeriod: payment.billingPeriod
    });
  } catch (error) {
    console.error("Payment status check failed:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});
router5.get("/config", async (_req, res) => {
  res.json({
    isConfigured: montyPayService.isConfigured(),
    pricing: PRICING
  });
});
var checkoutRoutes_default = router5;

// server/tenantMiddleware.ts
var MARKETING_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "scholar.name",
  "www.scholar.name",
  "scholarname.com",
  "www.scholarname.com"
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
    if (!tenant || !tenantHasServiceAccess(tenant)) {
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
import nodemailer3 from "nodemailer";
var updateEmitter = new EventEmitter();
var sseConnections = /* @__PURE__ */ new Set();
function adminSessionAuthMiddleware(req, res, next) {
  if (req.session?.userId && req.session?.isAuthenticated && req.session?.userRole === "admin") {
    console.log(`Admin web access: ${req.method} ${req.path} from ${req.ip}`);
    return next();
  }
  if (req.session?.isAdmin) {
    console.log(`Admin legacy web access: ${req.method} ${req.path} from ${req.ip}`);
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const adminToken = process.env.ADMIN_API_TOKEN;
    if (!adminToken) {
      console.error("ADMIN_API_TOKEN environment variable not set");
      return res.status(500).json({ message: "Admin authentication not configured" });
    }
    const token = authHeader.substring(7);
    if (token === adminToken) {
      req.session.isAdmin = true;
      console.log(`Admin operation: ${req.method} ${req.path} from ${req.ip}`);
      return next();
    }
  }
  return res.status(401).json({ message: "Authentication required" });
}
function isAuthenticated2(req) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (req.session?.userId && req.session?.isAuthenticated && req.session?.userRole === "admin") {
    return true;
  }
  if (req.session?.isAdmin) {
    return true;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    if (!adminToken) return false;
    const token = authHeader.substring(7);
    return token === adminToken;
  }
  return false;
}
var adminRateLimit = (() => {
  const requests = /* @__PURE__ */ new Map();
  const WINDOW_MS = 15 * 60 * 1e3;
  const MAX_REQUESTS = 100;
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of Array.from(requests.entries())) {
      if (now > data.resetTime) requests.delete(ip);
    }
  }, 60 * 60 * 1e3);
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
var publicWriteRateLimit = (() => {
  const requests = /* @__PURE__ */ new Map();
  const WINDOW_MS = 15 * 60 * 1e3;
  const MAX_REQUESTS = 20;
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of Array.from(requests.entries())) {
      if (now > data.resetTime) requests.delete(ip);
    }
  }, 60 * 60 * 1e3);
  return (req, res, next) => {
    const clientIP = req.ip || "unknown";
    const now = Date.now();
    const clientData = requests.get(clientIP);
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }
    if (clientData.count >= MAX_REQUESTS) {
      console.warn(`Public write rate limit exceeded for IP ${clientIP} on ${req.path}`);
      return res.status(429).json({ message: "Too many requests. Please try again later." });
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
setInterval(cleanupSSEConnections, 12e4);
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
  return publications2.map((pub, index) => {
    const openalexType = pub.publicationType?.toLowerCase() || "article";
    const bibtexType = bibtexTypeMap[openalexType] || "misc";
    const key = `${bibtexType}${pub.publicationYear || "unknown"}${index + 1}`;
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
  const openalexService4 = new OpenAlexService();
  app2.use(tenantResolver);
  app2.use("/api/auth", authRouter);
  app2.use("/api/admin", adminRouter);
  app2.use("/api/admin", tenantRoutes_default);
  app2.use("/api/researcher", researcherRoutes_default);
  app2.use("/api/checkout", checkoutRoutes_default);
  app2.get("/api/events", (req, res) => {
    console.log("\u{1F4E1} New SSE connection request from:", req.ip);
    try {
      const origin = req.headers.origin || req.headers.host || "";
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true"
      });
      res.write(`data: ${JSON.stringify({ type: "connected", timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
      console.log("\u2705 SSE connection established, sent initial message");
      const connection = { res };
      sseConnections.add(connection);
      console.log(`\u{1F4CA} Total SSE connections: ${sseConnections.size}`);
      const heartbeat = setInterval(() => {
        try {
          const socketHealthy = req.socket && !req.socket.destroyed && req.socket.writable;
          if (!res.destroyed && !res.finished && socketHealthy) {
            res.write(`data: ${JSON.stringify({ type: "heartbeat", timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`);
          } else {
            console.log("\u{1F9F9} Cleaning up dead SSE connection");
            clearInterval(heartbeat);
            sseConnections.delete(connection);
            if (req.socket && !req.socket.destroyed) {
              req.socket.destroy();
            }
          }
        } catch (error) {
          console.error("\u274C SSE heartbeat error:", error);
          clearInterval(heartbeat);
          sseConnections.delete(connection);
        }
      }, 6e4);
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
  app2.get("/api/site-context", async (req, res) => {
    try {
      const tenant = req.tenant;
      const isMarketingSite = req.isMarketingSite;
      if (isMarketingSite || !tenant) {
        return res.json({
          isTenantSite: false,
          isMarketingSite: true,
          tenant: null
        });
      }
      const accessState = getTenantAccessState(tenant);
      const profile = await storage.getResearcherProfileByTenant(tenant.id);
      return res.json({
        isTenantSite: true,
        isMarketingSite: false,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor
        },
        hasProfile: !!profile?.openalexId,
        openalexId: profile?.openalexId || null,
        accessState,
        accessMessage: getTenantAccessMessage(accessState)
      });
    } catch (error) {
      console.error("Error getting site context:", error);
      res.json({
        isTenantSite: false,
        isMarketingSite: true,
        tenant: null
      });
    }
  });
  app2.get("/api/profile", async (req, res) => {
    try {
      const tenant = req.tenant;
      if (!tenant) {
        return res.status(404).json({ message: "No tenant found for this domain" });
      }
      const accessState = getTenantAccessState(tenant);
      if (!tenantHasServiceAccess(tenant)) {
        return res.status(402).json({
          message: getTenantAccessMessage(accessState),
          accessState,
          tenantName: tenant.name,
          tenantStatus: tenant.status
        });
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
      const profileSections2 = await storage.getProfileSections(profile.id);
      const sortedPublications = [...publications2].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if ((b.publicationYear || 0) !== (a.publicationYear || 0)) {
          return (b.publicationYear || 0) - (a.publicationYear || 0);
        }
        return (b.citationCount || 0) - (a.citationCount || 0);
      });
      return res.json({
        profile: {
          ...profile
        },
        researcher: researcherData?.data || null,
        topics: researchTopics2,
        publications: sortedPublications,
        affiliations: affiliations2,
        profileSections: profileSections2.filter((s) => s.isVisible),
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
        const tenant = await storage.getTenant(profile.tenantId);
        const accessState = tenant ? getTenantAccessState(tenant) : "cancelled";
        if (!tenant || !tenantHasServiceAccess(tenant)) {
          return res.status(402).json({
            message: getTenantAccessMessage(accessState),
            accessState,
            isPreview: false
          });
        }
        const researcherData = await storage.getOpenalexData(openalexId, "researcher");
        const researchTopics2 = await storage.getResearchTopics(openalexId);
        const publications2 = await storage.getPublications(openalexId);
        const affiliations2 = await storage.getAffiliations(openalexId);
        const profileSections2 = await storage.getProfileSections(profile.id);
        const sortedPublications = [...publications2].sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if ((b.publicationYear || 0) !== (a.publicationYear || 0)) {
            return (b.publicationYear || 0) - (a.publicationYear || 0);
          }
          return (b.citationCount || 0) - (a.citationCount || 0);
        });
        return res.json({
          profile,
          researcher: researcherData?.data || null,
          topics: researchTopics2,
          publications: sortedPublications,
          affiliations: affiliations2,
          profileSections: profileSections2.filter((s) => s.isVisible),
          lastSynced: profile.lastSyncedAt,
          isPreview: false
        });
      }
      try {
        const researcher = await openalexService4.getResearcher(openalexId);
        const works = await openalexService4.getResearcherWorks(openalexId);
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
        const publications2 = works.results.slice(0, 3).map((work) => ({
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
          title: null,
          // Leave empty so frontend shows "Position" placeholder
          currentAffiliation: null,
          // Leave empty so frontend shows "Institution" placeholder
          department: null,
          bio: null,
          // Leave empty so frontend shows bio placeholder
          profileImageUrl: null,
          // Will be handled on frontend with initials avatar
          cvUrl: null,
          contactEmail: null,
          // Leave empty - no fake contact info in preview
          phone: null,
          officeLocation: null,
          location: null,
          countryCode: institution?.country_code || null,
          // Keep country code if available
          orcidId: orcid,
          // Keep ORCID if available from OpenAlex
          orcidUrl: orcid ? `https://orcid.org/${orcid.replace("https://orcid.org/", "")}` : "#",
          // Show ORCID button
          googleScholarUrl: "#",
          // Show button but doesn't navigate
          linkedinUrl: "#",
          // Show button but doesn't navigate
          twitterUrl: null,
          websiteUrl: "#",
          // Show button but doesn't navigate
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
    if (!isAuthenticated2(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      let systemUser = await storage.getUserByEmail("system@admin.local");
      if (!systemUser) {
        try {
          systemUser = await storage.createUser({
            email: "system@admin.local",
            passwordHash: "SYSTEM_USER_NO_LOGIN",
            firstName: "System",
            lastName: "Admin",
            role: "admin"
          });
        } catch (e) {
          if (e?.code !== "23505") throw e;
          systemUser = await storage.getUserByEmail("system@admin.local");
        }
      }
      const profileData = insertResearcherProfileSchema.parse({
        ...req.body,
        userId: systemUser.id
      });
      const profile = await storage.upsertResearcherProfile(profileData);
      if (profile.openalexId) {
        broadcastResearcherUpdate(profile.openalexId, "create");
        openalexService4.syncResearcherData(profile.openalexId).catch((error) => {
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
    if (!isAuthenticated2(req)) {
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
    if (!isAuthenticated2(req)) {
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
    if (!isAuthenticated2(req)) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }
      if (profile.openalexId) {
        await openalexService4.syncResearcherData(profile.openalexId);
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
    if (!isAuthenticated2(req)) {
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
  if (process.env.NODE_ENV !== "production") {
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
  }
  app2.get("/api/openalex/search/:openalexId", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const data = await openalexService4.getResearcher(openalexId);
      res.json(data);
    } catch (error) {
      console.error("Error searching OpenAlex:", error);
      res.status(500).json({ message: "Failed to search OpenAlex" });
    }
  });
  app2.get("/api/openalex/author/:openalexId", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const data = await openalexService4.getResearcher(openalexId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching OpenAlex author:", error);
      if (error instanceof Error && (error instanceof Error ? error.message : "Unknown error").includes("404")) {
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
  app2.get("/api/health", async (_req, res) => {
    try {
      const tenants2 = await storage.getAllTenants();
      res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), tenants: tenants2.length });
    } catch (error) {
      res.status(503).json({ status: "error", message: "Database unreachable" });
    }
  });
  app2.post("/api/contact", publicWriteRateLimit, async (req, res) => {
    console.log("[Contact] Received contact form submission");
    try {
      const { fullName, email, institution, role, planInterest, researchField, openalexId, estimatedProfiles, biography, preferredTheme } = req.body;
      console.log("[Contact] Form data:", { fullName, email, planInterest });
      if (!fullName || !email || !planInterest || !biography) {
        console.log("[Contact] Missing required fields");
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!process.env.SMTP_PASSWORD) {
        console.log("[Contact] SMTP_PASSWORD environment variable not configured");
        console.log("[Contact] Available env vars:", Object.keys(process.env).filter((k) => !k.includes("npm") && !k.includes("PATH")).join(", "));
        return res.status(500).json({
          message: "Email service not configured. Please add SMTP_PASSWORD to environment variables in A2 Hosting cPanel.",
          hint: "In cPanel Node.js Selector, add environment variable: SMTP_PASSWORD=your_email_password"
        });
      }
      console.log("[Contact] SMTP password configured, creating transporter...");
      const smtpHost = process.env.SMTP_HOST || "localhost";
      const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
      const smtpUser = process.env.SMTP_USER || "info@scholar.name";
      console.log(`[Contact] SMTP Config: host=${smtpHost}, port=${smtpPort}, user=${smtpUser}`);
      const transporter = nodemailer3.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log("[Contact] Transporter created, verifying connection...");
      const emailContent = [
        "New ScholarName Inquiry",
        "",
        "Contact Information:",
        `- Name: ${fullName}`,
        `- Email: ${email}`,
        `- Institution: ${institution || "Not provided"}`,
        `- Role: ${role || "Not provided"}`,
        "",
        `Plan Interest: ${planInterest}`,
        estimatedProfiles ? `Estimated Profiles: ${estimatedProfiles}` : null,
        "",
        "Research Details:",
        `- Field: ${researchField || "Not provided"}`,
        `- OpenAlex ID: ${openalexId || "Not provided"}`,
        preferredTheme ? `- Preferred Theme: ${preferredTheme}` : null,
        "",
        "Biography:",
        biography,
        "",
        "---",
        `Submitted: ${(/* @__PURE__ */ new Date()).toISOString()}`
      ].filter((line) => line !== null).join("\n");
      try {
        await transporter.verify();
        console.log("[Contact] SMTP connection verified successfully");
      } catch (verifyError) {
        const errorMsg = verifyError.message || String(verifyError);
        console.log(`[Contact] SMTP connection verification failed: ${errorMsg}`);
        console.log(`[Contact] Error code: ${verifyError.code || "N/A"}`);
        console.log(`[Contact] Error command: ${verifyError.command || "N/A"}`);
        let userMessage2 = "Email service connection failed";
        if (errorMsg.includes("Invalid login") || errorMsg.includes("authentication")) {
          userMessage2 = "Email authentication failed. Please check SMTP_PASSWORD in environment variables.";
        } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ENOTFOUND")) {
          userMessage2 = "Cannot connect to email server. Please check SMTP_HOST setting (try 'localhost' for A2 Hosting).";
        } else if (errorMsg.includes("ETIMEDOUT")) {
          userMessage2 = "Email server connection timed out. Please check SMTP settings.";
        }
        return res.status(500).json({
          message: userMessage2,
          error: process.env.NODE_ENV === "development" ? errorMsg : void 0
        });
      }
      console.log("[Contact] Sending email...");
      const adminEmail = await transporter.sendMail({
        from: `"ScholarName" <${smtpUser}>`,
        to: "info@scholar.name",
        replyTo: email,
        subject: `New Inquiry: ${planInterest} Plan - ${fullName}`,
        text: emailContent
      });
      console.log(`[Contact] Admin email sent: ${adminEmail.messageId}`);
      console.log(`[Contact] Admin response: ${JSON.stringify(adminEmail)}`);
      const escapeHtml2 = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      const safeFullName = escapeHtml2(fullName);
      const safePlan = escapeHtml2(planInterest);
      const safeEmail = escapeHtml2(email);
      const safeInstitution = institution ? escapeHtml2(institution) : "Not provided";
      const safeRole = role ? escapeHtml2(role) : "Not provided";
      const userMessage = [
        `Hi ${fullName},`,
        "",
        "Thanks for contacting ScholarName. We've received your request and our team will review it shortly.",
        "",
        "Summary:",
        `- Name: ${fullName}`,
        `- Email: ${email}`,
        `- Plan: ${planInterest}`,
        institution ? `- Institution: ${institution}` : "- Institution: Not provided",
        role ? `- Role: ${role}` : "- Role: Not provided",
        "",
        "What happens next:",
        "- We will respond within 1-2 business days.",
        "- Reply to this email if you want to add more details or attachments.",
        "",
        "Best,",
        "The ScholarName Team"
      ].join("\n");
      const userHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ScholarName Inquiry</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1a2332;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(11,31,58,0.08);">
            <tr>
              <td style="background-color:#0b1f3a;color:#ffffff;padding:24px 32px;">
                <div style="font-size:20px;font-weight:700;letter-spacing:0.5px;">ScholarName</div>
                <div style="font-size:14px;opacity:0.9;">Inquiry received</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Hi ${safeFullName},</div>
                <div style="font-size:14px;line-height:1.6;margin-bottom:20px;">
                  Thanks for contacting ScholarName. We have received your request and our team will review it shortly.
                </div>
                <div style="background-color:#f7f9fc;border:1px solid #e3e8f0;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
                  <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4a5b72;margin-bottom:10px;">
                    Your summary
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.6;">
                    <tr><td style="width:140px;color:#4a5b72;">Name</td><td style="font-weight:600;">${safeFullName}</td></tr>
                    <tr><td style="color:#4a5b72;">Email</td><td style="font-weight:600;">${safeEmail}</td></tr>
                    <tr><td style="color:#4a5b72;">Plan</td><td style="font-weight:600;">${safePlan}</td></tr>
                    <tr><td style="color:#4a5b72;">Institution</td><td>${safeInstitution}</td></tr>
                    <tr><td style="color:#4a5b72;">Role</td><td>${safeRole}</td></tr>
                  </table>
                </div>
                <div style="font-size:14px;line-height:1.6;margin-bottom:18px;">
                  <strong>What happens next:</strong><br />
                  We will respond within 1-2 business days. If you want to add more details, simply reply to this email.
                </div>
                <div style="font-size:13px;color:#4a5b72;line-height:1.6;">
                  Need to reach us sooner? Email <a href="mailto:info@scholar.name" style="color:#0b1f3a;text-decoration:none;">info@scholar.name</a>.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:#f7f9fc;font-size:12px;color:#6b778a;text-align:center;">
                ScholarName \xB7 Research portfolio websites for academics
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `.trim();
      const userEmail = await transporter.sendMail({
        from: `"ScholarName" <${smtpUser}>`,
        to: email,
        replyTo: "info@scholar.name",
        subject: `Thanks for reaching out to ScholarName`,
        text: userMessage,
        html: userHtml
      });
      console.log(`[Contact] Auto-reply sent to user: ${userEmail.messageId}`);
      console.log(`[Contact] User response: ${JSON.stringify(userEmail)}`);
      res.json({
        success: true,
        message: "Inquiry submitted successfully"
      });
    } catch (error) {
      const errorMsg = (error instanceof Error ? error.message : "Unknown error") || String(error);
      console.log(`[Contact] Error processing contact form: ${errorMsg}`);
      console.log(`[Contact] Error code: ${error?.code || "N/A"}`);
      console.log(`[Contact] Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
      let userMessage = "Failed to process inquiry";
      if (errorMsg.includes("Invalid login") || errorMsg.includes("authentication")) {
        userMessage = "Email authentication failed. Please check SMTP credentials.";
      } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ENOTFOUND")) {
        userMessage = "Cannot connect to email server. Please check SMTP settings.";
      }
      res.status(500).json({
        message: userMessage,
        error: process.env.NODE_ENV === "development" ? errorMsg : void 0
      });
    }
  });
  app2.get("/api/researcher/:openalexId/export-bibliography", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const format = req.query.format || "bibtex";
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      const tenant = req.tenant;
      const isAuthorized = profile && (profile.isPublic || tenant && profile.tenantId === tenant.id);
      if (!isAuthorized) {
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
        message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Failed to upload CV"
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
        message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Failed to upload profile image"
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
  app2.get("/api/themes", async (req, res) => {
    try {
      const activeThemes = await storage.getActiveThemes();
      res.json(activeThemes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });
  app2.get("/api/themes/default", async (req, res) => {
    try {
      const defaultTheme = await storage.getDefaultTheme();
      res.json(defaultTheme || null);
    } catch (error) {
      console.error("Error fetching default theme:", error);
      res.status(500).json({ message: "Failed to fetch default theme" });
    }
  });
  app2.get("/api/themes/:id", async (req, res) => {
    try {
      const theme = await storage.getTheme(req.params.id);
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });
  app2.get("/api/admin/themes", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const allThemes = await storage.getAllThemes();
      res.json(allThemes);
    } catch (error) {
      console.error("Error fetching all themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });
  app2.post("/api/admin/themes", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const themeData = insertThemeSchema.parse({
        ...req.body,
        name: typeof req.body?.name === "string" ? req.body.name.trim() : req.body?.name
      });
      const newTheme = await storage.createTheme(themeData);
      res.status(201).json(newTheme);
    } catch (error) {
      console.error("Error creating theme:", error);
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid theme data", errors: error.errors });
      }
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Theme name already exists" });
      }
      res.status(500).json({ message: "Failed to create theme" });
    }
  });
  app2.patch("/api/admin/themes/:id", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateThemeSchema.parse({
        ...req.body,
        id,
        name: typeof req.body?.name === "string" ? req.body.name.trim() : req.body?.name
      });
      const updatedTheme = await storage.updateTheme(id, updates);
      if (!updatedTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      res.json(updatedTheme);
    } catch (error) {
      console.error("Error updating theme:", error);
      if (error instanceof z6.ZodError) {
        return res.status(400).json({ message: "Invalid theme data", errors: error.errors });
      }
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Theme name already exists" });
      }
      res.status(500).json({ message: "Failed to update theme" });
    }
  });
  app2.post("/api/admin/themes/:id/set-default", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTheme = await storage.setDefaultTheme(id);
      if (!updatedTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      res.json(updatedTheme);
    } catch (error) {
      console.error("Error setting default theme:", error);
      res.status(500).json({ message: "Failed to set default theme" });
    }
  });
  app2.delete("/api/admin/themes/:id", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const theme = await storage.getTheme(id);
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      if (theme.isDefault) {
        return res.status(400).json({ message: "Cannot delete the default theme" });
      }
      await storage.deleteTheme(id);
      res.json({ message: "Theme deleted successfully" });
    } catch (error) {
      console.error("Error deleting theme:", error);
      res.status(500).json({ message: "Failed to delete theme" });
    }
  });
  app2.get("/api/admin/themes/tenants", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const tenantsWithThemes = await storage.getTenantsWithThemeInfo();
      res.json(tenantsWithThemes);
    } catch (error) {
      console.error("Error fetching tenants with theme info:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });
  app2.post("/api/admin/themes/:id/apply-bulk", adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantIds } = req.body;
      const theme = await storage.getTheme(id);
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      const result = await storage.bulkApplyThemeToTenants(id, tenantIds);
      res.json({
        message: `Theme "${theme.name}" applied successfully`,
        updated: result.updated
      });
    } catch (error) {
      console.error("Error applying theme to tenants:", error);
      res.status(500).json({ message: "Failed to apply theme" });
    }
  });
  app2.post("/api/analytics/track", publicWriteRateLimit, async (req, res) => {
    try {
      const { openalexId, eventType, eventTarget, visitorId, referrer, userAgent, country, city } = req.body;
      if (!openalexId || !eventType) {
        return res.status(400).json({ message: "openalexId and eventType are required" });
      }
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      const event = await storage.trackAnalyticsEvent({
        profileId: profile?.id || null,
        openalexId,
        eventType,
        eventTarget: eventTarget || null,
        visitorId: visitorId || null,
        referrer: referrer || req.get("referer") || null,
        userAgent: userAgent || req.get("user-agent") || null,
        country: country || null,
        city: city || null
      });
      res.json({ success: true, eventId: event.id });
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });
  app2.get("/api/analytics/:openalexId", async (req, res) => {
    try {
      const { openalexId } = req.params;
      const days = parseInt(req.query.days) || 30;
      const session2 = req.session;
      if (!session2?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(session2.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (user.role !== "admin") {
        const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
        if (!profile || profile.tenantId !== user.tenantId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const summary = await storage.getAnalyticsSummary(openalexId, days);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.post("/api/chat-message", publicWriteRateLimit, async (req, res) => {
    try {
      const { name, email, message, page } = req.body;
      if (!email || !message) {
        return res.status(400).json({ message: "Email and message are required" });
      }
      const transporter = nodemailer3.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (adminEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: adminEmail,
          subject: `[Scholar.name Chat] New message from ${escapeHtml(name || email)}`,
          html: `
            <h2>New Chat Message</h2>
            <p><strong>From:</strong> ${escapeHtml(name || "Anonymous")} (${escapeHtml(email)})</p>
            <p><strong>Page:</strong> ${escapeHtml(page || "Unknown")}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This message was sent via the Scholar.name chat widget.</p>
          `,
          replyTo: email
        });
      }
      res.json({
        success: true,
        message: "Message received! We'll get back to you soon."
      });
    } catch (error) {
      console.error("Error handling chat message:", error);
      res.status(500).json({ message: "Failed to deliver message. Please email us directly at hello@scholar.name." });
    }
  });
  app2.post("/api/report-issue", publicWriteRateLimit, async (req, res) => {
    try {
      const { openalexId, issueType, email, description } = req.body;
      if (!openalexId || !issueType || !email || !description) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const issueTypeLabels = {
        "wrong_person": "Wrong person / Not me",
        "wrong_publications": "Wrong publications listed",
        "missing_publications": "Missing publications",
        "wrong_affiliation": "Wrong affiliation",
        "other": "Other issue"
      };
      const transporter = nodemailer3.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (adminEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: adminEmail,
          subject: `[Scholar.name] Data Issue Report: ${issueTypeLabels[issueType] || issueType}`,
          html: `
            <h2>\u{1F6A8} Data Issue Report</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Issue Type</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(issueTypeLabels[issueType] || issueType)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>OpenAlex ID</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <a href="https://openalex.org/authors/${escapeHtmlAttribute(openalexId)}">${escapeHtml(openalexId)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Profile URL</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <a href="https://scholar.name/researcher/${openalexId}">View Profile</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Reporter Email</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(email)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Description</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(description).replace(/\n/g, "<br>")}</td>
              </tr>
            </table>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Respond to this user at ${escapeHtml(email)}. If the issue is with source data, 
              guide them to submit a correction to OpenAlex.
            </p>
          `,
          replyTo: email
        });
      }
      res.json({
        success: true,
        message: "Report submitted successfully"
      });
    } catch (error) {
      console.error("Error handling issue report:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/static.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
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
  const distPath = path2.resolve(__dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  const uploadsPath = path2.resolve(process.cwd(), "uploads");
  console.log(`[Static] Serving uploads from: ${uploadsPath}`);
  if (!fs2.existsSync(uploadsPath)) {
    try {
      fs2.mkdirSync(uploadsPath, { recursive: true });
      console.log(`[Static] Created uploads directory: ${uploadsPath}`);
    } catch (err) {
      console.error(`[Static] Failed to create uploads directory:`, err);
    }
  }
  app2.use("/uploads", express.static(uploadsPath));
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/services/themeSeed.ts
var DEFAULT_THEMES = [
  {
    name: "Deep Navy",
    description: "Classic academic blue",
    sortOrder: 1,
    config: {
      colors: {
        primary: "#1e3a5f",
        primaryDark: "#0f2240",
        accent: "#F2994A",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        text: "#1E293B",
        textMuted: "#64748B"
      }
    },
    isActive: true,
    isDefault: true
  },
  {
    name: "Forest Scholar",
    description: "Natural green tones",
    sortOrder: 2,
    config: {
      colors: {
        primary: "#2d6a4f",
        primaryDark: "#1b4332",
        accent: "#95d5b2",
        background: "#FFFFFF",
        surface: "#f0fdf4",
        text: "#1a2e1a",
        textMuted: "#4a7c59"
      }
    },
    isActive: true,
    isDefault: false
  },
  {
    name: "Crimson",
    description: "Bold academic red",
    sortOrder: 3,
    config: {
      colors: {
        primary: "#8b1a1a",
        primaryDark: "#5c0f0f",
        accent: "#e07b7b",
        background: "#FFFFFF",
        surface: "#fff5f5",
        text: "#1a0a0a",
        textMuted: "#6b3636"
      }
    },
    isActive: true,
    isDefault: false
  },
  {
    name: "Slate Pro",
    description: "Modern dark slate",
    sortOrder: 4,
    config: {
      colors: {
        primary: "#374151",
        primaryDark: "#1f2937",
        accent: "#6366f1",
        background: "#FFFFFF",
        surface: "#f9fafb",
        text: "#111827",
        textMuted: "#6b7280"
      }
    },
    isActive: true,
    isDefault: false
  },
  {
    name: "Warm Amber",
    description: "Warm earth tones",
    sortOrder: 5,
    config: {
      colors: {
        primary: "#92400e",
        primaryDark: "#78350f",
        accent: "#f59e0b",
        background: "#FFFFFF",
        surface: "#fffbeb",
        text: "#1c0a00",
        textMuted: "#92400e"
      }
    },
    isActive: true,
    isDefault: false
  }
];
async function seedThemesIfEmpty() {
  try {
    const existing = await storage.getActiveThemes();
    if (existing.length > 0) return;
    for (const theme of DEFAULT_THEMES) {
      await storage.createTheme(theme);
    }
    console.log("[themeSeed] Seeded 5 default themes");
  } catch (err) {
    console.error("[themeSeed] Failed to seed themes:", err);
  }
}

// server/index-production.ts
var app = express2();
app.set("trust proxy", 1);
app.use(express2.json());
app.use(express2.urlencoded({ extended: true }));
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
if (!process.env.SESSION_SECRET) {
  console.error("\u26A0\uFE0F  WARNING: SESSION_SECRET not set \u2014 using insecure fallback. Set SESSION_SECRET env var ASAP!");
}
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
  proxy: true,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1e3
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
  await seedThemesIfEmpty();
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Unhandled route error:", err);
  });
  serveStatic(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
    startSyncScheduler(72);
    log("Sync scheduler started - checking tenants every 72 hours");
  });
  const shutdown = (signal) => {
    log(`${signal} received \u2014 shutting down gracefully`);
    stopSyncScheduler();
    server.close(() => {
      pool?.end?.();
      log("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 1e4).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
  });
})().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
