import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen } from "lucide-react";

interface Collaborator {
  name: string;
  count: number;
  papers: string[];
}

interface CollaborationMapProps {
  publications: any[];
  researcherName: string;
  isLoading?: boolean;
}

export default function CollaborationMap({ publications, researcherName, isLoading }: CollaborationMapProps) {
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20" data-testid="section-collaboration-map">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-collaboration-title">Top Collaborators</h2>
              <p className="text-sm text-muted-foreground">Most frequent co-authors</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            {collaborators.length} collaborators
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collaborators.map((collab, index) => (
            <Card 
              key={collab.name} 
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20" 
              data-testid={`card-top-collaborator-${index}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-primary font-bold text-lg">#{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors" data-testid={`text-collaborator-name-${index}`}>
                      {collab.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-sm">
                        {collab.count} joint paper{collab.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2" title={collab.papers[0]}>
                      {collab.papers[0]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
