import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import StatsOverview from "@/components/StatsOverview";
import PublicationAnalytics from "@/components/PublicationAnalytics";
import ResearchTopics from "@/components/ResearchTopics";
import Publications from "@/components/Publications";
import SEO from "@/components/SEO";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { MapPin, Building2, Globe, Linkedin } from "lucide-react";
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
        <section className="hero-banner min-h-[85vh] flex items-center relative">
          <div className="hero-pattern"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
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
              <div className="lg:col-span-8 text-center lg:text-left text-white space-y-8">
                <div className="space-y-6">
                  <div className="h-16 lg:h-20 bg-white/20 rounded-lg mb-4 animate-pulse w-3/4 mx-auto lg:mx-0"></div>
                  <div className="h-8 bg-white/15 rounded-lg mb-4 animate-pulse w-1/2 mx-auto lg:mx-0"></div>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-3 pt-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-white/70 text-sm font-medium">Loading profile...</p>
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
      
      <section id="overview" className="hero-banner min-h-[50vh] sm:min-h-[60vh] md:min-h-[85vh] flex items-center relative pt-8 sm:pt-16 md:pt-0">
        <div className="hero-pattern"></div>
        <div className="hidden md:block hero-grid"></div>
        <div className="hidden md:block hero-slice hero-slice-one"></div>
        <div className="hidden md:block hero-slice hero-slice-two"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-20 z-10 w-full">
          <div className="flex flex-col items-center lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            {/* Profile Image - Smaller on mobile */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start mb-4 sm:mb-6 md:mb-12 lg:mb-0">
              <div className="profile-image-container">
                <div className="hidden sm:block profile-image-glow"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-1 sm:p-2 md:p-3 shadow-xl sm:shadow-2xl">
                  {profile?.profileImageUrl ? (
                    <img 
                      src={profile.profileImageUrl} 
                      alt="Professional portrait" 
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-44 md:h-44 lg:w-56 lg:h-56 rounded-full object-cover border-2 sm:border-3 md:border-4 border-white/30 shadow-lg sm:shadow-2xl"
                      data-testid="img-profile-photo"
                    />
                  ) : (
                    <div 
                      className={`w-20 h-20 sm:w-28 sm:h-28 md:w-44 md:h-44 lg:w-56 lg:h-56 rounded-full border-2 sm:border-3 md:border-4 border-white/30 shadow-lg sm:shadow-2xl flex items-center justify-center bg-gradient-to-br ${getAvatarColor(profile?.displayName || researcher?.display_name || '')}`}
                      data-testid="img-profile-photo"
                    >
                      <span className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white">
                        {getInitials(profile?.displayName || researcher?.display_name || '')}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:flex profile-badge absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 sm:border-3 md:border-4 border-white items-center justify-center">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content - Simplified on mobile */}
            <div className="lg:col-span-8 text-center lg:text-left text-white space-y-3 sm:space-y-4 md:space-y-8">
              <div className="space-y-2 sm:space-y-3 md:space-y-6">
                <div>
                  <div className="hidden sm:block hero-kicker mb-2 sm:mb-3">Research Portfolio</div>
                  <h1 className="hero-title text-xl sm:text-2xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-1 sm:mb-2 md:mb-4 leading-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent" data-testid="text-display-name">
                    {profile?.displayName || researcher?.display_name || 'Researcher Profile'}
                  </h1>
                  <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl mb-1 sm:mb-2 md:mb-4 text-white/90 font-light tracking-wide" data-testid="text-title">
                    {profile?.title || 'Research Professional'}
                  </p>
                  <div className="hidden sm:block hero-accent-line mb-3 sm:mb-4 md:mb-6 mx-auto lg:mx-0"></div>
                  {/* Affiliation - simplified on mobile */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm md:text-base text-white/80">
                    <span className="hero-meta-pill text-xs sm:text-sm">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span data-testid="text-affiliation" className="truncate max-w-[150px] sm:max-w-none">
                        {profile?.currentAffiliation || researcher?.last_known_institutions?.[0]?.display_name || 'Institution'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Bio card - hidden on mobile */}
              <div className="hidden sm:block hero-bio-card backdrop-blur-sm rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-white/90 leading-relaxed font-light line-clamp-3 sm:line-clamp-none" data-testid="text-bio">
                  {profile?.bio || `Researcher with ${researcher?.works_count || 0} publications and ${researcher?.cited_by_count || 0} citations.`}
                </p>
              </div>
              
              {/* Social/Academic Profile Links - icons only on mobile */}
              {(profile?.orcidUrl || profile?.googleScholarUrl || profile?.researchGateUrl || profile?.linkedinUrl || profile?.websiteUrl || profile?.twitterUrl) && (
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 md:gap-3" data-testid="social-links-container">
                  {profile?.orcidUrl && (
                    <a
                      href={profile.orcidUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-social-pill inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm hover:bg-white/20 transition-all duration-300"
                      title="ORCID"
                      data-testid="link-orcid"
                    >
                      <SiOrcid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">ORCID</span>
                    </a>
                  )}
                  {profile?.googleScholarUrl && (
                    <a
                      href={profile.googleScholarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-social-pill inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm hover:bg-white/20 transition-all duration-300"
                      title="Google Scholar"
                      data-testid="link-google-scholar"
                    >
                      <SiGooglescholar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Scholar</span>
                    </a>
                  )}
                  {profile?.researchGateUrl && (
                    <a
                      href={profile.researchGateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-social-pill inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm hover:bg-white/20 transition-all duration-300"
                      title="ResearchGate"
                      data-testid="link-researchgate"
                    >
                      <SiResearchgate className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">ResearchGate</span>
                    </a>
                  )}
                  {profile?.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-social-pill inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm hover:bg-white/20 transition-all duration-300"
                      title="LinkedIn"
                      data-testid="link-linkedin"
                    >
                      <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">LinkedIn</span>
                    </a>
                  )}
                  {profile?.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-social-pill inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm hover:bg-white/20 transition-all duration-300"
                      title="Website"
                      data-testid="link-website"
                    >
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Website</span>
                    </a>
                  )}
                  {profile?.twitterUrl && (
                    <a
                      href={profile.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-social-pill inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm hover:bg-white/20 transition-all duration-300"
                      title="X (Twitter)"
                      data-testid="link-twitter"
                    >
                      <FaXTwitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">X</span>
                    </a>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4 pt-2 md:pt-4">
                {(profile?.contactEmail || profile?.email) && (
                  <a 
                    href={`mailto:${profile.contactEmail || profile.email}`}
                    className="action-button hero-cta-primary group px-4 sm:px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                    data-testid="link-contact"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 inline-block group-hover:scale-110 transition-transform duration-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Get In Touch
                  </a>
                )}
                {profile?.cvUrl && profile.cvUrl !== '#cv-placeholder' && (
                  <a 
                    href={profile.cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-button hero-cta-secondary group backdrop-blur-sm text-white px-4 sm:px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/25 transition-all duration-300 hover:border-white/40 hover:scale-105 font-medium text-sm md:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                    data-testid="link-cv"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 inline-block group-hover:scale-110 transition-transform duration-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A1 1 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Download CV
                  </a>
                )}
                <a 
                  href={`https://openalex.org/authors/${openalexId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button hero-cta-secondary group backdrop-blur-sm text-white px-4 sm:px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/25 transition-all duration-300 hover:border-white/40 hover:scale-105 font-medium text-sm md:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                  data-testid="link-openalex"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 inline-block group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  View on OpenAlex
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-decorative top-20 right-20 w-80 h-80 bg-gradient-to-r from-white/8 to-accent/5"></div>
        <div className="hero-decorative bottom-20 left-20 w-64 h-64 bg-gradient-to-r from-accent/8 to-primary/5"></div>
      </section>

      <StatsOverview openalexId={openalexId} />
      <PublicationAnalytics openalexId={openalexId} researcherData={profileData} />
      <ResearchTopics openalexId={openalexId} />
      <Publications openalexId={openalexId} />

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
