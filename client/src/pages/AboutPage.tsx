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
    <div className="public-page">
      <SEO
        title="About Scholar.name — Our Mission & Team"
        description="Learn about Scholar.name, our mission to help researchers showcase their work, how we source data, and our commitment to accuracy and privacy."
        url="https://scholar.name/about"
      />
      <GlobalNav mode="landing" />

      <main className="public-main">
        {/* Hero */}
        <section className="public-masthead">
          <div className="public-masthead-inner">
            <span className="public-eyebrow">About Us</span>
            <h1 className="public-title">
              Helping researchers showcase their work
            </h1>
            <p className="public-copy">
              Scholar.name was built to solve a simple problem: researchers deserve better than a bare Google Scholar listing or an outdated faculty page.
            </p>
          </div>
        </section>

        <section className="public-section">
          <div className="public-container-lg flex flex-col gap-5">

            {/* Mission */}
            <div className="bg-white rounded-2xl border border-midnight/[.08] px-10 py-9">
              <span className="text-[11px] tracking-[.18em] uppercase text-warm font-bold block mb-3">Our Mission</span>
              <h2 className="font-serif font-medium text-midnight mb-3.5 tracking-[-0.01em]" style={{ fontSize: "clamp(20px,2.5vw,26px)" }}>
                Built by researchers, for researchers
              </h2>
              <p className="public-text-measure text-[15.5px] text-[#44474D] leading-[1.7] mb-3">
                Scholar.name was created by academics who were frustrated with the lack of good options for presenting research online. We understand the academic world because we live it — the pressure to publish, the need to stand out for grants and positions, and the desire to have your work recognized.
              </p>
              <p className="public-text-measure text-[15.5px] text-[#44474D] leading-[1.7] m-0">
                We believe every researcher should have a professional, up-to-date portfolio that reflects their contributions to science — without spending hours maintaining it manually.
              </p>
            </div>

            {/* Data sources */}
            <div className="bg-white rounded-2xl border border-midnight/[.08] p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-9 h-9 rounded-[9px] bg-midnight/[.06] grid place-items-center">
                  <Database size={17} className="text-midnight" />
                </span>
                <h2 className="font-serif font-medium text-midnight m-0" style={{ fontSize: "clamp(18px,2.5vw,24px)" }}>
                  Where your data comes from
                </h2>
              </div>

              {/* OpenAlex card */}
              <div className="bg-[#F0F4F8] rounded-xl px-[22px] py-5 mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Globe size={16} className="text-[#2563EB]" />
                  <span className="font-serif text-[17px] font-medium text-midnight">OpenAlex — Our Primary Data Source</span>
                </div>
                <p className="text-[14.5px] text-[#44474D] leading-[1.65] mb-3">
                  All publication data on Scholar.name comes from{" "}
                  <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-[#2563EB] no-underline inline-flex items-center gap-[3px]">
                    OpenAlex <ExternalLink size={11} />
                  </a>
                  , a free and open catalog of the world's scholarly papers, researchers, and institutions.
                </p>
                <div className="flex flex-col gap-[7px]">
                  {["250+ million works indexed from major publishers and databases", "Updated daily with new publications and citations", "Open and transparent — anyone can verify the source data"].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#44474D]">
                      <CheckCircle size={14} className="text-[#059669] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated vs controlled */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="about-grid">
                <style>{`@media (max-width: 560px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>
                <div className="bg-[#F0F4F8] rounded-[11px] px-[18px] py-4">
                  <div className="text-[13px] font-bold text-[#059669] mb-2.5">✓ Automated (from OpenAlex)</div>
                  {["Publication list & metadata", "Citation counts & metrics", "Co-author networks", "Research topics", "Affiliation history"].map((item) => (
                    <div key={item} className="text-[13.5px] text-[#44474D] py-[3px]">• {item}</div>
                  ))}
                </div>
                <div className="bg-[#F0F4F8] rounded-[11px] px-[18px] py-4">
                  <div className="text-[13px] font-bold text-[#2563EB] mb-2.5">✦ You control</div>
                  {["Bio & profile description", "Profile photo", "Which publications to feature", "Custom sections (awards, grants)", "Theme & visual design", "Privacy (public/private)"].map((item) => (
                    <div key={item} className="text-[13.5px] text-[#44474D] py-[3px]">• {item}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Accuracy note */}
            <div className="bg-warm/[.08] rounded-[14px] border border-warm/25 px-6 py-[22px]">
              <div className="flex items-center gap-2 mb-2.5">
                <Award size={16} className="text-[#B87A0A]" />
                <span className="font-serif text-base font-medium text-midnight">Data Accuracy Commitment</span>
              </div>
              <p className="text-[14.5px] text-[#44474D] leading-[1.65] mb-2">
                We know data accuracy is crucial. Publication matching — especially for common names, name variations, and transliterated names — is an ongoing challenge in bibliometrics. We sync directly from OpenAlex and show you exactly when data was last updated.
              </p>
              <p className="text-[14.5px] text-[#44474D] leading-[1.65] m-0">
                <strong>If something looks wrong:</strong> You can report issues directly from your profile, and we'll investigate.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-midnight/[.08] p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-9 h-9 rounded-[9px] bg-midnight/[.06] grid place-items-center">
                  <Mail size={17} className="text-midnight" />
                </span>
                <h2 className="font-serif font-medium text-midnight m-0" style={{ fontSize: "clamp(18px,2.5vw,24px)" }}>
                  Contact & Support
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="about-grid">
                <div className="bg-[#F0F4F8] rounded-xl px-5 py-[18px]">
                  <div className="font-serif text-base font-medium text-midnight mb-1">Email Support</div>
                  <div className="text-[13.5px] text-[#75777E] mb-2">Best for detailed questions</div>
                  <a href="mailto:support@scholar.name" className="text-sm text-[#2563EB] no-underline">support@scholar.name</a>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#75777E] mt-2">
                    <Clock size={12} /> Response: 24-48 hours
                  </div>
                </div>
                <div className="bg-[#F0F4F8] rounded-xl px-5 py-[18px]">
                  <div className="font-serif text-base font-medium text-midnight mb-1">Contact Form</div>
                  <div className="text-[13.5px] text-[#75777E] mb-2">Quick questions & help</div>
                  <Link href="/contact" className="text-sm text-[#2563EB] no-underline">Open contact form →</Link>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#75777E] mt-2">
                    <Clock size={12} /> Usually within minutes
                  </div>
                </div>
              </div>
            </div>

            {/* CTA band */}
            <div className="public-cta-band rounded-2xl px-9 py-11 text-center">
              <div className="public-cta-content">
                <h2 className="font-serif font-medium text-white mb-2.5 tracking-[-0.01em]" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
                  Ready to create your portfolio?
                </h2>
                <p className="text-[15px] text-white/65 mb-6">
                  Join researchers from leading institutions who trust Scholar.name.
                </p>
                <div className="flex gap-2.5 justify-center flex-wrap">
                  <button onClick={() => navigate("/signup")} className="px-6 py-2.5 bg-warm text-on-secondary-container border-none rounded-[9px] text-sm font-bold cursor-pointer">
                    Create Free Account
                  </button>
                  <button onClick={() => navigate("/")} className="px-5 py-2.5 bg-white/10 text-white border border-white/[.18] rounded-[9px] text-sm font-medium cursor-pointer">
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
