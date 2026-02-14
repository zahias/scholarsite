import { Link, useLocation } from "wouter";
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
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  };

  // Landing site nav
  if (mode === "landing") {
    return (
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" onClick={handleNavClick}>
              <a className="flex items-center cursor-pointer" data-testid="link-logo">
                <BookOpen className="h-7 w-7 text-white mr-2" />
                <span className="text-lg font-semibold text-white">ScholarName</span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => { handleNavClick(); navigate("/features"); }} className="nav-link text-sm" data-testid="link-features">
                Features
              </button>
              <button onClick={() => { handleNavClick(); navigate("/pricing"); }} className="nav-link text-sm" data-testid="link-pricing">
                Pricing
              </button>
              <button onClick={() => { handleNavClick(); navigate("/faq"); }} className="nav-link text-sm" data-testid="link-faq">
                FAQ
              </button>

              {!hideLogin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  data-testid="link-login"
                  onClick={() => {
                    handleNavClick();
                    navigate("/login");
                  }}
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  Login
                </Button>
              )}

              {!hideSignup && (
                <Button
                  size="sm"
                  className="btn-premium text-sm"
                  data-testid="button-get-started-nav"
                  onClick={() => {
                    handleNavClick();
                    navigate("/signup");
                  }}
                >
                  Create Your Portfolio
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-white/10">
              <button
                className="nav-link block py-2 text-sm"
                onClick={() => { handleNavClick(); navigate("/features"); }}
              >
                Features
              </button>
              <button
                className="nav-link block py-2 text-sm"
                onClick={() => { handleNavClick(); navigate("/pricing"); }}
              >
                Pricing
              </button>
              <button
                className="nav-link block py-2 text-sm"
                onClick={() => { handleNavClick(); navigate("/faq"); }}
              >
                FAQ
              </button>
              {!hideLogin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/80 hover:text-white"
                  onClick={() => {
                    handleNavClick();
                    navigate("/login");
                  }}
                >
                  Login
                </Button>
              )}
              {!hideSignup && (
                <Button
                  className="w-full btn-premium"
                  onClick={() => {
                    handleNavClick();
                    navigate("/signup");
                  }}
                >
                  Create Your Portfolio
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>
    );
  }

  // App authenticated nav (minimal)
  if (mode === "app") {
    return (
      <nav className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/dashboard" onClick={handleNavClick}>
              <a className="flex items-center cursor-pointer" data-testid="link-app-logo">
                <BookOpen className="h-5 w-5 text-primary mr-2" />
                <span className="font-semibold text-foreground">ScholarName</span>
              </a>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleNavClick();
                  navigate("/dashboard");
                }}
              >
                Dashboard
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
      <nav className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" onClick={handleNavClick}>
              <a className="flex items-center cursor-pointer" data-testid="link-auth-logo">
                <BookOpen className="h-5 w-5 text-primary mr-2" />
                <span className="font-semibold text-foreground">ScholarName</span>
              </a>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return null;
}
