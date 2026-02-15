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
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    { 
      label: "Citations", 
      value: citationCount, 
      icon: Quote,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    { 
      label: "h-index", 
      value: summaryStats.h_index ?? 0, 
      icon: Hash,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    { 
      label: "i10-index", 
      value: summaryStats.i10_index ?? 0, 
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
    },
  ];

  return (
    <section className="py-8 -mt-6 md:-mt-8" data-testid="section-stats">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div 
              key={item.label}
              className={`${item.bgColor} ${item.borderColor} border rounded-xl p-5 text-center transition-shadow hover:shadow-md`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${item.bgColor} mb-3`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${item.color}`} data-testid={`stat-${item.label.toLowerCase().replace('-', '-')}`}>
                <AnimatedCounter end={item.value} />
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
