import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PublicationAnalyticsProps {
  openalexId: string;
  researcherData?: ResearcherData | null;
  inline?: boolean;
}

interface Publication {
  id: string;
  title: string;
  authorNames?: string;
  journal?: string;
  publicationYear?: number;
  citationCount?: number;
  topics?: string[];
  doi?: string;
  isOpenAccess?: boolean;
  publicationType?: string;
}

interface ResearcherData {
  profile: any;
  researcher: any;
  topics: any[];
  publications: Publication[];
  affiliations: any[];
  lastSynced: string;
}

// Brand colors
const BRAND_NAVY = "#0B1F3A";
const BRAND_GOLD = "#D4AF37";

export default function PublicationAnalytics({ openalexId, researcherData: propResearcherData, inline = false }: PublicationAnalyticsProps) {
  const { data: fetchedData, isLoading } = useQuery<ResearcherData | null>({
    queryKey: [`/api/researcher/${openalexId}/data`],
    retry: false,
    enabled: !propResearcherData,
  });

  const researcherData = propResearcherData || fetchedData;

  // Data processing for cumulative impact chart
  const chartData = useMemo(() => {
    if (!researcherData?.publications || researcherData.publications.length === 0) {
      return {
        impactData: [],
        totalPublications: 0,
        totalCitations: 0,
        yearRange: { start: 0, end: 0 },
      };
    }

    const publications = researcherData.publications;
    const currentYear = new Date().getFullYear();

    // Calculate yearly counts
    const yearCounts: { [year: number]: number } = {};
    const yearCitations: { [year: number]: number } = {};
    let totalCitations = 0;

    publications.forEach(pub => {
      const year = pub.publicationYear || currentYear;
      yearCounts[year] = (yearCounts[year] || 0) + 1;
      const citations = pub.citationCount || 0;
      yearCitations[year] = (yearCitations[year] || 0) + citations;
      totalCitations += citations;
    });

    const startYear = Math.min(...Object.keys(yearCounts).map(Number));
    const endYear = Math.max(...Object.keys(yearCounts).map(Number));

    // Create cumulative impact data
    const impactData = [];
    let cumulativePubs = 0;
    let cumulativeCitations = 0;
    let prevCumulativePubs = 0;
    let prevCumulativeCitations = 0;

    for (let year = startYear; year <= endYear; year++) {
      const pubs = yearCounts[year] || 0;
      const cites = yearCitations[year] || 0;
      
      prevCumulativePubs = cumulativePubs;
      prevCumulativeCitations = cumulativeCitations;
      
      cumulativePubs += pubs;
      cumulativeCitations += cites;

      impactData.push({
        year,
        cumulativePubs,
        cumulativeCitations,
        yearlyPubs: pubs,
        yearlyCitations: cites,
        pubsDelta: cumulativePubs - prevCumulativePubs,
        citationsDelta: cumulativeCitations - prevCumulativeCitations,
      });
    }

    return {
      impactData,
      totalPublications: publications.length,
      totalCitations,
      yearRange: { start: startYear, end: endYear },
    };
  }, [researcherData]);

  if (isLoading) {
    return (
      <div data-testid="section-analytics-loading">
        <div className="text-center mb-6">
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (chartData.totalPublications === 0) {
    return (
      <div data-testid="section-analytics-empty">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">No Publication Data</h3>
            <p className="text-muted-foreground text-sm">
              Analytics will appear once publication data is synchronized.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Custom tooltip with year-over-year delta
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
          <p className="font-bold text-base mb-2 border-b pb-1">{label}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between items-center">
              <span style={{ color: BRAND_NAVY }}>Publications:</span>
              <span className="font-semibold">{data?.cumulativePubs?.toLocaleString()}</span>
            </div>
            {data?.pubsDelta > 0 && (
              <div className="text-xs text-muted-foreground pl-2">
                +{data.pubsDelta} this year
              </div>
            )}
            <div className="flex justify-between items-center">
              <span style={{ color: BRAND_GOLD }}>Citations:</span>
              <span className="font-semibold">{data?.cumulativeCitations?.toLocaleString()}</span>
            </div>
            {data?.citationsDelta > 0 && (
              <div className="text-xs text-muted-foreground pl-2">
                +{data.citationsDelta.toLocaleString()} this year
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const content = (
    <div className="space-y-4">
      {!inline && (
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">Research Impact</h2>
          <p className="text-sm text-muted-foreground">
            Cumulative publications and citations over {chartData.yearRange.end - chartData.yearRange.start + 1} years
          </p>
        </div>
      )}
      
      <Card className="overflow-hidden" data-testid="card-impact-chart">
        <CardContent className="p-3 sm:p-6">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart 
              data={chartData.impactData} 
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradientPubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_NAVY} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={BRAND_NAVY} stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 11 }} 
                tickFormatter={(v) => `'${String(v).slice(-2)}`}
              />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11 }} 
                width={45}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                label={{ value: 'Publications', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: BRAND_NAVY } }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 11 }} 
                width={50}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                label={{ value: 'Citations', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: BRAND_GOLD } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
              <Bar 
                yAxisId="left" 
                dataKey="cumulativePubs" 
                fill="url(#gradientPubs)"
                radius={[4, 4, 0, 0]}
                name="Total Publications"
                maxBarSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeCitations"
                stroke={BRAND_GOLD}
                strokeWidth={3}
                dot={{ fill: BRAND_GOLD, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: BRAND_GOLD }}
                name="Total Citations"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  if (inline) {
    return <div data-testid="section-analytics">{content}</div>;
  }

  return (
    <section id="analytics" className="py-6" data-testid="section-analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
}
