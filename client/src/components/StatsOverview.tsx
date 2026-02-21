import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { BookOpen, Quote, Hash, Award } from "lucide-react";
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
      <section className="py-8 -mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
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

  const statItems = [
    {
      label: "Publications",
      value: worksCount,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-100 dark:border-blue-900/30",
    },
    {
      label: "Citations",
      value: citationCount,
      icon: Quote,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-100 dark:border-amber-900/30",
    },
    {
      label: "h-index",
      value: summaryStats.h_index ?? 0,
      icon: Hash,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
    },
    {
      label: "i10-index",
      value: summaryStats.i10_index ?? 0,
      icon: Award,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-100 dark:border-purple-900/30",
    },
  ];

  return (
    <section className="py-8 -mt-6 md:-mt-8 bg-academic-motif relative" data-testid="section-stats">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`bg-white/70 dark:bg-midnight/30 backdrop-blur-xl shadow-xl border-platinum dark:border-white/20 border rounded-xl p-6 text-center transition-all hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted/50 dark:bg-muted/20 mb-4`}>
                <item.icon className={`w-6 h-6 text-midnight dark:text-white`} />
              </div>
              <div className={`text-3xl md:text-4xl font-serif font-bold text-midnight dark:text-white`} data-testid={`stat-${item.label.toLowerCase().replace('-', '-')}`}>
                <AnimatedCounter end={item.value} />
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-2">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
