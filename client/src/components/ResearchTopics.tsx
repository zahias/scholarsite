import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface ResearchTopicsProps {
  openalexId: string;
  inline?: boolean;
}

interface Topic {
  id: string;
  displayName: string;
  count: number;
  subfield?: string;
  field?: string;
  domain?: string;
}

export default function ResearchTopics({ openalexId, inline = false }: ResearchTopicsProps) {
  const { data: researcherData, isLoading } = useQuery<{
    profile: any;
    researcher: any;
    topics: Topic[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
  } | null>({
    queryKey: [`/api/researcher/${openalexId}/data`],
    retry: false,
  });

  // Group topics by domain/field and calculate sizes
  const { groupedTopics, allTopics } = useMemo(() => {
    const topics = researcherData?.topics || [];
    if (topics.length === 0) return { groupedTopics: {}, allTopics: [] };

    const maxCount = Math.max(...topics.map(t => t.count));
    const minCount = Math.min(...topics.map(t => t.count));
    
    // Calculate relative size (1-5 scale) for each topic
    const topicsWithSize = topics.map(topic => {
      const normalized = maxCount === minCount 
        ? 1 
        : (topic.count - minCount) / (maxCount - minCount);
      // Size scale: 1 = smallest (text-xs), 5 = largest (text-lg)
      const size = Math.ceil(normalized * 4) + 1;
      return { ...topic, size };
    });

    // Group by domain
    const grouped: { [domain: string]: typeof topicsWithSize } = {};
    topicsWithSize.forEach(topic => {
      const domain = topic.domain || 'Other';
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(topic);
    });

    // Sort groups by total count
    const sortedGroups: { [domain: string]: typeof topicsWithSize } = {};
    Object.entries(grouped)
      .sort((a, b) => {
        const sumA = a[1].reduce((acc, t) => acc + t.count, 0);
        const sumB = b[1].reduce((acc, t) => acc + t.count, 0);
        return sumB - sumA;
      })
      .forEach(([domain, topics]) => {
        sortedGroups[domain] = topics.sort((a, b) => b.count - a.count);
      });

    return { groupedTopics: sortedGroups, allTopics: topicsWithSize };
  }, [researcherData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 mx-auto" />
        <div className="flex flex-wrap justify-center gap-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  const topics = researcherData?.topics || [];

  // Size classes for tag cloud
  const sizeClasses: { [key: number]: string } = {
    1: 'text-xs px-2 py-0.5',
    2: 'text-xs px-2.5 py-1',
    3: 'text-sm px-3 py-1',
    4: 'text-sm px-3 py-1.5 font-medium',
    5: 'text-base px-4 py-1.5 font-semibold',
  };

  // Color palette for domains
  const domainColors: { [key: string]: string } = {
    'Physical Sciences': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    'Life Sciences': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300',
    'Social Sciences': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
    'Health Sciences': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300',
    'Engineering': 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
    'Arts & Humanities': 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
    'Other': 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800/50 dark:text-gray-300',
  };

  const getColorClass = (domain: string) => {
    return domainColors[domain] || domainColors['Other'];
  };

  const content = (
    <>
      {!inline && (
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">Research Areas</h2>
          <p className="text-sm text-muted-foreground">
            {topics.length} topics across {Object.keys(groupedTopics).length} domains
          </p>
        </div>
      )}
      
      {topics.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🔬</div>
            <h3 className="text-lg font-semibold mb-2">No Research Topics</h3>
            <p className="text-muted-foreground text-sm">
              Topics will appear once publication data is synchronized.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tag Cloud by Domain */}
          {Object.entries(groupedTopics).map(([domain, domainTopics]) => (
            <div key={domain} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getColorClass(domain).split(' ')[0]}`}></span>
                {domain}
                <span className="text-xs">({domainTopics.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {domainTopics.slice(0, 8).map((topic, index) => (
                  <span
                    key={topic.id || index}
                    className={`inline-flex items-center rounded-full transition-colors cursor-default ${sizeClasses[topic.size]} ${getColorClass(domain)}`}
                    title={`${topic.count} publications • ${topic.subfield || topic.field || domain}`}
                    data-testid={`tag-topic-${index}`}
                  >
                    {topic.displayName}
                    <span className="ml-1.5 opacity-60 text-[0.7em]">{topic.count}</span>
                  </span>
                ))}
                {domainTopics.length > 8 && (
                  <span className="inline-flex items-center text-xs text-muted-foreground px-2 py-1">
                    +{domainTopics.length - 8} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (inline) {
    return <div data-testid="section-research-topics">{content}</div>;
  }

  return (
    <section id="research" className="py-6" data-testid="section-research-topics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
}
