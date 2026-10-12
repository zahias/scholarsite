import { Link } from "wouter";
import { BookOpen, Lock } from "lucide-react";

interface GlobalFooterProps {
  mode?: "landing" | "app";
}

export default function GlobalFooter({ mode = "landing" }: GlobalFooterProps) {
  const handleNavClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-primary-container text-white py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {mode === "landing" ? (
          <>
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center mb-4">
                  <BookOpen className="h-6 w-6 text-secondary-container mr-2" />
                  <span className="font-semibold font-headline text-white">Scholar.name</span>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  Professional research portfolios for academics. Auto-syncs with OpenAlex.
                </p>
                <p className="text-xs text-white/50">
                  Data sourced from{" "}
                  <a
                    href="https://openalex.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-container hover:underline"
                  >
                    OpenAlex
                  </a>
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-medium mb-4 text-white/90">Product</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <Link href="/features" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-features">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-pricing">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-faq">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-blog">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-medium mb-4 text-white/90">Company</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <Link href="/about" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-about">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-contact">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-medium mb-4 text-white/90">Legal</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <Link href="/privacy" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-privacy">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" onClick={handleNavClick} className="hover:text-white transition-colors" data-testid="link-footer-terms">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-sm text-white/50 gap-4">
              <p data-version="1.0.3-performance-ux">&copy; {new Date().getFullYear()} Scholar.name. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SSL Secured
                </span>
                <span>•</span>
                <span>Made for Researchers</span>
              </div>
            </div>
          </>
        ) : (
          // Minimal app footer
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Scholar.name. All rights reserved.</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs">
              <Link href="/privacy" onClick={handleNavClick} className="hover:text-foreground">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" onClick={handleNavClick} className="hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
