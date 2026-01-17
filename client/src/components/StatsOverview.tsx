import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

interface StatsOverviewProps {
  openalexId: string;
}

export default function StatsOverview({ openalexId }: StatsOverviewProps) {
  const { data: researcherData, isLoading } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
  } | null>({
    queryKey: [`/api/researcher/${openalexId}/data`],
    retry: false,
  });

  // Calculate YoY trends from publications
  const trends = useMemo(() => {
    if (!researcherData?.publications || researcherData.publications.length === 0) {
      return { pubsChange: 0, citesChange: 0 };
    }

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const twoYearsAgo = currentYear - 2;

    let lastYearPubs = 0;
    let twoYearsAgoPubs = 0;
    let lastYearCites = 0;
    let twoYearsAgoCites = 0;

    researcherData.publications.forEach(pub => {
      const year = pub.publicationYear;
      const cites = pub.citationCount || 0;
      
      if (year === lastYear) {
        lastYearPubs++;
        lastYearCites += cites;
      } else if (year === twoYearsAgo) {
        twoYearsAgoPubs++;
        twoYearsAgoCites += cites;
      }
    });

    // Calculate percentage changes
    const pubsChange = twoYearsAgoPubs > 0 
      ? Math.round(((lastYearPubs - twoYearsAgoPubs) / twoYearsAgoPubs) * 100)
      : lastYearPubs > 0 ? 100 : 0;

    const citesChange = twoYearsAgoCites > 0 
      ? Math.round(((lastYearCites - twoYearsAgoCites) / twoYearsAgoCites) * 100)
      : lastYearCites > 0 ? 100 : 0;

    return { pubsChange, citesChange };
  }, [researcherData]);

  if (isLoading) {
    return (
      <section className="py-6 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-32 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!researcherData?.researcher) {
    return null;
  }

  const stats = researcherData?.researcher;
  const summaryStats = stats?.summary_stats ?? { h_index: 0, i10_index: 0 };
  const worksCount = stats?.works_count ?? 0;
  const citationCount = stats?.cited_by_count ?? 0;

  const TrendIndicator = ({ value, label }: { value: number; label: string }) => {
    if (value === 0) return null;
    
    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-600" : "text-red-500";
    
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs ${colorClass}`} title={`${label} YoY change`}>
        <Icon className="w-3 h-3" />
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <section className="py-4 md:py-6 -mt-4 md:-mt-6" data-testid="section-stats">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact horizontal stat row */}
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6">
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-primary" data-testid="stat-publications">
                  <AnimatedCounter end={worksCount} />
                </div>
                <div className="text-xs text-muted-foreground">Publications</div>
              </div>
              <TrendIndicator value={trends.pubsChange} label="Publications" />
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-accent" data-testid="stat-citations">
                  <AnimatedCounter end={citationCount} />
                </div>
                <div className="text-xs text-muted-foreground">Citations</div>
              </div>
              <TrendIndicator value={trends.citesChange} label="Citations" />
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
            <CardContent className="px-4 py-3 text-center">
              <div className="text-xl md:text-2xl font-bold text-primary" data-testid="stat-h-index">
                <AnimatedCounter end={summaryStats.h_index ?? 0} />
              </div>
              <div className="text-xs text-muted-foreground">h-index</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
            <CardContent className="px-4 py-3 text-center">
              <div className="text-xl md:text-2xl font-bold text-accent" data-testid="stat-i10-index">
                <AnimatedCounter end={summaryStats.i10_index ?? 0} />
              </div>
              <div className="text-xs text-muted-foreground">i10-index</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
