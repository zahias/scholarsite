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

const inputClass = "w-full px-3 py-2.5 text-[14.5px] text-[#171C1F] bg-white border border-midnight/[.14] rounded-lg outline-none box-border";

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
    <div className="relative">
      <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" autoComplete="new-password"
        id={formItemId}
        aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        className={`${inputClass} pr-10`} {...field} />
      <button type="button" aria-label={showPassword ? "Hide" : "Show"} onClick={onToggleShow}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#75777E] p-0.5">
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
    <div className="signup-benefits-grid rounded-r-2xl overflow-hidden flex flex-col justify-between px-10 py-12">
      {/* Mini profile preview */}
      <div>
        <div className="bg-white/[.06] border border-white/10 rounded-[14px] px-[22px] py-5 mb-9">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-11 h-11 rounded-full bg-[linear-gradient(135deg,#FFC72E,#FFB700)] grid place-items-center">
              <span className="font-serif text-lg text-midnight font-bold italic">J</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Jane Smith, PhD</div>
              <div className="text-white/55 text-xs">scholar.name/janesmith</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[["142", "h-index"], ["412", "papers"], ["189k", "citations"]].map(([val, label]) => (
              <div key={label} className="bg-white/[.08] rounded-lg px-2.5 py-2 text-center">
                <div className="font-serif text-lg text-warm font-semibold leading-none">{val}</div>
                <div className="text-[10px] text-white/50 uppercase tracking-[.1em] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["CRISPR", "Gene Editing", "Biochemistry"].map((t) => (
              <span key={t} className="text-[10.5px] bg-warm/15 text-warm px-2 py-[3px] rounded-full border border-warm/25">{t}</span>
            ))}
          </div>
        </div>

        {/* Benefits list */}
        <div className="flex flex-col gap-4">
          {[
            ["Auto-sync publications", "Linked to OpenAlex — checked monthly for newly indexed works."],
            ["Institutional credibility", "A URL like scholar.name/you signals professionalism."],
            ["Citation analytics", "Track your h-index, i10, and citation trends over time."],
            ["14-day free trial", `Full access, no credit card required. Starter from $${PRICING.starter.monthly}/mo after.`],
          ].map(([title, desc]) => (
            <div key={title as string} className="flex gap-3 items-start">
              <div className="w-[22px] h-[22px] rounded-full bg-warm/15 border border-warm/30 grid place-items-center shrink-0 mt-px">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFC72E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div className="text-[13.5px] text-white font-semibold mb-0.5">{title}</div>
                <div className="text-[12.5px] text-white/55 leading-normal">{desc}</div>
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
      <div className="auth-page-shell items-center justify-center p-6">
        <div className="auth-card px-9 pt-12 pb-12 max-w-[400px] text-center">
          <div className="w-16 h-16 rounded-full bg-[#DDF2E4] grid place-items-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[#2F6D3A]" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-midnight mb-2.5">Welcome to Scholar.name!</h1>
          <p className="text-[#44474D] text-sm mb-6 leading-[1.55]">Your account has been created. Redirecting to your dashboard...</p>
          <Loader2 size={24} className="animate-spin text-midnight mx-auto" />
        </div>
      </div>
    );
  }

  // Step progress dots
  const ProgressDots = () => (
    <div className="flex items-center gap-1.5 mb-7">
      {Array.from({ length: totalSteps }, (_, i) => {
        const s = i + 1;
        const done = s < step;
        const active = s === step;
        return (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold transition-all duration-200 ${done ? "bg-[#2F6D3A] text-white" : active ? "bg-midnight text-white" : "bg-[#E4E9F7] text-[#75777E]"}`}>
              {done ? <CheckCircle size={14} /> : s}
            </div>
            {s < totalSteps && <div className={`w-7 h-0.5 rounded-sm ${done ? "bg-[#2F6D3A]" : "bg-[#E4E9F7]"}`} />}
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
      <nav className="bg-white/90 backdrop-blur-[14px] border-b border-midnight/[.08] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-8 py-2.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 font-serif text-lg font-semibold text-midnight no-underline">
            <BookOpen size={22} className="text-midnight" />
            Scholar.name
          </a>
          <span className="text-[13.5px] text-[#44474D]">
            Already a member?{" "}
            <a href="/login" className="text-midnight font-semibold underline decoration-warm underline-offset-2">Sign in</a>
          </span>
        </div>
      </nav>

      {/* Main two-column grid */}
      <div className="flex-1 flex items-stretch justify-center">
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr" }} className="signup-grid w-full max-w-[1040px] my-8 mx-auto rounded-2xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(11,31,58,.18)] border border-midnight/[.08]">
          <style>{`
            @media (max-width: 860px) { .signup-grid { grid-template-columns: 1fr !important; margin: 16px !important; } .signup-panel-right { display: none !important; } }
            @media (max-width: 520px) { .signup-form-left { padding: 24px 20px !important; } }
          `}</style>

          {/* LEFT: Form panel */}
          <div className="signup-form-left bg-white px-12 py-11">
            {/* Back button */}
            <button onClick={() => step === 1 ? navigate("/") : setStep(step - 1)}
              className="flex items-center gap-[5px] text-[13px] text-[#44474D] bg-transparent border-none cursor-pointer p-0 mb-6">
              <ArrowLeft size={14} />
              {step === 1 ? "Back to Home" : "Back"}
            </button>

            <ProgressDots />

            {/* Step 1: Credentials */}
            {step === 1 && (
              <>
                <h1 className="font-serif text-2xl font-medium text-midnight mb-1.5 tracking-[-0.015em]">Start your free 14-day trial</h1>
                <p className="text-sm text-[#44474D] mb-7 leading-normal">Step 1 of {totalSteps} — no credit card required</p>

                <div className="auth-divider mt-0">Sign up with email</div>

                <Form {...form}>
                  <form onSubmit={(e) => { e.preventDefault(); handleStep1Next(); }} className="flex flex-col gap-3.5">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="name-row">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel className="text-[13px] text-midnight font-medium">First name</FormLabel>
                          <FormControl><input placeholder="Jane" autoComplete="given-name" className={inputClass} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem className="flex flex-col gap-1">
                          <FormLabel className="text-[13px] text-midnight font-medium">Last name</FormLabel>
                          <FormControl><input placeholder="Smith" autoComplete="family-name" className={inputClass} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem className="flex flex-col gap-1">
                        <FormLabel className="text-[13px] text-midnight font-medium">Email</FormLabel>
                        <FormControl><input type="email" placeholder="jane.smith@university.edu" autoComplete="email" className={inputClass} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem className="flex flex-col gap-1">
                        <FormLabel className="text-[13px] text-midnight font-medium">Password</FormLabel>
                        <PasswordField showPassword={showPassword} onToggleShow={() => setShowPassword(!showPassword)} field={field} />
                        {/* Password strength meter */}
                        {passwordValue && (
                          <div className="flex gap-1 mt-0.5">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex-1 h-[3px] rounded-sm transition-colors duration-200" style={{ background: i <= strengthLevel ? STRENGTH_COLORS[strengthLevel] : "#E4E9F7" }} />
                            ))}
                            <span className="text-[11px] font-semibold ml-1 leading-3" style={{ color: STRENGTH_COLORS[strengthLevel] }}>{STRENGTH_LABELS[strengthLevel]}</span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="affiliation" render={({ field }) => (
                      <FormItem className="flex flex-col gap-1">
                        <FormLabel className="text-[13px] text-midnight font-medium">
                          Affiliation <span className="text-[#75777E] font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl><input placeholder="e.g., MIT, Stanford University" autoComplete="organization" className={inputClass} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <p className="text-[11.5px] text-[#75777E] my-1">
                      By continuing you agree to our{" "}
                      <a href="/terms" className="text-midnight underline decoration-warm">Terms</a>
                      {" "}and{" "}
                      <a href="/privacy" className="text-midnight underline decoration-warm">Privacy Policy</a>.
                    </p>

                    <button type="submit" className="w-full px-5 py-3 bg-midnight text-white rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center justify-center gap-2">
                      Continue <ArrowRight size={15} />
                    </button>
                  </form>
                </Form>
              </>
            )}

            {/* Step 2: Find your profile */}
            {step === 2 && (
              <>
                <h1 className="font-serif text-2xl font-medium text-midnight mb-1.5 tracking-[-0.015em]">Find your research profile</h1>
                <p className="text-sm text-[#44474D] mb-7 leading-normal">Step 2 of {totalSteps} — link your OpenAlex publications (optional)</p>

                {/* Search box */}
                <div className="relative mb-5" ref={searchRef}>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75777E]" />
                    <input type="text" placeholder="Search by name..." value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); setSelectedAuthor(null); }}
                      onFocus={() => setShowResults(true)}
                      className={`${inputClass} pl-9`} />
                  </div>
                  {showResults && debouncedQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-midnight/[.12] rounded-[10px] shadow-[0_12px_30px_-8px_rgba(11,31,58,.2)] max-h-64 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-[13.5px] text-[#44474D]">
                          <Loader2 size={15} className="animate-spin" /> Searching...
                        </div>
                      ) : searchResults?.results?.length ? (
                        searchResults.results.map((author) => (
                          <button key={author.id} onClick={() => handleSelectAuthor(author)}
                            className="w-full text-left px-4 py-2.5 bg-transparent border-none border-b border-midnight/[.06] cursor-pointer transition-colors duration-100 hover:bg-[#F0F4F8]">
                            <div className="font-semibold text-[13.5px] text-midnight">{author.display_name}</div>
                            <div className="text-xs text-[#75777E] overflow-hidden text-ellipsis whitespace-nowrap">{author.hint}</div>
                            <div className="text-xs text-[#75777E] mt-0.5">
                              {author.works_count.toLocaleString()} works · {author.cited_by_count.toLocaleString()} citations
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-[13.5px] text-[#75777E] text-center">No researchers found for "{debouncedQuery}"</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected author card */}
                {selectedAuthor && (
                  <div className="rounded-xl px-[18px] py-4 bg-[#F0F4F8] border border-midnight/[.08] mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-midnight/[.08] grid place-items-center shrink-0">
                        <BookOpen size={18} className="text-midnight" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-midnight">{selectedAuthor.display_name}</div>
                        <div className="text-xs text-[#75777E] overflow-hidden text-ellipsis whitespace-nowrap">{selectedAuthor.hint}</div>
                        <div className="text-xs text-[#75777E] mt-[3px]">
                          {selectedAuthor.works_count.toLocaleString()} works · {selectedAuthor.cited_by_count.toLocaleString()} citations
                        </div>
                      </div>
                      <a href={`/researcher/${selectedAuthor.id}`} target="_blank" rel="noopener noreferrer" title="Preview profile"
                        className="text-midnight shrink-0 grid place-items-center">
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <button onClick={handleStep2Next} disabled={signupMutation.isPending}
                    className={`w-full px-5 py-3 ${signupMutation.isPending ? "bg-[#9AA3B2] cursor-not-allowed" : "bg-midnight cursor-pointer"} text-white rounded-lg text-sm font-semibold border-none flex items-center justify-center gap-2`}>
                    {signupMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : <>Create Your Portfolio <ArrowRight size={15} /></>}
                  </button>
                  {!selectedAuthor && (
                    <button type="button" onClick={handleStep2Next} disabled={signupMutation.isPending}
                      className="bg-transparent border-none text-[13px] text-[#75777E] cursor-pointer py-2 text-center">
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
