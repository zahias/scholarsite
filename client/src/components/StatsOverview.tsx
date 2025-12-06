import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  if (isLoading) {
    return (
      <section className="py-16 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="stat-card">
                <CardContent className="p-6 text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!researcherData?.researcher) {
    return (
      <section className="py-16 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No research data available. Please sync your data in the admin panel.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const stats = researcherData?.researcher;

  return (
    <section className="py-8 md:py-16 -mt-6 md:-mt-10" data-testid="section-stats">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="stat-card bg-card rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2" data-testid="stat-publications">
                <AnimatedCounter end={stats.works_count} />
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Publications</div>
            </CardContent>
          </Card>
          
          <Card className="stat-card bg-card rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1 md:mb-2" data-testid="stat-citations">
                <AnimatedCounter end={stats.cited_by_count} />
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Citations</div>
            </CardContent>
          </Card>
          
          <Card className="stat-card bg-card rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2" data-testid="stat-h-index">
                <AnimatedCounter end={stats.summary_stats.h_index} />
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">h-index</div>
            </CardContent>
          </Card>
          
          <Card className="stat-card bg-card rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1 md:mb-2" data-testid="stat-i10-index">
                <AnimatedCounter end={stats.summary_stats.i10_index} />
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">i10-index</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
