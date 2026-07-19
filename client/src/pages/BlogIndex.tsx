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
    date: "July 8, 2026",
    readingTime: "6 min",
  },
  {
    slug: "what-is-h-index",
    title: "What Is an H-Index and How Do You Track It?",
    excerpt: "The h-index is one of the most cited metrics in academic hiring and grant evaluation. Here's what it means, how it's calculated, and how to monitor yours automatically.",
    category: "Academic Metrics",
    date: "June 22, 2026",
    readingTime: "5 min",
  },
  {
    slug: "how-to-create-academic-portfolio",
    title: "How to Create an Academic Portfolio Website (Step by Step)",
    excerpt: "A complete guide to building a professional academic portfolio — what to include, which tools to choose, and how to keep it updated without spending hours on maintenance.",
    category: "How-To Guide",
    date: "June 3, 2026",
    readingTime: "7 min",
  },
  {
    slug: "best-website-builders-researchers",
    title: "Best Personal Website Builders for Researchers in 2026",
    excerpt: "Comparing WordPress, Squarespace, Google Sites, ORCID, and Scholar.name — across setup time, cost, design quality, and the one feature most tools miss.",
    category: "Comparison",
    date: "May 14, 2026",
    readingTime: "5 min",
  },
  {
    slug: "academic-cv-vs-research-portfolio",
    title: "Academic CV vs. Research Portfolio Website: What's the Difference?",
    excerpt: "Your CV and your portfolio website serve different audiences at different moments. Here's how to think about both — and why every researcher needs each one.",
    category: "Career Advice",
    date: "April 29, 2026",
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
      className={`bg-white border border-midnight/[.08] rounded-[14px] overflow-hidden cursor-pointer transition-[transform,box-shadow] duration-200 ${hovered ? "-translate-y-1 shadow-[0_16px_40px_-16px_rgba(11,31,58,.16)]" : "shadow-[0_2px_8px_-2px_rgba(11,31,58,.06)]"}`}>
      {/* Thumbnail */}
      <div className="h-[140px] border-b border-midnight/[.06] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${catColor(post.category)}22 0%, ${catColor(post.category)}0a 100%)` }}>
        <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg, ${catColor(post.category)}08 0 1px, transparent 1px 36px), repeating-linear-gradient(90deg, ${catColor(post.category)}08 0 1px, transparent 1px 36px)` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-5xl italic leading-none select-none" style={{ color: `${catColor(post.category)}20` }}>S</span>
        </div>
      </div>
      <div className="px-5 pt-[18px] pb-5">
        <span className="inline-block text-[10.5px] font-bold tracking-[.14em] uppercase rounded-full mb-2.5 px-[9px] py-[3px]" style={{ color: catColor(post.category), background: `${catColor(post.category)}14` }}>
          {post.category}
        </span>
        <h2 className="font-serif text-[17px] font-medium text-midnight leading-[1.3] mb-2 tracking-[-0.01em]">
          {post.title}
        </h2>
        <p className="text-[13.5px] text-[#44474D] leading-[1.55] mb-3.5">{post.excerpt}</p>
        <div className="flex gap-3 text-xs text-[#75777E]">
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
          <div className="public-masthead-inner text-left">
            <span className="public-eyebrow">
              The Scholar Journal
            </span>
            <h1 className="public-title max-w-[640px]" style={{ fontSize: "clamp(36px,5vw,64px)" }}>
              Research, visibility, and <em className="italic text-warm">craft</em>.
            </h1>
            <p className="public-copy max-w-[480px] m-0">
              Practical guides on academic portfolios, research metrics, and career development — for researchers at every stage.
            </p>
          </div>
        </section>

        {/* Category tabs */}
        <div className="border-b border-midnight/[.08] bg-white sticky top-[60px] z-10">
          <div className="max-w-[1280px] mx-auto px-8 flex gap-1 overflow-x-auto">
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-3.5 text-[13.5px] whitespace-nowrap transition-colors duration-150 -mb-px ${activeCategory === cat ? "font-semibold text-midnight border-b-2 border-warm" : "font-normal text-[#44474D] border-b-2 border-transparent"} bg-transparent border-t-0 border-x-0 cursor-pointer`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <section className="public-section pt-12 pb-[72px]">
        <div className="public-container-lg">

          {/* Featured story */}
          {featured && (
            <div className="mb-14">
              <div className="text-[11px] tracking-[.18em] uppercase text-[#75777E] font-semibold mb-4">Featured</div>
              <article
                onClick={() => { window.scrollTo(0, 0); navigate("/blog/" + featured.slug); }}
                className="public-card featured-card overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-[0_20px_50px_-16px_rgba(11,31,58,.18)]"
                style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr" }}>
                <style>{`@media (max-width: 720px) { .featured-card { grid-template-columns: 1fr !important; } }`}</style>
                {/* Illustration */}
                <div className="min-h-[260px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #142850 100%)" }}>
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 20%, rgba(255,199,46,.22), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 48px)" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-serif text-8xl italic leading-none text-warm/20">S</span>
                  </div>
                </div>
                {/* Content */}
                <div className="pt-9 pr-9 pb-9 pl-8 bg-white flex flex-col justify-center">
                  <span className="inline-block self-start text-[10.5px] font-bold tracking-[.14em] uppercase rounded-full mb-3.5 px-[9px] py-[3px]" style={{ color: catColor(featured.category), background: `${catColor(featured.category)}14` }}>
                    {featured.category}
                  </span>
                  <h2 className="font-serif font-medium text-midnight leading-[1.2] mb-3 tracking-[-0.015em]" style={{ fontSize: "clamp(20px,2.4vw,28px)" }}>
                    {featured.title}
                  </h2>
                  <p className="text-[14.5px] text-[#44474D] leading-relaxed mb-5">{featured.excerpt}</p>
                  <div className="flex gap-3 text-[12.5px] text-[#75777E]">
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
            <p className="text-center text-[#75777E] py-12 text-[15px]">No articles in this category yet — check back soon.</p>
          )}
        </div>
        </section>

        {/* Newsletter band */}
        <div className="bg-[#F0F4F8] border-t border-midnight/[.06] px-8 py-[60px]">
          <div className="max-w-[520px] mx-auto text-center">
            <span className="font-serif text-[11px] tracking-[.22em] uppercase text-[#6F5400] font-semibold block mb-3">Newsletter</span>
            <h2 className="font-serif font-medium text-midnight mb-2.5 tracking-[-0.015em]" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              Get the digest.
            </h2>
            <p className="text-[#44474D] text-[15px] leading-[1.55] mb-6">New articles, academic career tips, and research visibility insights — delivered monthly.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-[400px] mx-auto newsletter-form">
              <style>{`@media (max-width: 480px) { .newsletter-form { flex-direction: column !important; } .newsletter-form button { width: 100% !important; } }`}</style>
              <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="you@university.edu"
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-midnight/[.14] outline-none text-[#171C1F] bg-white" />
              <button type="submit"
                className="px-5 py-2.5 bg-midnight text-white rounded-lg text-sm font-semibold border-none cursor-pointer whitespace-nowrap">
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
