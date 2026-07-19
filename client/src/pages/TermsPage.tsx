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
const linkClass = "text-midnight underline decoration-warm decoration-2 underline-offset-[3px]";

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
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Terms of Service — Scholar.name"
        description="Terms and conditions governing your use of Scholar.name research portfolio service."
        url="https://scholar.name/terms"
        type="website"
      />
      <GlobalNav mode="landing" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-midnight text-white pt-[72px] pb-14">
          <div className="legal-hero-grid absolute inset-0 pointer-events-none" />
          <div className="relative z-[1] max-w-[900px] mx-auto px-8">
            <span className="font-serif text-xs tracking-[.22em] uppercase text-warm font-semibold mb-4.5 block">
              Legal · Terms
            </span>
            <h1 className="font-serif font-medium leading-[1.02] tracking-[-0.022em] text-white mb-4" style={{ fontSize: "clamp(42px,5vw,64px)" }}>
              Terms of <em className="font-serif italic text-warm">service</em>.
            </h1>
            <p className="text-[17px] text-white/72 max-w-[620px] leading-[1.55]">
              The agreement between you and Scholar Systems, Inc. when you use scholar.name. Written in plain language wherever we can.
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

            <section id="summary" ref={setRef(0)} className={`${sectionClass} pt-0`}>
              <h2 className={h2Class}>
                <span className={kickerClass}>Preamble</span>
                The one-minute version.
              </h2>
              <PlainEng>Be a responsible user. Don't impersonate other researchers. You own your bio and keep the rights to your own work. We provide the Service "as is" and liability is capped at what you've paid us in the last 12 months. Either side can end the agreement at any time.</PlainEng>
              <p className={pClass}>These Terms of Service ("Terms") form a binding agreement between you and <strong className={strongClass}>Scholar Systems, Inc.</strong> ("Scholar", "we") when you access <a href="/" className={linkClass}>scholar.name</a> or related services (the "Service"). By creating an account or using the Service, you accept these Terms.</p>
            </section>

            <section id="accounts" ref={setRef(1)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>01</span>
                Your account.
              </h2>
              <PlainEng>You must be 16+, provide accurate info, and keep your account secure. One profile per person — no impersonation.</PlainEng>
              <ul className={ulClass}>
                <li className={liClass}>You must be at least 16 years old to create an account.</li>
                <li className={liClass}>You must provide accurate information and keep your account secure.</li>
                <li className={liClass}>You are responsible for all activity under your account.</li>
                <li className={liClass}>You may have <strong className={strongClass}>one</strong> personal Scholar profile. Institutional plans are available for departments and labs.</li>
                <li className={liClass}>Do <strong className={strongClass}>not</strong> create a profile for another person without their express permission. Impersonation is grounds for immediate termination.</li>
              </ul>
            </section>

            <section id="use" ref={setRef(2)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>02</span>
                Acceptable use.
              </h2>
              <PlainEng>Don't use Scholar.name for anything illegal, harmful, or academically dishonest. Fabricated research records will get you suspended.</PlainEng>
              <p className={pClass}>You agree not to use the Service to:</p>
              <ul className={ulClass}>
                <li className={liClass}>Violate any law or the rights of others.</li>
                <li className={liClass}>Post content that is defamatory, harassing, or fraudulent.</li>
                <li className={liClass}>Upload malware or attempt to probe, scan, or test the vulnerability of the Service.</li>
                <li className={liClass}>Scrape or bulk-extract data beyond what our public API permits.</li>
                <li className={liClass}>Fabricate or falsify research records, citations, or affiliations.</li>
                <li className={liClass}>Resell or sublicense the Service without our written permission.</li>
              </ul>
              <Note title="Research integrity">We take research integrity seriously. Profiles found to contain fabricated publications, misattributed co-authors, or citation-manipulation schemes will be suspended and the relevant records flagged to OpenAlex and, where appropriate, institutional integrity offices.</Note>
            </section>

            <section id="content" ref={setRef(3)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>03</span>
                Your content and license.
              </h2>
              <PlainEng>You own your bio, links, and uploads. By posting, you give us permission to display it as part of running the Service. You can export or delete everything anytime.</PlainEng>
              <p className={pClass}>You retain ownership of everything you contribute to your profile — your bio, custom sections, links, and any uploads. By posting content to the Service, you grant Scholar a worldwide, royalty-free, non-exclusive license to host, display, and distribute it solely for the purpose of operating the Service.</p>
              <p className={pClass}>Publication metadata displayed on your profile is sourced from OpenAlex and other public databases. You do not grant us any new rights in that metadata.</p>
              <p className={pClass}>You may export or delete your content at any time from your account settings.</p>
            </section>

            <section id="openalex" ref={setRef(4)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>04</span>
                OpenAlex attribution and limits.
              </h2>
              <PlainEng>Our publication data comes from OpenAlex (CC0 license). To fix a wrong record, submit the correction to OpenAlex directly — we'll pick it up on next sync.</PlainEng>
              <p className={pClass}>Scholar is built on <a href="https://openalex.org" target="_blank" rel="noopener" className={linkClass}>OpenAlex</a> under its <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener" className={linkClass}>CC0 license</a>. We credit OpenAlex prominently on every profile.</p>
              <p className={pClass}>Scholar does not guarantee the accuracy or completeness of OpenAlex data. Corrections to the underlying record must be submitted to OpenAlex directly.</p>
            </section>

            <section id="payment" ref={setRef(5)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>05</span>
                Paid plans.
              </h2>
              <PlainEng>The free trial lasts 14 days. Paid plans keep your public portfolio active after the trial. MontyPay handles online card payments when checkout is enabled.</PlainEng>
              <ul className={ulClass}>
                <li className={liClass}>The free trial lasts 14 days and includes your profile, OpenAlex sync, and public URL while the trial is active.</li>
                <li className={liClass}>Paid plans (<strong className={strongClass}>Scholar Pro</strong>, <strong className={strongClass}>Institution</strong>) unlock analytics, custom domains, multiple authors, and priority support.</li>
                <li className={liClass}>If your trial or paid period ends without an active plan, your public portfolio becomes inactive until you reactivate.</li>
                <li className={liClass}>Online payments are processed by MontyPay when checkout is enabled. We do not store your card details.</li>
                <li className={liClass}>We offer a <strong className={strongClass}>30-day refund</strong> on annual plans, no questions asked. Monthly plans are non-refundable but can be canceled anytime.</li>
              </ul>
            </section>

            <section id="termination" ref={setRef(6)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>06</span>
                Ending this agreement.
              </h2>
              <PlainEng>Delete your account anytime in Settings. Your profile goes 404 within 24 hours. If we close your account without cause, we'll refund unused paid plan time.</PlainEng>
              <p className={pClass}>You may delete your account at any time from Settings → Account. Your profile URL will return 404 within 24 hours, and your personal data will be removed from our active systems within 30 days (backups purge within 90).</p>
              <p className={pClass}>We may suspend or terminate your account if you materially violate these Terms, though we will generally warn you first. If we close your account without cause, we'll refund any unused portion of a paid plan.</p>
            </section>

            <section id="warranty" ref={setRef(7)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>07</span>
                Warranties and disclaimers.
              </h2>
              <PlainEng>The Service is "as is." We can't promise 100% uptime or that every OpenAlex record will be accurate. Standard legal disclaimer — implied warranties are disclaimed to the extent the law allows.</PlainEng>
              <p className={pClass}>The Service is provided <strong className={strongClass}>"as is"</strong> and <strong className={strongClass}>"as available"</strong>. We do not warrant that the Service will be uninterrupted, error-free, or that any particular OpenAlex record will be accurate or complete at any given moment. We disclaim all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent permitted by law.</p>
            </section>

            <section id="liability" ref={setRef(8)} className={sectionClass}>
              <h2 className={h2Class}>
                <span className={kickerClass}>08</span>
                Limitation of liability.
              </h2>
              <PlainEng>Our liability is capped at the greater of $100 or what you paid us in the last 12 months. We can't be liable for indirect or punitive damages.</PlainEng>
              <p className={pClass}>To the fullest extent permitted by applicable law, Scholar's total aggregate liability for any claims arising out of or relating to the Service shall not exceed the greater of <strong className={strongClass}>(a) US$100</strong> or <strong className={strongClass}>(b) the amount you paid Scholar in the 12 months</strong> preceding the claim. We shall not be liable for indirect, incidental, consequential, or punitive damages.</p>
              <p className={pClass}>Nothing in these Terms limits liability for gross negligence, willful misconduct, or any other liability that cannot be excluded by law.</p>
            </section>

            <section id="changes" ref={setRef(9)} className="py-8 border-b-0">
              <h2 className={h2Class}>
                <span className={kickerClass}>09</span>
                Changes, disputes, and contact.
              </h2>
              <PlainEng>We'll email you 30 days before material changes. California law governs disputes, in San Francisco courts — unless you're a consumer who can sue locally.</PlainEng>
              <p className={pClass}>We may update these Terms from time to time. Material changes will be announced by email at least 30 days before they take effect, and by a banner on your dashboard. Continued use after the effective date constitutes acceptance.</p>
              <p className={pClass}>These Terms are governed by the laws of the State of California, USA. Any dispute will be resolved in the state or federal courts of San Francisco County, unless you are a consumer entitled to bring a claim in your local jurisdiction.</p>

              {/* Contact card */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }} className="relative overflow-hidden mt-10 p-7 bg-midnight text-white rounded-2xl gap-[18px] items-center">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_85%_0%,rgba(255,199,46,.15),transparent_60%)]" />
                <div className="relative z-[1]">
                  <h3 className="font-serif text-white mb-1 text-xl font-medium">Questions about these Terms?</h3>
                  <p className="text-white/70 text-sm m-0">Reach our legal team at legal@scholar.name.</p>
                </div>
                <a href="mailto:legal@scholar.name"
                  className="relative z-[1] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer bg-warm text-on-secondary-container no-underline whitespace-nowrap">
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
