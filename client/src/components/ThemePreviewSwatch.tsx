import { normalizeThemeConfig } from "@/context/ThemeContext";
import type { ThemeConfig } from "@shared/schema";

interface ThemePreviewSwatchProps {
  config: ThemeConfig | null | undefined;
  size?: "sm" | "md";
}

// Renders a small mockup (header bar + body lines + accent pill) styled with the
// theme's actual colors, instead of two isolated color dots — so themes are
// visually distinguishable at a glance in every picker that lists them.
export function ThemePreviewSwatch({ config, size = "md" }: ThemePreviewSwatchProps) {
  const c = normalizeThemeConfig(config);
  const dims = size === "sm" ? { width: 56, height: 40 } : { width: 92, height: 62 };

  return (
    <div
      aria-hidden="true"
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,.1)",
        background: c.colors.background,
        flexShrink: 0,
      }}
    >
      <div style={{ height: "36%", background: c.colors.primary, display: "flex", alignItems: "center", padding: "0 6px" }}>
        <div style={{ width: "45%", height: 3, borderRadius: 2, background: "rgba(255,255,255,.85)" }} />
      </div>
      <div style={{ height: "64%", background: c.colors.surface, padding: "5px 6px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
        <div style={{ width: "72%", height: 3, borderRadius: 2, background: c.colors.text, opacity: 0.85 }} />
        <div style={{ width: "48%", height: 3, borderRadius: 2, background: c.colors.textMuted, opacity: 0.8 }} />
        <div style={{ width: 18, height: 5, borderRadius: 3, background: c.colors.accent, marginTop: 2 }} />
      </div>
    </div>
  );
}
