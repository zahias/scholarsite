import {
  users,
  researcherProfiles,
  openalexData,
  researchTopics,
  publications,
  affiliations,
  siteSettings,
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Researcher profile operations
  getResearcherProfile(userId: string): Promise<ResearcherProfile | undefined>;
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
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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

  // Researcher profile operations
  async getResearcherProfile(userId: string): Promise<ResearcherProfile | undefined> {
    const [profile] = await db
      .select()
      .from(researcherProfiles)
      .where(eq(researcherProfiles.userId, userId));
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
