import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import {
  Search,
  Check,
  RefreshCw,
  BarChart3,
  Globe,
  GraduationCap,
  FlaskConical,
  Building2,
  ChevronDown,
  Loader2,
  BookOpen,
  Lock,
  Zap,
  Mail,
  FileText,
  Handshake,
  ArrowRight,
} from "lucide-react";

// ───── Types ─────
interface AuthorSearchResult {
  id: string;
  display_name: string;
  hint: string;
  works_count: number;
  cited_by_count: number;
}
interface SearchResponse {
  results: AuthorSearchResult[];
}

// ───── Static data ─────
const faqs = [
  {
    question: "Where does the publication data come from?",
    answer:
      "All publication data comes from OpenAlex, a free and open index of 250\u202fM+ scholarly works. Your profile syncs automatically. You can report issues directly from your profile.",
  },
  {
    question: "How accurate is the publication matching?",
    answer:
      "OpenAlex uses advanced algorithms, but no system is perfect for common names. You can see all attributed publications and report any that don\u2019t belong to you.",
  },
  {
    question: "Can I edit my publications?",
    answer:
      "You control your bio, photo, themes, and featured works. The publication list comes from OpenAlex \u2014 we\u2019ll guide you through requesting corrections if needed.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes! Pro plan includes custom domains (yourname.com). Starter uses yourname.scholar.name. Both are professional and memorable.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Cancel anytime. Your profile stays active until the billing period ends, then becomes private (not deleted). Reactivate anytime.",
  },
];

const features = [
  {
    icon: RefreshCw,
    title: "Auto-updated publications",
    description:
      "Your publication list stays current automatically. New papers appear on your profile without lifting a finger.",
  },
  {
    icon: BarChart3,
    title: "Impact visualizations",
    description:
      "Beautiful charts showing citation trends, h-index growth, and research topic maps that bring your work to life.",
  },
  {
    icon: Globe,
    title: "Your own academic URL",
    description:
      "Get yourname.scholar.name \u2014 a clean, professional link for email signatures, CVs, and conference bios.",
  },
];

const personas = [
  {
    icon: GraduationCap,
    title: "PhD students",
    desc: "Build your first web presence before the job market opens up.",
  },
  {
    icon: FlaskConical,
    title: "Postdocs",
    desc: "A professional link for every grant application and lab introduction.",
  },
  {
    icon: Building2,
    title: "Faculty",
    desc: "Replace your outdated university page with something you\u2019re proud to share.",
  },
  {
    icon: Globe,
    title: "Global researchers",
    desc: "A professional presence at a fraction of the cost of Western alternatives.",
  },
];

const useCases = [
  {
    icon: Mail,
    title: "Email signature",
    desc: "A clean, memorable link instead of an ugly Google Scholar URL.",
  },
  {
    icon: FileText,
    title: "Grant applications",
    desc: 'A professional portfolio when they ask for your \u201cpersonal website.\u201d',
  },
  {
    icon: Handshake,
    title: "Collaboration",
    desc: "Potential co-authors see your research areas and top papers instantly.",
  },
];

const testimonials = [
  {
    quote:
      "I used to send people a 10-item Google Scholar URL. Now I just say scholar.name/rnakamoto. Set it up in one afternoon.",
    name: "R. Nakamoto",
    role: "Postdoc, Computational Biology",
  },
  {
    quote:
      "My university page hadn\u2019t been updated in 4 years. Scholar.name auto-syncs from OpenAlex and looks 10\u00d7 better than anything our IT department would build.",
    name: "Prof. S. Bergmann",
    role: "Associate Professor, Materials Science",
  },
  {
    quote:
      "I was about to pay $400 for Academia.edu. Found Scholar.name the same day. $9.99/month and it does more than I actually need.",
    name: "D. Osei",
    role: "PhD Candidate, Environmental Studies",
  },
];

const pricingPlans = [
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
      "Weekly data sync",
      "Priority support",
    ],
    highlighted: true,
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Scholar.name",
  applicationCategory: "WebApplication",
  description: "Professional research portfolio platform for academics.",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "9.99",
    highPrice: "19.99",
    priceCurrency: "USD",
    offerCount: "2",
  },
};

// Citation bars data
const citationBars = [
  { year: "'18", pct: 22 },
  { year: "'19", pct: 34 },
  { year: "'20", pct: 48 },
  { year: "'21", pct: 42 },
  { year: "'22", pct: 60 },
  { year: "'23", pct: 76 },
  { year: "'24", pct: 88, hi: true },
  { year: "'25", pct: 95, hi: true },
];

// ───── Component ─────
export default function LandingPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResponse>({
    queryKey: ["/api/openalex/autocomplete", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(
        "/api/openalex/autocomplete?q=" + encodeURIComponent(debouncedQuery),
      );
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelectAuthor = useCallback(
    (authorId: string) => {
      setShowResults(false);
      setSearchQuery("");
      window.scrollTo(0, 0);
      navigate("/researcher/" + authorId);
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const results = searchResults?.results || [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelectAuthor(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  const resultsListId = "hero-search-results";
  const activeDescendant = selectedIndex >= 0 ? "search-result-" + selectedIndex : undefined;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Scholar.name — Academic Portfolio Website for Researchers"
        description="Professional research portfolios for academics. Showcase publications, citations & impact — auto-updated from OpenAlex."
        url="https://scholar.name"
        type="website"
        structuredData={structuredData}
      />

      <GlobalNav mode="landing" />

      <main id="main-content">

        {/* ═══════ HERO ═══════ */}
        <section
          className="relative overflow-hidden flex items-center hero-section"
          style={{
            background: "linear-gradient(135deg,#081529 0%,#0B1F3A 45%,#17345b 100%)",
            color: "#fff",
            padding: "110px 0 120px",
            minHeight: "640px",
          }}
          aria-labelledby="hero-heading"
        >
          {/* Grid + glow overlay */}
          <div className="landing-hero-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
          {/* Orbs */}
          <div
            className="absolute pointer-events-none rounded-full"
            aria-hidden="true"
            style={{
              width: 460, height: 460, top: -120, right: -100,
              background: "radial-gradient(circle,rgba(255,199,46,.22),transparent 68%)",
              filter: "blur(90px)",
            }}
          />
          <div
            className="absolute pointer-events-none rounded-full"
            aria-hidden="true"
            style={{
              width: 340, height: 340, bottom: -80, left: -60,
              background: "radial-gradient(circle,rgba(100,140,210,.18),transparent 70%)",
              filter: "blur(90px)",
            }}
          />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-8">
            <div className="text-center max-w-[920px] mx-auto">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full border border-white/15 bg-white/8 text-[12px] text-white/80">
                <span
                  className="rounded-full"
                  style={{
                    width: 6, height: 6, flexShrink: 0,
                    background: "#FFC72E",
                    boxShadow: "0 0 10px rgba(255,199,46,.8)",
                    display: "inline-block",
                  }}
                />
                Auto-synced with OpenAlex · 250M+ works
              </div>

              <h1
                id="hero-heading"
                className="font-serif font-medium text-white mb-5"
                style={{
                  fontSize: "clamp(42px,6vw,80px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.025em",
                }}
              >
                Your research, one link,{" "}
                <em className="font-serif not-italic" style={{ color: "#FFC72E", fontStyle: "italic", fontWeight: 500 }}>
                  always up to date
                </em>
              </h1>

              <p className="mb-8 text-white/72" style={{ fontSize: 18, maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.55 }}>
                Scholar.name creates a professional academic portfolio from your publications — no manual entry, no maintenance.
              </p>

              <div className="flex gap-3 justify-center items-center flex-wrap mb-8">
                <button
                  className="btn-gold inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-[15px] font-semibold"
                  onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
                  data-testid="button-free-trial"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3l1.9 5.8L20 9l-4.8 3.5L17 19l-5-3.6L7 19l1.8-6.5L4 9l6.1-.2z"/>
                  </svg>
                  Create your portfolio
                </button>
                <button
                  className="text-white/70 hover:text-white text-[14px] transition-colors underline underline-offset-4"
                  onClick={() => { window.scrollTo(0, 0); navigate("/researcher/A5037710835"); }}
                >
                  View a demo profile →
                </button>
              </div>

              {/* Search bar */}
              <div className="relative max-w-[580px] mx-auto" ref={searchRef}>
                <div
                  className="flex items-center gap-3 rounded-[14px] bg-white"
                  style={{ padding: "6px 6px 6px 18px", boxShadow: "0 20px 60px -20px rgba(0,0,0,.5)" }}
                >
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for any researcher by name…"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); setSelectedIndex(-1); }}
                    onFocus={() => setShowResults(true)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border-0 outline-none text-[15px] text-gray-900 bg-transparent py-3.5 font-sans"
                    role="combobox"
                    aria-expanded={showResults && searchQuery.length >= 2}
                    aria-controls={resultsListId}
                    aria-activedescendant={activeDescendant}
                    aria-autocomplete="list"
                    aria-label="Search for any researcher by name"
                    data-testid="input-researcher-search"
                  />
                  {isSearching
                    ? <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2 flex-shrink-0" aria-hidden="true" />
                    : (
                      <button
                        className="btn-navy px-4 py-2.5 rounded-lg text-[14px] font-semibold"
                        onClick={() => { if (searchResults?.results?.[0]) handleSelectAuthor(searchResults.results[0].id); }}
                        aria-label="Search"
                      >
                        Search
                      </button>
                    )
                  }
                </div>

                {showResults && searchQuery.length >= 2 && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] overflow-hidden text-left z-40"
                    style={{ boxShadow: "0 20px 60px -20px rgba(0,0,0,.4)" }}
                  >
                    {isSearching ? (
                      <div className="p-6 text-center" role="status">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0B1F3A]" />
                        <p className="text-gray-500 text-sm">Searching researchers…</p>
                      </div>
                    ) : searchResults?.results && searchResults.results.length > 0 ? (
                      <ul id={resultsListId} role="listbox" aria-label="Researcher search results">
                        {searchResults.results.map((r, i) => (
                          <li
                            key={r.id}
                            id={"search-result-" + i}
                            role="option"
                            aria-selected={i === selectedIndex}
                            className={
                              "flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 cursor-pointer transition-colors " +
                              (i === selectedIndex ? "bg-[#F0F4F8]" : "hover:bg-[#F0F4F8]")
                            }
                            onClick={() => handleSelectAuthor(r.id)}
                          >
                            <div className="w-9 h-9 rounded-full bg-[rgba(11,31,58,.08)] flex items-center justify-center text-[#0B1F3A] flex-shrink-0">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-medium text-[#0B1F3A] truncate">{r.display_name}</div>
                              {r.hint && <div className="text-[12px] text-gray-500 mt-0.5 truncate">{r.hint}</div>}
                              <div className="flex gap-2.5 text-[11px] text-gray-400 mt-0.5">
                                <span>{r.works_count.toLocaleString()} publications</span>
                                <span>{r.cited_by_count.toLocaleString()} citations</span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center">
                        <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No researchers found for &ldquo;{searchQuery}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ TRUST BAR ═══════ */}
        <section className="py-5 bg-[#F0F4F8]" aria-label="Trust indicators">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-9 text-[13.5px] text-gray-600">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0B1F3A]" aria-hidden="true" />
                <span>250M+ indexed works</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-200" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0B1F3A]" aria-hidden="true" />
                <span>Secure &amp; private</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-200" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0B1F3A]" aria-hidden="true" />
                <span>Ready in 5 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ OPENALEX CREDIT ═══════ */}
        <section className="py-7 bg-white border-b border-gray-100 text-center text-[13.5px] text-gray-500" aria-label="Data source">
          <div className="max-w-[1200px] mx-auto px-8">
            Powered by{" "}
            <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-[#0B1F3A] font-medium underline underline-offset-3">
              OpenAlex
            </a>{" "}
            — the free, open catalog of the world&rsquo;s research. 250M+ works · 90K+ sources · updated daily.
          </div>
        </section>

        {/* ═══════ PROFILE PREVIEW ═══════ */}
        <section className="py-[88px] bg-white" aria-label="Profile preview">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-2.5">See what yours looks like</div>
              <h2
                className="font-serif font-medium text-[#0B1F3A] mb-3"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                A portfolio worth sharing.
              </h2>
              <p className="text-[17px] text-gray-600">Every page is built the same way: your publications, your metrics, your topics — laid out with typography that respects the work.</p>
            </div>

            {/* Browser mockup */}
            <div className="max-w-[820px] mx-auto relative">
              <div
                className="absolute pointer-events-none"
                aria-hidden="true"
                style={{
                  inset: -24, zIndex: -1, borderRadius: 32,
                  background: "radial-gradient(ellipse at 50% 40%,rgba(255,199,46,.1),transparent 60%)",
                }}
              />
              <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden" style={{ boxShadow: "0 30px 80px -20px rgba(11,31,58,.18)" }}>
                {/* Browser bar */}
                <div className="bg-[#F0F4F8] px-4 py-2.5 flex items-center gap-2.5 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D7DDE4]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D7DDE4]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D7DDE4]" />
                  </div>
                  <div className="flex-1 bg-white rounded-md py-1.5 px-3 text-[12px] text-gray-400 font-mono text-center">
                    <strong className="text-[#0B1F3A] font-medium">doudna</strong>.scholar.name
                  </div>
                  <div className="w-10" />
                </div>

                {/* P1 Profile card */}
                <div>
                  {/* Profile hero */}
                  <div
                    className="relative overflow-hidden px-11 pt-10 pb-9 text-white"
                    style={{
                      background: "linear-gradient(130deg,#0B1F3A 0%,#142850 50%,#1E3A5F 100%)",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      aria-hidden="true"
                      style={{ background: "radial-gradient(ellipse at top right,rgba(255,199,46,.14),transparent 55%)" }}
                    />
                    <div className="relative flex justify-between items-start mb-6">
                      <span className="text-[10px] tracking-[.3em] uppercase text-white/65">Researcher portfolio</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
                        style={{ background: "rgba(255,199,46,.15)", border: "1px solid rgba(255,199,46,.3)", color: "#FFC72E" }}
                      >
                        <span
                          className="rounded-full"
                          style={{ width: 5, height: 5, background: "#FFC72E", boxShadow: "0 0 8px rgba(255,199,46,.8)", display: "inline-block" }}
                        />
                        Live · synced 2 min ago
                      </span>
                    </div>
                    <div className="relative flex gap-5 items-center">
                      <div
                        className="w-[86px] h-[86px] rounded-full flex items-center justify-center font-serif text-3xl font-semibold flex-shrink-0 text-[#0B1F3A]"
                        style={{
                          background: "linear-gradient(135deg,#FFC72E,#E5A922)",
                          boxShadow: "0 0 0 3px rgba(255,255,255,.08),0 0 30px rgba(255,199,46,.25)",
                        }}
                      >
                        JD
                      </div>
                      <div>
                        <div className="font-serif text-3xl font-medium text-white" style={{ letterSpacing: "-0.01em", lineHeight: 1.1 }}>Dr. Jennifer Doudna</div>
                        <div className="text-[14px] text-white/72 mt-1">UC Berkeley · Innovative Genomics Institute</div>
                        <div className="text-[12px] font-mono mt-2" style={{ color: "#FFC72E" }}>doudna.scholar.name</div>
                      </div>
                    </div>
                    <div className="w-[60px] h-[3px] rounded mt-5" style={{ background: "#FFC72E" }} />
                  </div>

                  {/* Profile body */}
                  <div className="px-11 py-9 bg-white">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        { n: "412", l: "Publications" },
                        { n: "189k", l: "Citations", gold: true },
                        { n: "142", l: "h-index" },
                      ].map((s) => (
                        <div
                          key={s.l}
                          className="rounded-[10px] px-4 py-4"
                          style={s.gold ? { background: "rgba(255,199,46,.12)", border: "1px solid rgba(255,199,46,.3)" } : { background: "#F0F4F8" }}
                        >
                          <div className="font-serif text-3xl font-medium text-[#0B1F3A]" style={{ lineHeight: 1 }}>{s.n}</div>
                          <div className="text-[11px] tracking-[.1em] uppercase text-gray-500 mt-1.5">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] tracking-[.2em] uppercase text-gray-400 mb-2.5">Research topics</div>
                    <div className="flex flex-wrap gap-1.5">
                      {["CRISPR", "Cas9 nuclease", "Gene editing", "RNA biology", "Genome engineering", "Guide RNA"].map((t, i) => (
                        <span
                          key={t}
                          className="px-3 py-1 rounded-full text-[12px]"
                          style={i === 0
                            ? { background: "rgba(255,199,46,.2)", color: "#6F5400", fontWeight: 600 }
                            : { background: "#E4E9F7", color: "#0B1F3A" }
                          }
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FEATURES ═══════ */}
        <section id="features" className="py-[112px] bg-[#F0F4F8]" aria-labelledby="features-heading">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5">Features</div>
              <h2
                id="features-heading"
                className="font-serif font-medium text-[#0B1F3A] mb-3.5"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                Built for researchers.
              </h2>
              <p className="text-[17px] text-gray-600">Features designed to showcase your academic achievements — not yet another generic website builder.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-[1040px] mx-auto">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-[14px] p-8 transition-all duration-200 hover:-translate-y-1"
                  style={{ border: "1px solid rgba(11,31,58,.08)", boxShadow: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 18px 40px -16px rgba(11,31,58,.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: "rgba(11,31,58,.06)" }}
                  >
                    <f.icon className="w-[22px] h-[22px] text-[#0B1F3A]" />
                  </div>
                  <h3 className="font-serif font-medium text-[#0B1F3A] mb-2.5" style={{ fontSize: 21, lineHeight: 1.25 }}>{f.title}</h3>
                  <p className="text-[15px] text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ DASHBOARD BAND ═══════ */}
        <section
          className="relative overflow-hidden py-[112px]"
          style={{ background: "linear-gradient(180deg,#081529,#0B1F3A)", color: "#fff" }}
          aria-label="Analytics dashboard"
        >
          <div className="dash-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5" style={{ color: "#FFC72E" }}>Analytics</div>
              <h2
                className="font-serif font-medium text-white mb-3.5"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                Your impact, measured with care.
              </h2>
              <p className="text-[17px] text-white/70">A full dashboard of citation trends, topic evolution, and network reach — live, printable, and honest about the limits of the data.</p>
            </div>

            {/* Citation bars (D1) */}
            <div
              className="max-w-[1040px] mx-auto rounded-[20px] p-10"
              style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(10px)" }}
            >
              <div className="flex justify-between items-end mb-7 gap-8 flex-wrap">
                <div>
                  <h3 className="font-serif text-white mb-1" style={{ fontSize: 24 }}>Citations per year</h3>
                  <p className="text-[13px] text-white/60">Live trend · synced from OpenAlex</p>
                </div>
                <div
                  className="flex gap-0.5 rounded-[9px] p-[3px] text-[12px]"
                  style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.06)" }}
                >
                  {["1y", "5y", "All"].map((t) => (
                    <span
                      key={t}
                      className="px-3.5 py-1 rounded-md cursor-pointer"
                      style={t === "All" ? { background: "rgba(255,199,46,.18)", color: "#FFC72E" } : { color: "rgba(255,255,255,.55)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div
                className="flex gap-2 items-end pb-8 mb-5 relative"
                style={{ height: 240, borderBottom: "1px solid rgba(255,255,255,.06)" }}
              >
                {citationBars.map((b) => (
                  <div key={b.year} className="flex-1 relative group" style={{ height: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div
                      className="w-full rounded-sm transition-all duration-300"
                      style={{
                        height: b.pct + "%",
                        borderRadius: "3px 3px 0 0",
                        background: b.hi
                          ? "linear-gradient(180deg,#FFC72E,rgba(255,199,46,.4))"
                          : "linear-gradient(180deg,rgba(255,199,46,.7),rgba(255,199,46,.15))",
                        minHeight: 12,
                      }}
                    />
                    <span
                      className="absolute font-mono text-white/50"
                      style={{ bottom: -22, left: "50%", transform: "translateX(-50%)", fontSize: 10 }}
                    >
                      {b.year}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-6 text-[12px] text-white/65">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#FFC72E" }} />
                  Citations this year
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(122,168,116,.6)" }} />
                  h-index growth
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ WHO IT'S FOR ═══════ */}
        <section className="py-[112px] bg-white" aria-labelledby="personas-heading">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5">Who it&rsquo;s for</div>
              <h2
                id="personas-heading"
                className="font-serif font-medium text-[#0B1F3A] mb-3.5"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                From first paper to tenure.
              </h2>
              <p className="text-[17px] text-gray-600">Built for every stage of an academic career — from first-year PhD students to full professors.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[18px] max-w-[1100px] mx-auto">
              {personas.map((p) => (
                <div
                  key={p.title}
                  className="bg-white rounded-[14px] p-6 transition-all duration-200 hover:-translate-y-[3px]"
                  style={{ border: "1px solid rgba(11,31,58,.08)", boxShadow: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 16px 36px -16px rgba(11,31,58,.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4" style={{ background: "rgba(11,31,58,.06)" }}>
                    <p.icon className="w-5 h-5 text-[#0B1F3A]" />
                  </div>
                  <h3 className="font-serif font-medium text-[#0B1F3A] mb-2" style={{ fontSize: 18, lineHeight: 1.25 }}>{p.title}</h3>
                  <p className="text-[13.5px] text-gray-600 leading-snug">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ USE CASES ═══════ */}
        <section className="py-[112px] bg-[#F0F4F8]" aria-labelledby="usecases-heading">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5">Where you&rsquo;ll use it</div>
              <h2
                id="usecases-heading"
                className="font-serif font-medium text-[#0B1F3A]"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                One link. Everywhere it matters.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-[1040px] mx-auto">
              {useCases.map((u) => (
                <div
                  key={u.title}
                  className="bg-white rounded-[14px] p-7"
                  style={{ border: "1px solid rgba(11,31,58,.08)" }}
                >
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3.5" style={{ background: "rgba(11,31,58,.06)" }}>
                    <u.icon className="w-5 h-5 text-[#0B1F3A]" />
                  </div>
                  <h3 className="font-serif font-medium text-[#0B1F3A] mb-2" style={{ fontSize: 20, lineHeight: 1.25 }}>{u.title}</h3>
                  <p className="text-[14px] text-gray-600 leading-snug">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ TESTIMONIALS ═══════ */}
        <section className="py-24 bg-[#0B1F3A]" aria-label="What researchers say">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5" style={{ color: "#FFC72E" }}>What researchers say</div>
              <h2
                className="font-serif font-medium text-white"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                From PhD students to full professors.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-[14px] p-7 flex flex-col"
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
                >
                  {/* Quote icon */}
                  <svg className="mb-3.5 opacity-85" style={{ width: 22, height: 22, color: "#FFC72E", fill: "#FFC72E" }} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 21c3 0 7-1 7-8V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4M14 21c3 0 7-1 7-8V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4"/>
                  </svg>
                  <blockquote className="font-serif text-[14.5px] text-white/82 leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 mt-auto">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,199,46,.18)" }}
                    >
                      <GraduationCap className="w-4 h-4" style={{ color: "#FFC72E" }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{t.name}</div>
                      <div className="text-[11.5px] text-white/55 mt-0.5">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ PRICING ═══════ */}
        <section id="pricing" className="py-[112px] bg-[#F0F4F8]" aria-labelledby="pricing-heading">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-8 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5">Pricing</div>
              <h2
                id="pricing-heading"
                className="font-serif font-medium text-[#0B1F3A] mb-4"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                Simple, transparent pricing.
              </h2>

              {/* Savings badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium mb-6"
                style={{ background: "rgba(122,168,116,.15)", color: "#2F6D3A", border: "1px solid rgba(122,168,116,.3)" }}
              >
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                70% cheaper than Academia.edu Premium ($400/yr)
              </div>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <label
                  htmlFor="billing-toggle"
                  className={"text-[14px] font-medium cursor-pointer " + (!isYearly ? "text-[#0B1F3A]" : "text-gray-400")}
                >
                  Monthly
                </label>
                <Switch
                  id="billing-toggle"
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  aria-label="Toggle yearly billing"
                  data-testid="switch-billing-toggle"
                />
                <label
                  htmlFor="billing-toggle"
                  className={"text-[14px] font-medium cursor-pointer " + (isYearly ? "text-[#0B1F3A]" : "text-gray-400")}
                >
                  Yearly{" "}
                  <Badge variant="secondary" className="ml-1.5 text-xs bg-green-100 text-green-700">Save 2 months</Badge>
                </label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-[780px] mx-auto">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="bg-white rounded-[14px] p-8 relative transition-shadow duration-200"
                  style={plan.highlighted
                    ? { border: "2px solid #FFC72E", boxShadow: "0 20px 40px -20px rgba(255,199,46,.35)" }
                    : { border: "1px solid rgba(11,31,58,.08)" }
                  }
                  data-testid={"card-pricing-" + plan.name.toLowerCase()}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="gold">Most popular</Badge>
                    </div>
                  )}
                  <h3 className="font-serif font-medium text-[#0B1F3A] text-center mb-1" style={{ fontSize: 22 }}>{plan.name}</h3>
                  <p className="text-[13px] text-gray-500 text-center mb-5">{plan.description}</p>
                  <div className="text-center mb-6">
                    <span className="font-serif text-[#0B1F3A]" style={{ fontSize: 40, fontWeight: 500 }}>
                      ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-[14px] text-gray-500 ml-1">/{isYearly ? "year" : "month"}</span>
                    {isYearly && (
                      <p className="text-[12px] text-green-600 font-medium mt-1">Save ${plan.yearlySavings}</p>
                    )}
                  </div>
                  <ul className="mb-6 space-y-[7px]">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-[14px] text-gray-700">
                        <Check className="w-4 h-4 text-[#0B1F3A] flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={"w-full py-3 rounded-lg font-semibold text-[14px] transition-all hover:-translate-y-px " + (plan.highlighted ? "btn-gold" : "btn-navy")}
                    data-testid={"button-select-" + plan.name.toLowerCase()}
                    onClick={() => { window.scrollTo(0, 0); navigate("/signup?plan=" + plan.name.toLowerCase()); }}
                  >
                    Get started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ FAQ ═══════ */}
        <section className="py-[112px] bg-white" aria-labelledby="faq-heading">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-14 max-w-[720px] mx-auto">
              <div className="eyebrow mb-3.5">FAQ</div>
              <h2
                id="faq-heading"
                className="font-serif font-medium text-[#0B1F3A]"
                style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
              >
                Frequently asked questions.
              </h2>
            </div>
            <div className="max-w-[720px] mx-auto flex flex-col gap-2.5">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className={"bg-[#F0F4F8] rounded-xl overflow-hidden transition-all duration-200 " + (isOpen ? "faq-open" : "")}
                  >
                    <button
                      className={"w-full flex justify-between items-center gap-5 px-6 py-5 text-[15px] font-medium text-[#0B1F3A] text-left bg-transparent border-0 cursor-pointer font-sans transition-colors " + (isOpen ? "bg-[#EAEEF2]" : "hover:bg-[#EAEEF2]")}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={"faq-a-" + i}
                    >
                      {faq.question}
                      <span
                        className={"w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 " + (isOpen ? "faq-chev-open" : "bg-[#EAEEF2] text-gray-500")}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    <div
                      id={"faq-a-" + i}
                      className="overflow-hidden transition-all duration-250"
                      style={{ maxHeight: isOpen ? 400 : 0 }}
                    >
                      <p className="px-6 pb-5 text-[14.5px] text-gray-600 leading-relaxed bg-[#EAEEF2]">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section
          className="relative overflow-hidden py-24 text-center"
          style={{ background: "linear-gradient(135deg,#081529,#0B1F3A 50%,#1A3358)", color: "#fff" }}
          aria-label="Get started"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ background: "radial-gradient(ellipse at 80% 50%,rgba(255,199,46,.1),transparent 55%)" }}
          />
          <div className="relative max-w-[640px] mx-auto px-8">
            <h2
              className="font-serif font-medium text-white mb-4"
              style={{ fontSize: "clamp(32px,3.6vw,48px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
            >
              Ready to showcase your research?
            </h2>
            <p className="text-white/70 mb-8" style={{ fontSize: 17 }}>
              Join researchers who&rsquo;ve replaced outdated faculty pages with a living, breathing portfolio.
            </p>
            <button
              className="btn-gold inline-flex items-center gap-2 px-7 py-4 rounded-lg text-[15px] font-semibold"
              onClick={() => { window.scrollTo(0, 0); navigate("/signup"); }}
            >
              Start building your portfolio
            </button>
          </div>
        </section>

      </main>

      <GlobalFooter />
      <ExitIntentPopup />
    </div>
  );
}
