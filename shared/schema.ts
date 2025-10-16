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

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Researcher profiles table
export const researcherProfiles = pgTable("researcher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  openalexId: varchar("openalex_id").unique().notNull(),
  displayName: text("display_name"),
  title: text("title"),
  bio: text("bio"),
  cvUrl: varchar("cv_url"),
  // Current affiliation fields (manually entered)
  currentAffiliation: text("current_affiliation"),
  currentPosition: text("current_position"),
  currentAffiliationUrl: varchar("current_affiliation_url"),
  currentAffiliationStartDate: date("current_affiliation_start_date"),
  email: varchar("email"), // Contact email for the researcher
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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
