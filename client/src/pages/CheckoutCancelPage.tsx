import { useLocation } from "wouter";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
      <SEO
        title="Payment Cancelled — Scholar.name"
        description="Your payment was cancelled. No charges were made."
        type="website"
      />
      <GlobalNav mode="auth" />

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 24px 48px" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(11,31,58,.08)", boxShadow: "0 20px 60px -20px rgba(11,31,58,.12)", padding: "44px 40px 40px", textAlign: "center" }}>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0F4F8", border: "1px solid rgba(11,31,58,.08)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
            <XCircle size={28} style={{ color: "#0B1F3A", opacity: .5 }} />
          </div>

          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 10px", letterSpacing: "-0.015em" }}>
            Payment Cancelled
          </h1>
          <p style={{ fontSize: 15, color: "#44474D", lineHeight: 1.6, margin: "0 0 28px" }}>
            Your payment was not completed. No charges were made to your account.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(11,31,58,.06)", margin: "0 0 28px" }} />

          <p style={{ fontSize: 14, color: "#75777E", lineHeight: 1.6, margin: "0 0 32px" }}>
            If you experienced any issues or have questions about our plans, we're happy to help.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => navigate("/#pricing")}
              style={{ width: "100%", padding: "12px 20px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              data-testid="button-try-again"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/contact")}
              style={{ width: "100%", padding: "12px 20px", background: "#fff", color: "#0B1F3A", border: "1px solid rgba(11,31,58,.14)", borderRadius: 10, fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              data-testid="button-contact-support"
            >
              <MessageCircle size={15} /> Contact Support
            </button>
            <button
              onClick={() => navigate("/")}
              style={{ width: "100%", padding: "12px 20px", background: "transparent", color: "#75777E", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              data-testid="button-back-home"
            >
              <ArrowLeft size={14} /> Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
