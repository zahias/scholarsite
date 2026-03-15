import { storage } from "../storage";

const DEFAULT_THEMES = [
  {
    name: "Deep Navy",
    description: "Classic academic blue",
    sortOrder: 1,
    config: {
      colors: {
        primary: "#1e3a5f",
        primaryDark: "#0f2240",
        accent: "#F2994A",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        text: "#1E293B",
        textMuted: "#64748B",
      },
    },
    isActive: true,
    isDefault: true,
  },
  {
    name: "Forest Scholar",
    description: "Natural green tones",
    sortOrder: 2,
    config: {
      colors: {
        primary: "#2d6a4f",
        primaryDark: "#1b4332",
        accent: "#95d5b2",
        background: "#FFFFFF",
        surface: "#f0fdf4",
        text: "#1a2e1a",
        textMuted: "#4a7c59",
      },
    },
    isActive: true,
    isDefault: false,
  },
  {
    name: "Crimson",
    description: "Bold academic red",
    sortOrder: 3,
    config: {
      colors: {
        primary: "#8b1a1a",
        primaryDark: "#5c0f0f",
        accent: "#e07b7b",
        background: "#FFFFFF",
        surface: "#fff5f5",
        text: "#1a0a0a",
        textMuted: "#6b3636",
      },
    },
    isActive: true,
    isDefault: false,
  },
  {
    name: "Slate Pro",
    description: "Modern dark slate",
    sortOrder: 4,
    config: {
      colors: {
        primary: "#374151",
        primaryDark: "#1f2937",
        accent: "#6366f1",
        background: "#FFFFFF",
        surface: "#f9fafb",
        text: "#111827",
        textMuted: "#6b7280",
      },
    },
    isActive: true,
    isDefault: false,
  },
  {
    name: "Warm Amber",
    description: "Warm earth tones",
    sortOrder: 5,
    config: {
      colors: {
        primary: "#92400e",
        primaryDark: "#78350f",
        accent: "#f59e0b",
        background: "#FFFFFF",
        surface: "#fffbeb",
        text: "#1c0a00",
        textMuted: "#92400e",
      },
    },
    isActive: true,
    isDefault: false,
  },
];

export async function seedThemesIfEmpty(): Promise<void> {
  try {
    const existing = await storage.getActiveThemes();
    if (existing.length > 0) return;

    for (const theme of DEFAULT_THEMES) {
      await storage.createTheme(theme as Parameters<typeof storage.createTheme>[0]);
    }
    console.log("[themeSeed] Seeded 5 default themes");
  } catch (err) {
    console.error("[themeSeed] Failed to seed themes:", err);
  }
}
