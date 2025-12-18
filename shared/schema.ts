import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: Session table is managed by connect-pg-simple, not Drizzle
// See server/index.ts for session configuration

// Plan types for pricing tiers
export type PlanType = 'starter' | 'professional' | 'institution';

// Tenant status
export type TenantStatus = 'active' | 'suspended' | 'cancelled' | 'pending';

// Tenants table - each paying customer
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Display name for the tenant/site
  plan: varchar("plan").$type<PlanType>().default('starter').notNull(),
  status: varchar("status").$type<TenantStatus>().default('pending').notNull(),
  // Billing info
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  // Sync settings based on plan
  lastSyncAt: timestamp("last_sync_at"),
  syncFrequency: varchar("sync_frequency").default('monthly'), // monthly, weekly, daily
  // Branding
  primaryColor: varchar("primary_color").default('#0B1F3A'),
  accentColor: varchar("accent_color").default('#F2994A'),
  logoUrl: varchar("logo_url"),
  selectedThemeId: varchar("selected_theme_id"), // Reference to themes table
  // Contact
  contactEmail: varchar("contact_email"),
  notes: text("notes"), // Admin notes about this tenant
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Domains table - map custom domains to tenants
export const domains = pgTable("domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  hostname: varchar("hostname").unique().notNull(), // e.g., "dr-smith.com" or "smith.scholarsite.com"
  isPrimary: boolean("is_primary").default(false).notNull(), // Primary domain for this tenant
  isSubdomain: boolean("is_subdomain").default(false).notNull(), // true if *.scholarsite.com
  sslStatus: varchar("ssl_status").default('pending'), // pending, active, failed
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User roles
export type UserRole = 'admin' | 'researcher';

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id), // null for platform admins
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").$type<UserRole>().default('researcher').notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Researcher profiles table
export const researcherProfiles = pgTable("researcher_profiles", {
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
  email: varchar("email"), // Contact email for the researcher
  // Social/Academic profile links
  orcidUrl: varchar("orcid_url"),
  googleScholarUrl: varchar("google_scholar_url"),
  researchGateUrl: varchar("research_gate_url"),
  linkedinUrl: varchar("linkedin_url"),
  websiteUrl: varchar("website_url"),
  twitterUrl: varchar("twitter_url"),
  selectedThemeId: varchar("selected_theme_id"), // Reference to themes table
  isPublic: boolean("is_public").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OpenAlex researcher data cache
export const openalexData = pgTable("openalex_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  dataType: varchar("data_type").notNull(), // 'researcher', 'works', 'topics'
  data: jsonb("data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  uniqueOpenalexDataType: unique().on(table.openalexId, table.dataType),
}));

// Research topics cache
export const researchTopics = pgTable("research_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  displayName: text("display_name").notNull(),
  count: integer("count").notNull(),
  subfield: text("subfield"),
  field: text("field"),
  domain: text("domain"),
  value: varchar("value"), // topic share value
});

// Publications cache
export const publications = pgTable("publications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  workId: varchar("work_id").notNull(),
  title: text("title").notNull(),
  authorNames: text("author_names"),
  journal: text("journal"),
  publicationYear: integer("publication_year"),
  citationCount: integer("citation_count").default(0),
  topics: jsonb("topics"), // array of topic tags
  doi: varchar("doi"),
  isOpenAccess: boolean("is_open_access").default(false),
  publicationType: varchar("publication_type"), // article, book-chapter, etc.
  isReviewArticle: boolean("is_review_article").default(false),
});

// Affiliations cache
export const affiliations = pgTable("affiliations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  openalexId: varchar("openalex_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  institutionName: text("institution_name").notNull(),
  institutionType: varchar("institution_type"),
  countryCode: varchar("country_code"),
  years: jsonb("years"), // array of years
  startYear: integer("start_year"),
  endYear: integer("end_year"),
});

// Tenant types
export type InsertTenant = typeof tenants.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;

// Domain types
export type InsertDomain = typeof domains.$inferInsert;
export type Domain = typeof domains.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Auth schemas
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;

// Safe user type (without password hash)
export type SafeUser = Omit<User, 'passwordHash'>;

export type InsertResearcherProfile = typeof researcherProfiles.$inferInsert;
export type ResearcherProfile = typeof researcherProfiles.$inferSelect;

export type InsertOpenalexData = typeof openalexData.$inferInsert;
export type OpenalexData = typeof openalexData.$inferSelect;

export type InsertResearchTopic = typeof researchTopics.$inferInsert;
export type ResearchTopic = typeof researchTopics.$inferSelect;

export type InsertPublication = typeof publications.$inferInsert;
export type Publication = typeof publications.$inferSelect;

export type InsertAffiliation = typeof affiliations.$inferInsert;
export type Affiliation = typeof affiliations.$inferSelect;

// Site settings table for theme and configuration
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key").unique().notNull(), // e.g., 'theme', 'contact_email', 'platform_name'
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertSiteSetting = typeof siteSettings.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;

// Theme configuration type
export type ThemeConfig = {
  colors: {
    primary: string;       // Main brand color
    primaryDark: string;   // Darker variant for gradients
    accent: string;        // Accent/highlight color
    background: string;    // Page background
    surface: string;       // Card/section backgrounds
    text: string;          // Primary text color
    textMuted: string;     // Secondary text color
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
  };
};

// Themes table - predefined color themes for researcher profiles
export const themes = pgTable("themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  config: jsonb("config").$type<ThemeConfig>().notNull(),
  previewImageUrl: varchar("preview_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertTheme = typeof themes.$inferInsert;
export type Theme = typeof themes.$inferSelect;

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateThemeSchema = insertThemeSchema.partial().extend({
  id: z.string(),
});

export const insertResearcherProfileSchema = createInsertSchema(researcherProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  openalexId: z.string().transform((val) => {
    // Ensure OpenAlex ID is properly formatted with capital A
    const trimmed = val.trim();
    if (trimmed.toLowerCase().startsWith('a') && !trimmed.startsWith('A')) {
      return 'A' + trimmed.slice(1);
    }
    return trimmed.startsWith('A') ? trimmed : `A${trimmed}`;
  }).refine((val) => /^A\d+$/.test(val), {
    message: "OpenAlex ID must start with 'A' followed by numbers (e.g., A5056485484)"
  }),
  currentAffiliationStartDate: z.string().transform((val) => {
    // Transform empty strings to null for date fields to prevent DB errors
    return val === '' ? null : val;
  }).nullable()
});

export const updateResearcherProfileSchema = insertResearcherProfileSchema.partial().extend({
  id: z.string(),
});

// Tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTenantSchema = insertTenantSchema.partial().extend({
  id: z.string(),
});

// Domain schemas
export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
});

export const updateDomainSchema = insertDomainSchema.partial().extend({
  id: z.string(),
});

// Payment status types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

// Payments table - track all payment transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  orderNumber: varchar("order_number").unique().notNull(),
  amount: varchar("amount").notNull(),
  currency: varchar("currency").default('USD').notNull(),
  status: varchar("status").$type<PaymentStatus>().default('pending').notNull(),
  plan: varchar("plan").$type<PlanType>().notNull(),
  billingPeriod: varchar("billing_period").default('monthly').notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  montyPaySessionId: varchar("montypay_session_id"),
  montyPayTransactionId: varchar("montypay_transaction_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type InsertPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Checkout session request schema
export const checkoutSessionSchema = z.object({
  plan: z.enum(['starter', 'pro']),
  billingPeriod: z.enum(['monthly', 'yearly']),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  openalexId: z.string().optional(),
});
