import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, BookOpen } from "lucide-react";

interface Collaborator {
  name: string;
  count: number;
  papers: string[];
  institution?: string;
}

interface Affiliation {
  id: string;
  institutionName: string;
  institutionId?: string;
  institutionType?: string;
  countryCode?: string;
  years?: number[];
  startYear?: number;
  endYear?: number;
}

interface ResearchNetworkProps {
  publications: any[];
  affiliations: Affiliation[];
  researcherName: string;
  isLoading?: boolean;
}

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", UK: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", CA: "🇨🇦", AU: "🇦🇺",
  JP: "🇯🇵", CN: "🇨🇳", IN: "🇮🇳", IT: "🇮🇹", ES: "🇪🇸", NL: "🇳🇱", CH: "🇨🇭",
  SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰", FI: "🇫🇮", BE: "🇧🇪", AT: "🇦🇹", PT: "🇵🇹",
  IE: "🇮🇪", NZ: "🇳🇿", SG: "🇸🇬", KR: "🇰🇷", IL: "🇮🇱", BR: "🇧🇷", MX: "🇲🇽",
  AR: "🇦🇷", ZA: "🇿🇦", EG: "🇪🇬", SA: "🇸🇦", AE: "🇦🇪", TR: "🇹🇷", RU: "🇷🇺",
  PL: "🇵🇱", CZ: "🇨🇿", HU: "🇭🇺", GR: "🇬🇷", TW: "🇹🇼", HK: "🇭🇰", MY: "🇲🇾",
  TH: "🇹🇭", PH: "🇵🇭", ID: "🇮🇩", VN: "🇻🇳", LB: "🇱🇧", PK: "🇵🇰", BD: "🇧🇩",
  CL: "🇨🇱", CO: "🇨🇴", PE: "🇵🇪", NG: "🇳🇬", KE: "🇰🇪", GH: "🇬🇭"
};

function getFlag(countryCode?: string): string {
  if (!countryCode) return "🏛️";
  return countryFlags[countryCode.toUpperCase()] || "🌍";
}

export default function ResearchNetwork({ publications, affiliations, researcherName, isLoading }: ResearchNetworkProps) {
  const networkData = useMemo(() => {
    if (!publications || publications.length === 0) return { collaborators: [], institutions: [] };

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

    const collaborators = Array.from(coauthorMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const currentYear = new Date().getFullYear();
    const institutions = (affiliations || [])
      .map(aff => {
        const years = aff.years as number[] | undefined;
        const startYear = aff.startYear || (years && years.length > 0 ? Math.min(...years) : null);
        const endYear = aff.endYear || (years && years.length > 0 ? Math.max(...years) : null);
        const isCurrent = endYear === null || endYear >= currentYear;
        const paperCount = years?.length || 0;
        return { ...aff, computedStart: startYear, computedEnd: endYear, isCurrent, paperCount };
      })
      .sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.paperCount - a.paperCount;
      })
      .slice(0, 4);

    return { collaborators, institutions };
  }, [publications, affiliations, researcherName]);

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (networkData.collaborators.length === 0 && networkData.institutions.length === 0) {
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
            <h2 className="text-2xl font-bold" data-testid="text-network-title">Research Network</h2>
            <p className="text-sm text-muted-foreground">Collaborators and institutional connections</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {networkData.collaborators.length > 0 && (
            <Card className="overflow-hidden" data-testid="card-collaborators">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Top Collaborators</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {networkData.collaborators.length} shown
                  </Badge>
                </div>
                <div className="space-y-3">
                  {networkData.collaborators.map((collab, index) => (
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
          )}

          {networkData.institutions.length > 0 && (
            <Card className="overflow-hidden" data-testid="card-institutions">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Institutional Connections</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {networkData.institutions.length} shown
                  </Badge>
                </div>
                <div className="space-y-3">
                  {networkData.institutions.map((inst, index) => (
                    <div 
                      key={inst.id || index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        inst.isCurrent ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                      data-testid={`item-institution-${index}`}
                    >
                      <div className="text-2xl flex-shrink-0">
                        {getFlag(inst.countryCode)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate" data-testid={`text-institution-name-${index}`}>
                            {inst.institutionName}
                          </p>
                          {inst.isCurrent && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {inst.computedStart && inst.computedEnd && `${inst.computedStart}-${inst.isCurrent ? 'Present' : inst.computedEnd}`}
                          {inst.institutionType && ` • ${inst.institutionType.replace('_', ' ')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
