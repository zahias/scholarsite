import BlogPostLayout from "@/components/BlogPostLayout";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Create an Academic Portfolio Website (Step by Step)",
  datePublished: "2026-04-02",
  author: { "@type": "Organization", name: "Scholar.name" },
  publisher: { "@type": "Organization", name: "Scholar.name", url: "https://scholar.name" },
};

export default function HowToCreateAcademicPortfolio() {
  return (
    <BlogPostLayout
      title="How to Create an Academic Portfolio Website (Step by Step)"
      description="A complete guide to building a professional academic portfolio — what to include, which tools to choose, and how to keep it updated without spending hours on maintenance."
      url="https://scholar.name/blog/how-to-create-academic-portfolio"
      publishedDate="June 3, 2026"
      readingTime="7 min"
      category="How-To Guide"
      structuredData={structuredData}
    >
      <p>
        A personal website is no longer optional for researchers. Grant reviewers Google you.
        Hiring committees look for your web presence. Potential collaborators want to see your work
        before reaching out. If the best they find is a bare Google Scholar listing or an outdated
        university directory page, that&rsquo;s a missed opportunity.
      </p>
      <p>
        This guide walks you through building an academic portfolio website from scratch — what to
        include, which platform to use, and how to keep it current without investing hours of
        maintenance time.
      </p>

      <h2>Step 1: Know your audience</h2>
      <p>
        Before you write a single word, decide who the site is <em>primarily</em> for. Different
        audiences want different things:
      </p>
      <ul>
        <li><strong>Grant reviewers</strong> want to see your track record: publications, citations, funding history, and research trajectory.</li>
        <li><strong>Hiring committees</strong> want your research statement, teaching philosophy, and evidence of impact.</li>
        <li><strong>Potential collaborators</strong> want to quickly understand your research topics and whether there&rsquo;s overlap with theirs.</li>
        <li><strong>Journalists / science communicators</strong> want a contact form and a plain-English description of what you do.</li>
      </ul>
      <p>
        Most academic portfolio sites serve all of these audiences with a single homepage. The key
        is to lead with impact and put the granular detail (full publication list, CV) one click
        deeper.
      </p>

      <h2>Step 2: Decide what to include</h2>
      <p>Every strong academic portfolio has these core sections:</p>

      <h3>About / Bio</h3>
      <p>
        Two to three paragraphs. Lead with your research focus, not your job title. Tell people what
        problem you work on and why it matters. Keep it accessible — someone outside your subfield
        should understand it.
      </p>

      <h3>Publications</h3>
      <p>
        This is the core of any academic portfolio. Ideally, it auto-updates so you don&rsquo;t have
        to manually add every new paper. Highlight 3–5 featured papers with a sentence explaining
        their significance. The full list should be sortable and filterable.
      </p>

      <h3>Impact metrics</h3>
      <p>
        Your h-index, total citations, and citation trajectory communicate research impact quickly.
        Display them visibly — not buried in a lengthy CV.
      </p>

      <h3>Contact</h3>
      <p>
        Make it easy to reach you. A contact form or a prominently displayed email address. Many
        academic sites bury this; don&rsquo;t.
      </p>

      <h3>Optional but valuable</h3>
      <ul>
        <li>Active research projects or lab description</li>
        <li>Talks / conference presentations</li>
        <li>Media coverage or press mentions</li>
        <li>Teaching and mentorship</li>
        <li>Downloadable CV (PDF)</li>
      </ul>

      <h2>Step 3: Choose your platform</h2>
      <p>
        This is where researchers most often get stuck. Here are the real tradeoffs:
      </p>

      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>Setup time</th>
            <th>Maintenance</th>
            <th>Auto-sync publications</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>WordPress</td><td>Days to weeks</td><td>High</td><td>✗</td><td>$10–30/mo + developer time</td></tr>
          <tr><td>Squarespace / Wix</td><td>Hours to days</td><td>Medium</td><td>✗</td><td>$16–23/mo</td></tr>
          <tr><td>Google Sites</td><td>1–2 hours</td><td>High</td><td>✗</td><td>Free</td></tr>
          <tr><td>GitHub Pages + Hugo/Jekyll</td><td>Days (technical)</td><td>Medium–High</td><td>✗</td><td>Free</td></tr>
          <tr><td>Scholar.name</td><td>Under 5 min</td><td>None (auto-sync)</td><td>✓ Via OpenAlex</td><td>$9.99/mo</td></tr>
        </tbody>
      </table>

      <p>
        The critical difference is <strong>publication auto-sync</strong>. With every other platform,
        you must manually update your publication list every time a new paper comes out. Most
        researchers either don&rsquo;t do this (leaving the site stale) or spend significant time on
        it. Scholar.name pulls from OpenAlex automatically.
      </p>

      <h2>Step 4: Set up your URL</h2>
      <p>
        Your URL is part of your professional brand. Options, ranked:
      </p>
      <ol>
        <li><strong>yourname.com</strong> — best, but requires purchasing a domain (~$12/yr) and hosting</li>
        <li><strong>yourname.scholar.name</strong> — clean, academic-specific, memorable, included in Starter plan</li>
        <li><strong>yourname.github.io</strong> — acceptable for technical audiences, signals developer</li>
        <li><strong>yourname.wordpress.com</strong> — looks unprofessional; upgrade to a custom domain</li>
        <li><strong>scholar.google.com/citations?user=...</strong> — not a real URL for a portfolio</li>
      </ol>

      <h2>Step 5: Write your bio</h2>
      <p>
        The biggest mistake researchers make: writing for colleagues instead of for a broad audience.
        Your bio should be clear to a smart non-specialist. Avoid jargon. Lead with what you study
        and why it matters, not with your degree history.
      </p>
      <p>A simple structure that works:</p>
      <ul>
        <li><strong>Sentence 1:</strong> What do you research? (plain English)</li>
        <li><strong>Sentence 2:</strong> Why does it matter / what problem does it solve?</li>
        <li><strong>Sentences 3–4:</strong> Your methodology or approach.</li>
        <li><strong>Sentence 5:</strong> Current position and affiliations.</li>
      </ul>

      <h2>Step 6: Keep it current</h2>
      <p>
        The most common failure mode for academic portfolios is staleness. A page that says your
        latest publication was three years ago looks worse than no page at all.
      </p>
      <p>
        If you choose a platform that requires manual updates, schedule a quarterly reminder to
        review and update the site. If you choose Scholar.name, this step is handled automatically
        — your publications and citation data update without any action from you.
      </p>

      <h2>Quick-start checklist</h2>
      <ul>
        <li>Choose a platform (consider auto-sync seriously)</li>
        <li>Claim a clean URL</li>
        <li>Write a 4–5 sentence bio in plain English</li>
        <li>Add your publication list (or connect to a source that syncs it)</li>
        <li>Display your h-index and citation metrics</li>
        <li>Add a contact form or email</li>
        <li>Share the URL in your email signature, CV, and social profiles</li>
      </ul>
    </BlogPostLayout>
  );
}
