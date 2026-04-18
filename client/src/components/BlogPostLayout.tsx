import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import SEO from "@/components/SEO";
import { Check, Copy, Bookmark } from "lucide-react";

interface Props {
  title: string;
  description: string;
  url: string;
  publishedDate: string;
  readingTime: string;
  category: string;
  children: ReactNode;
  structuredData?: object;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Methods": "#2B5BD7",
  "Tools": "#2F6D3A",
  "Analytics": "#6B3FA0",
  "Career": "#B33A3A",
  "AI": "#B87A0A",
  "Open Science": "#2B5BD7",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#0B1F3A";
}

export default function BlogPostLayout({
  title,
  description,
  url,
  publishedDate,
  readingTime,
  category,
  children,
  structuredData,
}: Props) {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>
      <SEO
        title={title + " — Scholar.name Blog"}
        description={description}
        url={url}
        type="article"
        structuredData={structuredData}
      />
      <GlobalNav mode="landing" />

      <main style={{ flex: 1 }}>
        {/* Breadcrumb */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#75777E" }}>
          <a href="/blog" onClick={(e) => { e.preventDefault(); navigate("/blog"); }}
            style={{ color: "#75777E", textDecoration: "none", transition: "color .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0B1F3A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#75777E")}>
            Blog
          </a>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: categoryColor(category), fontWeight: 500 }}>{category}</span>
        </div>

        {/* Post header */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 24px 0", textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", background: `${categoryColor(category)}14`, color: categoryColor(category), border: `1px solid ${categoryColor(category)}26`, marginBottom: 16 }}>
            {category}
          </span>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.1, fontWeight: 500, color: "#0B1F3A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          <p style={{ fontSize: 17, color: "#44474D", lineHeight: 1.55, maxWidth: 580, margin: "0 auto 20px" }}>
            {description}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 13, color: "#75777E", paddingBottom: 24, borderBottom: "1px solid rgba(11,31,58,.08)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {publishedDate}
            </span>
            <span>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {readingTime} read
            </span>
            <span>·</span>
            <span>Scholar Editorial Team</span>
          </div>
        </div>

        {/* Hero illustration */}
        <div style={{ maxWidth: 860, margin: "32px auto 0", padding: "0 24px" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", height: 260, background: "linear-gradient(135deg, #081529 0%, #0B1F3A 50%, #17345b 100%)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 78% 22%, rgba(255,199,46,.18), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, rgba(255,255,255,.028) 0 1px, transparent 1px 48px)" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(40px,6vw,80px)", color: "rgba(255,199,46,.25)", fontStyle: "italic", lineHeight: 1, userSelect: "none" }}>Scholar</span>
            </div>
          </div>
        </div>

        {/* Article + share rail */}
        <div style={{ maxWidth: 1040, margin: "40px auto 0", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 52px", gap: 48, alignItems: "start" }}
          className="post-grid">

          {/* Article body */}
          <div className="post-body"
            style={{ fontSize: 17, lineHeight: 1.75, color: "#171C1F",
              /* prose overrides */
            }}>
            <style>{`
              .post-body h2 { font-family: 'Newsreader', serif; font-size: 1.6em; font-weight: 600; color: #0B1F3A; margin: 2.2em 0 .6em; letter-spacing: -0.015em; line-height: 1.2; }
              .post-body h3 { font-family: 'Newsreader', serif; font-size: 1.25em; font-weight: 600; color: #0B1F3A; margin: 1.8em 0 .5em; }
              .post-body p { margin: 0 0 1.1em; }
              .post-body ul, .post-body ol { padding-left: 1.4em; margin: 0 0 1.1em; }
              .post-body li { margin-bottom: .5em; }
              .post-body a { color: #0B1F3A; text-decoration: underline; text-decoration-color: #FFC72E; text-decoration-thickness: 2px; text-underline-offset: 3px; }
              .post-body strong { color: #0B1F3A; font-weight: 600; }
              .post-body table { width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: .92em; }
              .post-body th { background: #F0F4F8; padding: 10px 12px; text-align: left; font-size: .8em; font-weight: 600; color: #0B1F3A; letter-spacing: .04em; text-transform: uppercase; }
              .post-body td { padding: 10px 12px; border-bottom: 1px solid rgba(11,31,58,.07); }
              @media (max-width: 720px) { .post-grid { grid-template-columns: 1fr !important; } .post-share-rail { display: none !important; } }
            `}</style>
            {children}
          </div>

          {/* Sticky share rail */}
          <div className="post-share-rail" style={{ position: "sticky", top: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* Copy link */}
            <button onClick={handleCopy} title="Copy link" style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", cursor: "pointer", display: "grid", placeItems: "center", color: copied ? "#2F6D3A" : "#44474D", transition: "all .15s" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            {/* X / Twitter */}
            <button onClick={shareX} title="Share on X" style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", cursor: "pointer", display: "grid", placeItems: "center", color: "#44474D", transition: "all .15s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.836L1.254 2.25H8.08l4.265 5.638 5.899-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            {/* LinkedIn */}
            <button onClick={shareLinkedIn} title="Share on LinkedIn" style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", cursor: "pointer", display: "grid", placeItems: "center", color: "#44474D", transition: "all .15s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </button>
            {/* Bookmark */}
            <button onClick={() => setBookmarked(!bookmarked)} title="Bookmark" style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", cursor: "pointer", display: "grid", placeItems: "center", color: bookmarked ? "#FFC72E" : "#44474D", transition: "all .15s" }}>
              <Bookmark size={16} style={{ fill: bookmarked ? "#FFC72E" : "none" }} />
            </button>
          </div>
        </div>

        {/* Author card */}
        <div style={{ maxWidth: 780, margin: "48px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#F0F4F8", borderRadius: 14, padding: "24px 28px", display: "flex", gap: 20, alignItems: "flex-start", border: "1px solid rgba(11,31,58,.06)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #0B1F3A, #17345b)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "#FFC72E", fontWeight: 600, fontStyle: "italic" }}>S</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#0B1F3A", marginBottom: 2 }}>Scholar Editorial Team</div>
              <div style={{ fontSize: 13, color: "#44474D", lineHeight: 1.5 }}>The Scholar.name editorial team covers research productivity, academic visibility, and the tools shaping modern scholarship.</div>
            </div>
          </div>
        </div>

        {/* Related posts */}
        <div style={{ maxWidth: 780, margin: "48px auto 0", padding: "0 24px" }}>
          <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "#0B1F3A", fontWeight: 600, margin: "0 0 18px" }}>More from the Journal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="related-grid">
            <style>{`.related-grid { } @media (max-width: 560px) { .related-grid { grid-template-columns: 1fr !important; } }`}</style>
            {[
              { cat: "Methods", title: "Building a Reproducible Research Workflow", slug: "reproducible-research-workflow" },
              { cat: "Analytics", title: "Understanding Your h-Index and What It Really Means", slug: "understanding-h-index" },
            ].map(({ cat, title: t, slug }) => (
              <a key={slug} href={`/blog/${slug}`}
                onClick={(e) => { e.preventDefault(); navigate(`/blog/${slug}`); }}
                style={{ background: "#fff", border: "1px solid rgba(11,31,58,.08)", borderRadius: 12, padding: "18px 20px", textDecoration: "none", display: "block", transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px -8px rgba(11,31,58,.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = ""; }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: categoryColor(cat), display: "block", marginBottom: 6 }}>{cat}</span>
                <span style={{ fontSize: 15, color: "#0B1F3A", fontFamily: "'Newsreader', serif", fontWeight: 500, lineHeight: 1.3 }}>{t}</span>
              </a>
            ))}
          </div>
        </div>

        {/* CTA band */}
        <div style={{ margin: "60px 0 0", background: "linear-gradient(135deg, #081529 0%, #0B1F3A 60%, #17345b 100%)", padding: "64px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 48px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto" }}>
            <span style={{ display: "inline-block", fontFamily: "'Newsreader', serif", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, marginBottom: 16 }}>Scholar.name</span>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(26px,4vw,38px)", color: "#fff", fontWeight: 500, lineHeight: 1.12, margin: "0 0 14px", letterSpacing: "-0.015em" }}>
              Build your own research <em style={{ fontStyle: "italic", color: "#FFC72E" }}>portfolio</em>.
            </h2>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: 15, lineHeight: 1.55, margin: "0 0 28px" }}>
              Join researchers who've replaced outdated faculty pages with a living, auto-updated portfolio — in under 5 minutes.
            </p>
            <button onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#FFC72E", color: "#6F5400", borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: "inherit", border: "none", cursor: "pointer", letterSpacing: ".01em" }}>
              Start Free — No Credit Card Needed
            </button>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
