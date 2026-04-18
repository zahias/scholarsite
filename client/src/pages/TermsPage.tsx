import { useEffect, useRef, useState } from "react";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import SEO from "@/components/SEO";

const TOC_ITEMS = [
  { id: "summary",     label: "Plain-English summary" },
  { id: "accounts",   label: "Accounts" },
  { id: "use",        label: "Acceptable use" },
  { id: "content",    label: "Your content" },
  { id: "openalex",   label: "OpenAlex attribution" },
  { id: "payment",    label: "Paid plans" },
  { id: "termination",label: "Termination" },
  { id: "warranty",   label: "Warranties & disclaimers" },
  { id: "liability",  label: "Limitation of liability" },
  { id: "changes",    label: "Changes & contact" },
];

function PlainEng({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl mb-5 text-sm border"
      style={{ background: "#F0F4F8", borderColor: "rgba(11,31,58,.08)", color: "#44474D", alignItems: "flex-start" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <b style={{ color: "#0B1F3A", fontWeight: 600, display: "block", marginBottom: 2 }}>In plain English</b>
        {children}
      </div>
    </div>
  );
}

function Note({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FBF7EE", borderLeft: "3px solid #FFC72E", padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "14px 0", fontSize: 14.5 }}>
      {title && <b style={{ display: "block", fontFamily: "'Newsreader', serif", color: "#0B1F3A", marginBottom: 4 }}>{title}</b>}
      {children}
    </div>
  );
}

export default function TermsPage() {
  const [activeId, setActiveId] = useState("summary");
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sectionRefs.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    sectionRefs.current[i] = el;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff" }}>
      <SEO
        title="Terms of Service — Scholar.name"
        description="Terms and conditions governing your use of Scholar.name research portfolio service."
        url="https://scholar.name/terms"
        type="website"
      />
      <GlobalNav mode="landing" />

      <main>
        {/* Hero */}
        <section style={{ background: "#0B1F3A", color: "#fff", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
          <div className="legal-hero-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, marginBottom: 18, display: "block" }}>
              Legal · Terms
            </span>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(42px,5vw,64px)", lineHeight: 1.02, fontWeight: 500, letterSpacing: "-0.022em", color: "#fff", margin: "0 0 16px" }}>
              Terms of <em style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: "#FFC72E" }}>service</em>.
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.72)", maxWidth: 620, lineHeight: 1.55 }}>
              The agreement between you and Scholar Systems, Inc. when you use scholar.name. Written in plain language wherever we can.
            </p>
            <div style={{ display: "flex", gap: 18, marginTop: 24, fontSize: 13, color: "rgba(255,255,255,.6)", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Last updated April 1, 2026
              </span>
              <span>·</span>
              <span>Effective April 15, 2026</span>
              <span>·</span>
              <span>Governed by California law</span>
            </div>
          </div>
        </section>

        {/* Layout */}
        <div style={{ maxWidth: 1100, margin: "56px auto 72px", padding: "0 32px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 56, alignItems: "start" }}
          className="legal-layout-grid">

          {/* TOC */}
          <aside style={{ position: "sticky", top: 90, fontSize: 13.5 }}>
            <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#75777E", fontWeight: 600, marginBottom: 14 }}>On this page</div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, counterReset: "toc", display: "flex", flexDirection: "column", gap: 8 }}>
              {TOC_ITEMS.map(({ id, label }, i) => (
                <li key={id} style={{ counterIncrement: "toc", display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: "'Newsreader', serif", fontSize: 12, color: "#6F5400", fontWeight: 700, minWidth: 22 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a href={`#${id}`}
                    style={{ color: activeId === id ? "#0B1F3A" : "#44474D", textDecoration: "none", lineHeight: 1.4, fontWeight: activeId === id ? 600 : 400, transition: "color .15s" }}>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          {/* Body */}
          <article style={{ fontSize: 16, lineHeight: 1.7, color: "#171C1F" }}>

            <section id="summary" ref={setRef(0)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)", paddingTop: 0 }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>Preamble</span>
                The one-minute version.
              </h2>
              <PlainEng>Be a responsible user. Don't impersonate other researchers. You own your bio and keep the rights to your own work. We provide the Service "as is" and liability is capped at what you've paid us in the last 12 months. Either side can end the agreement at any time.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>These Terms of Service ("Terms") form a binding agreement between you and <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Scholar Systems, Inc.</strong> ("Scholar", "we") when you access <a href="/" style={{ color: "#0B1F3A", textDecoration: "underline", textDecorationColor: "#FFC72E", textDecorationThickness: 2, textUnderlineOffset: 3 }}>scholar.name</a> or related services (the "Service"). By creating an account or using the Service, you accept these Terms.</p>
            </section>

            <section id="accounts" ref={setRef(1)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>01</span>
                Your account.
              </h2>
              <PlainEng>You must be 16+, provide accurate info, and keep your account secure. One profile per person — no impersonation.</PlainEng>
              <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
                <li style={{ marginBottom: 8 }}>You must be at least 16 years old to create an account.</li>
                <li style={{ marginBottom: 8 }}>You must provide accurate information and keep your account secure.</li>
                <li style={{ marginBottom: 8 }}>You are responsible for all activity under your account.</li>
                <li style={{ marginBottom: 8 }}>You may have <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>one</strong> personal Scholar profile. Institutional plans are available for departments and labs.</li>
                <li style={{ marginBottom: 8 }}>Do <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>not</strong> create a profile for another person without their express permission. Impersonation is grounds for immediate termination.</li>
              </ul>
            </section>

            <section id="use" ref={setRef(2)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>02</span>
                Acceptable use.
              </h2>
              <PlainEng>Don't use Scholar.name for anything illegal, harmful, or academically dishonest. Fabricated research records will get you suspended.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>You agree not to use the Service to:</p>
              <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
                <li style={{ marginBottom: 8 }}>Violate any law or the rights of others.</li>
                <li style={{ marginBottom: 8 }}>Post content that is defamatory, harassing, or fraudulent.</li>
                <li style={{ marginBottom: 8 }}>Upload malware or attempt to probe, scan, or test the vulnerability of the Service.</li>
                <li style={{ marginBottom: 8 }}>Scrape or bulk-extract data beyond what our public API permits.</li>
                <li style={{ marginBottom: 8 }}>Fabricate or falsify research records, citations, or affiliations.</li>
                <li style={{ marginBottom: 8 }}>Resell or sublicense the Service without our written permission.</li>
              </ul>
              <Note title="Research integrity">We take research integrity seriously. Profiles found to contain fabricated publications, misattributed co-authors, or citation-manipulation schemes will be suspended and the relevant records flagged to OpenAlex and, where appropriate, institutional integrity offices.</Note>
            </section>

            <section id="content" ref={setRef(3)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>03</span>
                Your content and license.
              </h2>
              <PlainEng>You own your bio, links, and uploads. By posting, you give us permission to display it as part of running the Service. You can export or delete everything anytime.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>You retain ownership of everything you contribute to your profile — your bio, custom sections, links, and any uploads. By posting content to the Service, you grant Scholar a worldwide, royalty-free, non-exclusive license to host, display, and distribute it solely for the purpose of operating the Service.</p>
              <p style={{ margin: "0 0 14px" }}>Publication metadata displayed on your profile is sourced from OpenAlex and other public databases. You do not grant us any new rights in that metadata.</p>
              <p style={{ margin: "0 0 14px" }}>You may export or delete your content at any time from your account settings.</p>
            </section>

            <section id="openalex" ref={setRef(4)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>04</span>
                OpenAlex attribution and limits.
              </h2>
              <PlainEng>Our publication data comes from OpenAlex (CC0 license). To fix a wrong record, submit the correction to OpenAlex directly — we'll pick it up on next sync.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>Scholar is built on <a href="https://openalex.org" target="_blank" rel="noopener" style={{ color: "#0B1F3A", textDecoration: "underline", textDecorationColor: "#FFC72E", textDecorationThickness: 2, textUnderlineOffset: 3 }}>OpenAlex</a> under its <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener" style={{ color: "#0B1F3A", textDecoration: "underline", textDecorationColor: "#FFC72E", textDecorationThickness: 2, textUnderlineOffset: 3 }}>CC0 license</a>. We credit OpenAlex prominently on every profile.</p>
              <p style={{ margin: "0 0 14px" }}>Scholar does not guarantee the accuracy or completeness of OpenAlex data. Corrections to the underlying record must be submitted to OpenAlex directly.</p>
            </section>

            <section id="payment" ref={setRef(5)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>05</span>
                Paid plans.
              </h2>
              <PlainEng>Free plan has no time limit. Paid plans auto-renew. Stripe handles payments. 30-day refund on annual plans; monthly plans can be canceled anytime.</PlainEng>
              <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
                <li style={{ marginBottom: 8 }}>The free plan has no time limit and includes your profile, OpenAlex sync, and public URL.</li>
                <li style={{ marginBottom: 8 }}>Paid plans (<strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Scholar Pro</strong>, <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Institution</strong>) unlock analytics, custom domains, multiple authors, and priority support.</li>
                <li style={{ marginBottom: 8 }}>Paid subscriptions renew automatically unless canceled before the renewal date.</li>
                <li style={{ marginBottom: 8 }}>All payments are processed by Stripe. We do not store your card details.</li>
                <li style={{ marginBottom: 8 }}>We offer a <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>30-day refund</strong> on annual plans, no questions asked. Monthly plans are non-refundable but can be canceled anytime.</li>
              </ul>
            </section>

            <section id="termination" ref={setRef(6)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>06</span>
                Ending this agreement.
              </h2>
              <PlainEng>Delete your account anytime in Settings. Your profile goes 404 within 24 hours. If we close your account without cause, we'll refund unused paid plan time.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>You may delete your account at any time from Settings → Account. Your profile URL will return 404 within 24 hours, and your personal data will be removed from our active systems within 30 days (backups purge within 90).</p>
              <p style={{ margin: "0 0 14px" }}>We may suspend or terminate your account if you materially violate these Terms, though we will generally warn you first. If we close your account without cause, we'll refund any unused portion of a paid plan.</p>
            </section>

            <section id="warranty" ref={setRef(7)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>07</span>
                Warranties and disclaimers.
              </h2>
              <PlainEng>The Service is "as is." We can't promise 100% uptime or that every OpenAlex record will be accurate. Standard legal disclaimer — implied warranties are disclaimed to the extent the law allows.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>The Service is provided <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>"as is"</strong> and <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>"as available"</strong>. We do not warrant that the Service will be uninterrupted, error-free, or that any particular OpenAlex record will be accurate or complete at any given moment. We disclaim all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent permitted by law.</p>
            </section>

            <section id="liability" ref={setRef(8)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>08</span>
                Limitation of liability.
              </h2>
              <PlainEng>Our liability is capped at the greater of $100 or what you paid us in the last 12 months. We can't be liable for indirect or punitive damages.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>To the fullest extent permitted by applicable law, Scholar's total aggregate liability for any claims arising out of or relating to the Service shall not exceed the greater of <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>(a) US$100</strong> or <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>(b) the amount you paid Scholar in the 12 months</strong> preceding the claim. We shall not be liable for indirect, incidental, consequential, or punitive damages.</p>
              <p style={{ margin: "0 0 14px" }}>Nothing in these Terms limits liability for gross negligence, willful misconduct, or any other liability that cannot be excluded by law.</p>
            </section>

            <section id="changes" ref={setRef(9)} style={{ padding: "32px 0", borderBottom: 0 }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>09</span>
                Changes, disputes, and contact.
              </h2>
              <PlainEng>We'll email you 30 days before material changes. California law governs disputes, in San Francisco courts — unless you're a consumer who can sue locally.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>We may update these Terms from time to time. Material changes will be announced by email at least 30 days before they take effect, and by a banner on your dashboard. Continued use after the effective date constitutes acceptance.</p>
              <p style={{ margin: "0 0 14px" }}>These Terms are governed by the laws of the State of California, USA. Any dispute will be resolved in the state or federal courts of San Francisco County, unless you are a consumer entitled to bring a claim in your local jurisdiction.</p>

              {/* Contact card */}
              <div style={{ marginTop: 40, padding: 28, background: "#0B1F3A", color: "#fff", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 0%, rgba(255,199,46,.15), transparent 60%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h3 style={{ fontFamily: "'Newsreader', serif", color: "#fff", margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Questions about these Terms?</h3>
                  <p style={{ color: "rgba(255,255,255,.7)", margin: 0, fontSize: 14 }}>Reach our legal team at legal@scholar.name.</p>
                </div>
                <a href="mailto:legal@scholar.name"
                  style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#FFC72E", color: "#6F5400", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Contact Legal
                </a>
              </div>
            </section>
          </article>
        </div>
      </main>

      <style>{`
        @media (max-width: 880px) {
          .legal-layout-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .legal-layout-grid aside { position: relative !important; top: 0 !important; padding: 20px; background: #F0F4F8; border-radius: 12px; }
        }
      `}</style>

      <GlobalFooter />
    </div>
  );
}
