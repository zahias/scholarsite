import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, Mail, ArrowRight, MessageCircle } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";

export default function CheckoutSuccessPage() {
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get("order");

  const { data: paymentStatus, isLoading } = useQuery<{
    orderNumber: string;
    status: string;
    plan: string;
    amount: string;
  }>({
    queryKey: ["/api/checkout/status", orderNumber],
    queryFn: async () => {
      const response = await fetch(`/api/checkout/status/${orderNumber}`);
      if (!response.ok) throw new Error("Failed to fetch payment status");
      return response.json();
    },
    enabled: !!orderNumber,
    refetchInterval: (query) => {
      if (query.state.data?.status === "completed") return false;
      return 3000;
    },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={40} style={{ color: "#FFC72E", animation: "spin 1s linear infinite", margin: "0 auto 16px", display: "block" }} />
          <p style={{ color: "#44474D", fontSize: 15 }}>Confirming your payment…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
      <SEO
        title="Payment Successful — Scholar.name"
        description="Your payment was successful. Welcome to Scholar.name."
        type="website"
      />
      <GlobalNav mode="auth" />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px 48px" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.12)", padding: "44px 40px 40px", textAlign: "center" }}>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,199,46,.15)", border: "1px solid rgba(255,199,46,.3)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
            <CheckCircle size={28} style={{ color: "#FFC72E" }} />
          </div>

          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px", letterSpacing: "-0.015em" }}>
            Payment Successful!
          </h1>
          <p style={{ fontSize: 15, color: "#44474D", lineHeight: 1.6, margin: "0 0 28px" }}>
            Welcome to Scholar.name. Your research portfolio is being set up.
          </p>

          {/* Order details */}
          {paymentStatus && (
            <div style={{ background: "#F0F4F8", borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0", fontSize: 13.5 }}>
                <span style={{ color: "#75777E" }}>Order Number</span>
                <span style={{ color: "#0B1F3A", fontWeight: 600, textAlign: "right" }}>{paymentStatus.orderNumber}</span>
                <span style={{ color: "#75777E" }}>Plan</span>
                <span style={{ color: "#0B1F3A", fontWeight: 600, textAlign: "right", textTransform: "capitalize" }}>{paymentStatus.plan}</span>
                <span style={{ color: "#75777E" }}>Amount</span>
                <span style={{ color: "#0B1F3A", fontWeight: 600, textAlign: "right" }}>${paymentStatus.amount} USD</span>
                <span style={{ color: "#75777E" }}>Status</span>
                <span style={{ color: "#059669", fontWeight: 600, textAlign: "right", textTransform: "capitalize" }}>{paymentStatus.status}</span>
              </div>
            </div>
          )}

          {/* Email notice — navy callout */}
          <div style={{ background: "#0B1F3A", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 0%, rgba(255,199,46,.18), transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Mail size={17} style={{ color: "#FFC72E", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", margin: "0 0 3px" }}>Check your email</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: 0, lineHeight: 1.5 }}>
                  We've sent setup instructions to your email. Follow them to customize your portfolio.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => navigate("/")}
              style={{ width: "100%", padding: "12px 20px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              data-testid="button-go-home"
            >
              Go to Homepage <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate("/contact")}
              style={{ width: "100%", padding: "12px 20px", background: "#fff", color: "#0B1F3A", border: "1px solid rgba(11,31,58,.14)", borderRadius: 10, fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              data-testid="button-need-help"
            >
              <MessageCircle size={15} /> Need Help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
