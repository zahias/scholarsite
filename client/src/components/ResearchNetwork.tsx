import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen } from "lucide-react";

interface ResearchNetworkProps {
  publications: any[];
  researcherName: string;
  isLoading?: boolean;
}

export default function ResearchNetwork({ publications, researcherName, isLoading }: ResearchNetworkProps) {
  const collaborators = useMemo(() => {
    if (!publications || publications.length === 0) return [];

    const coauthorMap = new Map<string, { count: number; papers: string[] }>();
    const normalizedResearcherName = researcherName.toLowerCase().trim();

    publications.forEach((pub) => {
      if (!pub.authorNames) return;
      
      const authors = pub.authorNames.split(',').map((a: string) => a.trim()).filter(Boolean);
      
      authors.forEach((author: string) => {
        const normalizedAuthor = author.toLowerCase().trim();
        if (normalizedAuthor === normalizedResearcherName) return;
        if (normalizedAuthor.includes(normalizedResearcherName) || normalizedResearcherName.includes(normalizedAuthor)) return;
        
        const existing = coauthorMap.get(author);
        if (existing) {
          existing.count++;
          existing.papers.push(pub.title);
        } else {
          coauthorMap.set(author, { count: 1, papers: [pub.title] });
        }
      });
    });

    return Array.from(coauthorMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [publications, researcherName]);

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-64 rounded-xl max-w-md" />
        </div>
      </section>
    );
  }

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <section id="network" className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20" data-testid="section-research-network">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-network-title">Top Collaborators</h2>
            <p className="text-sm text-muted-foreground">Researchers with the most joint publications</p>
          </div>
        </div>

        <Card className="overflow-hidden max-w-md" data-testid="card-collaborators">
          <CardContent className="p-6">
            <div className="space-y-3">
              {collaborators.map((collab, index) => (
                <div 
                  key={collab.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  data-testid={`item-collaborator-${index}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" data-testid={`text-collaborator-name-${index}`}>
                      {collab.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {collab.count} joint paper{collab.count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
