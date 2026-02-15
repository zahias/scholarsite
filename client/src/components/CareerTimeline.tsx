import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { TrendingUp, Calendar, Award, Sparkles } from "lucide-react";

interface CareerTimelineProps {
  openalexId: string;
  researcherData?: ResearcherData | null;
  inline?: boolean;
}

interface CountByYear {
  year: number;
  works_count: number;
  cited_by_count: number;
}

interface ResearcherData {
  profile: any;
  researcher: any;
  topics: any[];
  publications: any[];
  affiliations: any[];
  lastSynced: string;
}

// Theme-aware colors — read from CSS custom properties at render time
function getThemeColors() {
  if (typeof window === 'undefined') return { primary: '#1e3a5f', accent: '#c9a227', primaryLight: '#2a4d6e' };
  const styles = getComputedStyle(document.documentElement);
  return {
    primary: styles.getPropertyValue('--theme-primary').trim() || '#1e3a5f',
    accent: styles.getPropertyValue('--theme-accent').trim() || '#c9a227',
    primaryLight: styles.getPropertyValue('--theme-primary').trim() || '#1e3a5f',
  };
}

interface MilestoneEvent {
  year: number;
  type: 'first_publication' | 'peak_year' | 'citation_milestone' | 'prolific_year';
  label: string;
  value?: number;
}

export default function CareerTimeline({ openalexId, researcherData: propResearcherData, inline = false }: CareerTimelineProps) {
  const themeColors = useMemo(() => getThemeColors(), []);
  
  const { data: fetchedData, isLoading } = useQuery<ResearcherData | null>({
    queryKey: [`/api/researcher/${openalexId}/data`],
    retry: false,
    enabled: !propResearcherData,
  });

  const researcherData = propResearcherData || fetchedData;

  // Process counts_by_year data from OpenAlex
  const timelineData = useMemo(() => {
    const researcher = researcherData?.researcher;
    const countsByYear: CountByYear[] = researcher?.counts_by_year || [];
    
    if (countsByYear.length === 0) {
      // Fallback: compute from publications if counts_by_year not available
      const publications = researcherData?.publications || [];
      if (publications.length === 0) {
        return {
          data: [],
          milestones: [],
          careerStart: null,
          peakYear: null,
          totalYears: 0,
          avgPubsPerYear: 0,
        };
      }

      // Build year counts from publications
      const yearCounts: { [year: number]: { works: number; citations: number } } = {};
      publications.forEach((pub: any) => {
        const year = pub.publicationYear || new Date().getFullYear();
        if (!yearCounts[year]) {
          yearCounts[year] = { works: 0, citations: 0 };
        }
        yearCounts[year].works += 1;
        yearCounts[year].citations += pub.citationCount || 0;
      });

      const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
      const startYear = Math.min(...years);
      const endYear = Math.max(...years);

      // Build timeline data
      const data = [];
      let cumulativeWorks = 0;
      let cumulativeCitations = 0;

      for (let year = startYear; year <= endYear; year++) {
        const yearData = yearCounts[year] || { works: 0, citations: 0 };
        cumulativeWorks += yearData.works;
        cumulativeCitations += yearData.citations;
        
        data.push({
          year,
          publications: yearData.works,
          citations: yearData.citations,
          cumulativePublications: cumulativeWorks,
          cumulativeCitations: cumulativeCitations,
        });
      }

      return processTimelineData(data, startYear, endYear);
    }

    // Use OpenAlex counts_by_year - sort by year ascending
    const sortedCounts = [...countsByYear].sort((a, b) => a.year - b.year);
    const startYear = sortedCounts[0]?.year;
    const endYear = sortedCounts[sortedCounts.length - 1]?.year;

    // Build timeline with cumulative values
    const data = [];
    let cumulativeWorks = 0;
    let cumulativeCitations = 0;

    for (let year = startYear; year <= endYear; year++) {
      const yearData = sortedCounts.find(c => c.year === year);
      const works = yearData?.works_count || 0;
      const citations = yearData?.cited_by_count || 0;
      
      cumulativeWorks += works;
      cumulativeCitations += citations;
      
      data.push({
        year,
        publications: works,
        citations: citations,
        cumulativePublications: cumulativeWorks,
        cumulativeCitations: cumulativeCitations,
      });
    }

    return processTimelineData(data, startYear, endYear);
  }, [researcherData]);

  // Helper function to process timeline data and find milestones
  function processTimelineData(data: any[], startYear: number, endYear: number) {
    if (data.length === 0) {
      return {
        data: [],
        milestones: [],
        careerStart: null,
        peakYear: null,
        totalYears: 0,
        avgPubsPerYear: 0,
      };
    }

    // Find milestones
    const milestones: MilestoneEvent[] = [];
    
    // First publication year
    const firstPubYear = data.find(d => d.publications > 0);
    if (firstPubYear) {
      milestones.push({
        year: firstPubYear.year,
        type: 'first_publication',
        label: 'Career Start',
      });
    }

    // Peak publication year
    const peakYear = data.reduce((max, d) => 
      d.publications > (max?.publications || 0) ? d : max, data[0]);
    if (peakYear && peakYear.publications > 0) {
      milestones.push({
        year: peakYear.year,
        type: 'peak_year',
        label: `Peak Year (${peakYear.publications} pubs)`,
        value: peakYear.publications,
      });
    }

    // Citation milestones (100, 500, 1000, 5000)
    const citationThresholds = [100, 500, 1000, 5000, 10000];
    citationThresholds.forEach(threshold => {
      const crossedYear = data.find(d => d.cumulativeCitations >= threshold);
      const prevYear = data.find(d => d.year === crossedYear?.year - 1);
      if (crossedYear && (!prevYear || prevYear.cumulativeCitations < threshold)) {
        milestones.push({
          year: crossedYear.year,
          type: 'citation_milestone',
          label: `${threshold.toLocaleString()} Citations`,
          value: threshold,
        });
      }
    });

    // Calculate stats
    const totalPubs = data.reduce((sum, d) => sum + d.publications, 0);
    const totalYears = endYear - startYear + 1;
    const avgPubsPerYear = totalYears > 0 ? (totalPubs / totalYears).toFixed(1) : 0;

    return {
      data,
      milestones: milestones.slice(0, 4), // Limit to 4 milestones
      careerStart: startYear,
      peakYear: peakYear?.year,
      totalYears,
      avgPubsPerYear,
    };
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const colors = themeColors;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }}></span>
              <span className="text-muted-foreground">Publications:</span>
              <span className="font-medium">{data.publications}</span>
              <span className="text-xs text-muted-foreground">
                (total: {data.cumulativePublications})
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.accent }}></span>
              <span className="text-muted-foreground">Citations:</span>
              <span className="font-medium">{data.citations.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">
                (total: {data.cumulativeCitations.toLocaleString()})
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div data-testid="section-timeline-loading">
        <div className="flex items-center gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    );
  }

  if (timelineData.data.length === 0) {
    return (
      <div data-testid="section-timeline-empty">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-semibold mb-2">No Timeline Data</h3>
            <p className="text-muted-foreground text-sm">
              Career timeline will appear once publication data is available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="section-career-timeline" className="space-y-6">
      {/* Milestone Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Career Span */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Career Span</span>
            </div>
            <p className="text-2xl font-bold text-primary">{timelineData.totalYears} years</p>
            <p className="text-xs text-muted-foreground mt-1">
              {timelineData.careerStart} – {timelineData.data[timelineData.data.length - 1]?.year}
            </p>
          </CardContent>
        </Card>

        {/* Peak Year */}
        {timelineData.peakYear && (
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Peak Year</span>
              </div>
              <p className="text-2xl font-bold text-accent">{timelineData.peakYear}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Most productive year
              </p>
            </CardContent>
          </Card>
        )}

        {/* Avg Publications/Year */}
        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg/Year</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{timelineData.avgPubsPerYear}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Publications per year
            </p>
          </CardContent>
        </Card>

        {/* Key Milestone */}
        {timelineData.milestones.length > 1 && (
          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Milestone</span>
              </div>
              <p className="text-lg font-bold text-purple-600 leading-tight">
                {timelineData.milestones[timelineData.milestones.length - 1]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                in {timelineData.milestones[timelineData.milestones.length - 1]?.year}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Timeline Chart */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="h-[280px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData.data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="pubGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="citeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColors.accent} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={themeColors.accent} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                  width={35}
                  label={{ 
                    value: 'Publications', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 10, fill: themeColors.primary }
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                  width={45}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  label={{ 
                    value: 'Citations', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { fontSize: 10, fill: themeColors.accent }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
                
                {/* Reference lines for milestones */}
                {timelineData.milestones
                  .filter(m => m.type === 'first_publication' || m.type === 'peak_year')
                  .map((milestone, idx) => (
                    <ReferenceLine
                      key={idx}
                      x={milestone.year}
                      yAxisId="left"
                      stroke={milestone.type === 'first_publication' ? '#22c55e' : '#f59e0b'}
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      label={{
                        value: milestone.type === 'first_publication' ? '🚀' : '⭐',
                        position: 'top',
                        fontSize: 14,
                      }}
                    />
                  ))}
                
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="publications"
                  name="Publications"
                  stroke={themeColors.primary}
                  strokeWidth={2}
                  fill="url(#pubGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: themeColors.primary }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="citations"
                  name="Citations"
                  stroke={themeColors.accent}
                  strokeWidth={2}
                  fill="url(#citeGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: themeColors.accent }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Legend/Note */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              🚀 Career start • ⭐ Peak productivity year • Data from OpenAlex
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
