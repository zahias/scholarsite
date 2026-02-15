import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import {
  RefreshCw,
  BarChart3,
  Globe,
  Sparkles,
  Palette,
  Download,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: RefreshCw,
    title: "Auto-Sync Publications",
    description:
      "Your publications update automatically from OpenAlex — the open index of 250M+ scholarly works. No manual entry, no copy-paste.",
  },
  {
    icon: BarChart3,
    title: "Citation Analytics",
    description:
      "Interactive charts showing citation trends, h-index growth, and publication timeline. See your research impact at a glance.",
  },
  {
    icon: Globe,
    title: "Shareable URL",
    description:
      "Get yourname.scholar.name or connect your own domain. A clean, memorable link for email signatures, grants, and conferences.",
  },
  {
    icon: Palette,
    title: "Customizable Themes",
    description:
      "Choose from professionally designed color themes to match your personal brand. Your portfolio, your style.",
  },
  {
    icon: Users,
    title: "Co-Author Network",
    description:
      "See your co-author connections and institutional relationships at a glance. Great for discovering shared research interests.",
  },
  {
    icon: Download,
    title: "Research Passport",
    description:
      "Download a polished PDF summary of your profile — perfect for tenure packets, grant appendices, and job applications.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Controls",
    description:
      "You decide what's visible. Hide sections, report misattributed papers, and control who sees your analytics.",
  },
  {
    icon: Sparkles,
    title: "AI-Ready Metadata",
    description:
      "Structured data and OpenGraph tags ensure your profile looks great when shared on social media, Slack, or in search results.",
  },
];

export default function FeaturesPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Features — Scholar.name"
        description="Auto-syncing publications, citation analytics, customizable themes, collaboration maps, and more. See everything Scholar.name offers researchers."
        url="https://scholar.name/features"
        type="website"
      />

      <GlobalNav mode="landing" />

      <main className="flex-1">
        {/* Hero */}
        <section className="landing-hero py-16 lg:py-20 relative">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to showcase your research
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              From automatic publication syncing to downloadable Research Passports — built by academics, for academics.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <Card
                  key={i}
                  className="group border bg-white shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to build your portfolio?
            </h2>
            <p className="text-muted-foreground mb-8">
              14-day free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="btn-premium px-8"
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/signup");
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your Portfolio
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/pricing");
                }}
              >
                View Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter mode="landing" />
    </div>
  );
}
