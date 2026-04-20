import { useLocation } from "wouter";
import SEO from "@/components/SEO";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#0B1F3A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", position: "relative", overflow: "hidden" }}>
      <SEO title="Page Not Found — Scholar.name" description="The page you're looking for doesn't exist." />

      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.14), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />

      {/* Minimal logo nav */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "18px 32px", display: "flex", alignItems: "center" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#FFC72E", display: "grid", placeItems: "center" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 700, color: "#0B1F3A", lineHeight: 1 }}>S</span>
          </div>
          <span style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 500, color: "#fff", letterSpacing: "-0.01em" }}>Scholar.name</span>
        </a>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(80px,18vw,140px)", fontWeight: 500, color: "rgba(255,199,46,.18)", lineHeight: 1, marginBottom: 0, letterSpacing: "-0.04em", userSelect: "none" }}>
          404
        </div>
        <div style={{ width: 48, height: 3, background: "#FFC72E", borderRadius: 2, margin: "-12px auto 24px" }} />
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 500, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.015em" }}>
          Page not found
        </h1>
        <p style={{ fontSize: 15.5, color: "rgba(255,255,255,.6)", lineHeight: 1.6, margin: "0 0 32px" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: ".01em" }}
          data-testid="button-go-home"
        >
          ← Go Home
        </button>
      </div>
    </div>
  );
}
