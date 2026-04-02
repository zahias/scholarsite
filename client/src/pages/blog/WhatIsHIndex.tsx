import BlogPostLayout from "@/components/BlogPostLayout";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is an H-Index and How Do You Track It?",
  datePublished: "2026-04-02",
  author: { "@type": "Organization", name: "Scholar.name" },
  publisher: { "@type": "Organization", name: "Scholar.name", url: "https://scholar.name" },
};

export default function WhatIsHIndex() {
  return (
    <BlogPostLayout
      title="What Is an H-Index and How Do You Track It?"
      description="The h-index is one of the most cited metrics in academic hiring and grant evaluation. Here's what it means, how it's calculated, and how to monitor yours automatically."
      url="https://scholar.name/blog/what-is-h-index"
      publishedDate="April 2, 2026"
      readingTime="5 min"
      category="Academic Metrics"
      structuredData={structuredData}
    >
      <p>
        If you&rsquo;ve applied for a faculty position, a grant, or a research award in the last
        decade, you&rsquo;ve encountered the h-index. It appears on CVs, in promotion dossiers, and
        in funding applications. But many researchers — especially early-career ones — are not
        entirely sure what it measures, how it&rsquo;s calculated, or whether it actually reflects
        the quality of their work.
      </p>
      <p>
        This guide explains all of that, plus how to track your h-index automatically without
        checking multiple databases manually.
      </p>

      <h2>What is the h-index?</h2>
      <p>
        The h-index was proposed by physicist Jorge Hirsch in 2005. The concept is simple:
      </p>
      <p>
        <strong>Your h-index is <em>h</em> if you have at least <em>h</em> papers that have each
        been cited at least <em>h</em> times.</strong>
      </p>
      <p>
        For example, if you have an h-index of 15, it means you have at least 15 papers that have
        each received at least 15 citations. Papers beyond that threshold don&rsquo;t affect the
        number (they raise your i10-index or total citation count instead).
      </p>

      <h2>A concrete example</h2>
      <p>
        Imagine you have 8 papers with the following citation counts (sorted high to low):
      </p>

      <table>
        <thead>
          <tr>
            <th>Paper #</th>
            <th>Citations</th>
            <th>Contributes to h?</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>142</td><td>Yes (≥ 5)</td></tr>
          <tr><td>2</td><td>87</td><td>Yes (≥ 5)</td></tr>
          <tr><td>3</td><td>31</td><td>Yes (≥ 5)</td></tr>
          <tr><td>4</td><td>18</td><td>Yes (≥ 5)</td></tr>
          <tr><td>5</td><td>11</td><td>Yes (≥ 5)</td></tr>
          <tr><td>6</td><td>4</td><td>No ({"<"} 6)</td></tr>
          <tr><td>7</td><td>2</td><td>No</td></tr>
          <tr><td>8</td><td>0</td><td>No</td></tr>
        </tbody>
      </table>

      <p>
        In this case, the h-index is <strong>5</strong> — five papers each with at least 5
        citations.
      </p>

      <h2>Why it&rsquo;s useful</h2>
      <p>
        The h-index solves a specific problem: it prevents a single viral paper from inflating your
        apparent impact. A researcher with one paper cited 1,000 times and nine papers cited 0 times
        has an h-index of 1. Compare that to a researcher with 20 papers each cited 20 times — an
        h-index of 20. The second researcher has more <em>sustained</em> impact across their body of
        work.
      </p>
      <p>
        This makes it useful for evaluating research productivity over a career, not just a single
        breakthrough moment.
      </p>

      <h2>Its limitations</h2>
      <p>
        Like any metric, the h-index has real weaknesses that you should understand:
      </p>
      <ul>
        <li><strong>Field dependency</strong> — Citation rates vary enormously by discipline. An h-index of 20 is exceptional in mathematics; in biomedicine it&rsquo;s modest. Never compare h-indices across fields.</li>
        <li><strong>Seniority bias</strong> — It can only go up over time, so senior researchers will always outperform early-career researchers on this metric alone.</li>
        <li><strong>Doesn&rsquo;t capture quality</strong> — A highly cited paper in a low-quality journal counts the same as one in <em>Nature</em>.</li>
        <li><strong>Database-dependent</strong> — Your h-index will differ between Google Scholar, Web of Science, Scopus, and OpenAlex depending on what each platform indexes.</li>
      </ul>

      <h2>Related metrics to know</h2>
      <ul>
        <li><strong>i10-index</strong> — Number of papers with at least 10 citations. Used by Google Scholar. More sensitive to early-career productivity.</li>
        <li><strong>Total citations</strong> — The raw count. Useful alongside the h-index, not instead of it.</li>
        <li><strong>Citation trajectory</strong> — How your citations are growing year over year. Increasingly important in grant applications as evidence of momentum.</li>
      </ul>

      <h2>How to track your h-index</h2>
      <p>
        The manual approach: log into Google Scholar, Scopus, or Web of Science periodically and
        check your profile. The problem is that none of these platforms alert you when your index
        changes, and checking multiple databases is tedious.
      </p>
      <p>
        Scholar.name syncs your publication and citation data from{" "}
        <strong>OpenAlex</strong> — a free, continuously updated open-access index of 250M+ scholarly
        works. Your h-index, citation count, and citation trajectory are always current on your
        profile, displayed in clean visualizations you can share with anyone.
      </p>
      <p>
        Instead of checking manually, your Scholar.name profile <em>is</em> your live metrics
        dashboard — always up to date, always shareable.
      </p>

      <h2>What h-index do you need?</h2>
      <p>
        This varies significantly by field and career stage, but as rough benchmarks in most STEM
        fields:
      </p>
      <ul>
        <li><strong>PhD student finishing up:</strong> 1–5</li>
        <li><strong>Early-career / postdoc:</strong> 5–15</li>
        <li><strong>Mid-career faculty:</strong> 15–30</li>
        <li><strong>Senior / full professor:</strong> 30+</li>
        <li><strong>Field leaders:</strong> 50–100+</li>
      </ul>
      <p>
        Again: only compare within your field. A computational linguist and a molecular biologist at
        the same career stage will have very different h-indices.
      </p>
    </BlogPostLayout>
  );
}
