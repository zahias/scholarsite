import { storage } from "../storage";
import type { 
  InsertResearchTopic,
  InsertPublication,
  InsertAffiliation,
  InsertOpenalexData 
} from "@shared/schema";

interface OpenAlexInstitution {
  id: string;
  display_name: string;
  country_code?: string;
  type?: string;
}

interface OpenAlexAffiliation {
  institution: OpenAlexInstitution;
  years: number[];
}

interface OpenAlexTopic {
  id: string;
  display_name: string;
  count: number;
  subfield: {
    id: string;
    display_name: string;
  };
  field: {
    id: string;
    display_name: string;
  };
  domain: {
    id: string;
    display_name: string;
  };
}

interface OpenAlexTopicShare {
  id: string;
  display_name: string;
  value: number;
  subfield: {
    id: string;
    display_name: string;
  };
  field: {
    id: string;
    display_name: string;
  };
  domain: {
    id: string;
    display_name: string;
  };
}

interface OpenAlexAuthor {
  display_name: string;
}

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year?: number;
  cited_by_count: number;
  doi?: string;
  type?: string; // article, review, book-chapter, etc.
  open_access?: {
    is_oa: boolean;
  };
  primary_location?: {
    source?: {
      display_name?: string;
    };
  };
  authorships: {
    author: OpenAlexAuthor;
  }[];
  topics?: OpenAlexTopic[];
}

interface OpenAlexWorksResponse {
  results: OpenAlexWork[];
  meta: {
    count: number;
    next_cursor?: string;
  };
}

interface OpenAlexResearcher {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  summary_stats: {
    h_index: number;
    i10_index: number;
    "2yr_mean_citedness": number;
  };
  affiliations: OpenAlexAffiliation[];
  topics: OpenAlexTopic[];
  topic_share: OpenAlexTopicShare[];
}

export class OpenAlexService {
  private baseUrl = 'https://api.openalex.org';
  
  async getResearcher(openalexId: string): Promise<OpenAlexResearcher> {
    const cleanId = openalexId.startsWith('A') ? openalexId : `A${openalexId}`;
    const url = `${this.baseUrl}/people/${cleanId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getResearcherWorks(openalexId: string): Promise<OpenAlexWorksResponse> {
    const cleanId = openalexId.startsWith('A') ? openalexId : `A${openalexId}`;
    let allResults: OpenAlexWork[] = [];
    let page = 1;
    let totalCount = 0;
    const perPage = 200; // OpenAlex max per page
    let hasMoreResults = true;
    
    // Fetch all pages using page-based pagination
    while (hasMoreResults) {
      const url = `${this.baseUrl}/works?filter=author.id:${cleanId}&per-page=${perPage}&page=${page}&sort=cited_by_count:desc`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
      }
      
      const data: OpenAlexWorksResponse = await response.json();
      allResults = allResults.concat(data.results);
      totalCount = data.meta.count;
      
      console.log(`Fetched ${allResults.length} of ${totalCount} publications for ${cleanId} (page ${page})`);
      
      page++;
      
      // Continue until we have all results or no more results returned
      hasMoreResults = allResults.length < totalCount && data.results.length > 0;
    }
    
    return {
      results: allResults,
      meta: {
        count: totalCount
      }
    };
  }

  async syncResearcherData(openalexId: string): Promise<void> {
    try {
      console.log(`Starting sync for researcher: ${openalexId}`);
      
      // Fetch researcher data - handle 404 gracefully
      let researcher;
      try {
        researcher = await this.getResearcher(openalexId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          console.log(`OpenAlex researcher ${openalexId} not found (404) - skipping sync`);
          return; // Exit gracefully, don't fail profile creation
        }
        throw error; // Re-throw other errors
      }
      
      // Cache raw researcher data
      await storage.upsertOpenalexData({
        openalexId,
        dataType: 'researcher',
        data: researcher,
      });

      // Process and cache research topics
      if (researcher.topics && researcher.topics.length > 0) {
        const topics: InsertResearchTopic[] = researcher.topics.map(topic => ({
          openalexId,
          topicId: topic.id,
          displayName: topic.display_name,
          count: topic.count,
          subfield: topic.subfield.display_name,
          field: topic.field.display_name,
          domain: topic.domain.display_name,
        }));
        
        await storage.upsertResearchTopics(topics);
      }

      // Process and cache affiliations
      if (researcher.affiliations && researcher.affiliations.length > 0) {
        const affiliations: InsertAffiliation[] = researcher.affiliations.map(affiliation => {
          const sortedYears = affiliation.years.sort((a, b) => a - b);
          return {
            openalexId,
            institutionId: affiliation.institution.id,
            institutionName: affiliation.institution.display_name,
            institutionType: affiliation.institution.type,
            countryCode: affiliation.institution.country_code,
            years: affiliation.years,
            startYear: sortedYears[0],
            endYear: sortedYears[sortedYears.length - 1],
          };
        });
        
        await storage.upsertAffiliations(affiliations);
      }

      // Fetch and process works/publications - handle 404 gracefully
      let worksResponse;
      try {
        worksResponse = await this.getResearcherWorks(openalexId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          console.log(`OpenAlex works for ${openalexId} not found (404) - skipping works sync`);
          return;
        }
        throw error;
      }
      
      if (worksResponse.results && worksResponse.results.length > 0) {
        const publications: InsertPublication[] = worksResponse.results
          .filter(work => work.title && work.title.trim() !== '') // Filter out works without valid titles
          .map(work => {
            // Extract type name from OpenAlex URL (e.g., "https://openalex.org/types/article" -> "article")
            const publicationType = work.type ? work.type.split('/').pop() || null : null;
            
            return {
              openalexId,
              workId: work.id,
              title: work.title,
              authorNames: work.authorships.map(a => a.author.display_name).join(', '),
              journal: work.primary_location?.source?.display_name || null,
              publicationYear: work.publication_year || null,
              citationCount: work.cited_by_count || 0,
              topics: work.topics ? work.topics.map(t => t.display_name) : null,
              doi: work.doi || null,
              isOpenAccess: work.open_access?.is_oa || false,
              publicationType,
              isReviewArticle: publicationType === 'review',
            };
          });
        
        console.log(`Processed ${publications.length} valid publications (filtered out ${worksResponse.results.length - publications.length} without titles)`);
        
        if (publications.length > 0) {
          await storage.upsertPublications(publications);
        }
      }

      // Cache works data
      await storage.upsertOpenalexData({
        openalexId,
        dataType: 'works',
        data: worksResponse,
      });

      console.log(`Successfully synced data for researcher: ${openalexId}`);
    } catch (error) {
      console.error(`Error syncing researcher data for ${openalexId}:`, error);
      throw error;
    }
  }
}
