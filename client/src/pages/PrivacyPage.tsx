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
    <div className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm border bg-[#F0F4F8] border-midnight/[.08] text-[#44474D]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <b className="text-midnight font-semibold block mb-0.5">In plain English</b>
        {children}
      </div>
    </div>
  );
}

function Note({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FBF7EE] border-l-[3px] border-warm px-[18px] py-3.5 rounded-r-[10px] my-3.5 text-[14.5px]">
      {title && <b className="block font-serif text-midnight mb-1">{title}</b>}
      {children}
    </div>
  );
}

const sectionClass = "py-8 border-b border-midnight/[.08]";
const h2Class = "font-serif text-[28px] font-semibold text-midnight mb-3 tracking-[-0.015em] scroll-mt-[90px]";
const kickerClass = "block font-serif text-xs tracking-[.22em] uppercase text-[#6F5400] font-bold mb-1.5 not-italic";
const pClass = "mb-3.5";
const ulClass = "pl-5 mb-3.5";
const liClass = "mb-2";
const strongClass = "text-midnight font-semibold";

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
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Privacy Policy — Scholar.name"
        description="Learn how Scholar.name collects, uses, and protects your personal information."
        url="https://scholar.name/privacy"
        type="website"
      />
      <GlobalNav mode="landing" hideLogin={false} hideSignup={false} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-midnight text-white pt-[72px] pb-14">
          <div className="legal-hero-grid absolute inset-0 pointer-events-none" />
          <div className="relative z-[1] max-w-[900px] mx-auto px-8">
            <span className="font-serif text-xs tracking-[.22em] uppercase text-warm font-semibold mb-4.5 block">
              Legal · Privacy
            </span>
            <h1 className="font-serif font-medium leading-[1.02] tracking-[-0.022em] text-white mb-4" style={{ fontSize: "clamp(42px,5vw,64px)" }}>
              Privacy <em className="font-serif italic text-warm">policy</em>.
            </h1>
            <p className="text-[17px] text-white/72 max-w-[620px] leading-[1.55]">
              How Scholar Systems, Inc. collects, uses, and protects your information when you use scholar.name.
            </p>
            <div className="flex gap-[18px] mt-6 text-[13px] text-white/60 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
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
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr" }} className="legal-layout-grid max-w-[1100px] mt-14 mb-[72px] mx-auto px-8 gap-14 items-start">

          {/* TOC */}
          <aside className="sticky top-[90px] text-[13.5px]">
            <div className="text-[11px] tracking-[.2em] uppercase text-[#75777E] font-semibold mb-3.5">On this page</div>
            <ol className="list-none p-0 m-0 flex flex-col gap-2">
              {TOC_ITEMS.map(({ id, label }, i) => (
                <li key={id} className="flex items-baseline gap-2.5">
                  <span className="font-serif text-xs text-[#6F5400] font-bold min-w-[22px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a href={`#${id}`}
                    className={`no-underline leading-[1.4] transition-colors duration-150 ${activeId === id ? "text-midnight font-semibold" : "text-[#44474D] font-normal"}`}>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          {/* Body */}
          <article className="text-base leading-[1.7] text-[#171C1F]">

            <section id="intro" ref={setRef(0)} className={`${sectionClass} pt-0`}>
              <h2 className={h2Class}>
                <span className={kickerClass}>Preamble</span>
                Introduction
              </h2>
              <PlainEng>We run scholar.name to help researchers build public portfolios. We only collect what we need to run the service and never sell your data.</PlainEng>
              <p className={pClass}>Scholar.name ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how <strong className={strongClass}>Scholar Systems, Inc.</strong> collects, uses, discloses, and safeguards your information when you use our research portfolio service.</p>
              <p className={pClass}>By creating an account or using the Service, you agree to this Privacy Policy. If you disagree, please do not use scholar.name.</p>
            </section>

            <section id="collect" ref={setRef(1)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>01</span>
                Data we collect
              </h2>
              <PlainEng>You give us your name and email. Your publication records come from OpenAlex — already public. We log standard server data like IP addresses.</PlainEng>
              <p className={pClass}><strong className={strongClass}>Account data</strong> — name, email address, institutional affiliation, and password (hashed) when you register.</p>
              <p className={pClass}><strong className={strongClass}>Academic data</strong> — publication records, citation counts, h-index, affiliations, and topic areas sourced from <a href="https://openalex.org" target="_blank" rel="noopener" className="text-midnight underline decoration-warm decoration-2 underline-offset-[3px]">OpenAlex</a> (CC0 public domain).</p>
              <p className={pClass}><strong className={strongClass}>Usage data</strong> — IP address, browser type, pages visited, and timestamps via server logs and analytics cookies.</p>
              <Note title="OpenAlex data">Publication metadata on your profile comes from OpenAlex's public database. We surface it on your behalf; ownership and corrections go through OpenAlex directly.</Note>
            </section>

            <section id="use" ref={setRef(2)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>02</span>
                How we use it
              </h2>
              <PlainEng>We use your data to run the service, sync your publications, and send you the emails you'd expect (password resets, billing).</PlainEng>
              <ul className={ulClass}>
                <li className={liClass}>Provide, maintain, and improve the Service</li>
                <li className={liClass}>Sync and display your researcher profile with up-to-date OpenAlex data</li>
                <li className={liClass}>Process your account, subscriptions, and support requests</li>
                <li className={liClass}>Send transactional emails (password reset, billing receipts, material policy changes)</li>
                <li className={liClass}>Detect abuse, fraud, and security incidents</li>
                <li className={liClass}>Analyze aggregate usage patterns to improve user experience (never individual profiling for advertising)</li>
              </ul>
            </section>

            <section id="sharing" ref={setRef(3)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>03</span>
                Sharing
              </h2>
              <PlainEng>We never sell your data. Your public profile is visible while your trial or paid plan is active. We use MontyPay for online payments and standard cloud providers for hosting.</PlainEng>
              <ul className={ulClass}>
                <li className={liClass}><strong className={strongClass}>Public profile</strong> — your researcher page is publicly accessible at your scholar.name URL.</li>
                <li className={liClass}><strong className={strongClass}>Service providers</strong> — we share data with sub-processors (hosting, analytics, email delivery, payment via MontyPay) under data-processing agreements.</li>
                <li className={liClass}><strong className={strongClass}>Legal</strong> — we may disclose data if required by law or to protect legal rights.</li>
                <li className={liClass}><strong className={strongClass}>Business transfer</strong> — in a merger or acquisition, data may transfer with appropriate notice to you.</li>
              </ul>
            </section>

            <section id="retention" ref={setRef(4)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>04</span>
                Retention
              </h2>
              <PlainEng>We keep your data while your account is active. Delete your account and we wipe active data within 30 days; backups purge within 90.</PlainEng>
              <p className={pClass}>We retain your personal data for as long as your account is active. When you delete your account, your profile URL returns 404 within 24 hours and active data is removed within 30 days. Encrypted backup copies are purged within 90 days.</p>
              <p className={pClass}>We may retain certain records longer if required by law or to resolve open disputes.</p>
            </section>

            <section id="rights" ref={setRef(5)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>05</span>
                Your rights
              </h2>
              <PlainEng>You can export, correct, or delete your data from Settings at any time. GDPR and CCPA users have additional formal rights — just email us.</PlainEng>
              <ul className={ulClass}>
                <li className={liClass}><strong className={strongClass}>Access</strong> — download all your profile and account data from Settings → Export.</li>
                <li className={liClass}><strong className={strongClass}>Correction</strong> — update account data in Settings. For OpenAlex record corrections, submit directly to OpenAlex.</li>
                <li className={liClass}><strong className={strongClass}>Deletion</strong> — delete your account in Settings → Account → Delete. We honor GDPR Art. 17 and CCPA erasure requests.</li>
                <li className={liClass}><strong className={strongClass}>Opt-out</strong> — unsubscribe from marketing emails at any time via the footer link.</li>
              </ul>
            </section>

            <section id="cookies" ref={setRef(6)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>06</span>
                Cookies
              </h2>
              <PlainEng>We use a session cookie to keep you logged in and an analytics cookie to understand aggregate usage. No advertising cookies.</PlainEng>
              <p className={pClass}>We use strictly necessary cookies (session authentication) and analytics cookies (aggregate page-view data). We do not use advertising or cross-site tracking cookies. You can disable analytics cookies in Settings or through your browser without losing functionality.</p>
            </section>

            <section id="children" ref={setRef(7)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>07</span>
                Children
              </h2>
              <PlainEng>Scholar.name is for researchers aged 16+. We don't knowingly collect data from anyone younger.</PlainEng>
              <p className={pClass}>The Service is not intended for anyone under 16. We do not knowingly collect personal data from minors. If you believe we hold data about a child, contact us and we will delete it promptly.</p>
            </section>

            <section id="changes" ref={setRef(8)} className="py-8 border-b-0">
              <h2 className={h2Class}>
                <span className={kickerClass}>08</span>
                Changes &amp; contact
              </h2>
              <PlainEng>We'll email you 30 days before any material change. Continued use = acceptance of the new policy.</PlainEng>
              <p className={pClass}>We may update this policy periodically. Material changes will be announced by email at least 30 days before taking effect, and by a banner in your dashboard. Continued use after the effective date constitutes acceptance.</p>
              <p className={pClass}>This policy is governed by the laws of the State of California, USA.</p>

              {/* Contact card */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }} className="relative overflow-hidden mt-10 p-7 bg-midnight text-white rounded-2xl gap-[18px] items-center">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_85%_0%,rgba(255,199,46,.15),transparent_60%)]" />
                <div className="relative z-[1]">
                  <h3 className="font-serif text-white mb-1 text-xl font-medium">Questions about privacy?</h3>
                  <p className="text-white/70 text-sm m-0">Reach our privacy team at privacy@scholar.name.</p>
                </div>
                <a href="mailto:privacy@scholar.name"
                  className="relative z-[1] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer bg-warm text-on-secondary-container no-underline whitespace-nowrap">
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
