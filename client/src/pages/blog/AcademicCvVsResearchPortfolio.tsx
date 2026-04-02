import BlogPostLayout from "@/components/BlogPostLayout";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Academic CV vs. Research Portfolio Website: What's the Difference?",
  datePublished: "2026-04-02",
  author: { "@type": "Organization", name: "Scholar.name" },
  publisher: { "@type": "Organization", name: "Scholar.name", url: "https://scholar.name" },
};

export default function AcademicCvVsResearchPortfolio() {
  return (
    <BlogPostLayout
      title="Academic CV vs. Research Portfolio Website: What's the Difference?"
      description="Your CV and your portfolio website serve different audiences at different moments. Here's how to think about both — and why every researcher needs each one."
      url="https://scholar.name/blog/academic-cv-vs-research-portfolio"
      publishedDate="April 2, 2026"
      readingTime="4 min"
      category="Career Advice"
      structuredData={structuredData}
    >
      <p>
        The academic CV and the research portfolio website are often talked about as if they&rsquo;re
        the same thing in different formats. They&rsquo;re not. They serve different purposes,
        reach different audiences, and succeed by doing very different things. Every researcher
        needs both.
      </p>

      <h2>What the academic CV does</h2>
      <p>
        Your CV is a comprehensive professional record. It is exhaustive by design. A complete
        academic CV typically includes:
      </p>
      <ul>
        <li>Education (institutions, degrees, years, advisors)</li>
        <li>All publications, including preprints, book chapters, and conference papers</li>
        <li>Grants and fellowships (with amounts)</li>
        <li>Teaching experience (courses, institutions, student evaluations)</li>
        <li>Service (committees, journal reviewing, conference organizing)</li>
        <li>Invited talks and presentations</li>
        <li>Awards and honors</li>
        <li>References</li>
      </ul>
      <p>
        A senior faculty member&rsquo;s CV might run 20–40 pages. That&rsquo;s intentional — it is
        a complete record, not a highlight reel.
      </p>
      <p>
        The CV is typically shared as a PDF in response to a specific request. Job applications,
        grant proposals, promotion dossiers, and panel invitations all require a CV. The audience
        is always a reviewer with specific institutional context who is actively evaluating you
        against defined criteria.
      </p>

      <h2>What the research portfolio website does</h2>
      <p>
        Your portfolio website is the opposite: a curated, accessible, first-impression document.
        It is <strong>selective by design</strong>. A strong portfolio site:
      </p>
      <ul>
        <li>Explains your research focus in plain language, quickly</li>
        <li>Highlights your best or most recent work, not everything</li>
        <li>Shows impact metrics (h-index, citations) that communicate credibility at a glance</li>
        <li>Has a clear contact path</li>
        <li>Loads fast and looks good on a phone</li>
      </ul>
      <p>
        The portfolio site is always on. It&rsquo;s discoverable via Google, linked from your email
        signature, included in your Twitter/X bio, and shared when someone asks &ldquo;where can I
        learn more about your work?&rdquo; The audience is often unknown — it could be a journalist,
        a potential collaborator, a funding body, a prospective student, or a hiring committee
        doing initial screening.
      </p>

      <h2>Key differences side by side</h2>

      <table>
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>Academic CV</th>
            <th>Portfolio Website</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Scope</strong></td><td>Exhaustive</td><td>Curated</td></tr>
          <tr><td><strong>Audience</strong></td><td>Known reviewers</td><td>Anyone</td></tr>
          <tr><td><strong>Format</strong></td><td>PDF / static document</td><td>Live web page</td></tr>
          <tr><td><strong>Always accessible</strong></td><td>Only when shared</td><td>Yes, 24/7</td></tr>
          <tr><td><strong>Shareable as a link</strong></td><td>Awkward (file)</td><td>Yes, instantly</td></tr>
          <tr><td><strong>Shows personality</strong></td><td>Minimal</td><td>Yes</td></tr>
          <tr><td><strong>Kept current by</strong></td><td>You, manually</td><td>Ideally, automatically</td></tr>
          <tr><td><strong>Length</strong></td><td>Long (10–40+ pages)</td><td>One page or short</td></tr>
        </tbody>
      </table>

      <h2>When each one wins</h2>

      <h3>CV wins when:</h3>
      <ul>
        <li>A formal application requires it explicitly</li>
        <li>A reviewer needs to verify a specific credential (degree year, grant amount)</li>
        <li>You&rsquo;re in a late hiring stage where completeness matters</li>
        <li>A grant funder needs your full publication record with funding details</li>
      </ul>

      <h3>Portfolio wins when:</h3>
      <ul>
        <li>Someone Googles your name</li>
        <li>You&rsquo;re networking at a conference and want to share your work instantly</li>
        <li>You&rsquo;re in a grant letter of intent or NSF-style bio blurb that links to a &ldquo;website&rdquo;</li>
        <li>A journalist or communicator wants a quick overview of your research</li>
        <li>A prospective student is evaluating potential advisors</li>
        <li>You want to control the first impression someone gets of your work</li>
      </ul>

      <h2>The most common mistake</h2>
      <p>
        Researchers who have only a CV and no website are invisible to anyone who hasn&rsquo;t
        already received their application materials. They rely entirely on others routing people to
        them — through institutional directories, journal bylines, or referrals.
      </p>
      <p>
        Researchers who have only a website and no structured CV struggle when formal applications
        require one.
      </p>
      <p>
        The answer is both. They serve different moments in the same professional story.
      </p>

      <h2>Practical takeaway</h2>
      <p>
        Keep your CV updated in a document editor (Microsoft Word, LaTeX, or Google Docs). Update
        it whenever you publish, receive a grant, or take a new position.
      </p>
      <p>
        For your portfolio, use a platform that handles the publication updates for you. That way,
        the part that changes most often — your publications and citations — stays current without
        any effort, and you only need to update the site when something significant changes in your
        narrative (a new research direction, a new institution, a major award).
      </p>
    </BlogPostLayout>
  );
}
