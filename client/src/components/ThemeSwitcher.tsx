import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProfileTheme } from '@/context/ThemeContext';
import type { Theme, ThemeConfig } from '@shared/schema';

interface ThemeSwitcherProps {
  isPreview?: boolean;
}

export function ThemeSwitcher({ isPreview = false }: ThemeSwitcherProps) {
  const { themes, currentTheme, setCurrentTheme, isLoading } = useProfileTheme();

  if (isLoading || themes.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${isPreview ? 'bottom-20 md:bottom-6' : 'bottom-6'} right-6 z-50`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-14 w-14"
            style={{
              backgroundColor: currentTheme?.config ? (currentTheme.config as ThemeConfig).colors.primary : '#0B1F3A',
            }}
            data-testid="button-theme-switcher"
          >
            <Palette className="h-6 w-6 text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-4" 
          side="top" 
          align="end"
          sideOffset={12}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Choose Theme</span>
            </div>
            <div className="grid gap-2">
              {themes.map((theme) => (
                <ThemeOption
                  key={theme.id}
                  theme={theme}
                  isSelected={currentTheme?.id === theme.id}
                  onSelect={() => setCurrentTheme(theme)}
                />
              ))}
            </div>
            {isPreview && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Preview different themes. Your preference will be saved when you sign up.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ThemeOptionProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeOption({ theme, isSelected, onSelect }: ThemeOptionProps) {
  const config = theme.config as ThemeConfig;
  
  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
        ${isSelected 
          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      data-testid={`button-theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex gap-1">
        <div
          className="w-5 h-5 rounded-full border border-white/20"
          style={{ backgroundColor: config.colors.primary }}
        />
        <div
          className="w-5 h-5 rounded-full border border-white/20 -ml-2"
          style={{ backgroundColor: config.colors.accent }}
        />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{theme.name}</p>
        {theme.description && (
          <p className="text-xs text-muted-foreground truncate">{theme.description}</p>
        )}
      </div>
      {isSelected && (
        <Check className="h-4 w-4 text-primary shrink-0" />
      )}
    </button>
  );
}
