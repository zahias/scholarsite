import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Sparkles } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import SEO from "@/components/SEO";

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
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title + " — Scholar.name Blog"}
        description={description}
        url={url}
        type="article"
        structuredData={structuredData}
      />
      <GlobalNav mode="landing" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Button
          variant="ghost"
          className="mb-8 -ml-2"
          onClick={() => { window.scrollTo(0, 0); navigate("/blog"); }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          All Articles
        </Button>

        <div className="mb-10">
          <Badge variant="scholarly-label" className="mb-4">{category}</Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-midnight leading-tight mb-5">
            {title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b border-border pb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />{publishedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />{readingTime} read
            </span>
          </div>
        </div>

        <article className="prose prose-lg max-w-none space-y-5 text-base leading-relaxed
          prose-headings:font-serif prose-headings:text-midnight
          prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-foreground prose-p:leading-relaxed
          prose-a:text-primary-container prose-a:underline prose-a:underline-offset-2
          prose-strong:text-midnight prose-strong:font-semibold
          prose-ul:space-y-2 prose-li:text-foreground
          prose-table:w-full prose-thead:bg-surface-container-low
          prose-th:p-3 prose-th:text-left prose-th:text-sm prose-th:font-semibold prose-th:text-midnight
          prose-td:p-3 prose-td:text-sm prose-td:border-b prose-td:border-border">
          {children}
        </article>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-midnight text-center">
          <h2 className="text-2xl font-serif font-bold text-white mb-3">
            Ready to create your portfolio?
          </h2>
          <p className="text-white/70 mb-5 text-sm max-w-sm mx-auto">
            Join researchers who&rsquo;ve replaced outdated faculty pages with a living, auto-updated
            portfolio &mdash; in under 5 minutes.
          </p>
          <Button
            variant="primary-cta"
            size="lg"
            onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Free &mdash; No Credit Card Needed
          </Button>
        </div>
      </main>
      <GlobalFooter mode="landing" />
    </div>
  );
}
