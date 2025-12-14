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
    primary: '#0B1F3A',
    primaryDark: '#061224',
    accent: '#F2994A',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textMuted: '#64748B',
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
