import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface NavigationProps {
  researcherName?: string;
}

export default function Navigation({ researcherName = 'Researcher' }: NavigationProps) {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'analytics', 'research', 'publications'];
      const scrollPosition = window.scrollY + window.innerHeight / 3; // Trigger earlier for better UX

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
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Impact' },
    { id: 'research', label: 'Research' },
    { id: 'publications', label: 'Publications' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 shadow-sm" aria-label="Profile navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{researcherName}</h2>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative py-2 transition-colors ${
                  activeSection === item.id 
                    ? 'text-slate-900 dark:text-white font-medium' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                data-testid={`nav-${item.id}`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
