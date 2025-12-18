import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BookOpen, Check, Loader2, Shield, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

const PRICING = {
  starter: { monthly: 9.99, yearly: 95.88, name: "Starter" },
  pro: { monthly: 19.99, yearly: 191.88, name: "Pro" },
};

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const plan = (urlParams.get("plan") as "starter" | "pro") || "starter";
  const billingPeriod = (urlParams.get("billing") as "monthly" | "yearly") || "monthly";
  const openalexId = urlParams.get("openalexId") || undefined;

  const pricing = PRICING[plan];
  const amount = billingPeriod === "yearly" ? pricing.yearly : pricing.monthly;

  const { data: checkoutConfig } = useQuery<{ isConfigured: boolean }>({
    queryKey: ["/api/checkout/config"],
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const response = await apiRequest("POST", "/api/checkout/create-session", {
        ...data,
        plan,
        billingPeriod,
        openalexId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.fallbackUrl) {
        navigate(data.fallbackUrl);
      }
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    checkoutMutation.mutate(data);
  };

  if (checkoutConfig && !checkoutConfig.isConfigured) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 nav-premium">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
                <BookOpen className="h-7 w-7 text-white mr-2" />
                <span className="text-lg font-semibold text-white">ScholarName</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 py-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Payment Coming Soon</CardTitle>
              <CardDescription>
                Online payment is being set up. Please contact us to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">ScholarName</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
            <p className="text-muted-foreground mb-8">
              You're one step away from your professional research portfolio.
            </p>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{pricing.name} Plan</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {billingPeriod} billing
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">/{billingPeriod === "yearly" ? "year" : "month"}</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {plan === "starter" && (
                    <>
                      <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>scholar.name subdomain</span></div>
                      <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Publication analytics</span></div>
                      <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Monthly data sync</span></div>
                    </>
                  )}
                  {plan === "pro" && (
                    <>
                      <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Custom domain (yourname.com)</span></div>
                      <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Research Passport download</span></div>
                      <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Weekly data sync</span></div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by MontyPay</span>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Your Details
                </CardTitle>
                <CardDescription>
                  Enter your information to proceed to payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. Jane Smith" {...field} data-testid="input-customer-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane.smith@university.edu" {...field} data-testid="input-customer-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {checkoutMutation.error && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {(checkoutMutation.error as any)?.message || "Payment failed. Please try again."}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={checkoutMutation.isPending}
                      data-testid="button-proceed-to-payment"
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment - ${amount.toFixed(2)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By proceeding, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => navigate("/#pricing")} data-testid="button-back-to-pricing">
                ← Back to pricing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
