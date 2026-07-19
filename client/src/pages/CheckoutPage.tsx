import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Shield, Check } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";
import { PRICING } from "@shared/pricing";

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

const PLAN_NAMES: Record<keyof typeof PRICING, string> = {
  starter: "Starter",
  pro: "Pro",
};

const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-[9px] border border-midnight/[.14] outline-none text-[#171C1F] bg-white box-border transition-colors duration-150 focus:border-warm";

const planFeatures: Record<string, string[]> = {
  starter: ["scholar.name subdomain", "Publication analytics", "Monthly data sync"],
  pro: ["Custom domain (yourname.com)", "Research Passport download", "Monthly data sync"],
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
    defaultValues: { customerName: "", customerEmail: "" },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, plan, billingPeriod, openalexId }),
      });
      const payload = await response.json();
      if (!response.ok && !payload.fallbackUrl) {
        throw new Error(payload.message || "Failed to create checkout session");
      }
      return payload;
    },
    onSuccess: (data) => {
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else if (data.fallbackUrl) navigate(data.fallbackUrl);
    },
  });

  const onSubmit = (data: CheckoutFormData) => checkoutMutation.mutate(data);

  if (checkoutConfig && !checkoutConfig.isConfigured) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <SEO title="Checkout — Scholar.name" description="Complete your order." url="https://scholar.name/checkout" type="website" />
        <GlobalNav mode="auth" />
        <div className="max-w-[440px] mx-auto px-6 py-20">
          <div className="bg-white rounded-[20px] border border-midnight/[.08] px-9 pt-10 pb-9 text-center">
            <h1 className="font-serif text-2xl font-medium text-midnight mb-2.5">Payment Coming Soon</h1>
            <p className="text-[15px] text-[#44474D] leading-relaxed mb-6">Online payment is being set up. Please contact us to get started.</p>
            <button onClick={() => navigate("/contact")} className="px-6 py-2.5 bg-warm text-on-secondary-container border-none rounded-[9px] text-sm font-bold cursor-pointer">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <SEO title="Checkout — Scholar.name" description="Complete your order for a Scholar.name research portfolio." url="https://scholar.name/checkout" type="website" />
      <GlobalNav mode="auth" />

      <div className="max-w-[880px] mx-auto px-6 pt-16 pb-20">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="checkout-grid">
          <style>{`@media (max-width: 680px) { .checkout-grid { grid-template-columns: 1fr !important; } }`}</style>

          {/* Left: Order summary */}
          <div>
            <h1 className="font-serif font-medium text-midnight mb-2 tracking-[-0.015em]" style={{ fontSize: "clamp(24px,3vw,32px)" }}>
              Complete your order
            </h1>
            <p className="text-[15px] text-[#44474D] leading-relaxed mb-6">
              You're one step away from your professional research portfolio.
            </p>

            {/* Plan card */}
            <div className="bg-white rounded-2xl border border-midnight/[.08] px-6 pt-6 pb-5 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-serif text-xl font-medium text-midnight">{PLAN_NAMES[plan]} Plan</div>
                  <div className="text-[13.5px] text-[#75777E] capitalize">{billingPeriod} billing</div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-[28px] font-semibold text-midnight">${amount.toFixed(2)}</span>
                  <span className="text-[13px] text-[#75777E]">/{billingPeriod === "yearly" ? "year" : "month"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {planFeatures[plan]?.map((feat) => (
                  <div key={feat} className="flex items-center gap-[9px] text-sm text-[#171C1F]">
                    <span className="w-[18px] h-[18px] rounded-full bg-midnight/[.06] grid place-items-center shrink-0">
                      <Check size={10} className="text-midnight" />
                    </span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-[13px] text-[#75777E]">
              <Shield size={14} className="text-warm" />
              Secure payment powered by MontyPay
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl border border-midnight/[.08] px-7 pt-7 pb-6">
            <h2 className="font-serif text-xl font-medium text-midnight mb-1">Your details</h2>
            <p className="text-[13.5px] text-[#75777E] mb-5">Enter your information to proceed to payment</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-[13px] text-midnight font-medium">Full Name</FormLabel>
                    <FormControl>
                      <input placeholder="Dr. Jane Smith" className={inputClass} {...field} data-testid="input-customer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="customerEmail" render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="text-[13px] text-midnight font-medium">Email Address</FormLabel>
                    <FormControl>
                      <input type="email" placeholder="jane.smith@university.edu" className={inputClass} {...field} data-testid="input-customer-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {checkoutMutation.error && (
                  <div className="px-3.5 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[9px] text-[13.5px] text-[#B91C1C]">
                    {(checkoutMutation.error as any)?.message || "Payment failed. Please try again."}
                  </div>
                )}

                <button type="submit" disabled={checkoutMutation.isPending} data-testid="button-proceed-to-payment"
                  className={`w-full px-5 py-3.5 ${checkoutMutation.isPending ? "bg-warm/50 cursor-not-allowed" : "bg-warm cursor-pointer"} text-on-secondary-container border-none rounded-[10px] text-[14.5px] font-bold flex items-center justify-center gap-2 mt-1`}>
                  {checkoutMutation.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Processing…</>
                  ) : (
                    `Proceed to Payment — $${amount.toFixed(2)}`
                  )}
                </button>

                <p className="text-[12.5px] text-center text-[#75777E] m-0">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <button onClick={() => navigate("/pricing")} data-testid="button-back-to-pricing"
                className="bg-transparent border-none text-[13.5px] text-[#75777E] cursor-pointer">
                ← Back to pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
