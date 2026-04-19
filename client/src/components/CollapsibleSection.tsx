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

  useEffect(() => {
    if (mobileDefaultOpen !== undefined && window.innerWidth < 768) {
      setIsOpen(mobileDefaultOpen);
    }
  }, [mobileDefaultOpen]);

  return (
    <section
      id={id}
      className={cn("scroll-mt-20", className)}
      style={{ marginTop: 16, background: "#fff", borderRadius: 14, border: "1px solid rgba(11,31,58,.08)", overflow: "hidden" }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "18px 24px", background: "none", border: "none",
          borderBottom: isOpen ? "1px solid rgba(11,31,58,.06)" : "none",
          cursor: "pointer", fontFamily: "inherit", transition: "background .15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8F9FA"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <span style={{ color: "#FFC72E", display: "flex", alignItems: "center" }}>{icon}</span>
          )}
          <span style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(17px,2vw,21px)", fontWeight: 500, color: "#0B1F3A", letterSpacing: "-0.01em" }}>
            {title}
          </span>
          {badge}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#75777E", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }} className="hidden sm:inline">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          {isOpen
            ? <ChevronUp size={16} style={{ transition: "transform .2s" }} />
            : <ChevronDown size={16} style={{ transition: "transform .2s" }} />}
        </div>
      </button>

      {/* Collapsible content — CSS grid animation */}
      <div
        id={`${id}-content`}
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div
          className="overflow-hidden"
          style={{ opacity: isOpen ? 1 : 0, transition: "opacity 200ms ease-in-out" }}
        >
          <div style={{ padding: "20px 24px" }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
