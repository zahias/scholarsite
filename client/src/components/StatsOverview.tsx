import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div style={{ maxWidth: 860, margin: "16px auto 0", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!researcherData?.researcher) return null;

  const stats = researcherData.researcher;
  const summaryStats = stats?.summary_stats ?? { h_index: 0, i10_index: 0 };

  const statItems = [
    { label: "Publications", value: stats?.works_count ?? 0,          icon: BookOpen },
    { label: "Citations",    value: stats?.cited_by_count ?? 0,       icon: Quote    },
    { label: "h-index",      value: summaryStats.h_index ?? 0,        icon: Hash     },
    { label: "i10-index",    value: summaryStats.i10_index ?? 0,      icon: Award    },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "16px auto 0", padding: "0 24px" }} data-testid="section-stats">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="stats-grid">
        {statItems.map((item) => (
          <div
            key={item.label}
            style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(11,31,58,.08)", padding: "18px 20px", textAlign: "center", transition: "transform .2s, box-shadow .2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px -8px rgba(11,31,58,.14)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9, background: "#F0F4F8", marginBottom: 10 }}>
              <item.icon size={16} style={{ color: "#FFC72E" }} />
            </div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 600, color: "#0B1F3A", lineHeight: 1 }} data-testid={`stat-${item.label.toLowerCase().replace(" ", "-")}`}>
              <AnimatedCounter end={item.value} />
            </div>
            <div style={{ fontSize: 11.5, color: "#75777E", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
