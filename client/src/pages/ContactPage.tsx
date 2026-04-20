import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Building2, Users, ArrowRight } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  institutionName: z.string().min(2, "Institution name is required"),
  teamSize: z.string().min(1, "Please indicate team size"),
  message: z.string().min(10, "Please describe your needs (at least 10 characters)"),
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      institutionName: "",
      teamSize: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, planInterest: "institution" }),
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

        <div className="max-w-2xl mx-auto px-4 py-20" aria-live="polite">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your inquiry has been submitted. Our team will review it and get back to you within 1-2 business days.
              </p>
              <Button onClick={() => navigate("/")} data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Enterprise & Institutions — Scholar.name"
        description="Bring Scholar.name to your entire department or institution. Contact us for group and enterprise pricing."
        url="https://scholar.name/contact"
        type="website"
      />
      <GlobalNav mode="landing" hideSignup hideLogin />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
          data-testid="button-back-landing"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Individual signup nudge */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>Signing up as an individual researcher?</strong>{" "}
            <Link href="/signup" className="underline font-medium hover:text-blue-900">
              Create your portfolio directly →
            </Link>
          </p>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
            <Building2 className="w-4 h-4" />
            Enterprise &amp; Institutions
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Bring Scholar.name to your institution</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Streamline research visibility for your entire department. Custom onboarding, group pricing, and dedicated support.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Users, title: "Group onboarding", desc: "We help migrate your department's profiles" },
            { icon: Building2, title: "Custom branding", desc: "Match your institution's visual identity" },
            { icon: Send, title: "Dedicated support", desc: "Priority email and phone support" },
          ].map((b) => (
            <div key={b.title} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <b.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm">{b.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tell us about your institution</CardTitle>
            <CardDescription>
              We'll follow up within 1-2 business days with pricing and next steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="fullName">Your Name *</FormLabel>
                        <FormControl>
                          <Input id="fullName" autoComplete="name" placeholder="Dr. Jane Smith" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="email">Work Email *</FormLabel>
                        <FormControl>
                          <Input id="email" autoComplete="email" placeholder="jane@university.edu" type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="institutionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="institutionName">Institution / Department *</FormLabel>
                        <FormControl>
                          <Input id="institutionName" placeholder="MIT Department of Biology" {...field} data-testid="input-institution" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="teamSize">Number of researchers *</FormLabel>
                        <FormControl>
                          <Input id="teamSize" placeholder="e.g. 25" {...field} data-testid="input-team-size" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="message">Tell us about your needs *</FormLabel>
                      <FormControl>
                        <Textarea
                          id="message"
                          placeholder="Describe your use case, integration needs, timeline, or any questions..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-6"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-inquiry"
                >
                  {submitMutation.isPending ? "Sending…" : "Send Inquiry"}
                </Button>
              </form>
            </Form>

            <p style={{ fontSize: 12.5, textAlign: "center", color: "#75777E", marginTop: 14 }}>
              By submitting, you agree to our{" "}
              <Link href="/privacy" style={{ color: "#2563EB", textDecoration: "none" }}>Privacy Policy</Link>
              {" "}and{" "}
              <Link href="/terms" style={{ color: "#2563EB", textDecoration: "none" }}>Terms of Service</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
