import type { ReactNode } from "react";

// ── Tiptap/ProseMirror JSON doc shape (the subset our editor config can produce) ──

export interface DocMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface DocNode {
  type: string;
  attrs?: Record<string, any>;
  content?: DocNode[];
  text?: string;
  marks?: DocMark[];
}

export interface TiptapDoc {
  type: "doc";
  content: DocNode[];
}

function isTiptapDoc(value: unknown): value is TiptapDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).type === "doc" &&
    Array.isArray((value as any).content)
  );
}

// ── Legacy markdown-ish renderer (relocated verbatim from ProfileSections.tsx) ──
// Sections created before the WYSIWYG editor shipped store a plain string here,
// not JSON — this must keep rendering them exactly as before, forever, since
// there is no migration converting old rows to the new format.
function renderLegacyContent(content: string): ReactNode[] {
  const lines = content.split("\n");

  return lines.map((line, index) => {
    if (line.startsWith("### ")) {
      return <h4 key={index} className="font-semibold text-lg mt-4 mb-2">{line.slice(4)}</h4>;
    }
    if (line.startsWith("## ")) {
      return <h3 key={index} className="font-semibold text-xl mt-4 mb-2">{line.slice(3)}</h3>;
    }
    if (line.startsWith("# ")) {
      return <h2 key={index} className="font-bold text-2xl mt-4 mb-2">{line.slice(2)}</h2>;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={index} className="ml-4 list-disc text-muted-foreground">
          {line.slice(2)}
        </li>
      );
    }

    const numberedMatch = line.match(/^\d+\.\s/);
    if (numberedMatch) {
      return (
        <li key={index} className="ml-4 list-decimal text-muted-foreground">
          {line.slice(numberedMatch[0].length)}
        </li>
      );
    }

    if (line.trim() === "") {
      return <br key={index} />;
    }

    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g);

    return (
      <p key={index} className="text-muted-foreground mb-2">
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
            return <em key={i}>{part.slice(1, -1)}</em>;
          }
          return part;
        })}
      </p>
    );
  });
}

// ── Safe URL checks — the one place user-controlled strings flow into an HTML
// attribute browsers treat specially (href/src), so they get an explicit
// scheme allow-list on top of never using dangerouslySetInnerHTML anywhere. ──
function isSafeLinkHref(href: unknown): href is string {
  return typeof href === "string" && /^(https?:|mailto:)/i.test(href.trim());
}

function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/");
}

// ── Whitelist JSON→React renderer. Unknown node/mark types are silently
// dropped — this is the safety property that makes rendering stored JSON
// structurally incapable of XSS, without needing an HTML sanitizer at all. ──
function renderMarks(text: string, marks: DocMark[] | undefined, key: number): ReactNode {
  if (!marks || marks.length === 0) return text;
  return marks.reduce<ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong key={key}>{acc}</strong>;
      case "italic":
        return <em key={key}>{acc}</em>;
      case "link":
        return isSafeLinkHref(mark.attrs?.href) ? (
          <a key={key} href={mark.attrs!.href} target="_blank" rel="noopener noreferrer" className="underline">
            {acc}
          </a>
        ) : (
          acc
        );
      default:
        return acc;
    }
  }, text);
}

function renderInline(nodes: DocNode[] | undefined, keyPrefix: string): ReactNode[] {
  if (!nodes) return [];
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.type === "text" && typeof node.text === "string") {
      return <span key={key}>{renderMarks(node.text, node.marks, i)}</span>;
    }
    if (node.type === "hardBreak") {
      return <br key={key} />;
    }
    return null;
  });
}

function renderNode(node: DocNode, key: string): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="text-muted-foreground mb-2">
          {renderInline(node.content, key)}
        </p>
      );
    case "heading": {
      const level = node.attrs?.level;
      if (level === 3) {
        return <h4 key={key} className="font-semibold text-lg mt-4 mb-2">{renderInline(node.content, key)}</h4>;
      }
      return <h3 key={key} className="font-semibold text-xl mt-4 mb-2">{renderInline(node.content, key)}</h3>;
    }
    case "bulletList":
      return (
        <ul key={key} className="mb-2">
          {(node.content ?? []).map((li, i) => renderNode(li, `${key}-${i}`))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="mb-2">
          {(node.content ?? []).map((li, i) => renderNode(li, `${key}-${i}`))}
        </ol>
      );
    case "listItem":
      return (
        <li key={key} className="ml-4 list-disc text-muted-foreground">
          {(node.content ?? []).map((child, i) => renderInline(child.content, `${key}-${i}`))}
        </li>
      );
    case "image":
      return isSafeImageSrc(node.attrs?.src) ? (
        <img
          key={key}
          src={node.attrs!.src}
          alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
          className="rounded-md my-3 max-w-full h-auto"
        />
      ) : null;
    default:
      return null;
  }
}

interface SectionContentProps {
  content: string;
}

// Renders a section's stored content — JSON from the WYSIWYG editor if that's
// what's there, otherwise falling back to the legacy markdown-ish renderer for
// sections created before the editor shipped.
export default function SectionContent({ content }: SectionContentProps) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return <>{renderLegacyContent(content)}</>;
  }

  if (!isTiptapDoc(parsed)) {
    return <>{renderLegacyContent(content)}</>;
  }

  return <>{parsed.content.map((node, i) => renderNode(node, `n${i}`))}</>;
}

// Seeds the Tiptap editor when entering edit mode: JSON content passes
// through as-is; a legacy plain string becomes a single starting paragraph
// the researcher can then reformat with the new editor.
export function parseSectionContentForEditing(content: string): TiptapDoc {
  try {
    const parsed = JSON.parse(content);
    if (isTiptapDoc(parsed)) return parsed;
  } catch {
    // fall through to legacy wrap
  }
  return {
    type: "doc",
    content: [{ type: "paragraph", content: content ? [{ type: "text", text: content }] : [] }],
  };
}

function collectText(node: DocNode, out: string[]): void {
  if (node.type === "text" && typeof node.text === "string") {
    out.push(node.text);
  }
  (node.content ?? []).forEach((child) => collectText(child, out));
}

// Plain-text extraction for the dashboard's collapsed section-list preview.
export function extractPlainTextPreview(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (isTiptapDoc(parsed)) {
      const out: string[] = [];
      parsed.content.forEach((node) => collectText(node, out));
      return out.join(" ");
    }
  } catch {
    // not JSON — legacy content is already plain-ish text
  }
  return content;
}
