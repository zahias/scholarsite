import { storage } from "../storage";
import type { 
  InsertResearchTopic,
  InsertPublication,
  InsertAffiliation,
  InsertOpenalexData 
} from "@shared/schema";
import fetch from "node-fetch";

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
  display_name?: string;
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
  orcid?: string | null;
  summary_stats: {
    h_index: number;
    i10_index: number;
    "2yr_mean_citedness": number;
  };
  last_known_institutions?: Array<{
    id: string;
    display_name: string;
    country_code?: string;
    type?: string;
  }>;
  affiliations: OpenAlexAffiliation[];
  topics: OpenAlexTopic[];
  topic_share: OpenAlexTopicShare[];
}

export class OpenAlexService {
  private baseUrl = 'https://api.openalex.org';
  private readonly worksPageSize = 100;
  private readonly maxPublications = 500;
  private readonly workFields = [
    'id',
    'title',
    'display_name',
    'publication_year',
    'cited_by_count',
    'doi',
    'type',
    'open_access',
    'primary_location',
    'authorships',
    'topics',
  ].join(',');

  private withApiKey(url: string): string {
    const apiKey = process.env.OPENALEX_API_KEY;
    if (!apiKey) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}api_key=${encodeURIComponent(apiKey)}`;
  }
  
  async getResearcher(openalexId: string): Promise<OpenAlexResearcher> {
    const cleanId = openalexId.startsWith('A') ? openalexId : `A${openalexId}`;
    const url = this.withApiKey(`${this.baseUrl}/authors/${cleanId}`);
    
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as OpenAlexResearcher;
  }

  async getResearcherWorks(openalexId: string): Promise<OpenAlexWorksResponse> {
    const cleanId = openalexId.startsWith('A') ? openalexId : `A${openalexId}`;
    const fetchPage = async (page: number): Promise<OpenAlexWorksResponse> => {
      const query = new URLSearchParams({
        filter: `authorships.author.id:${cleanId}`,
        per_page: String(this.worksPageSize),
        page: String(page),
        sort: 'cited_by_count:desc',
        select: this.workFields,
      });
      const url = this.withApiKey(`${this.baseUrl}/works?${query.toString()}`);
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenAlexWorksResponse;
      if (!data?.meta || !Array.isArray(data.results) || !Number.isFinite(data.meta.count)) {
        throw new Error('OpenAlex API returned malformed works data');
      }
      return data;
    };

    // First page establishes the total; all remaining capped pages form one parallel wave.
    const firstPage = await fetchPage(1);
    const totalCount = firstPage.meta.count;
    const cappedCount = Math.min(totalCount, this.maxPublications);
    const pageCount = Math.ceil(cappedCount / this.worksPageSize);
    const remainingPages = pageCount > 1
      ? await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => fetchPage(index + 2)))
      : [];
    const allResults = [firstPage, ...remainingPages]
      .flatMap((page) => page.results)
      .slice(0, cappedCount);

    console.log(`Fetched ${allResults.length} of ${cappedCount} publications for ${cleanId} in ${pageCount} page request(s)`);
    
    return {
      results: allResults,
      meta: {
        count: totalCount
      }
    };
  }

  async syncResearcherData(openalexId: string): Promise<{ publicationsProcessed: number; worksCount: number; citedByCount: number }> {
    try {
      console.log(`Starting sync for researcher: ${openalexId}`);

      // Fetch researcher data - handle 404 gracefully
      let researcher;
      try {
        researcher = await this.getResearcher(openalexId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          console.log(`OpenAlex researcher ${openalexId} not found (404) - skipping sync`);
          return { publicationsProcessed: 0, worksCount: 0, citedByCount: 0 }; // Exit gracefully, don't fail profile creation
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
          return { publicationsProcessed: 0, worksCount: researcher.works_count || 0, citedByCount: researcher.cited_by_count || 0 };
        }
        throw error;
      }

      let publicationsProcessed = 0;
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
        publicationsProcessed = publications.length;

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
      return {
        publicationsProcessed,
        worksCount: researcher.works_count || 0,
        citedByCount: researcher.cited_by_count || 0,
      };
    } catch (error) {
      console.error(`Error syncing researcher data for ${openalexId}:`, error);
      throw error;
    }
  }
}
