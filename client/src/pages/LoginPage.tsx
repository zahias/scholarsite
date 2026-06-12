import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
      <nav style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(11,31,58,.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: "#0B1F3A", textDecoration: "none", letterSpacing: "-0.01em" }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "#0B1F3A", color: "#FFC72E", display: "grid", placeItems: "center", fontFamily: "'Newsreader', serif", fontSize: 14, fontWeight: 700, fontStyle: "italic" }}>S</span>
            Scholar.name
          </a>
          <a href="/" style={{ fontSize: 13.5, color: "#44474D", textDecoration: "none" }}>← Back to Home</a>
        </div>
      </nav>

      {/* Page body */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative" }}>

        {/* SVG decorative backdrop */}
        <div className="auth-backdrop" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
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
        <div className="auth-card" style={{ position: "relative", zIndex: 1, padding: "36px 36px 28px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(11,31,58,.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "#0B1F3A", margin: "0 0 6px", letterSpacing: "-0.015em" }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "#44474D", margin: 0 }}>Sign in to manage your research portfolio</p>
          </div>

          {/* OAuth buttons */}
          <button type="button" disabled style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(11,31,58,.14)", background: "#fff", fontSize: 14, fontWeight: 500, color: "#0B1F3A", cursor: "not-allowed", opacity: .65, marginBottom: 10, fontFamily: "inherit" }}>
            <span style={{ width: 18, height: 18, borderRadius: 3, background: "#3EB750", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, fontStyle: "italic", flexShrink: 0 }}>iD</span>
            Continue with ORCID
          </button>
          <button type="button" disabled style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(11,31,58,.14)", background: "#fff", fontSize: 14, fontWeight: 500, color: "#0B1F3A", cursor: "not-allowed", opacity: .65, marginBottom: 0, fontFamily: "inherit" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

          {/* Email/password form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Email</FormLabel>
                  <FormControl>
                    <input type="email" placeholder="jane.smith@university.edu" autoComplete="email"
                      style={{ width: "100%", padding: "10px 12px", fontSize: 14.5, fontFamily: "inherit", color: "#171C1F", background: "#fff", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, outline: "none" }}
                      {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Password</FormLabel>
                    <a href="/forgot-password" style={{ fontSize: 12, color: "#44474D", textDecoration: "underline", textDecorationColor: "#FFC72E", textUnderlineOffset: 2 }}>Forgot password?</a>
                  </div>
                  <FormControl>
                    <div style={{ position: "relative" }}>
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
                        style={{ width: "100%", padding: "10px 40px 10px 12px", fontSize: 14.5, fontFamily: "inherit", color: "#171C1F", background: "#fff", border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, outline: "none" }}
                        {...field} />
                      <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#75777E", padding: 2 }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Keep signed in */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#44474D", cursor: "pointer" }}>
                <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: "#0B1F3A" }} />
                Keep me signed in
              </label>

              <button type="submit" disabled={loginMutation.isPending}
                style={{ width: "100%", padding: "12px 20px", background: loginMutation.isPending ? "#9AA3B2" : "#0B1F3A", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", border: "none", cursor: loginMutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                {loginMutation.isPending ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign in"}
              </button>
            </form>
          </Form>

          {/* Footer links */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#44474D", marginTop: 20, marginBottom: 0 }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color: "#0B1F3A", fontWeight: 600, textDecoration: "underline", textDecorationColor: "#FFC72E", textUnderlineOffset: 2 }}>Create one free</a>
          </p>

          {/* Trust strip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(11,31,58,.08)", flexWrap: "wrap" }}>
            {["End-to-end encrypted", "SSO via ORCID", "SOC 2"].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#75777E", letterSpacing: ".01em" }}>
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
