import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Database, Clock, Mail, Globe, Award, CheckCircle, ExternalLink } from "lucide-react";
import SEO from "@/components/SEO";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";

export default function AboutPage() {
  const [, navigate] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>
      <SEO
        title="About Scholar.name — Our Mission & Team"
        description="Learn about Scholar.name, our mission to help researchers showcase their work, how we source data, and our commitment to accuracy and privacy."
        url="https://scholar.name/about"
      />
      <GlobalNav mode="landing" />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ background: "#0B1F3A", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.14), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1, textAlign: "center" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, display: "block", marginBottom: 16 }}>About Us</span>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(32px,5vw,56px)", lineHeight: 1.08, fontWeight: 500, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Helping researchers showcase their work
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", lineHeight: 1.55, maxWidth: 540, margin: "0 auto" }}>
              Scholar.name was built to solve a simple problem: researchers deserve better than a bare Google Scholar listing or an outdated faculty page.
            </p>
          </div>
        </section>

        <section style={{ background: "#F0F4F8", padding: "64px 24px 80px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Mission */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(11,31,58,.08)", padding: "32px 32px" }}>
              <span style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 700, display: "block", marginBottom: 12 }}>Our Mission</span>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 500, color: "#0B1F3A", margin: "0 0 14px", letterSpacing: "-0.01em" }}>
                Built by researchers, for researchers
              </h2>
              <p style={{ fontSize: 15.5, color: "#44474D", lineHeight: 1.7, margin: "0 0 12px" }}>
                Scholar.name was created by academics who were frustrated with the lack of good options for presenting research online. We understand the academic world because we live it — the pressure to publish, the need to stand out for grants and positions, and the desire to have your work recognized.
              </p>
              <p style={{ fontSize: 15.5, color: "#44474D", lineHeight: 1.7, margin: 0 }}>
                We believe every researcher should have a professional, up-to-date portfolio that reflects their contributions to science — without spending hours maintaining it manually.
              </p>
            </div>

            {/* Data sources */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(11,31,58,.08)", padding: "32px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(11,31,58,.06)", display: "grid", placeItems: "center" }}>
                  <Database size={17} style={{ color: "#0B1F3A" }} />
                </span>
                <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 500, color: "#0B1F3A", margin: 0 }}>
                  Where your data comes from
                </h2>
              </div>

              {/* OpenAlex card */}
              <div style={{ background: "#F0F4F8", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Globe size={16} style={{ color: "#2563EB" }} />
                  <span style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 500, color: "#0B1F3A" }}>OpenAlex — Our Primary Data Source</span>
                </div>
                <p style={{ fontSize: 14.5, color: "#44474D", lineHeight: 1.65, margin: "0 0 12px" }}>
                  All publication data on Scholar.name comes from{" "}
                  <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    OpenAlex <ExternalLink size={11} />
                  </a>
                  , a free and open catalog of the world's scholarly papers, researchers, and institutions.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {["250+ million works indexed from major publishers and databases", "Updated daily with new publications and citations", "Open and transparent — anyone can verify the source data"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#44474D" }}>
                      <CheckCircle size={14} style={{ color: "#059669", flexShrink: 0, marginTop: 2 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated vs controlled */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="about-grid">
                <style>{`@media (max-width: 560px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>
                <div style={{ background: "#F0F4F8", borderRadius: 11, padding: "16px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 10 }}>✓ Automated (from OpenAlex)</div>
                  {["Publication list & metadata", "Citation counts & metrics", "Co-author networks", "Research topics", "Affiliation history"].map((item) => (
                    <div key={item} style={{ fontSize: 13.5, color: "#44474D", padding: "3px 0" }}>• {item}</div>
                  ))}
                </div>
                <div style={{ background: "#F0F4F8", borderRadius: 11, padding: "16px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginBottom: 10 }}>✦ You control</div>
                  {["Bio & profile description", "Profile photo", "Which publications to feature", "Custom sections (awards, grants)", "Theme & visual design", "Privacy (public/private)"].map((item) => (
                    <div key={item} style={{ fontSize: 13.5, color: "#44474D", padding: "3px 0" }}>• {item}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Accuracy note */}
            <div style={{ background: "rgba(255,199,46,.08)", borderRadius: 14, border: "1px solid rgba(255,199,46,.25)", padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Award size={16} style={{ color: "#B87A0A" }} />
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 500, color: "#0B1F3A" }}>Data Accuracy Commitment</span>
              </div>
              <p style={{ fontSize: 14.5, color: "#44474D", lineHeight: 1.65, margin: "0 0 8px" }}>
                We know data accuracy is crucial. Publication matching — especially for common names, name variations, and transliterated names — is an ongoing challenge in bibliometrics. We sync directly from OpenAlex and show you exactly when data was last updated.
              </p>
              <p style={{ fontSize: 14.5, color: "#44474D", lineHeight: 1.65, margin: 0 }}>
                <strong>If something looks wrong:</strong> You can report issues directly from your profile, and we'll investigate.
              </p>
            </div>

            {/* Contact */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(11,31,58,.08)", padding: "32px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(11,31,58,.06)", display: "grid", placeItems: "center" }}>
                  <Mail size={17} style={{ color: "#0B1F3A" }} />
                </span>
                <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 500, color: "#0B1F3A", margin: 0 }}>
                  Contact & Support
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="about-grid">
                <div style={{ background: "#F0F4F8", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 500, color: "#0B1F3A", marginBottom: 4 }}>Email Support</div>
                  <div style={{ fontSize: 13.5, color: "#75777E", marginBottom: 8 }}>Best for detailed questions</div>
                  <a href="mailto:support@scholar.name" style={{ fontSize: 14, color: "#2563EB", textDecoration: "none" }}>support@scholar.name</a>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#75777E", marginTop: 8 }}>
                    <Clock size={12} /> Response: 24-48 hours
                  </div>
                </div>
                <div style={{ background: "#F0F4F8", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 500, color: "#0B1F3A", marginBottom: 4 }}>Contact Form</div>
                  <div style={{ fontSize: 13.5, color: "#75777E", marginBottom: 8 }}>Quick questions & help</div>
                  <Link href="/contact" style={{ fontSize: 14, color: "#2563EB", textDecoration: "none" }}>Open contact form →</Link>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#75777E", marginTop: 8 }}>
                    <Clock size={12} /> Usually within minutes
                  </div>
                </div>
              </div>
            </div>

            {/* CTA band */}
            <div style={{ background: "#0B1F3A", borderRadius: 16, padding: "44px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.15), transparent 55%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 500, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                  Ready to create your portfolio?
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,.65)", margin: "0 0 24px" }}>
                  Join researchers from leading institutions who trust Scholar.name.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => navigate("/signup")} style={{ padding: "11px 24px", background: "#FFC72E", color: "#6F5400", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                    Create Free Account
                  </button>
                  <button onClick={() => navigate("/")} style={{ padding: "11px 20px", background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.18)", borderRadius: 9, fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}
