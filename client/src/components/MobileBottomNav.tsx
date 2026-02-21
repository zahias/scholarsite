import { Home, BarChart3, BookOpen, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'analytics', 'research', 'publications'];
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'analytics', icon: BarChart3, label: 'Impact' },
    { id: 'research', icon: User, label: 'Research' },
    { id: 'publications', icon: BookOpen, label: 'Publications' },
  ];

  return (
    <nav aria-label="Profile sections" className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
      <div className="grid grid-cols-4 gap-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[52px] py-2 px-2 rounded-xl transition-colors active:scale-95 ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
              }`}
              data-testid={`nav-mobile-${item.id}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
