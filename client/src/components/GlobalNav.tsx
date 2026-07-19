import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";

interface GlobalNavProps {
  mode?: "landing" | "app" | "auth"; // landing: public site, app: authenticated app, auth: login/signup
  hideLogin?: boolean;
  hideSignup?: boolean;
}

export default function GlobalNav({
  mode = "landing",
  hideLogin = false,
  hideSignup = false,
}: GlobalNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  };

  // Landing site nav
  if (mode === "landing") {
    return (
      <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="sticky top-0 z-50 glass-nav" aria-label="Main navigation">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" onClick={handleNavClick} className="flex items-center cursor-pointer" data-testid="link-logo">
                <BookOpen className="h-7 w-7 text-primary-container mr-2" />
                <span className="text-lg font-semibold text-on-surface font-headline">Scholar.name</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/features" onClick={handleNavClick} className="text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors" data-testid="link-features">
                Features
              </Link>
              <Link href="/pricing" onClick={handleNavClick} className="text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors" data-testid="link-pricing">
                Pricing
              </Link>
              <Link href="/faq" onClick={handleNavClick} className="text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors" data-testid="link-faq">
                FAQ
              </Link>
              <Link href="/blog" onClick={handleNavClick} className="text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors" data-testid="link-blog">
                Blog
              </Link>

              {!hideLogin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-on-surface-variant hover:text-primary-container hover:bg-primary-container/5"
                  data-testid="link-login"
                >
                  <Link href="/login" onClick={handleNavClick}>
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    Login
                  </Link>
                </Button>
              )}

              {!hideSignup && (
                <Button asChild variant="primary-cta" size="sm" data-testid="button-get-started-nav">
                  <Link href="/signup" onClick={handleNavClick}>Create Your Portfolio</Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-on-surface-variant hover:text-primary-container"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div id="mobile-nav-menu" className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${mobileOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'} space-y-2 border-t border-outline-variant/20`}>
              <Link href="/features" onClick={handleNavClick} className="block py-2 text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors">
                Features
              </Link>
              <Link href="/pricing" onClick={handleNavClick} className="block py-2 text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/faq" onClick={handleNavClick} className="block py-2 text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors">
                FAQ
              </Link>
              <Link href="/blog" onClick={handleNavClick} className="block py-2 text-sm text-on-surface-variant hover:text-primary-container font-medium transition-colors">
                Blog
              </Link>
              {!hideLogin && (
                <Button asChild variant="ghost" className="w-full justify-start text-on-surface-variant hover:text-primary-container">
                  <Link href="/login" onClick={handleNavClick}>Login</Link>
                </Button>
              )}
              {!hideSignup && (
                <Button asChild variant="primary-cta" className="w-full">
                  <Link href="/signup" onClick={handleNavClick}>Create Your Portfolio</Link>
                </Button>
              )}
          </div>
        </div>
      </nav>
      </>
    );
  }

  // App authenticated nav (minimal)
  if (mode === "app") {
    return (
      <nav className="sticky top-0 z-40 glass-nav" aria-label="App navigation">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/dashboard" onClick={handleNavClick} className="flex items-center cursor-pointer" data-testid="link-app-logo">
                <BookOpen className="h-5 w-5 text-primary-container mr-2" />
                <span className="font-semibold text-on-surface font-headline">Scholar.name</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-on-surface-variant hover:text-primary-container">
                <Link href="/dashboard" onClick={handleNavClick}>Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Auth pages nav (minimal)
  if (mode === "auth") {
    return (
      <nav className="sticky top-0 z-40 glass-nav" aria-label="Authentication navigation">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" onClick={handleNavClick} className="flex items-center cursor-pointer" data-testid="link-auth-logo">
                <BookOpen className="h-5 w-5 text-primary-container mr-2" />
                <span className="font-semibold text-on-surface font-headline">Scholar.name</span>
            </Link>
            <Button asChild variant="ghost" size="sm" className="text-on-surface-variant hover:text-primary-container">
              <Link href="/" onClick={handleNavClick}>← Back to Home</Link>
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return null;
}
