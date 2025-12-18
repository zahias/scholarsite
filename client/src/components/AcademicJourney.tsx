import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Building2, MapPin } from "lucide-react";

interface Affiliation {
  id: string;
  institutionName: string;
  institutionType?: string;
  countryCode?: string;
  years?: number[];
  startYear?: number;
  endYear?: number;
}

interface AcademicJourneyProps {
  affiliations: Affiliation[];
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

export default function AcademicJourney({ affiliations, isLoading }: AcademicJourneyProps) {
  const sortedAffiliations = useMemo(() => {
    if (!affiliations || affiliations.length === 0) return [];
    
    return [...affiliations]
      .map(aff => {
        const years = aff.years as number[] | undefined;
        const startYear = aff.startYear || (years && years.length > 0 ? Math.min(...years) : null);
        const endYear = aff.endYear || (years && years.length > 0 ? Math.max(...years) : null);
        return { ...aff, computedStart: startYear, computedEnd: endYear };
      })
      .sort((a, b) => {
        if (a.computedEnd === null && b.computedEnd !== null) return -1;
        if (a.computedEnd !== null && b.computedEnd === null) return 1;
        if (a.computedEnd !== null && b.computedEnd !== null) {
          return b.computedEnd - a.computedEnd;
        }
        if (a.computedStart !== null && b.computedStart !== null) {
          return b.computedStart - a.computedStart;
        }
        return 0;
      });
  }, [affiliations]);

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (sortedAffiliations.length === 0) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <section className="py-12 lg:py-16 bg-muted/30" data-testid="section-academic-journey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-journey-title">Academic Journey</h2>
            <p className="text-sm text-muted-foreground">Career timeline and affiliations</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent hidden md:block" />
          
          <div className="space-y-4">
            {sortedAffiliations.map((aff, index) => {
              const isCurrent = aff.computedEnd === null || aff.computedEnd >= currentYear;
              const yearRange = aff.computedStart 
                ? (isCurrent ? `${aff.computedStart} - Present` : `${aff.computedStart} - ${aff.computedEnd}`)
                : (aff.computedEnd ? `Until ${aff.computedEnd}` : '');
              
              return (
                <Card 
                  key={aff.id || index}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-md ${
                    isCurrent ? 'border-primary/30 bg-primary/5' : 'hover:border-primary/20'
                  }`}
                  data-testid={`card-affiliation-${index}`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 hidden md:block" />
                  
                  <CardContent className="p-5 md:pl-8">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0" data-testid={`flag-${index}`}>
                        {getFlag(aff.countryCode)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base md:text-lg" data-testid={`text-institution-${index}`}>
                            {aff.institutionName}
                          </h3>
                          {isCurrent && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {yearRange && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {yearRange}
                            </span>
                          )}
                          {aff.countryCode && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {aff.countryCode}
                            </span>
                          )}
                          {aff.institutionType && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {aff.institutionType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
