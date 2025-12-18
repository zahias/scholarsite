import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronDown, ChevronUp } from "lucide-react";

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
  const [showAll, setShowAll] = useState(false);

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
      .slice(0, 50);
  }, [publications, researcherName]);

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (collaborators.length === 0) {
    return null;
  }

  const displayedCollaborators = showAll ? collaborators : collaborators.slice(0, 12);
  const maxCount = collaborators[0]?.count || 1;

  const getNodeSize = (count: number) => {
    const minSize = 60;
    const maxSize = 120;
    const ratio = count / maxCount;
    return minSize + (maxSize - minSize) * Math.sqrt(ratio);
  };

  const getOpacity = (count: number) => {
    const ratio = count / maxCount;
    return 0.4 + 0.6 * ratio;
  };

  return (
    <section className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20" data-testid="section-collaboration-map">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-collaboration-title">Collaboration Network</h2>
              <p className="text-sm text-muted-foreground">Top co-authors by joint publications</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            {collaborators.length} collaborators
          </Badge>
        </div>

        {/* Network Visualization - Bubble Layout */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="relative min-h-[300px] flex flex-wrap justify-center items-center gap-3">
              {displayedCollaborators.map((collab, index) => {
                const size = getNodeSize(collab.count);
                const opacity = getOpacity(collab.count);
                
                return (
                  <div
                    key={collab.name}
                    className="group relative cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10"
                    style={{ 
                      width: size, 
                      height: size,
                    }}
                    data-testid={`collaborator-node-${index}`}
                  >
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
                      style={{ opacity }}
                    >
                      <div className="text-center px-2">
                        <div className="text-xs font-medium truncate max-w-full leading-tight" style={{ fontSize: Math.max(10, size / 8) }}>
                          {collab.name.split(' ').slice(0, 2).join(' ')}
                        </div>
                        <div className="text-xs opacity-80 mt-0.5" style={{ fontSize: Math.max(8, size / 10) }}>
                          {collab.count} paper{collab.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-popover border shadow-lg rounded-lg p-3 min-w-[200px] max-w-[300px]">
                        <p className="font-medium text-sm mb-1">{collab.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {collab.count} joint publication{collab.count > 1 ? 's' : ''}
                        </p>
                        <div className="text-xs text-muted-foreground/80 max-h-[100px] overflow-y-auto">
                          {collab.papers.slice(0, 3).map((paper, i) => (
                            <p key={i} className="truncate mb-1">• {paper}</p>
                          ))}
                          {collab.papers.length > 3 && (
                            <p className="text-primary">+{collab.papers.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {collaborators.length > 12 && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  data-testid="button-toggle-collaborators"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show All {collaborators.length} Collaborators
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Collaborators List */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collaborators.slice(0, 4).map((collab, index) => (
            <Card key={collab.name} className="hover:shadow-md transition-shadow" data-testid={`card-top-collaborator-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">#{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{collab.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {collab.count} joint paper{collab.count > 1 ? 's' : ''}
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
