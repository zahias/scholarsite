import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Sparkles, User, Building2, Loader2, CheckCircle } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";
import type { Theme } from "@shared/schema";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  planInterest: z.string().min(1, "Please select a plan"),
  message: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", fontSize: 14, fontFamily: "inherit",
  borderRadius: 9, border: "1px solid rgba(11,31,58,.14)", outline: "none",
  color: "#171C1F", background: "#fff", boxSizing: "border-box",
};

export default function ContactPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPlan = urlParams.get("plan") || "";

  const { data: themes = [] } = useQuery<Theme[]>({ queryKey: ["/api/themes"] });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { fullName: "", email: "", planInterest: preselectedPlan || "trial", message: "" },
  });

  const selectedPlan = form.watch("planInterest");

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit inquiry");
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({ title: "Inquiry Submitted", description: "We'll get back to you within 1-2 business days." });
    },
    onError: () => {
      toast({ title: "Submission Failed", description: "Please try again or email us directly.", variant: "destructive" });
    },
  });

  const onSubmit = (data: ContactFormData) => submitMutation.mutate(data);

  if (isSubmitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
        <SEO title="Thank You — Scholar.name" description="Your inquiry has been submitted." url="https://scholar.name/contact" type="website" />
        <GlobalNav mode="landing" hideSignup hideLogin />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 24px" }} aria-live="polite">
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", padding: "48px 40px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,199,46,.15)", border: "1px solid rgba(255,199,46,.3)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
              <CheckCircle size={28} style={{ color: "#FFC72E" }} />
            </div>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px" }}>Thank you!</h1>
            <p style={{ fontSize: 15, color: "#44474D", lineHeight: 1.6, margin: "0 0 28px" }}>
              Your inquiry has been submitted. Our team will review your request and get back to you within 1-2 business days.
            </p>
            <button onClick={() => navigate("/")} data-testid="button-back-home"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
      <SEO title="Get Started — Scholar.name" description="Contact us to set up your professional research portfolio website." url="https://scholar.name/contact" type="website" />
      <GlobalNav mode="landing" hideSignup hideLogin />

      <main>
        {/* Hero */}
        <section style={{ background: "#0B1F3A", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.14), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1, textAlign: "center" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, display: "block", marginBottom: 16 }}>Get Started</span>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.08, fontWeight: 500, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
              Get started with Scholar.name
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", lineHeight: 1.55 }}>
              Tell us about your needs and we'll help you create the perfect research portfolio.
            </p>
          </div>
        </section>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.1)", padding: "36px 36px 32px" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, color: "#0B1F3A", margin: "0 0 4px" }}>Get Started</h2>
            <p style={{ fontSize: 14, color: "#75777E", margin: "0 0 24px" }}>
              Fill out this quick form and we'll set up your portfolio within 24 hours.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Name + email */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="name-row">
                  <style>{`@media (max-width: 520px) { .name-row { grid-template-columns: 1fr !important; } }`}</style>
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Full Name *</FormLabel>
                      <FormControl>
                        <input id="fullName" autoComplete="name" placeholder="Dr. Jane Smith" style={inputStyle} {...field} data-testid="input-name"
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FFC72E"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(11,31,58,.14)"; }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Email Address *</FormLabel>
                      <FormControl>
                        <input id="email" type="email" autoComplete="email" placeholder="jane@university.edu" style={inputStyle} {...field} data-testid="input-email"
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FFC72E"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(11,31,58,.14)"; }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Plan interest — styled radio chips */}
                <FormField control={form.control} name="planInterest" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500, display: "block", marginBottom: 8 }}>Which plan interests you? *</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid sm:grid-cols-3 gap-3">
                        {[
                          { value: "trial", icon: Sparkles, label: "Free Trial", sub: "14 days free" },
                          { value: "starter", icon: User, label: "Starter", sub: "$9.99/month" },
                          { value: "professional", icon: Building2, label: "Pro", sub: "$19.99/month" },
                        ].map(({ value, icon: Icon, label, sub }) => (
                          <div key={value} className="relative">
                            <RadioGroupItem value={value} id={value} className="peer sr-only" data-testid={`radio-${value}`} />
                            <Label htmlFor={value} style={{
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                              borderRadius: 11, border: selectedPlan === value ? "2px solid #FFC72E" : "1px solid rgba(11,31,58,.1)",
                              background: selectedPlan === value ? "rgba(255,199,46,.06)" : "#F8F9FA",
                              padding: "14px 12px", cursor: "pointer", transition: "border-color .15s, background .15s",
                            }}>
                              <Icon size={20} style={{ color: selectedPlan === value ? "#B87A0A" : "#44474D", marginBottom: 6 }} />
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0B1F3A" }}>{label}</span>
                              <span style={{ fontSize: 12, color: "#75777E" }}>{sub}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Message */}
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Anything else? (optional)</FormLabel>
                    <FormControl>
                      <textarea id="message" placeholder="Tell us about yourself, your OpenAlex ID, or any questions…"
                        style={{ ...inputStyle, minHeight: 80, resize: "vertical" } as React.CSSProperties} {...field} data-testid="textarea-message"
                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#FFC72E"; }}
                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(11,31,58,.14)"; }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <button type="submit" disabled={submitMutation.isPending} data-testid="button-submit-inquiry"
                  style={{ width: "100%", padding: "13px 20px", background: submitMutation.isPending ? "rgba(255,199,46,.5)" : "#FFC72E", color: "#6F5400", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: submitMutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                  {submitMutation.isPending ? (
                    <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Setting up your portfolio…</>
                  ) : (
                    <>Start My Free Trial <Send size={14} /></>
                  )}
                </button>
              </form>
            </Form>

            <p style={{ fontSize: 12.5, textAlign: "center", color: "#75777E", marginTop: 14 }}>
              By submitting, you agree to our{" "}
              <Link href="/privacy" style={{ color: "#2563EB", textDecoration: "none" }}>Privacy Policy</Link>
              {" "}and{" "}
              <Link href="/terms" style={{ color: "#2563EB", textDecoration: "none" }}>Terms of Service</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
