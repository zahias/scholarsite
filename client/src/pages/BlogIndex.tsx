import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import SEO from "@/components/SEO";

const posts = [
  {
    slug: "google-scholar-vs-scholar-name",
    title: "Google Scholar Profile vs. Scholar.name: Which Is Better for Researchers?",
    excerpt:
      "Google Scholar is the default for academics — but it was never designed as a portfolio. Here's what it can't do, and how Scholar.name fills the gap.",
    category: "Comparison",
    date: "April 2, 2026",
    readingTime: "6 min",
  },
  {
    slug: "what-is-h-index",
    title: "What Is an H-Index and How Do You Track It?",
    excerpt:
      "The h-index is one of the most cited metrics in academic hiring and grant evaluation. Here's what it means, how it's calculated, and how to monitor yours automatically.",
    category: "Academic Metrics",
    date: "April 2, 2026",
    readingTime: "5 min",
  },
  {
    slug: "how-to-create-academic-portfolio",
    title: "How to Create an Academic Portfolio Website (Step by Step)",
    excerpt:
      "A complete guide to building a professional academic portfolio — what to include, which tools to choose, and how to keep it updated without spending hours on maintenance.",
    category: "How-To Guide",
    date: "April 2, 2026",
    readingTime: "7 min",
  },
  {
    slug: "best-website-builders-researchers",
    title: "Best Personal Website Builders for Researchers in 2026",
    excerpt:
      "Comparing WordPress, Squarespace, Google Sites, ORCID, and Scholar.name — across setup time, cost, design quality, and the one feature most tools miss.",
    category: "Comparison",
    date: "April 2, 2026",
    readingTime: "5 min",
  },
  {
    slug: "academic-cv-vs-research-portfolio",
    title: "Academic CV vs. Research Portfolio Website: What's the Difference?",
    excerpt:
      "Your CV and your portfolio website serve different audiences at different moments. Here's how to think about both — and why every researcher needs each one.",
    category: "Career Advice",
    date: "April 2, 2026",
    readingTime: "4 min",
  },
];

export default function BlogIndex() {
  const [, navigate] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Blog — Scholar.name | Research Portfolio & Academic Career Resources"
        description="Practical guides on academic portfolios, research metrics, career visibility, and how to stand out as a researcher online."
        url="https://scholar.name/blog"
        type="website"
      />
      <GlobalNav mode="landing" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-12">
          <Badge variant="scholarly-label" className="mb-4">Resources</Badge>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-midnight mb-4">
            The Scholar.name Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Guides on research visibility, academic portfolios, and career development for
            researchers at every stage.
          </p>
        </div>

        <div className="space-y-5">
          {posts.map((post) => (
            <Card
              key={post.slug}
              className="cursor-pointer group hover:ambient-shadow transition-all"
              onClick={() => { window.scrollTo(0, 0); navigate("/blog/" + post.slug); }}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{post.readingTime}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{post.date}
                      </span>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-midnight mb-2 group-hover:text-primary-container transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-container transition-colors flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <GlobalFooter mode="landing" />
    </div>
  );
}
