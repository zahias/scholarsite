import { useState, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  mobileDefaultOpen?: boolean;
  className?: string;
  id?: string;
  badge?: ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  mobileDefaultOpen,
  className,
  id,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Handle different defaults for mobile vs desktop
  useEffect(() => {
    if (mobileDefaultOpen !== undefined && window.innerWidth < 768) {
      setIsOpen(mobileDefaultOpen);
    }
  }, [mobileDefaultOpen]);

  return (
    <section id={id} className={cn("py-6 md:py-12", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-4 mb-4 md:mb-8 group cursor-pointer hover:opacity-80 transition-opacity"
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
        >
          <div className="flex items-center gap-3">
            {icon && <span className="text-primary">{icon}</span>}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-left">{title}</h2>
            {badge}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs sm:text-sm hidden sm:inline">
              {isOpen ? "Collapse" : "Expand"}
            </span>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 transition-transform" />
            ) : (
              <ChevronDown className="w-5 h-5 transition-transform" />
            )}
          </div>
        </button>
        
        {/* Collapsible Content */}
        <div
          id={`${id}-content`}
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
