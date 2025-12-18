import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "./Navigation";
import StatsOverview from "./StatsOverview";
import PublicationAnalytics from "./PublicationAnalytics";
import ResearchNetwork from "./ResearchNetwork";
import ResearchTopics from "./ResearchTopics";
import Publications from "./Publications";
import SEO from "./SEO";
import MobileBottomNav from "./MobileBottomNav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import ResearchPassport from "./ResearchPassport";
import { ProfileThemeProvider, useProfileTheme, getThemeStyles } from "@/context/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ResearcherProfile as ResearcherProfileType } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, MapPin, Building2, Mail, Globe, Linkedin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    lastSynced: string;
    isPreview?: boolean;
  } | null>({
    queryKey: [`/api/researcher/${id}/data`],
    retry: false,
  });

  // Preview expiration tracking (24 hours)
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const PREVIEW_EXPIRATION_HOURS = 24;
  
  useEffect(() => {
    // Guard for SSR - localStorage is only available in browser
    if (typeof window === 'undefined') return;
    if (!researcherData?.isPreview || !id) return;
    
    try {
      const storageKey = `preview_session_${id}`;
      const storedSession = localStorage.getItem(storageKey);
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        const firstViewTime = new Date(sessionData.firstView).getTime();
        const now = Date.now();
        const hoursPassed = (now - firstViewTime) / (1000 * 60 * 60);
        
        if (hoursPassed >= PREVIEW_EXPIRATION_HOURS) {
          // Preview has expired
          setShowExpirationModal(true);
        } else {
          // Update view count
          sessionData.viewCount = (sessionData.viewCount || 0) + 1;
          localStorage.setItem(storageKey, JSON.stringify(sessionData));
        }
      } else {
        // First time viewing this preview
        localStorage.setItem(storageKey, JSON.stringify({
          firstView: new Date().toISOString(),
          viewCount: 1
        }));
      }
    } catch (e) {
      // Silently handle localStorage errors (e.g., private browsing)
      console.warn('Unable to access localStorage for preview tracking');
    }
  }, [researcherData?.isPreview, id]);

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
                    <div className="w-44 h-44 lg:w-56 lg:h-56 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/60 animate-pulse">
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
          
          {/* Decorative Elements */}
          <div className="hero-decorative top-20 right-20 w-80 h-80 bg-gradient-to-r from-white/8 to-accent/5"></div>
          <div className="hero-decorative bottom-20 left-20 w-64 h-64 bg-gradient-to-r from-accent/8 to-primary/5"></div>
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
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">No Profile Available</h1>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  The researcher profile you're looking for doesn't exist or isn't public yet.
                </p>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="page-researcher-profile" style={getThemeStyles(themeConfig)}>
      {/* Preview Expiration Modal */}
      <Dialog open={showExpirationModal} onOpenChange={setShowExpirationModal}>
        <DialogContent className="sm:max-w-md" data-testid="modal-preview-expired">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Preview Session Expired
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your 24-hour preview session has ended. Ready to claim your professional research portfolio?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Create your own ScholarName portfolio to:
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Get your own professional domain
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Customize your profile with your own bio and photo
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Auto-sync your latest publications
              </li>
            </ul>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={() => navigate('/contact')}
                className="w-full"
                data-testid="button-claim-expired"
              >
                Create My Portfolio
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowExpirationModal(false)}
                className="w-full"
                data-testid="button-continue-preview"
              >
                Continue Browsing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      
      {/* Enhanced Hero Section - Mobile Optimized */}
      <section id="overview" className="hero-banner min-h-[70vh] md:min-h-[85vh] flex items-center relative pt-16 md:pt-0">
        {/* Enhanced Background pattern overlay */}
        <div className="hero-pattern"></div>
        
        {/* Back Button - Always show for navigation */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-sm md:text-base px-3 py-2 md:px-4 md:py-2 min-h-[44px]"
            data-testid="button-back-to-home"
          >
            <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-20 z-10 w-full">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Profile Image Section - Smaller on mobile */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start mb-6 md:mb-12 lg:mb-0">
              <div className="profile-image-container">
                <div className="profile-image-glow"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-2 md:p-3 shadow-2xl">
                  {profile?.profileImageUrl ? (
                    <img 
                      src={profile.profileImageUrl} 
                      alt="Professional portrait" 
                      className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-56 lg:h-56 rounded-full object-cover border-3 md:border-4 border-white/30 shadow-2xl"
                      data-testid="img-profile-photo"
                    />
                  ) : (
                    <div 
                      className={`w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-56 lg:h-56 rounded-full border-3 md:border-4 border-white/30 shadow-2xl flex items-center justify-center bg-gradient-to-br ${getAvatarColor(profile?.displayName || researcher?.display_name || '')}`}
                      data-testid="img-profile-photo"
                    >
                      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                        {getInitials(profile?.displayName || researcher?.display_name || '')}
                      </span>
                    </div>
                  )}
                  <div className="profile-badge absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 rounded-full border-3 md:border-4 border-white flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content Section - Mobile optimized spacing */}
            <div className="lg:col-span-8 text-center lg:text-left text-white space-y-4 md:space-y-8">
              <div className="space-y-3 md:space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 md:mb-4 leading-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent" data-testid="text-display-name">
                    {profile?.displayName || researcher?.display_name || 'Researcher Profile'}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 md:mb-4 text-white/90 font-light tracking-wide" data-testid="text-title">
                    {researcherData?.isPreview && !profile?.title 
                      ? <span className="italic opacity-70">Position</span>
                      : (profile?.title || 'Research Professional')}
                  </p>
                  {/* Always show affiliation section - use placeholders for preview */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-4 text-sm md:text-base text-white/80">
                    <span className="flex items-center gap-1 md:gap-2">
                      <Building2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span data-testid="text-affiliation" className="text-sm md:text-base">
                        {researcherData?.isPreview && !profile?.currentAffiliation
                          ? <span className="italic opacity-70">Institution</span>
                          : (profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || 'Institution')}
                      </span>
                    </span>
                    {(profile?.countryCode || researcher?.last_known_institutions?.[0]?.country_code) && (
                      <span className="flex items-center gap-1 md:gap-2">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="text-sm md:text-base">{profile?.countryCode || researcher?.last_known_institutions?.[0]?.country_code}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Always show bio section - use placeholder for preview */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed font-light" data-testid="text-bio">
                  {researcherData?.isPreview && !profile?.bio 
                    ? <span className="italic opacity-70">Your research bio and description will appear here once you customize your profile.</span>
                    : (profile?.bio || `Researcher with ${researcher?.works_count || 0} publications and ${researcher?.cited_by_count || 0} citations.`)}
                </p>
              </div>
              
              {/* Social/Academic Profile Links - Redesigned as pills */}
              {(profile?.orcidUrl || profile?.googleScholarUrl || profile?.researchGateUrl || profile?.linkedinUrl || profile?.websiteUrl || profile?.twitterUrl) && (
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3" data-testid="social-links-container">
                  {profile?.orcidUrl && (
                    <a
                      href={profile.orcidUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300"
                      data-testid="link-orcid"
                    >
                      <SiOrcid className="w-4 h-4" />
                      <span>ORCID</span>
                    </a>
                  )}
                  {profile?.googleScholarUrl && (
                    <a
                      href={profile.googleScholarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300"
                      data-testid="link-google-scholar"
                    >
                      <SiGooglescholar className="w-4 h-4" />
                      <span>Scholar</span>
                    </a>
                  )}
                  {profile?.researchGateUrl && (
                    <a
                      href={profile.researchGateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300"
                      data-testid="link-researchgate"
                    >
                      <SiResearchgate className="w-4 h-4" />
                      <span>ResearchGate</span>
                    </a>
                  )}
                  {profile?.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300"
                      data-testid="link-linkedin"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {profile?.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300"
                      data-testid="link-website"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                  {profile?.twitterUrl && (
                    <a
                      href={profile.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-all duration-300"
                      data-testid="link-twitter"
                    >
                      <FaXTwitter className="w-4 h-4" />
                      <span>X</span>
                    </a>
                  )}
                </div>
              )}
              
              {/* Streamlined Action Buttons - Primary actions only */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3 pt-2 md:pt-4">
                {(profile?.contactEmail || profile?.email) && (
                  <a 
                    href={`mailto:${profile.contactEmail || profile.email}`}
                    className="action-button group bg-white text-primary px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                    data-testid="link-contact"
                  >
                    <Mail className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                    Get In Touch
                  </a>
                )}
                {profile?.cvUrl && profile.cvUrl !== '#cv-placeholder' && (
                  <a 
                    href={profile.cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-button group bg-white/15 backdrop-blur-sm text-white px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/25 transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-105 font-medium text-sm md:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                    data-testid="link-cv"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 inline-block group-hover:scale-110 transition-transform duration-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Download CV
                  </a>
                )}
                <a 
                  href={`https://openalex.org/authors/${openalexId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button group bg-white/10 backdrop-blur-sm text-white px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/15 hover:border-white/30 font-medium text-sm md:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                  data-testid="link-openalex"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 inline-block group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  OpenAlex Profile
                </a>
                <div className="w-full sm:w-auto">
                  <ResearchPassport
                    openalexId={openalexId}
                    name={profile?.displayName || researcher?.display_name || 'Researcher'}
                    title={profile?.title}
                    institution={profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name}
                    publicationCount={researcher?.works_count || 0}
                    citationCount={researcher?.cited_by_count || 0}
                    profileUrl={window.location.href}
                  />
                </div>
              </div>
              
              {/* Preview Mode Indicator */}
              {profile?.isPreview && (
                <div className="mt-6">
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 border-amber-500/30 px-4 py-2">
                    Preview Mode - This is how your portfolio would look
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Decorative Elements */}
        <div className="hero-decorative top-20 right-20 w-80 h-80 bg-gradient-to-r from-white/8 to-accent/5"></div>
        <div className="hero-decorative bottom-20 left-20 w-64 h-64 bg-gradient-to-r from-accent/8 to-primary/5"></div>
        <div className="hero-decorative top-1/2 right-1/3 w-48 h-48 bg-gradient-to-r from-primary/6 to-white/4"></div>
      </section>

      <StatsOverview openalexId={openalexId} />
      <PublicationAnalytics openalexId={openalexId} researcherData={researcherData} />
      <ResearchNetwork 
        publications={researcherData?.publications || []}
        researcherName={profile?.displayName || researcher?.display_name || ''} 
        isLoading={isLoading}
      />
      <ResearchTopics openalexId={openalexId} />
      <Publications openalexId={openalexId} />

      {/* Footer */}
      <footer className="bg-gradient-to-br from-card to-muted/20 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground/70 text-sm">
              © {new Date().getFullYear()} ResearchHub. All rights reserved.
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
      {researcherData?.isPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-t border-primary/20 md:block hidden" data-testid="banner-claim-profile">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <p className="text-white text-sm md:text-base font-medium">
                  This is a preview. Claim your profile at <span className="font-semibold">{(profile?.displayName || researcher?.display_name || 'yourname').toLowerCase().replace(/\s+/g, '')}.scholar.name</span>
                </p>
              </div>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                data-testid="button-claim-profile"
              >
                Claim This Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA for Preview Mode */}
      {researcherData?.isPreview && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-t border-primary/20 md:hidden" data-testid="banner-claim-profile-mobile">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-white text-sm font-medium">
                Preview Mode - Claim your profile today!
              </p>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-md w-full"
                data-testid="button-claim-profile-mobile"
              >
                Claim This Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Theme Switcher - Floating button for theme preview */}
      <ThemeSwitcher isPreview={researcherData?.isPreview} />
    </div>
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
