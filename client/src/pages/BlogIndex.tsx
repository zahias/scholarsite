import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import SEO from "@/components/SEO";

const posts = [
  {
    slug: "google-scholar-vs-scholar-name",
    title: "Google Scholar Profile vs. Scholar.name: Which Is Better for Researchers?",
    excerpt: "Google Scholar is the default for academics — but it was never designed as a portfolio. Here's what it can't do, and how Scholar.name fills the gap.",
    category: "Comparison",
    date: "April 2, 2026",
    readingTime: "6 min",
  },
  {
    slug: "what-is-h-index",
    title: "What Is an H-Index and How Do You Track It?",
    excerpt: "The h-index is one of the most cited metrics in academic hiring and grant evaluation. Here's what it means, how it's calculated, and how to monitor yours automatically.",
    category: "Academic Metrics",
    date: "April 2, 2026",
    readingTime: "5 min",
  },
  {
    slug: "how-to-create-academic-portfolio",
    title: "How to Create an Academic Portfolio Website (Step by Step)",
    excerpt: "A complete guide to building a professional academic portfolio — what to include, which tools to choose, and how to keep it updated without spending hours on maintenance.",
    category: "How-To Guide",
    date: "April 2, 2026",
    readingTime: "7 min",
  },
  {
    slug: "best-website-builders-researchers",
    title: "Best Personal Website Builders for Researchers in 2026",
    excerpt: "Comparing WordPress, Squarespace, Google Sites, ORCID, and Scholar.name — across setup time, cost, design quality, and the one feature most tools miss.",
    category: "Comparison",
    date: "April 2, 2026",
    readingTime: "5 min",
  },
  {
    slug: "academic-cv-vs-research-portfolio",
    title: "Academic CV vs. Research Portfolio Website: What's the Difference?",
    excerpt: "Your CV and your portfolio website serve different audiences at different moments. Here's how to think about both — and why every researcher needs each one.",
    category: "Career Advice",
    date: "April 2, 2026",
    readingTime: "4 min",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Comparison": "#0B1F3A",
  "Academic Metrics": "#001F41",
  "How-To Guide": "#7AA874",
  "Career Advice": "#6F5400",
  "Tools": "#6F5400",
  "All": "#0B1F3A",
};

const allCategories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#0B1F3A";
}

function PostCard({ post, onClick }: { post: typeof posts[number]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1px solid rgba(11,31,58,.08)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform .2s, box-shadow .2s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 16px 40px -16px rgba(11,31,58,.16)" : "0 2px 8px -2px rgba(11,31,58,.06)",
      }}>
      {/* Thumbnail */}
      <div style={{ height: 140, background: `linear-gradient(135deg, ${catColor(post.category)}22 0%, ${catColor(post.category)}0a 100%)`, borderBottom: "1px solid rgba(11,31,58,.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, ${catColor(post.category)}08 0 1px, transparent 1px 36px), repeating-linear-gradient(90deg, ${catColor(post.category)}08 0 1px, transparent 1px 36px)` }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Newsreader', serif", fontSize: 48, color: `${catColor(post.category)}20`, fontStyle: "italic", lineHeight: 1, userSelect: "none" }}>J</span>
        </div>
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: catColor(post.category), background: `${catColor(post.category)}14`, padding: "3px 9px", borderRadius: 999, marginBottom: 10 }}>
          {post.category}
        </span>
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 500, color: "#0B1F3A", lineHeight: 1.3, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          {post.title}
        </h2>
        <p style={{ fontSize: 13.5, color: "#44474D", lineHeight: 1.55, margin: "0 0 14px" }}>{post.excerpt}</p>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#75777E" }}>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readingTime} read</span>
        </div>
      </div>
    </article>
  );
}

export default function BlogIndex() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  const [featured, ...rest] = filtered;

  return (
    <div className="public-page">
      <SEO
        title="Blog — Scholar.name | Research Portfolio & Academic Career Resources"
        description="Practical guides on academic portfolios, research metrics, career visibility, and how to stand out as a researcher online."
        url="https://scholar.name/blog"
        type="website"
      />
      <GlobalNav mode="landing" />

      <main className="public-main">
        {/* Masthead */}
        <section className="public-masthead">
          <div className="public-masthead-inner" style={{ textAlign: "left" }}>
            <span className="public-eyebrow">
              The Scholar Journal
            </span>
            <h1 className="public-title" style={{ fontSize: "clamp(36px,5vw,64px)", maxWidth: 640 }}>
              Research, visibility, and <em style={{ fontStyle: "italic", color: "#FFC72E" }}>craft</em>.
            </h1>
            <p className="public-copy" style={{ maxWidth: 480, margin: 0 }}>
              Practical guides on academic portfolios, research metrics, and career development — for researchers at every stage.
            </p>
          </div>
        </section>

        {/* Category tabs */}
        <div style={{ borderBottom: "1px solid rgba(11,31,58,.08)", background: "#fff", position: "sticky", top: 60, zIndex: 10 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", gap: 4, overflowX: "auto" }}>
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "13px 16px",
                  fontSize: 13.5,
                  fontWeight: activeCategory === cat ? 600 : 400,
                  color: activeCategory === cat ? "#0B1F3A" : "#44474D",
                  background: "none",
                  border: "none",
                  borderBottom: activeCategory === cat ? "2px solid #FFC72E" : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "color .15s",
                  marginBottom: -1,
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <section className="public-section" style={{ paddingTop: 48, paddingBottom: 72 }}>
        <div className="public-container-lg">

          {/* Featured story */}
          {featured && (
            <div style={{ marginBottom: 56 }}>
              <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "#75777E", fontWeight: 600, marginBottom: 16 }}>Featured</div>
              <article
                onClick={() => { window.scrollTo(0, 0); navigate("/blog/" + featured.slug); }}
                className="public-card featured-card"
                style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", overflow: "hidden", cursor: "pointer", transition: "box-shadow .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 20px 50px -16px rgba(11,31,58,.18)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                <style>{`@media (max-width: 720px) { .featured-card { grid-template-columns: 1fr !important; } }`}</style>
                {/* Illustration */}
                <div style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #142850 100%)", minHeight: 260, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 20%, rgba(255,199,46,.22), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 48px)" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Newsreader', serif", fontSize: 80, color: "rgba(255,199,46,.2)", fontStyle: "italic", lineHeight: 1 }}>J</span>
                  </div>
                </div>
                {/* Content */}
                <div style={{ padding: "36px 36px 36px 32px", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: catColor(featured.category), background: `${catColor(featured.category)}14`, padding: "3px 9px", borderRadius: 999, marginBottom: 14, alignSelf: "flex-start" }}>
                    {featured.category}
                  </span>
                  <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(20px,2.4vw,28px)", fontWeight: 500, color: "#0B1F3A", lineHeight: 1.2, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
                    {featured.title}
                  </h2>
                  <p style={{ fontSize: 14.5, color: "#44474D", lineHeight: 1.6, margin: "0 0 20px" }}>{featured.excerpt}</p>
                  <div style={{ display: "flex", gap: 12, fontSize: 12.5, color: "#75777E" }}>
                    <span>{featured.date}</span><span>·</span><span>{featured.readingTime} read</span>
                  </div>
                </div>
              </article>
            </div>
          )}

          {/* Post grid */}
          {rest.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="post-grid">
              <style>{`@media (max-width: 1120px) { .post-grid { grid-template-columns: repeat(3, 1fr) !important; } } @media (max-width: 900px) { .post-grid { grid-template-columns: repeat(2, 1fr) !important; } } @media (max-width: 560px) { .post-grid { grid-template-columns: 1fr !important; } }`}</style>
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} onClick={() => { window.scrollTo(0, 0); navigate("/blog/" + post.slug); }} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: "#75777E", padding: "48px 0", fontSize: 15 }}>No articles in this category yet — check back soon.</p>
          )}
        </div>
        </section>

        {/* Newsletter band */}
        <div style={{ background: "#F0F4F8", borderTop: "1px solid rgba(11,31,58,.06)", padding: "60px 32px" }}>
          <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 600, display: "block", marginBottom: 12 }}>Newsletter</span>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px", letterSpacing: "-0.015em" }}>
              Get the digest.
            </h2>
            <p style={{ color: "#44474D", fontSize: 15, lineHeight: 1.55, margin: "0 0 24px" }}>New articles, academic career tips, and research visibility insights — delivered monthly.</p>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }} className="newsletter-form">
              <style>{`@media (max-width: 480px) { .newsletter-form { flex-direction: column !important; } .newsletter-form button { width: 100% !important; } }`}</style>
              <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="you@university.edu"
                style={{ flex: 1, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", borderRadius: 8, border: "1px solid rgba(11,31,58,.14)", outline: "none", color: "#171C1F", background: "#fff" }} />
              <button type="submit"
                style={{ padding: "11px 20px", background: "#0B1F3A", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
