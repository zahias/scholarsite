import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface NavigationProps {
  researcherName?: string;
  sections?: Array<{ id: string; title: string }>;
}

export default function Navigation({ researcherName = 'Researcher', sections }: NavigationProps) {
  const [activeSection, setActiveSection] = useState('overview');

  const baseNavItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'insights', label: 'Insights' },
    { id: 'publications', label: 'Publications' },
  ];

  const navItems = [
    ...baseNavItems,
    ...(sections || []).map((s) => ({ id: s.id, label: s.title })),
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = navItems.map((item) => item.id);
      const scrollPosition = window.scrollY + window.innerHeight / 3; // Trigger earlier for better UX

      for (const sectionId of sectionIds) {
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
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-nav" aria-label="Profile navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-on-surface font-headline">{researcherName}</h2>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative py-2 transition-colors ${
                  activeSection === item.id
                    ? 'text-primary-container font-medium'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                data-testid={`nav-${item.id}`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-fixed-dim rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
