import { ReactNode } from "react";
import { Download, ExternalLink, Globe, Linkedin, Mail } from "lucide-react";
import { SiGooglescholar, SiOrcid, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

interface ProfileTopic {
  id?: string;
  displayName?: string;
  display_name?: string;
}

export interface ProfileShellData {
  displayName: string;
  title?: string | null;
  currentPosition?: string | null;
  isPreview?: boolean;
  affiliation?: string | null;
  affiliationUrl?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  orcidUrl?: string | null;
  googleScholarUrl?: string | null;
  researchGateUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  contactEmail?: string | null;
  worksCount?: number | null;
  citedByCount?: number | null;
  hIndex?: number | null;
  i10Index?: number | null;
  cvUrl?: string | null;
  openalexId?: string | null;
  topics?: ProfileTopic[];
}

interface ProfilePageShellProps extends ProfileShellData {
  actionsSlot?: ReactNode;
  identityCardId?: string;
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatMetric(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

const iconLinkClass = "profile-icon-link";

export default function ProfilePageShell({
  displayName,
  title,
  currentPosition,
  isPreview,
  affiliation,
  affiliationUrl,
  profileImageUrl,
  orcidUrl,
  googleScholarUrl,
  researchGateUrl,
  linkedinUrl,
  websiteUrl,
  twitterUrl,
  contactEmail,
  worksCount,
  citedByCount,
  hIndex,
  cvUrl,
  openalexId,
  topics = [],
  actionsSlot,
  identityCardId,
}: ProfilePageShellProps) {
  const profileHandle = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 28) || "researcher";
  const visibleTopics = topics
    .map((topic) => topic.displayName || topic.display_name)
    .filter((topic): topic is string => Boolean(topic))
    .slice(0, 8);
  const subtitleParts = Array.from(new Set([title, currentPosition, affiliation].filter(Boolean)));
  const stats = [
    { label: "Publications", value: formatMetric(worksCount) },
    { label: "Citations", value: formatMetric(citedByCount), featured: true },
    { label: "h-index", value: formatMetric(hIndex) },
  ];

  return (
    <section id={identityCardId ?? "overview"} className="profile-portfolio-shell">
      <div className="profile-portfolio-hero">
        <div className="profile-portfolio-inner">
          <div className="profile-portfolio-identity">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${displayName} profile`}
                className="profile-portfolio-avatar"
                data-testid="img-profile-photo"
              />
            ) : (
              <div className="profile-portfolio-avatar profile-portfolio-initials" data-testid="img-profile-photo">
                {getInitials(displayName)}
              </div>
            )}
            <div className="profile-portfolio-copy">
              <h1 data-testid="text-display-name">{displayName}</h1>
              <p data-testid="text-title">
                {subtitleParts.length > 0 ? subtitleParts.map((part, index) => (
                  <span key={part}>
                    {index > 0 && " · "}
                    {part === affiliation && affiliationUrl ? (
                      <a href={affiliationUrl} target="_blank" rel="noopener noreferrer">{part}</a>
                    ) : part}
                  </span>
                )) : "Research professional"}
              </p>
              <span>{profileHandle}.scholar.name</span>
            </div>
          </div>
          <div className="profile-portfolio-rule" aria-hidden="true" />
        </div>
      </div>

      <div className="profile-portfolio-body">
        <div className="profile-portfolio-inner">
          <div className="profile-metric-grid" data-testid="section-stats">
            {stats.map((stat) => (
              <div key={stat.label} className={`profile-metric${stat.featured ? " profile-metric-featured" : ""}`}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {visibleTopics.length > 0 && (
            <div className="profile-topic-summary">
              <p>Research topics</p>
              <div>
                {visibleTopics.map((topic, index) => (
                  <span key={topic} className={index === 0 ? "profile-topic-featured" : undefined}>{topic}</span>
                ))}
              </div>
            </div>
          )}

          <div className="profile-portfolio-actions" aria-label="Researcher links and profile tools">
            <div className="profile-social-links">
              {orcidUrl && <a href={orcidUrl} target="_blank" rel="noopener noreferrer" title="ORCID" className={iconLinkClass}><SiOrcid /></a>}
              {googleScholarUrl && <a href={googleScholarUrl} target="_blank" rel="noopener noreferrer" title="Google Scholar" className={iconLinkClass}><SiGooglescholar /></a>}
              {researchGateUrl && <a href={researchGateUrl} target="_blank" rel="noopener noreferrer" title="ResearchGate" className={iconLinkClass}><SiResearchgate /></a>}
              {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn" className={iconLinkClass}><Linkedin /></a>}
              {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" title="Website" className={iconLinkClass}><Globe /></a>}
              {twitterUrl && <a href={twitterUrl} target="_blank" rel="noopener noreferrer" title="X" className={iconLinkClass}><FaXTwitter /></a>}
              {contactEmail && <a href={`mailto:${contactEmail}`} title="Contact researcher" className={iconLinkClass} data-testid="link-contact"><Mail /></a>}
            </div>

            <div className="profile-tool-links">
              {cvUrl && cvUrl !== "#cv-placeholder" ? (
                <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="profile-tool-button" data-testid="link-cv"><Download /> Download CV</a>
              ) : isPreview ? (
                <span className="profile-tool-button profile-tool-disabled" title="CV available after claiming profile"><Download /> Download CV</span>
              ) : null}
              {openalexId && (
                <a href={`https://openalex.org/authors/${openalexId}`} target="_blank" rel="noopener noreferrer" className="profile-tool-button" data-testid="link-openalex"><ExternalLink /> OpenAlex</a>
              )}
              {actionsSlot}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
