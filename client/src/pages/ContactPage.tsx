import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft, Send, Building2, User, Users, Palette } from "lucide-react";
import type { Theme, ThemeConfig } from "@shared/schema";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  institution: z.string().optional(),
  role: z.string().optional(),
  planInterest: z.string().min(1, "Please select a plan"),
  researchField: z.string().optional(),
  openalexId: z.string().optional(),
  estimatedProfiles: z.string().optional(),
  biography: z.string().min(10, "Please provide a short biography").max(500, "Biography must be 500 characters or less"),
  preferredTheme: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPlan = urlParams.get('plan') || '';

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      institution: "",
      role: "",
      planInterest: preselectedPlan,
      researchField: "",
      openalexId: "",
      estimatedProfiles: "",
      biography: "",
      preferredTheme: "",
    },
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
      toast({
        title: "Inquiry Submitted",
        description: "We'll get back to you within 1-2 business days.",
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or email us directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 nav-premium">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <Link href="/" className="flex items-center">
                <BookOpen className="h-7 w-7 text-white mr-2" />
                <span className="text-lg font-semibold text-white">ScholarName</span>
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your inquiry has been submitted successfully. Our team will review your request and get back to you within 1-2 business days.
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
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center">
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">ScholarName</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate("/")}
          data-testid="button-back-landing"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Get Started with ScholarName</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us about your needs and we'll help you create the perfect research portfolio website.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Fill out the form below and our team will reach out to discuss your requirements.
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
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Jane Smith" {...field} data-testid="input-name" />
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
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="jane.smith@university.edu" type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution / Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Stanford University" {...field} data-testid="input-institution" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Professor, Researcher, PhD Student" {...field} data-testid="input-role" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="planInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Which plan interests you? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid sm:grid-cols-2 gap-4"
                        >
                          <div className="relative">
                            <RadioGroupItem
                              value="starter"
                              id="starter"
                              className="peer sr-only"
                              data-testid="radio-starter"
                            />
                            <Label
                              htmlFor="starter"
                              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                            >
                              <User className="mb-2 h-6 w-6" />
                              <span className="font-semibold">Starter</span>
                              <span className="text-sm text-muted-foreground">$9.99/month</span>
                            </Label>
                          </div>
                          <div className="relative">
                            <RadioGroupItem
                              value="professional"
                              id="professional"
                              className="peer sr-only"
                              data-testid="radio-professional"
                            />
                            <Label
                              htmlFor="professional"
                              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                            >
                              <Building2 className="mb-2 h-6 w-6" />
                              <span className="font-semibold">Pro</span>
                              <span className="text-sm text-muted-foreground">$19.99/month</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="researchField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Research Field</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Machine Learning, Molecular Biology" {...field} data-testid="input-research-field" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openalexId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OpenAlex ID (if known)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A5037710835" {...field} data-testid="input-openalex-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedPlan === "institution" && (
                  <FormField
                    control={form.control}
                    name="estimatedProfiles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Number of Researcher Profiles</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-profiles">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-5">1-5 profiles</SelectItem>
                            <SelectItem value="6-10">6-10 profiles</SelectItem>
                            <SelectItem value="11-25">11-25 profiles</SelectItem>
                            <SelectItem value="26-50">26-50 profiles</SelectItem>
                            <SelectItem value="50+">50+ profiles</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="biography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Biography *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself, your research interests, and academic background. This will help us understand your portfolio needs."
                          className="min-h-[120px]"
                          maxLength={500}
                          {...field}
                          data-testid="textarea-biography"
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormMessage />
                        <span className={`text-xs ${(field.value?.length || 0) > 450 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {field.value?.length || 0}/500 characters
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {themes.length > 0 && (
                  <FormField
                    control={form.control}
                    name="preferredTheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Preferred Theme
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-theme">
                              <SelectValue placeholder="Choose your portfolio theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {themes.map((theme) => {
                              const config = theme.config as ThemeConfig;
                              return (
                                <SelectItem key={theme.id} value={theme.id}>
                                  <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                      <div
                                        className="w-4 h-4 rounded-full border border-border"
                                        style={{ backgroundColor: config.colors.primary }}
                                      />
                                      <div
                                        className="w-4 h-4 rounded-full border border-border -ml-1"
                                        style={{ backgroundColor: config.colors.accent }}
                                      />
                                    </div>
                                    <span>{theme.name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a color theme for your portfolio. You can change this later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  className="w-full btn-premium py-6"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-inquiry"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By submitting this form, you agree to our{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          {" "}and{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
