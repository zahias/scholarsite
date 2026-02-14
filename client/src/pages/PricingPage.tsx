import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 9.99,
    yearlyPrice: 95.88,
    yearlySavings: 24,
    description: "Perfect for individual researchers",
    features: [
      "scholar.name subdomain",
      "Publication analytics",
      "Color themes",
      "Monthly data sync",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 19.99,
    yearlyPrice: 191.88,
    yearlySavings: 48,
    description: "For established academics",
    features: [
      "Everything in Starter",
      "Custom domain (yourname.com)",
      "Research Passport download",
      "Collaboration Map",
      "Weekly data sync",
      "Priority support",
    ],
    highlighted: true,
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Pricing — Scholar.name"
        description="Simple, transparent pricing for professional research portfolios. Start with a 14-day free trial — no credit card required."
        url="https://scholar.name/pricing"
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>
        </section>

        {/* Toggle + Plans */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  Save 2 months
                </Badge>
              </span>
            </div>

            {/* Plan cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {plans.map((plan, i) => (
                <Card
                  key={i}
                  className={`relative ${plan.highlighted ? "border-2 border-primary shadow-lg" : "border bg-white"}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                      {isYearly && (
                        <p className="text-sm text-green-600 mt-1">Save ${plan.yearlySavings}</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => {
                        window.scrollTo(0, 0);
                        navigate(`/signup?plan=${plan.name.toLowerCase()}`);
                      }}
                    >
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison note */}
            <p className="text-center text-sm text-muted-foreground mt-10 max-w-lg mx-auto">
              Both plans include a 14-day free trial with full access.
              Cancel anytime — your profile stays active until the billing period ends.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Have questions before you start?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/faq");
                }}
              >
                Read the FAQ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/contact");
                }}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter mode="landing" />
    </div>
  );
}
