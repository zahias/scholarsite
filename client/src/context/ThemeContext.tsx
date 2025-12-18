import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Theme, ThemeConfig } from '@shared/schema';

interface ThemeContextValue {
  themes: Theme[];
  currentTheme: Theme | null;
  setCurrentTheme: (theme: Theme) => void;
  themeConfig: ThemeConfig | null;
  isLoading: boolean;
}

const defaultThemeConfig: ThemeConfig = {
  colors: {
    primary: '#1e3a5f',
    primaryDark: '#0d1f35',
    accent: '#c9a227',
    background: '#fafbfc',
    surface: '#f0f4f8',
    text: '#1a2332',
    textMuted: '#5a6a7a',
  },
};

const ThemeContext = createContext<ThemeContextValue>({
  themes: [],
  currentTheme: null,
  setCurrentTheme: () => {},
  themeConfig: defaultThemeConfig,
  isLoading: true,
});

export function useProfileTheme() {
  return useContext(ThemeContext);
}

function applyThemeToDocument(config: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', config.colors.primary);
  root.style.setProperty('--theme-primary-dark', config.colors.primaryDark);
  root.style.setProperty('--theme-accent', config.colors.accent);
  root.style.setProperty('--theme-background', config.colors.background);
  root.style.setProperty('--theme-surface', config.colors.surface);
  root.style.setProperty('--theme-text', config.colors.text);
  root.style.setProperty('--theme-text-muted', config.colors.textMuted);
  
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  
  root.style.setProperty('--theme-primary-hsl', hexToHsl(config.colors.primary));
  root.style.setProperty('--theme-accent-hsl', hexToHsl(config.colors.accent));
}

interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: string | null;
}

export function ProfileThemeProvider({ children, initialThemeId }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);

  const { data: themes = [], isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
  });

  const { data: defaultTheme, isLoading: defaultLoading } = useQuery<Theme | null>({
    queryKey: ['/api/themes/default'],
  });

  useEffect(() => {
    if (themes.length > 0 && !currentTheme) {
      if (initialThemeId) {
        const initialTheme = themes.find(t => t.id === initialThemeId);
        if (initialTheme) {
          setCurrentTheme(initialTheme);
          return;
        }
      }
      if (defaultTheme) {
        setCurrentTheme(defaultTheme);
      } else {
        setCurrentTheme(themes[0]);
      }
    }
  }, [themes, defaultTheme, initialThemeId, currentTheme]);

  const themeConfig = currentTheme?.config as ThemeConfig | null;
  
  useEffect(() => {
    applyThemeToDocument(themeConfig || defaultThemeConfig);
  }, [themeConfig]);

  return (
    <ThemeContext.Provider
      value={{
        themes,
        currentTheme,
        setCurrentTheme,
        themeConfig: themeConfig || defaultThemeConfig,
        isLoading: themesLoading || defaultLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function getThemeStyles(config: ThemeConfig | null) {
  if (!config) return {};
  
  return {
    '--theme-primary': config.colors.primary,
    '--theme-primary-dark': config.colors.primaryDark,
    '--theme-accent': config.colors.accent,
    '--theme-background': config.colors.background,
    '--theme-surface': config.colors.surface,
    '--theme-text': config.colors.text,
    '--theme-text-muted': config.colors.textMuted,
  } as React.CSSProperties;
}
