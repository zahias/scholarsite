import { Home, BarChart3, BookOpen, User } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileNavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const defaultNavItems: MobileNavItem[] = [
  { id: 'overview', icon: Home, label: 'Overview' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'research', icon: User, label: 'Research' },
  { id: 'publications', icon: BookOpen, label: 'Publications' },
];

export default function MobileBottomNav({ items = defaultNavItems }: { items?: MobileNavItem[] }) {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const sections = items.map((item) => item.id);
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    // Run once immediately on mount instead of waiting for the first scroll
    // event — otherwise the initial highlighted tab reflects whatever the
    // default state happened to be, not the section actually in view (e.g.
    // if the page mounts already scrolled from a restored position).
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav aria-label="Profile sections" className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-lg z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', borderTop: '1px solid rgba(196, 198, 206, 0.15)' }}>
      <div className="grid grid-cols-4 gap-1 px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[52px] py-2 px-2 rounded-xl transition-colors active:scale-95 ${
                isActive
                  ? 'bg-warm text-midnight font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface active:bg-surface-container-high'
              }`}
              aria-label={item.label}
              aria-current={isActive ? "true" : undefined}
              data-testid={`nav-mobile-${item.id}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] font-medium leading-tight" aria-hidden="true">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
