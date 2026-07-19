import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import {
  ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff, Loader2, Search, BookOpen, ExternalLink,
} from "lucide-react";
import { PRICING } from "@shared/pricing";

// -- Schemas --
const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  affiliation: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 14.5, fontFamily: "inherit",
  color: "#171C1F", background: "#fff", border: "1px solid rgba(11,31,58,.14)",
  borderRadius: 8, outline: "none", boxSizing: "border-box",
};

// FormControl's Slot only forwards id/aria-describedby to its direct child, but the
// show/hide toggle needs a wrapping <div>. useFormField() must be called from a
// component actually rendered inside <FormItem>'s subtree (context is tree-position
// based, not call-order based) — hence this is its own component, not inline logic.
function PasswordField({ showPassword, onToggleShow, field }: {
  showPassword: boolean;
  onToggleShow: () => void;
  field: ControllerRenderProps<Step1Data, "password">;
}) {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
  return (
    <div style={{ position: "relative" }}>
      <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" autoComplete="new-password"
        id={formItemId}
        aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        style={{ ...inputStyle, paddingRight: 40 }} {...field} />
      <button type="button" aria-label={showPassword ? "Hide" : "Show"} onClick={onToggleShow}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#75777E", padding: 2 }}>
        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

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

function passwordStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(3, Math.round((score / 5) * 3));
}

const STRENGTH_COLORS = ["#E4E9F7", "#B33A3A", "#B87A0A", "#2F6D3A"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong"];

// Benefits panel for right column
function BenefitsPanel() {
  return (
    <div className="signup-benefits-grid" style={{ borderRadius: "0 16px 16px 0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 40px" }}>
      {/* Mini profile preview */}
      <div>
        <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: "20px 22px", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #FFC72E, #FFB700)", display: "grid", placeItems: "center" }}>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, color: "#0B1F3A", fontWeight: 700, fontStyle: "italic" }}>J</span>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Jane Smith, PhD</div>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: 12 }}>scholar.name/janesmith</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[["142", "h-index"], ["412", "papers"], ["189k", "citations"]].map(([val, label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, color: "#FFC72E", fontWeight: 600, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["CRISPR", "Gene Editing", "Biochemistry"].map((t) => (
              <span key={t} style={{ fontSize: 10.5, background: "rgba(255,199,46,.15)", color: "#FFC72E", padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(255,199,46,.25)" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Benefits list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            ["Auto-sync publications", "Linked to OpenAlex — checked monthly for newly indexed works."],
            ["Institutional credibility", "A URL like scholar.name/you signals professionalism."],
            ["Citation analytics", "Track your h-index, i10, and citation trends over time."],
            ["14-day free trial", `Full access, no credit card required. Starter from $${PRICING.starter.monthly}/mo after.`],
          ].map(([title, desc]) => (
            <div key={title as string} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,199,46,.15)", border: "1px solid rgba(255,199,46,.3)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFC72E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13.5, color: "#fff", fontWeight: 600, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Component --
export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorSearchResult | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", affiliation: "" },
  });

  const passwordValue = form.watch("password") ?? "";
  const strengthLevel = passwordStrength(passwordValue);

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
      const response = await fetch(`/api/openalex/autocomplete?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const signupMutation = useMutation({
    mutationFn: async (data: Step1Data & { openalexId?: string }) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName, lastName: data.lastName,
          email: data.email, password: data.password,
          openalexId: data.openalexId, affiliation: data.affiliation,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Persist selected OpenAlex author so dashboard can pre-fill the connect card
      if (selectedAuthor) {
        localStorage.setItem('pendingOpenalexConnect', JSON.stringify({
          id: selectedAuthor.id,
          display_name: selectedAuthor.display_name,
          hint: selectedAuthor.hint,
          works_count: selectedAuthor.works_count,
          cited_by_count: selectedAuthor.cited_by_count,
        }));
      }
      setIsSuccess(true);
      toast({ title: "Account created!", description: "Your 14-day free trial is active and your portfolio is being prepared." });
      setTimeout(() => navigate("/dashboard"), 1500);
    },
    onError: (error: Error) => {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    },
  });

  const handleStep1Next = async () => {
    const valid = await form.trigger();
    if (valid) {
      const { firstName, lastName } = form.getValues();
      setSearchQuery(`${firstName} ${lastName}`);
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleStep2Next = () => {
    const formData = form.getValues();
    signupMutation.mutate({ ...formData, openalexId: selectedAuthor?.id || undefined });
  };

  const handleSelectAuthor = (author: AuthorSearchResult) => {
    setSelectedAuthor(author);
    setShowResults(false);
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="auth-page-shell" style={{ alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="auth-card" style={{ padding: "48px 36px", maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DDF2E4", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={32} style={{ color: "#2F6D3A" }} />
          </div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px" }}>Welcome to Scholar.name!</h1>
          <p style={{ color: "#44474D", fontSize: 14, margin: "0 0 24px", lineHeight: 1.55 }}>Your account has been created. Redirecting to your dashboard...</p>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#0B1F3A", margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  // Step progress dots
  const ProgressDots = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const s = i + 1;
        const done = s < step;
        const active = s === step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, background: done ? "#2F6D3A" : active ? "#0B1F3A" : "#E4E9F7", color: done || active ? "#fff" : "#75777E", transition: "all .2s" }}>
              {done ? <CheckCircle size={14} /> : s}
            </div>
            {s < totalSteps && <div style={{ width: 28, height: 2, background: done ? "#2F6D3A" : "#E4E9F7", borderRadius: 1 }} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="auth-page-shell">
      <SEO
        title="Sign Up — Scholar.name"
        description="Create your free academic portfolio on Scholar.name. Showcase publications, citations, and career milestones."
        url="https://scholar.name/signup"
        type="website"
      />

      {/* Auth nav */}
      <nav style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(11,31,58,.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: "#0B1F3A", textDecoration: "none" }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "#0B1F3A", color: "#FFC72E", display: "grid", placeItems: "center", fontFamily: "'Newsreader', serif", fontSize: 14, fontWeight: 700, fontStyle: "italic" }}>S</span>
            Scholar.name
          </a>
          <span style={{ fontSize: 13.5, color: "#44474D" }}>
            Already a member?{" "}
            <a href="/login" style={{ color: "#0B1F3A", fontWeight: 600, textDecoration: "underline", textDecorationColor: "#FFC72E", textUnderlineOffset: 2 }}>Sign in</a>
          </span>
        </div>
      </nav>

      {/* Main two-column grid */}
      <div style={{ flex: 1, display: "flex", alignItems: "stretch", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", width: "100%", maxWidth: 1040, margin: "32px auto", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px -20px rgba(11,31,58,.18)", border: "1px solid rgba(11,31,58,.08)" }}
          className="signup-grid">
          <style>{`
            @media (max-width: 860px) { .signup-grid { grid-template-columns: 1fr !important; margin: 16px !important; } .signup-panel-right { display: none !important; } }
            @media (max-width: 520px) { .signup-form-left { padding: 24px 20px !important; } }
          `}</style>

          {/* LEFT: Form panel */}
          <div className="signup-form-left" style={{ background: "#fff", padding: "44px 48px" }}>
            {/* Back button */}
            <button onClick={() => step === 1 ? navigate("/") : setStep(step - 1)}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#44474D", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 24, fontFamily: "inherit" }}>
              <ArrowLeft size={14} />
              {step === 1 ? "Back to Home" : "Back"}
            </button>

            <ProgressDots />

            {/* Step 1: Credentials */}
            {step === 1 && (
              <>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", letterSpacing: "-0.015em" }}>Start your free 14-day trial</h1>
                <p style={{ fontSize: 14, color: "#44474D", margin: "0 0 28px", lineHeight: 1.5 }}>Step 1 of {totalSteps} — no credit card required</p>

                <div className="auth-divider" style={{ marginTop: 0 }}>Sign up with email</div>

                <Form {...form}>
                  <form onSubmit={(e) => { e.preventDefault(); handleStep1Next(); }} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="name-row">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>First name</FormLabel>
                          <FormControl><input placeholder="Jane" autoComplete="given-name" style={inputStyle} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Last name</FormLabel>
                          <FormControl><input placeholder="Smith" autoComplete="family-name" style={inputStyle} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Email</FormLabel>
                        <FormControl><input type="email" placeholder="jane.smith@university.edu" autoComplete="email" style={inputStyle} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Password</FormLabel>
                        <PasswordField showPassword={showPassword} onToggleShow={() => setShowPassword(!showPassword)} field={field} />
                        {/* Password strength meter */}
                        {passwordValue && (
                          <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                            {[1, 2, 3].map((i) => (
                              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strengthLevel ? STRENGTH_COLORS[strengthLevel] : "#E4E9F7", transition: "background .2s" }} />
                            ))}
                            <span style={{ fontSize: 11, color: STRENGTH_COLORS[strengthLevel], fontWeight: 600, marginLeft: 4, lineHeight: "12px" }}>{STRENGTH_LABELS[strengthLevel]}</span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="affiliation" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>
                          Affiliation <span style={{ color: "#75777E", fontWeight: 400 }}>(optional)</span>
                        </FormLabel>
                        <FormControl><input placeholder="e.g., MIT, Stanford University" autoComplete="organization" style={inputStyle} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <p style={{ fontSize: 11.5, color: "#75777E", margin: "4px 0" }}>
                      By continuing you agree to our{" "}
                      <a href="/terms" style={{ color: "#0B1F3A", textDecorationColor: "#FFC72E", textDecoration: "underline" }}>Terms</a>
                      {" "}and{" "}
                      <a href="/privacy" style={{ color: "#0B1F3A", textDecorationColor: "#FFC72E", textDecoration: "underline" }}>Privacy Policy</a>.
                    </p>

                    <button type="submit" style={{ width: "100%", padding: "12px 20px", background: "#0B1F3A", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </form>
                </Form>
              </>
            )}

            {/* Step 2: Find your profile */}
            {step === 2 && (
              <>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", letterSpacing: "-0.015em" }}>Find your research profile</h1>
                <p style={{ fontSize: 14, color: "#44474D", margin: "0 0 28px", lineHeight: 1.5 }}>Step 2 of {totalSteps} — link your OpenAlex publications (optional)</p>

                {/* Search box */}
                <div style={{ position: "relative", marginBottom: 20 }} ref={searchRef}>
                  <div style={{ position: "relative" }}>
                    <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#75777E" }} />
                    <input type="text" placeholder="Search by name..." value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); setSelectedAuthor(null); }}
                      onFocus={() => setShowResults(true)}
                      style={{ ...inputStyle, paddingLeft: 36 }} />
                  </div>
                  {showResults && debouncedQuery.length >= 2 && (
                    <div style={{ position: "absolute", zIndex: 50, width: "100%", marginTop: 4, background: "#fff", border: "1px solid rgba(11,31,58,.12)", borderRadius: 10, boxShadow: "0 12px 30px -8px rgba(11,31,58,.2)", maxHeight: 256, overflowY: "auto" }}>
                      {isSearching ? (
                        <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, color: "#44474D" }}>
                          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Searching...
                        </div>
                      ) : searchResults?.results?.length ? (
                        searchResults.results.map((author) => (
                          <button key={author.id} onClick={() => handleSelectAuthor(author)}
                            style={{ width: "100%", textAlign: "left", padding: "11px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(11,31,58,.06)", cursor: "pointer", fontFamily: "inherit", transition: "background .12s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F4F8")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0B1F3A" }}>{author.display_name}</div>
                            <div style={{ fontSize: 12, color: "#75777E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author.hint}</div>
                            <div style={{ fontSize: 12, color: "#75777E", marginTop: 2 }}>
                              {author.works_count.toLocaleString()} works · {author.cited_by_count.toLocaleString()} citations
                            </div>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: 16, fontSize: 13.5, color: "#75777E", textAlign: "center" }}>No researchers found for "{debouncedQuery}"</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected author card */}
                {selectedAuthor && (
                  <div style={{ borderRadius: 12, padding: "16px 18px", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(11,31,58,.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <BookOpen size={18} style={{ color: "#0B1F3A" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0B1F3A" }}>{selectedAuthor.display_name}</div>
                        <div style={{ fontSize: 12, color: "#75777E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedAuthor.hint}</div>
                        <div style={{ fontSize: 12, color: "#75777E", marginTop: 3 }}>
                          {selectedAuthor.works_count.toLocaleString()} works · {selectedAuthor.cited_by_count.toLocaleString()} citations
                        </div>
                      </div>
                      <a href={`/researcher/${selectedAuthor.id}`} target="_blank" rel="noopener noreferrer" title="Preview profile"
                        style={{ color: "#0B1F3A", flexShrink: 0, display: "grid", placeItems: "center" }}>
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={handleStep2Next} disabled={signupMutation.isPending}
                    style={{ width: "100%", padding: "12px 20px", background: signupMutation.isPending ? "#9AA3B2" : "#0B1F3A", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", border: "none", cursor: signupMutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {signupMutation.isPending ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</> : <>Create Your Portfolio <ArrowRight size={15} /></>}
                  </button>
                  {!selectedAuthor && (
                    <button type="button" onClick={handleStep2Next} disabled={signupMutation.isPending}
                      style={{ background: "none", border: "none", fontSize: 13, color: "#75777E", cursor: "pointer", fontFamily: "inherit", padding: "8px 0", textAlign: "center" }}>
                      Skip — I'll add this later
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Benefits panel */}
          <div className="signup-panel-right">
            <BenefitsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
