import {
  BarChart3,
  Download,
  Globe,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PRICING } from "@shared/pricing";

export const marketingFeatures = [
  {
    icon: RefreshCw,
    title: "Auto-Sync Publications",
    description: "Your profile checks OpenAlex monthly for newly indexed publications - no manual entry or copy-paste.",
  },
  {
    icon: BarChart3,
    title: "Citation Analytics",
    description: "Interactive citation trends, h-index growth, and publication timelines show your impact at a glance.",
  },
  {
    icon: Globe,
    title: "Shareable Academic URL",
    description: "Use yourname.scholar.name or connect your own domain for grants, conferences, and email signatures.",
  },
  {
    icon: Palette,
    title: "Customizable Themes",
    description: "Choose a professionally designed theme that fits your academic identity and personal brand.",
  },
  {
    icon: Users,
    title: "Co-Author Network",
    description: "See co-author connections and institutional relationships across your publication history.",
  },
  {
    icon: Download,
    title: "Research Passport",
    description: "Download a polished summary for tenure packets, grant appendices, and job applications.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Controls",
    description: "Control what is visible and report publication metadata that needs correction at its source.",
  },
  {
    icon: Sparkles,
    title: "Search-Ready Metadata",
    description: "Structured metadata and social previews help your portfolio appear clearly when shared or indexed.",
  },
] as const;

export const homepageFeatures = marketingFeatures.slice(0, 3);

export const pricingPlans = [
  {
    name: "Starter",
    monthlyPrice: PRICING.starter.monthly,
    yearlyPrice: PRICING.starter.yearly,
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
    monthlyPrice: PRICING.pro.monthly,
    yearlyPrice: PRICING.pro.yearly,
    yearlySavings: 48,
    description: "For established academics",
    features: [
      "Everything in Starter",
      "Custom domain (yourname.com)",
      "Research Passport download",
      "Priority support",
    ],
    highlighted: true,
  },
] as const;
