const LOWERCASE_PARTICLES = new Set(["de", "van", "von", "der", "den", "el", "al", "bin", "ibn", "da", "di", "du", "la", "le"]);

// OpenAlex author names often arrive all-lowercase or all-caps; title-case them
// for display while preserving names that already have deliberate internal
// capitalization (e.g. "McDonald", "O'Brien").
export function titleCaseName(name: string | null | undefined): string {
  if (!name) return "";
  const isAllLowerOrUpper = name === name.toLowerCase() || name === name.toUpperCase();
  if (!isAllLowerOrUpper) return name;

  return name
    .split(" ")
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && LOWERCASE_PARTICLES.has(lower)) return lower;
      return lower
        .split("-")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join("-");
    })
    .join(" ");
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}
