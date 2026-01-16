import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { TrendingUp, BarChart3, Award } from "lucide-react";

interface PublicationAnalyticsProps {
  openalexId: string;
  researcherData?: ResearcherData | null;
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

// Enhanced color palette - vibrant, non-black colors
const CHART_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
];

export default function PublicationAnalytics({ openalexId, researcherData: propResearcherData }: PublicationAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("growth");
  const [range, setRange] = useState<"5y" | "10y" | "all">("all");

  const { data: fetchedData, isLoading } = useQuery<ResearcherData | null>({
    queryKey: [`/api/researcher/${openalexId}/data`],
    retry: false,
    enabled: !propResearcherData,
  });

  const researcherData = propResearcherData || fetchedData;

  // Data processing and chart calculations
  const chartData = useMemo(() => {
    if (!researcherData?.publications || researcherData.publications.length === 0) {
      return {
        cumulativeData: [],
        cumulativeCitationsData: [],
        yearlyData: [],
        topicsData: [],
        typesData: [],
        citationData: [],
        totalPublications: 0,
        totalCitations: 0,
        avgCitations: 0,
        yearRange: { start: 0, end: 0 },
        mostProductiveYear: { year: 0, count: 0 },
        highestCitationYear: { year: 0, count: 0 },
        researchAreasCount: 0,
      };
    }

    const publications = researcherData.publications;
    const currentYear = new Date().getFullYear();

    // Calculate cumulative publications by year
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

    // Create cumulative publications, cumulative citations, and yearly data
    const cumulativeData = [];
    const cumulativeCitationsData = [];
    const yearlyData = [];
    let cumulative = 0;
    let cumulativeCitations = 0;

    for (let year = startYear; year <= endYear; year++) {
      const count = yearCounts[year] || 0;
      cumulative += count;
      const citations = yearCitations[year] || 0;
      cumulativeCitations += citations;

      cumulativeData.push({
        year,
        cumulative,
        publications: count,
      });

      cumulativeCitationsData.push({
        year,
        cumulative: cumulativeCitations,
        citations,
      });

      if (count > 0) {
        yearlyData.push({
          year,
          publications: count,
          citations,
          avgCitations: (citations / count).toFixed(1),
        });
      }
    }

    // Find most productive year
    const mostProductiveYear = yearlyData.reduce((max, curr) => 
      curr.publications > max.count ? { year: curr.year, count: curr.publications } : max
    , { year: 0, count: 0 });

    // Find highest citation year
    const highestCitationYear = yearlyData.reduce((max, curr) => 
      curr.citations > max.count ? { year: curr.year, count: curr.citations } : max
    , { year: 0, count: 0 });

    // Count unique research topics
    const topicSet = new Set<string>();
    publications.forEach(pub => {
      if (pub.topics && Array.isArray(pub.topics)) {
        pub.topics.forEach(topic => {
          if (typeof topic === 'string') {
            topicSet.add(topic);
          }
        });
      }
    });

    // Process publication types using the publicationType field
    const typeCountsMap: { [key: string]: number } = {};

    publications.forEach(pub => {
      const pubType = pub.publicationType || "Unknown";
      // Capitalize the first letter of each word for display
      const displayType = pubType.charAt(0).toUpperCase() + pubType.slice(1);
      typeCountsMap[displayType] = (typeCountsMap[displayType] || 0) + 1;
    });

    const typesData = Object.entries(typeCountsMap)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([type, count]) => ({
        type,
        count,
        percentage: ((count / publications.length) * 100).toFixed(1),
      }));

    // Citation impact data
    const citationData = yearlyData.map(d => ({
      year: d.year,
      publications: d.publications,
      citations: d.citations,
    }));

    return {
      cumulativeData,
      cumulativeCitationsData,
      yearlyData,
      topicsData: [],
      typesData,
      citationData,
      totalPublications: publications.length,
      totalCitations,
      avgCitations: totalCitations / publications.length,
      yearRange: { start: startYear, end: endYear },
      mostProductiveYear,
      highestCitationYear,
      researchAreasCount: topicSet.size,
    };
  }, [researcherData]);

  const rangeStart = useMemo(() => {
    if (range === "all") return chartData.yearRange.start;
    const span = range === "5y" ? 4 : 9;
    return Math.max(chartData.yearRange.end - span, chartData.yearRange.start);
  }, [chartData.yearRange.end, chartData.yearRange.start, range]);

  const filteredData = useMemo(() => {
    const byYear = (d: { year: number }) => d.year >= rangeStart;
    return {
      cumulativeData: chartData.cumulativeData.filter(byYear),
      cumulativeCitationsData: chartData.cumulativeCitationsData.filter(byYear),
      yearlyData: chartData.yearlyData.filter(byYear),
      citationData: chartData.citationData.filter(byYear),
      yearRange: { start: rangeStart, end: chartData.yearRange.end },
    };
  }, [chartData, rangeStart]);

  if (isLoading) {
    return (
      <section className="py-16" data-testid="section-analytics-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (chartData.totalPublications === 0) {
    return (
      <section className="py-16" data-testid="section-analytics-empty">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Publication Analytics</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive insights into research output and impact.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">No Publication Data Available</h3>
              <p className="text-muted-foreground">
                Analytics will appear here once publication data is synchronized from OpenAlex.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section id="analytics" className="py-8 md:py-16" data-testid="section-analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with summary stats */}
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4">Publication Analytics</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-4 md:mb-8 px-4">
            Comprehensive insights into research output and impact patterns over time.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 p-1">
            {[
              { label: "5y", value: "5y" as const },
              { label: "10y", value: "10y" as const },
              { label: "All", value: "all" as const },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${
                  range === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-range-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3" data-testid="tabs-analytics">
            <TabsTrigger value="growth" className="text-xs sm:text-sm" data-testid="tab-growth">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Growth</span>
            </TabsTrigger>
            <TabsTrigger value="types" className="text-xs sm:text-sm" data-testid="tab-types">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Types</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="text-xs sm:text-sm" data-testid="tab-impact">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Impact</span>
            </TabsTrigger>
          </TabsList>

          {/* Growth Tab */}
          <TabsContent value="growth" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <Card data-testid="card-cumulative-chart">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="hidden xs:inline">Cumulative</span> Publications
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {filteredData.yearRange.start}-{filteredData.yearRange.end}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
                    <AreaChart data={filteredData.cumulativeData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(-2)} />
                      <YAxis tick={{ fontSize: 10 }} width={30} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        name="Total Publications"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorCumulative)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card data-testid="card-cumulative-citations-chart">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    <span className="hidden xs:inline">Cumulative</span> Citations
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {chartData.totalCitations.toLocaleString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
                    <AreaChart data={filteredData.cumulativeCitationsData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCumulativeCitations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(-2)} />
                      <YAxis tick={{ fontSize: 10 }} width={30} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        name="Total Citations"
                        stroke="hsl(var(--accent))"
                        fill="url(#colorCumulativeCitations)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Types Tab */}
          <TabsContent value="types">
            <Card data-testid="card-types-chart">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Publication Types
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Bar Chart instead of Pie */}
                  <ResponsiveContainer width="100%" height={250} className="sm:!h-[350px]">
                    <BarChart data={chartData.typesData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="type" width={80} tick={{ fontSize: 10 }} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + '...' : v} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartData.typesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Legend with Colors - compact on mobile */}
                  <div className={`gap-2 sm:gap-3 ${chartData.typesData.length > 4 ? 'grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2' : 'flex flex-col'} content-center`}>
                    {chartData.typesData.map((item, index) => (
                      <div key={item.type} className="flex items-center justify-between p-2 sm:p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="font-medium text-xs sm:text-sm truncate">{item.type}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-1">
                          <div className="font-bold text-sm sm:text-lg">{item.count}</div>
                          <div className="text-xs text-muted-foreground hidden sm:block">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impact Tab */}
          <TabsContent value="impact">
            <Card data-testid="card-impact-chart">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  Citation Impact Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ResponsiveContainer width="100%" height={280} className="sm:!h-[400px]">
                  <ComposedChart data={filteredData.citationData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(-2)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={30} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar 
                      yAxisId="left" 
                      dataKey="publications" 
                      fill="hsl(var(--primary))" 
                      opacity={0.5}
                      radius={[4, 4, 0, 0]}
                      name="Publications"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="citations"
                      stroke="hsl(var(--accent))"
                      fill="url(#colorCitations)"
                      strokeWidth={2}
                      name="Citations"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Key Metrics Cards - Below Visualizations */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 max-w-6xl mx-auto mt-6 sm:mt-12">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3 sm:p-6 text-center">
              <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">
                {chartData.mostProductiveYear.count}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">Most Productive</div>
              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {chartData.mostProductiveYear.year || 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-3 sm:p-6 text-center">
              <div className="text-xl sm:text-3xl font-bold text-accent mb-1 sm:mb-2">
                {chartData.highestCitationYear.count}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">Top Citations</div>
              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {chartData.highestCitationYear.year || 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3 sm:p-6 text-center">
              <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">
                {chartData.researchAreasCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">Research Areas</div>
              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Distinct topics
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-3 sm:p-6 text-center">
              <div className="text-xl sm:text-3xl font-bold text-accent mb-1 sm:mb-2">
                {chartData.avgCitations.toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">Avg Citations</div>
              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Per publication
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-6 text-center">
              <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">
                {chartData.yearRange.end - chartData.yearRange.start + 1}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground font-medium">Active Years</div>
              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {chartData.yearRange.start} - {chartData.yearRange.end}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
