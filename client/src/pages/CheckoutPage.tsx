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

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

const PRICING = {
  starter: { monthly: 9.99, yearly: 95.88, name: "Starter" },
  pro: { monthly: 19.99, yearly: 191.88, name: "Pro" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", fontSize: 14, fontFamily: "inherit",
  borderRadius: 9, border: "1px solid rgba(11,31,58,.14)", outline: "none",
  color: "#171C1F", background: "#fff", boxSizing: "border-box",
  transition: "border-color .15s",
};

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
      <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
        <SEO title="Checkout — Scholar.name" description="Complete your order." url="https://scholar.name/checkout" type="website" />
        <GlobalNav mode="auth" />
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", padding: "40px 36px", textAlign: "center" }}>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px" }}>Payment Coming Soon</h1>
            <p style={{ fontSize: 15, color: "#44474D", margin: "0 0 24px", lineHeight: 1.6 }}>Online payment is being set up. Please contact us to get started.</p>
            <button onClick={() => navigate("/contact")} style={{ padding: "11px 24px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
              Contact Us
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
      <SEO title="Checkout — Scholar.name" description="Complete your order for a Scholar.name research portfolio." url="https://scholar.name/checkout" type="website" />
      <GlobalNav mode="auth" />

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "64px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="checkout-grid">
          <style>{`@media (max-width: 680px) { .checkout-grid { grid-template-columns: 1fr !important; } }`}</style>

          {/* Left: Order summary */}
          <div>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(24px,3vw,32px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 8px", letterSpacing: "-0.015em" }}>
              Complete your order
            </h1>
            <p style={{ fontSize: 15, color: "#44474D", margin: "0 0 24px", lineHeight: 1.6 }}>
              You're one step away from your professional research portfolio.
            </p>

            {/* Plan card */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(11,31,58,.08)", padding: "24px 24px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#0B1F3A" }}>{pricing.name} Plan</div>
                  <div style={{ fontSize: 13.5, color: "#75777E", textTransform: "capitalize" }}>{billingPeriod} billing</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A" }}>${amount.toFixed(2)}</span>
                  <span style={{ fontSize: 13, color: "#75777E" }}>/{billingPeriod === "yearly" ? "year" : "month"}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {planFeatures[plan]?.map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#171C1F" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(11,31,58,.06)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Check size={10} style={{ color: "#0B1F3A" }} />
                    </span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#75777E" }}>
              <Shield size={14} style={{ color: "#FFC72E" }} />
              Secure payment powered by MontyPay
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(11,31,58,.08)", padding: "28px 28px 24px" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#0B1F3A", margin: "0 0 4px" }}>Your details</h2>
            <p style={{ fontSize: 13.5, color: "#75777E", margin: "0 0 20px" }}>Enter your information to proceed to payment</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Full Name</FormLabel>
                    <FormControl>
                      <input placeholder="Dr. Jane Smith" style={inputStyle} {...field} data-testid="input-customer-name"
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FFC72E"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(11,31,58,.14)"; }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="customerEmail" render={({ field }) => (
                  <FormItem style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <FormLabel style={{ fontSize: 13, color: "#0B1F3A", fontWeight: 500 }}>Email Address</FormLabel>
                    <FormControl>
                      <input type="email" placeholder="jane.smith@university.edu" style={inputStyle} {...field} data-testid="input-customer-email"
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#FFC72E"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(11,31,58,.14)"; }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {checkoutMutation.error && (
                  <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, fontSize: 13.5, color: "#B91C1C" }}>
                    {(checkoutMutation.error as any)?.message || "Payment failed. Please try again."}
                  </div>
                )}

                <button type="submit" disabled={checkoutMutation.isPending} data-testid="button-proceed-to-payment"
                  style={{ width: "100%", padding: "13px 20px", background: checkoutMutation.isPending ? "rgba(255,199,46,.5)" : "#FFC72E", color: "#6F5400", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: checkoutMutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                  {checkoutMutation.isPending ? (
                    <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                  ) : (
                    `Proceed to Payment — $${amount.toFixed(2)}`
                  )}
                </button>

                <p style={{ fontSize: 12.5, textAlign: "center", color: "#75777E", margin: 0 }}>
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </Form>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button onClick={() => navigate("/pricing")} data-testid="button-back-to-pricing"
                style={{ background: "none", border: "none", fontSize: 13.5, color: "#75777E", cursor: "pointer", fontFamily: "inherit" }}>
                ← Back to pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
