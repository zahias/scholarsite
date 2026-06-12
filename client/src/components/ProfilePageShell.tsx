import { ReactNode } from "react";
import { Building2, Globe, Linkedin, ExternalLink, Download, Mail } from "lucide-react";
import { SiOrcid, SiGooglescholar, SiResearchgate } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

export interface ProfileShellData {
  displayName: string;
  title?: string | null;
  isPreview?: boolean;
  affiliation?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  // Social links
  orcidUrl?: string | null;
  googleScholarUrl?: string | null;
  researchGateUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  contactEmail?: string | null;
  // Stats
  worksCount?: number | null;
  citedByCount?: number | null;
  hIndex?: number | null;
  i10Index?: number | null;
  // Action buttons (OpenAlex, CV, etc.)
  cvUrl?: string | null;
  openalexId?: string | null;
}

interface ProfilePageShellProps extends ProfileShellData {
  actionsSlot?: ReactNode;
  identityCardId?: string;
}

const AVATAR_COLORS: [string, string][] = [
  ["#2563EB", "#1D4ED8"],
  ["#7C3AED", "#6D28D9"],
  ["#059669", "#047857"],
  ["#D97706", "#B45309"],
  ["#DC2626", "#B91C1C"],
  ["#0891B2", "#0E7490"],
  ["#4338CA", "#3730A3"],
  ["#0F766E", "#0D6365"],
];

export function getAvatarGradient(name: string): [string, string] {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const socialBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "50%",
  background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)",
  display: "grid", placeItems: "center", color: "#44474D", textDecoration: "none",
  flexShrink: 0,
};

export default function ProfilePageShell({
  displayName,
  title,
  isPreview,
  affiliation,
  bio,
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
  i10Index,
  cvUrl,
  openalexId,
  actionsSlot,
  identityCardId,
}: ProfilePageShellProps) {
  const [avatarFrom, avatarTo] = getAvatarGradient(displayName);

  const stats = [
    { label: "Publications", value: worksCount?.toLocaleString() ?? "—" },
    { label: "Citations",    value: citedByCount?.toLocaleString() ?? "—" },
    { label: "h-index",      value: hIndex?.toLocaleString() ?? "—" },
    { label: "i10-index",    value: i10Index?.toLocaleString() ?? "—" },
  ];

  return (
    <>
      {/* ── Banner ── */}
      <div style={{ height: 240, background: "linear-gradient(135deg, #081529 0%, #0B1F3A 50%, #142850 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
        <div className="profile-banner-fade" style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* ── Identity card ── */}
      <div className="profile-wide-container">
        <div
          id={identityCardId ?? "overview"}
          style={{ maxWidth: 980, margin: "-90px auto 0", position: "relative", zIndex: 10, background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.18)", padding: "28px 36px 32px", textAlign: "center" }}
        >
          {/* Avatar */}
          <div style={{ margin: "0 auto 16px", width: 120, height: 120 }}>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile" data-testid="img-profile-photo"
                style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "4px solid #fff", boxShadow: "0 4px 20px rgba(11,31,58,.18)" }} />
            ) : (
              <div data-testid="img-profile-photo"
                style={{ width: 120, height: 120, borderRadius: "50%", background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})`, border: "4px solid #fff", boxShadow: "0 4px 20px rgba(11,31,58,.18)", display: "grid", placeItems: "center" }}>
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 42, color: "#fff", fontWeight: 700, lineHeight: 1 }}>
                  {getInitials(displayName)}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", letterSpacing: "-0.015em" }} data-testid="text-display-name">
            {displayName}
          </h1>

          {/* Title */}
          <p style={{ fontSize: 15, color: "#44474D", margin: "0 0 10px" }} data-testid="text-title">
            {isPreview && !title
              ? <em style={{ opacity: 0.7 }}>Professor of [Your Field]</em>
              : (title || "Research Professional")}
          </p>

          {/* Affiliation chip */}
          {(affiliation || isPreview) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#44474D", background: "#F0F4F8", padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(11,31,58,.08)", marginBottom: 14 }} data-testid="text-affiliation">
              <Building2 size={13} style={{ color: "#FFC72E", flexShrink: 0 }} />
              {isPreview && !affiliation
                ? <em style={{ opacity: 0.7 }}>Your Institution</em>
                : affiliation}
            </span>
          )}

          {/* Bio excerpt (2-line clamp) */}
          {bio && (
            <p style={{ fontSize: 14, color: "#44474D", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {bio}
            </p>
          )}

          {/* Social icons */}
          {!isPreview && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {orcidUrl && <a href={orcidUrl} target="_blank" rel="noopener noreferrer" title="ORCID" style={socialBtn}><SiOrcid size={15} /></a>}
            {googleScholarUrl && <a href={googleScholarUrl} target="_blank" rel="noopener noreferrer" title="Google Scholar" style={socialBtn}><SiGooglescholar size={15} /></a>}
            {researchGateUrl && <a href={researchGateUrl} target="_blank" rel="noopener noreferrer" title="ResearchGate" style={socialBtn}><SiResearchgate size={15} /></a>}
            {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={socialBtn}><Linkedin size={15} /></a>}
            {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" title="Website" style={socialBtn}><Globe size={15} /></a>}
            {twitterUrl && <a href={twitterUrl} target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={socialBtn}><FaXTwitter size={15} /></a>}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} data-testid="link-contact"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 999, background: "#0B1F3A", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <Mail size={13} /> Contact
              </a>
            )}
          </div>
          )}

          {/* Action buttons — callers inject custom buttons via actionsSlot */}
          {!isPreview ? (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {cvUrl && cvUrl !== "#cv-placeholder" ? (
              <a href={cvUrl} target="_blank" rel="noopener noreferrer" data-testid="link-cv"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", background: "#fff" }}>
                <Download size={14} /> Download CV
              </a>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.08)", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#75777E", background: "#F8F9FA", opacity: 0.6, cursor: "not-allowed" }} title="CV available after claiming profile">
                <Download size={14} /> Download CV
              </span>
            )}
            {openalexId && (
              <a href={`https://openalex.org/authors/${openalexId}`} target="_blank" rel="noopener noreferrer" data-testid="link-openalex"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", background: "#fff" }}>
                <ExternalLink size={14} style={{ color: "#FFC72E" }} /> OpenAlex ↗
              </a>
            )}
            {actionsSlot}
          </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(255,199,46,.32)", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#6F5400", background: "rgba(255,199,46,.12)" }}>
              Preview mode: full links and tools unlock after claiming
            </div>
          )}
        </div>

        {/* ── Stats grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }} className="stats-grid">
          <style>{`@media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(11,31,58,.08)", padding: "18px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 600, color: "#0B1F3A", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: "#75777E", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
