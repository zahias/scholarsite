import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Eye, EyeOff, Loader2, BookOpen } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// FormControl's Slot only forwards id/aria-describedby to its direct child, but the
// show/hide toggle needs a wrapping <div>. useFormField() must be called from a
// component actually rendered inside <FormItem>'s subtree (context is tree-position
// based, not call-order based) — hence this is its own component, not inline logic.
function PasswordField({ showPassword, onToggleShow, field }: {
  showPassword: boolean;
  onToggleShow: () => void;
  field: ControllerRenderProps<LoginFormData, "password">;
}) {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
  return (
    <div className="relative">
      <input type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
        id={formItemId}
        aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        className="w-full py-2.5 pl-3 pr-10 text-[14.5px] text-[#171C1F] bg-white border border-midnight/[.14] rounded-lg outline-none"
        {...field} />
      <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
        onClick={onToggleShow}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#75777E] p-0.5">
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Welcome back!", description: "Redirecting to your dashboard..." });
      if (data.user?.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: LoginFormData) => loginMutation.mutate(data);

  return (
    <div className="auth-page-shell">
      <SEO
        title="Sign In — Scholar.name"
        description="Sign in to manage your academic portfolio on Scholar.name."
        url="https://scholar.name/login"
        type="website"
      />

      {/* Auth-mode nav */}
      <nav className="bg-white/90 backdrop-blur-[14px] border-b border-midnight/[.08] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-8 py-2.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 font-serif text-lg font-semibold text-midnight no-underline tracking-[-0.01em]">
            <BookOpen size={22} className="text-midnight" />
            Scholar.name
          </a>
          <a href="/" className="text-[13.5px] text-[#44474D] no-underline">← Back to Home</a>
        </div>
      </nav>

      {/* Page body */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">

        {/* SVG decorative backdrop */}
        <div className="auth-backdrop" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <defs>
              <radialGradient id="lgold" cx="75%" cy="20%" r="50%">
                <stop offset="0%" stopColor="#FFC72E" stopOpacity=".18" />
                <stop offset="100%" stopColor="#FFC72E" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lnavy" cx="20%" cy="80%" r="50%">
                <stop offset="0%" stopColor="#0B1F3A" stopOpacity=".08" />
                <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#lgold)" />
            <rect width="1200" height="800" fill="url(#lnavy)" />
            <path d="M-80 600 Q200 100 600 400 T1280 200" stroke="rgba(11,31,58,.06)" strokeWidth="1.5" fill="none" />
            <path d="M-100 700 Q300 300 700 500 T1300 100" stroke="rgba(255,199,46,.12)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Card */}
        <div className="auth-card relative z-10 px-9 pt-9 pb-7">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-full bg-midnight/[.06] flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h1 className="font-serif text-[26px] font-medium text-midnight mb-1.5 tracking-[-0.015em]">Welcome back</h1>
            <p className="text-sm text-[#44474D] m-0">Sign in to manage your research portfolio</p>
          </div>

          {/* OAuth buttons */}
          <button type="button" disabled className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-midnight/[.14] bg-white text-sm font-medium text-midnight cursor-not-allowed opacity-65 mb-2.5">
            <span className="w-[18px] h-[18px] rounded-[3px] bg-[#3EB750] text-white grid place-items-center text-[11px] font-extrabold italic shrink-0">iD</span>
            Continue with ORCID
          </button>
          <button type="button" disabled className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-midnight/[.14] bg-white text-sm font-medium text-midnight cursor-not-allowed opacity-65">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

          {/* Email/password form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <FormLabel className="text-[13px] text-midnight font-medium">Email</FormLabel>
                  <FormControl>
                    <input type="email" placeholder="jane.smith@university.edu" autoComplete="email"
                      className="w-full px-3 py-2.5 text-[14.5px] text-[#171C1F] bg-white border border-midnight/[.14] rounded-lg outline-none"
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-[13px] text-midnight font-medium">Password</FormLabel>
                    <a href="/forgot-password" className="text-xs text-[#44474D] underline decoration-warm underline-offset-2">Forgot password?</a>
                  </div>
                  <PasswordField showPassword={showPassword} onToggleShow={() => setShowPassword(!showPassword)} field={field} />
                  <FormMessage />
                </FormItem>
              )} />

              {/* Keep signed in */}
              <label className="flex items-center gap-2 text-[13px] text-[#44474D] cursor-pointer">
                <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-3.5 h-3.5 accent-midnight" />
                Keep me signed in
              </label>

              <button type="submit" disabled={loginMutation.isPending}
                className={`w-full px-5 py-3 ${loginMutation.isPending ? "bg-[#9AA3B2] cursor-not-allowed" : "bg-midnight cursor-pointer"} text-white rounded-lg text-sm font-semibold border-none flex items-center justify-center gap-2 mt-1`}>
                {loginMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign in"}
              </button>
            </form>
          </Form>

          {/* Footer links */}
          <p className="text-center text-[13px] text-[#44474D] mt-5 mb-0">
            Don't have an account?{" "}
            <a href="/signup" className="text-midnight font-semibold underline decoration-warm underline-offset-2">Create one free</a>
          </p>

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-3.5 mt-[22px] pt-[18px] border-t border-midnight/[.08] flex-wrap">
            {["End-to-end encrypted", "SSO via ORCID", "SOC 2"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1 text-[11px] text-[#75777E] tracking-[.01em]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
