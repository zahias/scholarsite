import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import StatsOverview from "./StatsOverview";
import PublicationAnalytics from "./PublicationAnalytics";
import CareerTimeline from "./CareerTimeline";
import ResearchTopics from "./ResearchTopics";
import Publications from "./Publications";
import ProfileSections from "./ProfileSections";
import ResearchInsights from "./ResearchInsights";
import SEO from "./SEO";
import MobileBottomNav from "./MobileBottomNav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import ResearchPassport from "./ResearchPassport";
import CollapsibleSection from "./CollapsibleSection";
import ShareButtons from "./ShareButtons";
import ReportIssue from "./ReportIssue";
import { ProfileThemeProvider, useProfileTheme, getThemeStyles } from "@/context/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ResearcherProfile as ResearcherProfileType } from "@shared/schema";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ArrowLeft, MapPin, Building2, Mail, Globe, Linkedin, BarChart3, Lightbulb, FileText, User, UserX, ExternalLink, Download, Calendar, Share2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { SiOrcid, SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

// Analytics tracking helper
const trackProfileEvent = async (openalexId: string, eventType: string, eventTarget?: string) => {
  try {
    // Get or create visitor ID
    let visitorId = localStorage.getItem('scholar_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('scholar_visitor_id', visitorId);
    }

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openalexId,
        eventType,
        eventTarget,
        visitorId,
        referrer: document.referrer || null,
      }),
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug('Analytics tracking failed:', error);
  }
};

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

function ResearcherProfileContent() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  // Get theme context for dynamic styling
  const { themeConfig } = useProfileTheme();

  // Enable real-time updates for this researcher profile
  const { isConnected } = useRealtimeUpdates();

  const { data: researcherData, isLoading, error } = useQuery<{
    profile: any;
    researcher: any;
    topics: any[];
    publications: any[];
    affiliations: any[];
    profileSections?: any[];
    lastSynced: string;
    isPreview?: boolean;
  } | null>({
    queryKey: [`/api/researcher/${id}/data`],
    retry: false,
  });

  // Track page view once when profile loads
  const openalexIdForTracking = researcherData?.profile?.openalexId || id;
  useEffect(() => {
    if (openalexIdForTracking && !researcherData?.isPreview) {
      trackProfileEvent(openalexIdForTracking, 'view');
    }
  }, [openalexIdForTracking, researcherData?.isPreview]);

  // Track click events (for external links like CV, LinkedIn, etc.)
  const handleTrackedClick = useCallback((target: string, url?: string) => {
    if (openalexIdForTracking && !researcherData?.isPreview) {
      trackProfileEvent(openalexIdForTracking, 'click', target);
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [openalexIdForTracking, researcherData?.isPreview]);

  // SEO data - must be before conditional returns to satisfy Rules of Hooks
  const profile = researcherData?.profile;
  const researcher = researcherData?.researcher;
  const openalexId = profile?.openalexId || id || '';

  const seoTitle = profile ? `${profile.displayName || researcher?.display_name} - Research Profile` : 'Research Profile';
  const seoDescription = profile?.bio || (researcher ? `${profile?.displayName || researcher.display_name} - ${researcher?.works_count || 0} publications, ${researcher?.cited_by_count || 0} citations, h-index: ${researcher?.summary_stats?.h_index || 0}` : 'Research Profile Platform');
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const profileImage = profile?.profileImageUrl || "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=500";

  // Schema.org structured data for Google Scholar
  const structuredData = useMemo(() => {
    if (!profile) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.displayName || researcher?.display_name,
      "description": profile.bio || `Researcher with ${researcher?.works_count || 0} publications`,
      "jobTitle": profile.title,
      "affiliation": profile.currentAffiliation ? {
        "@type": "Organization",
        "name": profile.currentAffiliation
      } : undefined,
      "url": profileUrl,
      "image": profileImage,
      "email": profile.contactEmail || undefined,
      "alumniOf": researcherData?.affiliations?.map((aff: any) => ({
        "@type": "Organization",
        "name": aff.institutionName
      })),
      "knowsAbout": researcherData?.topics?.slice(0, 10).map((topic: any) => topic.displayName),
      "sameAs": [
        `https://openalex.org/authors/${openalexId}`,
        profile.cvUrl,
      ].filter(Boolean)
    };
  }, [profile, researcher, researcherData, profileUrl, profileImage, openalexId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Loading..." />
        {/* Premium Loading State with Profile Preview Structure */}
        <section className="hero-banner min-h-[85vh] flex items-center relative">
          <div className="hero-pattern"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
              {/* Avatar Skeleton */}
              <div className="lg:col-span-4 flex justify-center lg:justify-start mb-12 lg:mb-0">
                <div className="profile-image-container">
                  <div className="profile-image-glow"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                    <div className="w-44 h-44 lg:w-56 lg:h-56 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center bg-primary/20 animate-pulse">
                      <div className="w-20 h-20 rounded-full bg-white/20"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="lg:col-span-8 text-center lg:text-left text-white space-y-8">
                <div className="space-y-6">
                  <div>
                    {/* Name skeleton */}
                    <div className="h-16 lg:h-20 bg-white/20 rounded-lg mb-4 animate-pulse w-3/4 mx-auto lg:mx-0"></div>
                    {/* Title skeleton */}
                    <div className="h-8 bg-white/15 rounded-lg mb-4 animate-pulse w-1/2 mx-auto lg:mx-0"></div>
                    {/* Affiliation skeleton */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                      <div className="h-6 bg-white/10 rounded-lg animate-pulse w-48"></div>
                      <div className="h-6 bg-white/10 rounded-lg animate-pulse w-24"></div>
                    </div>
                  </div>
                </div>

                {/* Bio skeleton */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="space-y-3">
                    <div className="h-4 bg-white/15 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-white/15 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-white/15 rounded animate-pulse w-4/6"></div>
                  </div>
                </div>

                {/* Action buttons skeleton */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                  <div className="h-14 bg-white/15 rounded-xl animate-pulse w-44"></div>
                  <div className="h-14 bg-white/20 rounded-xl animate-pulse w-48"></div>
                  <div className="h-14 bg-white/10 rounded-xl animate-pulse w-40"></div>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center justify-center lg:justify-start gap-3 pt-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-white/70 text-sm font-medium">Building your portfolio preview...</p>
                </div>
              </div>
            </div>
          </div>

          {/* No decorative elements - simplified design */}
        </section>

        {/* Stats Section Skeleton */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl p-6 shadow-sm border animate-pulse">
                  <div className="h-10 bg-muted rounded mb-2 w-16"></div>
                  <div className="h-4 bg-muted/60 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If no profile exists, show message
  if (error || !researcherData || !researcherData.profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation researcherName="Researcher Profile" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <EmptyState
            icon={UserX}
            title="No Profile Available"
            description="The researcher profile you're looking for doesn't exist or isn't public yet."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="page-researcher-profile" style={getThemeStyles(themeConfig)}>
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

      {/* Hero Section — Profile Banner */}
      <section id="overview" className="relative pb-10">
        {/* The Wide Banner Background */}
        <div className="h-48 md:h-64 bg-midnight w-full relative overflow-hidden">
          {/* Institutional context image */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20 md:-mt-24">
          <div className="flex flex-col items-center text-center">
            {/* Profile Image */}
            <div className="mb-5 relative">
              {profile?.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt="Professional portrait"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[6px] border-background shadow-xl"
                  data-testid="img-profile-photo"
                />
              ) : (
                <div
                  className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-background shadow-xl flex items-center justify-center bg-midnight/90 backdrop-blur-md`}
                  data-testid="img-profile-photo"
                >
                  <span className="text-4xl sm:text-5xl font-serif font-bold text-white">
                    {getInitials(profile?.displayName || researcher?.display_name || '')}
                  </span>
                </div>
              )}
            </div>

            {/* Name & Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-midnight dark:text-white mb-2" data-testid="text-display-name">
              {profile?.displayName || researcher?.display_name || 'Researcher Profile'}
            </h1>
            <p className="text-base sm:text-lg font-medium text-muted-foreground mb-2" data-testid="text-title">
              {researcherData?.isPreview && !profile?.title
                ? <span className="italic opacity-70">Professor of [Your Field]</span>
                : (profile?.title || 'Research Professional')}
            </p>
            {(profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || researcherData?.isPreview) && (
              <p className="text-sm font-medium text-midnight/70 dark:text-platinum flex items-center gap-1.5 mb-6" data-testid="text-affiliation">
                <Building2 className="w-4 h-4 text-warm" />
                {researcherData?.isPreview && !profile?.currentAffiliation
                  ? <span className="italic">Your Institution</span>
                  : (profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || '')}
              </p>
            )}

            {/* Bio excerpt in hero */}
            {profile?.bio && (
              <p className="text-base text-midnight/80 dark:text-white/80 max-w-2xl leading-relaxed mb-6 line-clamp-2">
                {profile.bio}
              </p>
            )}

            {/* Social Icons Row */}
            <div className="flex items-center gap-3 mb-6">
              {profile?.orcidUrl && (
                <a href={profile.orcidUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white dark:bg-midnight/50 shadow-sm border border-platinum dark:border-white/10 hover:-translate-y-1 hover:shadow-md transition-all text-midnight dark:text-white" title="ORCID">
                  <SiOrcid className="w-5 h-5" />
                </a>
              )}
              {profile?.googleScholarUrl && (
                <a href={profile.googleScholarUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white dark:bg-midnight/50 shadow-sm border border-platinum dark:border-white/10 hover:-translate-y-1 hover:shadow-md transition-all text-midnight dark:text-white" title="Google Scholar">
                  <SiGooglescholar className="w-5 h-5" />
                </a>
              )}
              {profile?.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white dark:bg-midnight/50 shadow-sm border border-platinum dark:border-white/10 hover:-translate-y-1 hover:shadow-md transition-all text-midnight dark:text-white" title="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Action Buttons — separated, clear hierarchy */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* CV Download */}
              {profile?.cvUrl && profile.cvUrl !== '#cv-placeholder' ? (
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-midnight text-white font-semibold text-sm hover:bg-midnight/90 hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => handleTrackedClick('cv_download')}
                  data-testid="link-cv"
                >
                  <Download className="w-4 h-4" />
                  Download CV
                </a>
              ) : (
                <span
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium opacity-50 cursor-not-allowed"
                  title="CV available after claiming profile"
                >
                  <Download className="w-4 h-4" />
                  Download CV
                </span>
              )}

              {/* View on OpenAlex */}
              <a
                href={`https://openalex.org/authors/${openalexId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white shadow-sm border border-platinum hover:-translate-y-0.5 hover:shadow-md text-midnight text-sm font-medium transition-all"
                onClick={() => handleTrackedClick('openalex_profile')}
              >
                <ExternalLink className="w-4 h-4 text-warm" />
                OpenAlex Profile
              </a>

              {/* Research Passport */}
              <ResearchPassport
                openalexId={openalexId}
                name={profile?.displayName || researcher?.display_name || 'Researcher'}
                title={profile?.title}
                institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
                publicationCount={researcher?.works_count || 0}
                citationCount={researcher?.cited_by_count || 0}
                profileUrl={typeof window !== 'undefined' ? window.location.href : ''}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview - Always visible */}
      <StatsOverview openalexId={openalexId} />

      {/* About Section - Always show in preview, show if bio exists in claimed */}
      {
        (researcherData?.isPreview || profile?.bio) && (
          <section className="py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CollapsibleSection
                id="about"
                title="About"
                icon={<User className="w-5 h-5 md:w-6 md:h-6" />}
                defaultOpen={true}
                mobileDefaultOpen={true}
              >
                <div className="space-y-4">
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed" data-testid="text-bio">
                    {profile?.bio ? (
                      profile.bio
                    ) : (
                      <span className="italic opacity-70">
                        Share your research journey, expertise, and what drives your work. Highlight your key contributions
                        and areas of specialization to help collaborators and students discover your profile.
                      </span>
                    )}
                  </p>
                </div>
              </CollapsibleSection>
            </div>
          </section>
        )
      }

      {/* Custom Profile Sections */}
      {
        researcherData?.profileSections && researcherData.profileSections.length > 0 && (
          <ProfileSections sections={researcherData.profileSections} />
        )
      }

      {/* Research Insights Dashboard (Tabs) */}
      <ResearchInsights
        openalexId={openalexId}
        researcherData={researcherData}
        researcherName={profile?.displayName || researcher?.display_name || 'Researcher'}
      />

      {/* Publications */}
      <CollapsibleSection
        id="publications"
        title="Publications"
        icon={<FileText className="w-5 h-5 md:w-6 md:h-6" />}
        defaultOpen={true}
        mobileDefaultOpen={false}
        className="bg-background"
      >
        <Publications openalexId={openalexId} inline />
      </CollapsibleSection>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground/70 text-sm">
              © {new Date().getFullYear()} Scholar.name. All rights reserved.
            </p>
            {researcherData?.lastSynced && (
              <p className="text-xs text-muted-foreground/60">
                Last data sync: {new Date(researcherData.lastSynced).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </footer>

      {/* Sticky Claim Profile CTA Banner - Preview Mode Only */}
      {
        researcherData?.isPreview && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-lg border-t border-primary/20 md:block hidden" data-testid="banner-claim-profile">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-white text-sm md:text-base font-medium">
                    <span className="hidden lg:inline">This is a preview of what your profile could look like.</span>
                    <span className="lg:hidden">Preview mode</span>
                    {' '}Create yours at <span className="font-semibold">{(profile?.displayName || researcher?.display_name || 'yourname').toLowerCase().replace(/\s+/g, '')}.scholar.name</span>
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                  data-testid="button-claim-profile"
                >
                  Claim This Profile
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Sticky CTA for Preview Mode — positioned above MobileBottomNav */}
      {
        researcherData?.isPreview && (
          <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-primary shadow-lg border-t border-primary/20 md:hidden" data-testid="banner-claim-profile-mobile" style={{ paddingBottom: '0' }}>
            <div className="px-4 py-3">
              <div className="flex flex-col gap-2 text-center">
                <p className="text-white text-sm font-medium">
                  Like what you see? Create your own portfolio!
                </p>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md w-full"
                  data-testid="button-claim-profile-mobile"
                >
                  Claim & Customize
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Theme Switcher - Floating button for theme preview */}
      <ThemeSwitcher isPreview={researcherData?.isPreview} />
    </div >
  );
}

export default function ResearcherProfile() {
  const { id } = useParams();

  return (
    <ProfileThemeProvider initialThemeId={null}>
      <ResearcherProfileContent />
    </ProfileThemeProvider>
  );
}
