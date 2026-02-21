import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Network, BookOpen, Lightbulb, TrendingUp, Users } from "lucide-react";
import CareerTimeline from "./CareerTimeline";
import ResearchTopics from "./ResearchTopics";

interface ResearchInsightsProps {
    openalexId: string;
    researcherData: any;
    researcherName: string;
}

// Theme-aware colors
function getThemeColors() {
    if (typeof window === 'undefined') return { primary: '#1e3a5f', accent: '#c9a227', sage: '#7AA874', platinum: '#E4E9F7' };
    const styles = getComputedStyle(document.documentElement);
    return {
        primary: styles.getPropertyValue('--theme-primary').trim() || '#0B1F3A',
        accent: styles.getPropertyValue('--theme-accent').trim() || '#F2994A',
        sage: styles.getPropertyValue('--theme-sage').trim() || '#7AA874',
        platinum: styles.getPropertyValue('--theme-platinum').trim() || '#E4E9F7',
    };
}

// ----------------------------------------------------------------------
// Collaborator Network Sub-component
// ----------------------------------------------------------------------
function CollaboratorNetwork({ publications, researcherName }: { publications: any[], researcherName: string }) {
    const themeColors = useMemo(() => getThemeColors(), []);

    const collaboratorData = useMemo(() => {
        const authorCounts: { [name: string]: { count: number; name: string } } = {};
        const normalizedResearcherName = researcherName.toLowerCase().trim();

        publications.forEach(pub => {
            if (pub.authorNames) {
                // authorNames is usually a comma-separated string
                const authors = pub.authorNames.split(',').map((a: string) => a.trim());
                authors.forEach((author: string) => {
                    if (!author) return;
                    const normalizedAuthor = author.toLowerCase();

                    // Skip the researcher themselves (using basic string matching)
                    if (normalizedAuthor.includes(normalizedResearcherName) || normalizedResearcherName.includes(normalizedAuthor)) {
                        return;
                    }

                    if (!authorCounts[normalizedAuthor]) {
                        authorCounts[normalizedAuthor] = { count: 0, name: author };
                    }
                    authorCounts[normalizedAuthor].count += 1;
                });
            }
        });

        return Object.values(authorCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 collaborators
    }, [publications, researcherName]);

    if (collaboratorData.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Not enough co-authorship data available.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-midnight/60 backdrop-blur-xl border border-platinum dark:border-white/20 rounded-lg p-3 shadow-xl">
                    <p className="font-bold text-sm text-midnight dark:text-white">{payload[0].payload.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-semibold text-warm">{payload[0].value}</span> co-authored publications
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mx-auto mb-6">
                <h3 className="text-xl font-serif font-bold text-midnight dark:text-white flex items-center justify-center gap-2">
                    <Network className="w-5 h-5 text-warm" /> Top Collaborators
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Frequent co-authors across {publications.length} publications
                </p>
            </div>

            <Card className="bg-white/50 dark:bg-midnight/20 backdrop-blur-sm border-platinum dark:border-white/10 shadow-none">
                <CardContent className="p-4 md:p-6">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={collaboratorData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} stroke="currentColor" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: 'currentColor' }}
                                    width={100}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                    {collaboratorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? themeColors.accent : themeColors.primary} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ----------------------------------------------------------------------
// Publication Venues Sub-component
// ----------------------------------------------------------------------
function PublicationVenues({ publications }: { publications: any[] }) {
    const themeColors = useMemo(() => getThemeColors(), []);

    const venueData = useMemo(() => {
        const venueCounts: { [name: string]: { count: number; name: string } } = {};

        publications.forEach(pub => {
            const journal = pub.journal?.trim();
            if (journal) {
                if (!venueCounts[journal]) {
                    venueCounts[journal] = { count: 0, name: journal };
                }
                venueCounts[journal].count += 1;
            }
        });

        return Object.values(venueCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8); // Top 8 venues
    }, [publications]);

    if (venueData.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Not enough venue data available.</p>
            </div>
        );
    }

    const COLORS = [
        themeColors.primary,
        themeColors.accent,
        themeColors.sage,
        '#6b21a8',
        '#0d9488',
        '#e11d48',
        '#3b82f6',
        '#f59e0b'
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-midnight/60 backdrop-blur-xl border border-platinum dark:border-white/20 rounded-lg p-3 shadow-xl max-w-[250px] whitespace-normal">
                    <p className="font-bold text-sm text-midnight dark:text-white leading-tight mb-1">
                        {payload[0].payload.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-semibold" style={{ color: payload[0].payload.fill }}>{payload[0].value}</span> publications
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mx-auto mb-6">
                <h3 className="text-xl font-serif font-bold text-midnight dark:text-white flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5 text-sage" /> Top Venues
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Most frequent journals and conferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={venueData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                stroke="none"
                            >
                                {venueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                    {venueData.map((venue, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate" title={venue.name}>
                                    {venue.name}
                                </p>
                            </div>
                            <div className="text-sm font-bold text-muted-foreground mx-2">
                                {venue.count}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Research Insights Component
// ----------------------------------------------------------------------
export default function ResearchInsights({ openalexId, researcherData, researcherName }: ResearchInsightsProps) {
    return (
        <section id="insights" className="py-8 md:py-16 bg-academic-motif relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-serif font-bold text-midnight dark:text-white mb-3">Research Insights</h2>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                        Explore the trajectory, collaborations, and publishing patterns that define this research portfolio.
                    </p>
                </div>

                <div className="bg-white/70 dark:bg-midnight/30 backdrop-blur-xl border border-platinum dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
                    <Tabs defaultValue="trajectory" className="w-full">

                        <div className="bg-muted/30 border-b border-platinum dark:border-white/10 p-2 sm:p-4 pb-0 overflow-x-auto">
                            <TabsList className="bg-transparent space-x-2 h-auto p-0 min-w-max">
                                <TabsTrigger
                                    value="trajectory"
                                    className="data-[state=active]:bg-white data-[state=active]:dark:bg-midnight/80 data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-warm px-6 py-3 text-sm font-medium transition-all"
                                >
                                    <TrendingUp className="w-4 h-4 mr-2" /> Journey
                                </TabsTrigger>
                                <TabsTrigger
                                    value="topics"
                                    className="data-[state=active]:bg-white data-[state=active]:dark:bg-midnight/80 data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3 text-sm font-medium transition-all"
                                >
                                    <Lightbulb className="w-4 h-4 mr-2" /> Topics
                                </TabsTrigger>
                                <TabsTrigger
                                    value="network"
                                    className="data-[state=active]:bg-white data-[state=active]:dark:bg-midnight/80 data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent px-6 py-3 text-sm font-medium transition-all"
                                >
                                    <Network className="w-4 h-4 mr-2" /> Network
                                </TabsTrigger>
                                <TabsTrigger
                                    value="venues"
                                    className="data-[state=active]:bg-white data-[state=active]:dark:bg-midnight/80 data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-sage px-6 py-3 text-sm font-medium transition-all"
                                >
                                    <BookOpen className="w-4 h-4 mr-2" /> Venues
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 sm:p-6 md:p-8 min-h-[400px]">
                            <TabsContent value="trajectory" className="mt-0 focus-visible:outline-none">
                                <CareerTimeline openalexId={openalexId} researcherData={researcherData} inline />
                            </TabsContent>

                            <TabsContent value="topics" className="mt-0 focus-visible:outline-none">
                                <ResearchTopics openalexId={openalexId} inline />
                            </TabsContent>

                            <TabsContent value="network" className="mt-0 focus-visible:outline-none">
                                <CollaboratorNetwork publications={researcherData?.publications || []} researcherName={researcherName} />
                            </TabsContent>

                            <TabsContent value="venues" className="mt-0 focus-visible:outline-none">
                                <PublicationVenues publications={researcherData?.publications || []} />
                            </TabsContent>
                        </div>

                    </Tabs>
                </div>
            </div>
        </section>
    );
}
