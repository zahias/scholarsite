import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Publications from "@/components/Publications";

export default function ResearcherPage() {
  const { id } = useParams();
  
  const { data: researcherData, isLoading, error } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
  } | null>({
    queryKey: [`/api/researcher/${id}/data`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        {/* Navigation Skeleton */}
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="flex items-center">
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </nav>

        {/* Header Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-4" />
                  <Skeleton className="h-5 w-48 mb-6" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="mt-6 lg:mt-0">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Publications Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-64 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !researcherData || !researcherData.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="font-semibold text-xl text-primary">Research Profile Platform</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card>
            <CardContent className="pt-6 text-center">
              <h1 className="text-3xl font-bold mb-4">Researcher Not Found</h1>
              <p className="text-muted-foreground mb-8">
                The researcher profile you're looking for doesn't exist or isn't public yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { profile, researcher } = researcherData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10" data-testid="page-researcher">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-semibold text-xl text-primary">Research Profile Platform</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Researcher Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="overflow-hidden shadow-2xl bg-gradient-to-r from-primary/5 via-background to-accent/5 border-2">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="text-researcher-name">
                    {profile.displayName || researcher?.display_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Verified Researcher</span>
                  </div>
                </div>
                
                {profile.title && (
                  <p className="text-xl text-muted-foreground mb-6" data-testid="text-researcher-title">
                    {profile.title}
                  </p>
                )}
                
                {profile.bio && (
                  <p className="text-card-foreground/80 leading-relaxed max-w-3xl" data-testid="text-researcher-bio">
                    {profile.bio}
                  </p>
                )}
                
                {profile.currentAffiliation && (
                  <div className="mt-6 flex items-center gap-2 text-muted-foreground">
                    <i className="fas fa-university"></i>
                    <span data-testid="text-current-affiliation">
                      {profile.currentPosition && `${profile.currentPosition} at `}
                      {profile.currentAffiliationUrl ? (
                        <a 
                          href={profile.currentAffiliationUrl} 
                          target="_blank" 
                          className="text-primary hover:underline"
                        >
                          {profile.currentAffiliation}
                        </a>
                      ) : (
                        profile.currentAffiliation
                      )}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 lg:mt-0 flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <i className="fas fa-user text-4xl text-primary"></i>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <div className="text-2xl font-bold text-primary" data-testid="stat-publication-count">
                  {researcherData.publications?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Publications</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <div className="text-2xl font-bold text-accent" data-testid="stat-citation-count">
                    {researcher?.cited_by_count?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Citations</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <div className="text-2xl font-bold text-primary" data-testid="stat-h-index">
                  {researcher?.summary_stats?.h_index || 0}
                </div>
                <div className="text-sm text-muted-foreground">H-Index</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publications Section */}
      <Publications openalexId={profile.openalexId} />
    </div>
  );
}