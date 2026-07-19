import { useLocation } from "wouter";
import { BookOpen } from "lucide-react";
import SEO from "@/components/SEO";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-midnight flex flex-col items-center justify-center relative overflow-hidden px-6 py-8">
      <SEO title="Page Not Found — Scholar.name" description="The page you're looking for doesn't exist." />

      {/* Background grid — a static multi-layer gradient; left as inline
          style since Tailwind's arbitrary-value syntax can't express a
          layered radial+repeating-linear background cleanly. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 70% 0%, rgba(255,199,46,.14), transparent 55%), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 52px)" }}
      />

      {/* Minimal logo nav */}
      <div className="absolute top-0 left-0 right-0 px-8 py-[18px] flex items-center">
        <a href="/" className="flex items-center gap-2 no-underline">
          <BookOpen className="w-6 h-6 text-warm" />
          <span className="font-serif text-[17px] font-medium text-white tracking-[-0.01em]">Scholar.name</span>
        </a>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-[480px]">
        <div
          className="font-serif font-medium leading-none tracking-[-0.04em] select-none"
          style={{ fontSize: "clamp(80px,18vw,140px)", color: "rgba(255,199,46,.18)" }}
        >
          404
        </div>
        <div className="w-12 h-[3px] bg-warm rounded mx-auto -mt-3 mb-6" />
        <h1
          className="font-serif font-medium text-white mb-3 tracking-[-0.015em]"
          style={{ fontSize: "clamp(24px,4vw,36px)" }}
        >
          Page not found
        </h1>
        <p className="text-[15.5px] text-white/60 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-7 py-3 bg-warm text-on-secondary-container border-none rounded-[10px] text-[14.5px] font-bold cursor-pointer tracking-[.01em]"
          data-testid="button-go-home"
        >
          ← Go Home
        </button>
      </div>
    </div>
  );
}
