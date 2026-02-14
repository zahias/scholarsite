import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Search,
  User,
  BookOpen,
  ExternalLink,
} from "lucide-react";

// -- Schemas --
const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Step1Data = z.infer<typeof step1Schema>;

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

// -- Component --
export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Wizard state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1 state
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state (find your profile)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorSearchResult | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Step 3 state (success)
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // -- Step 1 form --
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  // -- Step 2 search --
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
        `/api/openalex/autocomplete?q=${encodeURIComponent(debouncedQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  // -- Registration mutation --
  const signupMutation = useMutation({
    mutationFn: async (data: Step1Data) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Account created!",
        description: "Welcome to Scholar.name. Redirecting to your dashboard\u2026",
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // -- Step navigation --
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
    signupMutation.mutate(form.getValues());
  };

  const handleSelectAuthor = (author: AuthorSearchResult) => {
    setSelectedAuthor(author);
    setShowResults(false);
  };

  // -- Progress bar --
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const s = i + 1;
        const isActive = s === step;
        const isDone = s < step || isSuccess;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${isDone ? "bg-green-600 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {isDone ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < totalSteps && (
              <div className={`w-10 h-0.5 ${s < step || isSuccess ? "bg-green-600" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // -- Success state (Step 3) --
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalNav mode="auth" />
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-16">
          <ProgressBar />
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Welcome to Scholar.name!</h1>
              <p className="text-muted-foreground mb-6">
                Your account has been created. Redirecting to your dashboard...
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </CardContent>
          </Card>
        </div>
        <GlobalFooter mode="landing" />
      </div>
    );
  }

  // -- Main render --
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalNav mode="auth" />

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-12">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => {
            if (step === 1) navigate("/");
            else setStep(step - 1);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 1 ? "Back to Home" : "Back"}
        </Button>

        <ProgressBar />

        {/* Step 1: Credentials */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Step 1 of {totalSteps} &mdash; your login details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleStep1Next();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane" autoComplete="given-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input placeholder="Smith" autoComplete="family-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="jane.smith@university.edu"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                              autoComplete="new-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full btn-premium py-6">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms</a>
                {" "}and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Find Your Profile */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Find your research profile</CardTitle>
              <CardDescription>
                Step 2 of {totalSteps} &mdash; link your OpenAlex publications (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search box */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                      setSelectedAuthor(null);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="pl-10"
                  />
                </div>

                {/* Dropdown results */}
                {showResults && debouncedQuery.length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </div>
                    ) : searchResults?.results?.length ? (
                      searchResults.results.map((author) => (
                        <button
                          key={author.id}
                          className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                          onClick={() => handleSelectAuthor(author)}
                        >
                          <p className="font-medium text-sm">{author.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{author.hint}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {author.works_count.toLocaleString()} works &middot;{" "}
                            {author.cited_by_count.toLocaleString()} citations
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No researchers found for &ldquo;{debouncedQuery}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected author card */}
              {selectedAuthor && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{selectedAuthor.display_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{selectedAuthor.hint}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{selectedAuthor.works_count.toLocaleString()} works</span>
                        <span>{selectedAuthor.cited_by_count.toLocaleString()} citations</span>
                      </div>
                    </div>
                    <a
                      href={`/researcher/${selectedAuthor.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex-shrink-0"
                      title="Preview profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  className="w-full btn-premium py-6"
                  onClick={handleStep2Next}
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Your Portfolio
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {!selectedAuthor && (
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleStep2Next}
                    disabled={signupMutation.isPending}
                  >
                    Skip &mdash; I'll add this later
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom link to login */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Log in
          </a>
        </p>
      </div>

      <GlobalFooter mode="landing" />
    </div>
  );
}
