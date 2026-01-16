import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import StatsOverview from "@/components/StatsOverview";
import PublicationAnalytics from "@/components/PublicationAnalytics";
import ResearchTopics from "@/components/ResearchTopics";
import Publications from "@/components/Publications";
import SEO from "@/components/SEO";
import MobileBottomNav from "@/components/MobileBottomNav";
import CollapsibleSection from "@/components/CollapsibleSection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Building2, Globe, Linkedin, BarChart3, Lightbulb, FileText, User, ExternalLink, Download, Mail } from "lucide-react";
import { SiOrcid, SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function TenantProfilePage() {
  const { data: profileData, isLoading, error } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    lastSynced: string;
    tenant: any;
    isPreview?: boolean;
  } | null>({
    queryKey: ['/api/profile'],
    retry: false,
  });

  const profile = profileData?.profile;
  const researcher = profileData?.researcher;
  const tenant = profileData?.tenant;
  const openalexId = profile?.openalexId || '';
  
  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : 'Research Profile';
  const seoDescription = profile?.bio || (researcher ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations` : 'Research Profile');
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const profileImage = profile?.profileImageUrl || "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500";

  const structuredData = useMemo(() => {
    if (!profile) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.displayName || researcher?.display_name,
      "description": profile.bio || `Researcher with ${researcher?.works_count || 0} publications`,
      "jobTitle": profile.title,
      "url": profileUrl,
      "image": profileImage,
    };
  }, [profile, researcher, profileUrl, profileImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Loading..." />
        <section className="hero-banner-compact py-8 md:py-12 relative">
          <div className="hero-pattern"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/20 animate-pulse flex-shrink-0"></div>
              <div className="text-center md:text-left space-y-2 flex-1">
                <div className="h-7 md:h-9 bg-white/20 rounded-lg animate-pulse w-48 md:w-64 mx-auto md:mx-0"></div>
                <div className="h-5 bg-white/15 rounded-lg animate-pulse w-36 md:w-48 mx-auto md:mx-0"></div>
                <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-white/70 text-xs font-medium">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !profileData || !profileData.profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Profile" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Profile Not Configured</h1>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  This researcher profile hasn't been set up yet. Please log in to configure your OpenAlex ID.
                </p>
                <a 
                  href="/dashboard/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Log In to Configure
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="page-tenant-profile">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        image={profileImage}
        url={profileUrl}
        author={profile?.displayName || researcher?.display_name || 'Researcher'}
        type="profile"
        structuredData={structuredData || undefined}
      />
      <Navigation researcherName={profile?.displayName || researcher?.display_name || 'Researcher'} />
      
      {/* Compact Hero Section */}
      <section id="overview" className="hero-banner-compact py-6 md:py-10 relative">
        <div className="hero-pattern"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-white">
            {/* Profile Image - Compact */}
            <div className="flex-shrink-0">
              {profile?.profileImageUrl ? (
                <img 
                  src={profile.profileImageUrl} 
                  alt="Professional portrait" 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover border-3 border-white/30 shadow-xl"
                  data-testid="img-profile-photo"
                />
              ) : (
                <div 
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-3 border-white/30 shadow-xl flex items-center justify-center bg-gradient-to-br ${getAvatarColor(profile?.displayName || researcher?.display_name || '')}`}
                  data-testid="img-profile-photo"
                >
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {getInitials(profile?.displayName || researcher?.display_name || '')}
                  </span>
                </div>
              )}
            </div>
            
            {/* Name & Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1" data-testid="text-display-name">
                  {profile?.displayName || researcher?.display_name || 'Researcher Profile'}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/90" data-testid="text-title">
                  {profile?.title || 'Research Professional'}
                </p>
              </div>
              
              {/* Affiliation */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px] md:max-w-none" data-testid="text-affiliation">
                    {profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || 'Institution'}
                  </span>
                </span>
              </div>
              
              {/* Social Links - Icon buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {profile?.orcidUrl && (
                  <a href={profile.orcidUrl} target="_blank" rel="noopener noreferrer" 
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="ORCID">
                    <SiOrcid className="w-4 h-4" />
                  </a>
                )}
                {profile?.googleScholarUrl && (
                  <a href={profile.googleScholarUrl} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Google Scholar">
                    <SiGooglescholar className="w-4 h-4" />
                  </a>
                )}
                {profile?.researchGateUrl && (
                  <a href={profile.researchGateUrl} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="ResearchGate">
                    <SiResearchgate className="w-4 h-4" />
                  </a>
                )}
                {profile?.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile?.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Website">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {profile?.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="X (Twitter)">
                    <FaXTwitter className="w-4 h-4" />
                  </a>
                )}
                
                {/* Contact button */}
                {(profile?.contactEmail || profile?.email) && (
                  <a 
                    href={`mailto:${profile.contactEmail || profile.email}`}
                    className="ml-1 inline-flex items-center gap-1.5 bg-white text-primary px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-white/90 transition-colors"
                    data-testid="link-contact"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Contact
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Bio, CV, OpenAlex link */}
      {(profile?.bio || profile?.cvUrl || openalexId) && (
        <section className="py-6 md:py-10 bg-muted/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-10">
              {/* Bio */}
              {profile?.bio && (
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h2>
                  <p className="text-sm md:text-base text-foreground leading-relaxed" data-testid="text-bio">
                    {profile.bio}
                  </p>
                </div>
              )}
              
              {/* Quick Links */}
              <div className="flex flex-wrap md:flex-col gap-2 md:gap-3">
                {profile?.cvUrl && profile.cvUrl !== '#cv-placeholder' && (
                  <a 
                    href={profile.cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    data-testid="link-cv"
                  >
                    <Download className="w-4 h-4" />
                    Download CV
                  </a>
                )}
                {openalexId && (
                  <a 
                    href={`https://openalex.org/authors/${openalexId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    data-testid="link-openalex"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on OpenAlex
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Overview - Always visible */}
      <StatsOverview openalexId={openalexId} />
      
      {/* Analytics - Collapsible, collapsed on mobile by default */}
      <CollapsibleSection
        id="analytics"
        title="Publication Analytics"
        icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-background"
      >
        <PublicationAnalytics openalexId={openalexId} researcherData={profileData} inline />
      </CollapsibleSection>

      {/* Research Topics - Collapsible */}
      <CollapsibleSection
        id="research"
        title="Research Areas"
        icon={<Lightbulb className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-muted"
        badge={
          profileData?.topics?.length ? (
            <Badge variant="secondary" className="ml-2">
              {profileData.topics.length}
            </Badge>
          ) : null
        }
      >
        <ResearchTopics openalexId={openalexId} inline />
      </CollapsibleSection>

      {/* Publications - Collapsible */}
      <CollapsibleSection
        id="publications"
        title="Publications"
        icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-background"
        badge={
          researcher?.works_count ? (
            <Badge variant="secondary" className="ml-2">
              {researcher.works_count}
            </Badge>
          ) : null
        }
      >
        <Publications openalexId={openalexId} inline />
      </CollapsibleSection>

      <footer className="bg-gradient-to-br from-card to-muted/20 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground/70 text-sm">
              © {new Date().getFullYear()} {tenant?.name || 'ScholarName'}. Powered by ScholarName.
            </p>
            {profileData?.lastSynced && (
              <p className="text-xs text-muted-foreground/60">
                Last updated: {new Date(profileData.lastSynced).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
