import { useEffect, useRef, useState } from "react";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import SEO from "@/components/SEO";

const TOC_ITEMS = [
  { id: "intro",     label: "Introduction" },
  { id: "collect",   label: "Data we collect" },
  { id: "use",       label: "How we use it" },
  { id: "sharing",   label: "Sharing" },
  { id: "retention", label: "Retention" },
  { id: "rights",    label: "Your rights" },
  { id: "cookies",   label: "Cookies" },
  { id: "children",  label: "Children" },
  { id: "changes",   label: "Changes & contact" },
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

export default function PrivacyPage() {
  const [activeId, setActiveId] = useState("intro");
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
        title="Privacy Policy — Scholar.name"
        description="Learn how Scholar.name collects, uses, and protects your personal information."
        url="https://scholar.name/privacy"
        type="website"
      />
      <GlobalNav mode="landing" hideLogin={false} hideSignup={false} />

      <main>
        {/* Hero */}
        <section style={{ background: "#0B1F3A", color: "#fff", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
          <div className="legal-hero-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#FFC72E", fontWeight: 600, marginBottom: 18, display: "block" }}>
              Legal · Privacy
            </span>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(42px,5vw,64px)", lineHeight: 1.02, fontWeight: 500, letterSpacing: "-0.022em", color: "#fff", margin: "0 0 16px" }}>
              Privacy <em style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: "#FFC72E" }}>policy</em>.
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.72)", maxWidth: 620, lineHeight: 1.55 }}>
              How Scholar Systems, Inc. collects, uses, and protects your information when you use scholar.name.
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

            <section id="intro" ref={setRef(0)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)", paddingTop: 0 }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>Preamble</span>
                Introduction
              </h2>
              <PlainEng>We run scholar.name to help researchers build public portfolios. We only collect what we need to run the service and never sell your data.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>Scholar.name ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how <strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Scholar Systems, Inc.</strong> collects, uses, discloses, and safeguards your information when you use our research portfolio service.</p>
              <p style={{ margin: "0 0 14px" }}>By creating an account or using the Service, you agree to this Privacy Policy. If you disagree, please do not use scholar.name.</p>
            </section>

            <section id="collect" ref={setRef(1)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>01</span>
                Data we collect
              </h2>
              <PlainEng>You give us your name and email. Your publication records come from OpenAlex — already public. We log standard server data like IP addresses.</PlainEng>
              <p style={{ margin: "0 0 14px" }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Account data</strong> — name, email address, institutional affiliation, and password (hashed) when you register.</p>
              <p style={{ margin: "0 0 14px" }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Academic data</strong> — publication records, citation counts, h-index, affiliations, and topic areas sourced from <a href="https://openalex.org" target="_blank" rel="noopener" style={{ color: "#0B1F3A", textDecoration: "underline", textDecorationColor: "#FFC72E", textDecorationThickness: 2, textUnderlineOffset: 3 }}>OpenAlex</a> (CC0 public domain).</p>
              <p style={{ margin: "0 0 14px" }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Usage data</strong> — IP address, browser type, pages visited, and timestamps via server logs and analytics cookies.</p>
              <Note title="OpenAlex data">Publication metadata on your profile comes from OpenAlex's public database. We surface it on your behalf; ownership and corrections go through OpenAlex directly.</Note>
            </section>

            <section id="use" ref={setRef(2)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>02</span>
                How we use it
              </h2>
              <PlainEng>We use your data to run the service, sync your publications, and send you the emails you'd expect (password resets, billing).</PlainEng>
              <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
                <li style={{ marginBottom: 8 }}>Provide, maintain, and improve the Service</li>
                <li style={{ marginBottom: 8 }}>Sync and display your researcher profile with up-to-date OpenAlex data</li>
                <li style={{ marginBottom: 8 }}>Process your account, subscriptions, and support requests</li>
                <li style={{ marginBottom: 8 }}>Send transactional emails (password reset, billing receipts, material policy changes)</li>
                <li style={{ marginBottom: 8 }}>Detect abuse, fraud, and security incidents</li>
                <li style={{ marginBottom: 8 }}>Analyze aggregate usage patterns to improve user experience (never individual profiling for advertising)</li>
              </ul>
            </section>

            <section id="sharing" ref={setRef(3)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>03</span>
                Sharing
              </h2>
              <PlainEng>We never sell your data. Your public profile is visible while your trial or paid plan is active. We use MontyPay for online payments and standard cloud providers for hosting.</PlainEng>
              <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Public profile</strong> — your researcher page is publicly accessible at your scholar.name URL.</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Service providers</strong> — we share data with sub-processors (hosting, analytics, email delivery, payment via MontyPay) under data-processing agreements.</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Legal</strong> — we may disclose data if required by law or to protect legal rights.</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Business transfer</strong> — in a merger or acquisition, data may transfer with appropriate notice to you.</li>
              </ul>
            </section>

            <section id="retention" ref={setRef(4)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>04</span>
                Retention
              </h2>
              <PlainEng>We keep your data while your account is active. Delete your account and we wipe active data within 30 days; backups purge within 90.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>We retain your personal data for as long as your account is active. When you delete your account, your profile URL returns 404 within 24 hours and active data is removed within 30 days. Encrypted backup copies are purged within 90 days.</p>
              <p style={{ margin: "0 0 14px" }}>We may retain certain records longer if required by law or to resolve open disputes.</p>
            </section>

            <section id="rights" ref={setRef(5)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>05</span>
                Your rights
              </h2>
              <PlainEng>You can export, correct, or delete your data from Settings at any time. GDPR and CCPA users have additional formal rights — just email us.</PlainEng>
              <ul style={{ paddingLeft: 20, margin: "0 0 14px" }}>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Access</strong> — download all your profile and account data from Settings → Export.</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Correction</strong> — update account data in Settings. For OpenAlex record corrections, submit directly to OpenAlex.</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Deletion</strong> — delete your account in Settings → Account → Delete. We honor GDPR Art. 17 and CCPA erasure requests.</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: "#0B1F3A", fontWeight: 600 }}>Opt-out</strong> — unsubscribe from marketing emails at any time via the footer link.</li>
              </ul>
            </section>

            <section id="cookies" ref={setRef(6)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>06</span>
                Cookies
              </h2>
              <PlainEng>We use a session cookie to keep you logged in and an analytics cookie to understand aggregate usage. No advertising cookies.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>We use strictly necessary cookies (session authentication) and analytics cookies (aggregate page-view data). We do not use advertising or cross-site tracking cookies. You can disable analytics cookies in Settings or through your browser without losing functionality.</p>
            </section>

            <section id="children" ref={setRef(7)} style={{ padding: "32px 0", borderBottom: "1px solid rgba(11,31,58,.08)" }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>07</span>
                Children
              </h2>
              <PlainEng>Scholar.name is for researchers aged 16+. We don't knowingly collect data from anyone younger.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>The Service is not intended for anyone under 16. We do not knowingly collect personal data from minors. If you believe we hold data about a child, contact us and we will delete it promptly.</p>
            </section>

            <section id="changes" ref={setRef(8)} style={{ padding: "32px 0", borderBottom: 0 }}>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: "#0B1F3A", margin: "0 0 12px", letterSpacing: "-0.015em", scrollMarginTop: 90 }}>
                <span style={{ display: "block", fontFamily: "'Newsreader', serif", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "#6F5400", fontWeight: 700, marginBottom: 6, fontStyle: "normal" }}>08</span>
                Changes &amp; contact
              </h2>
              <PlainEng>We'll email you 30 days before any material change. Continued use = acceptance of the new policy.</PlainEng>
              <p style={{ margin: "0 0 14px" }}>We may update this policy periodically. Material changes will be announced by email at least 30 days before taking effect, and by a banner in your dashboard. Continued use after the effective date constitutes acceptance.</p>
              <p style={{ margin: "0 0 14px" }}>This policy is governed by the laws of the State of California, USA.</p>

              {/* Contact card */}
              <div style={{ marginTop: 40, padding: 28, background: "#0B1F3A", color: "#fff", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 0%, rgba(255,199,46,.15), transparent 60%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h3 style={{ fontFamily: "'Newsreader', serif", color: "#fff", margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Questions about privacy?</h3>
                  <p style={{ color: "rgba(255,255,255,.7)", margin: 0, fontSize: 14 }}>Reach our privacy team at privacy@scholar.name.</p>
                </div>
                <a href="mailto:privacy@scholar.name"
                  style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#FFC72E", color: "#6F5400", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Contact Privacy
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
