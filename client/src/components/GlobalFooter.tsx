import { useLocation } from "wouter";
import { BookOpen, Lock } from "lucide-react";

interface GlobalFooterProps {
  mode?: "landing" | "app";
}

export default function GlobalFooter({ mode = "landing" }: GlobalFooterProps) {
  const [, navigate] = useLocation();

  const handleNavClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-muted/30 border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {mode === "landing" ? (
          <>
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary mr-2" />
                  <span className="font-semibold">Scholar.name</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Professional research portfolios for academics. Auto-syncs with OpenAlex.
                </p>
                <p className="text-xs text-muted-foreground">
                  Data sourced from{" "}
                  <a
                    href="https://openalex.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    OpenAlex
                  </a>
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-medium mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <button
                      onClick={() => { handleNavClick(); navigate("/features"); }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-features"
                    >
                      Features
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { handleNavClick(); navigate("/pricing"); }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-pricing"
                    >
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { handleNavClick(); navigate("/faq"); }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-faq"
                    >
                      FAQ
                    </button>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-medium mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <button
                      onClick={() => {
                        handleNavClick();
                        navigate("/about");
                      }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-about"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleNavClick();
                        navigate("/contact");
                      }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-contact"
                    >
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-medium mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <button
                      onClick={() => {
                        handleNavClick();
                        navigate("/privacy");
                      }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-privacy"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleNavClick();
                        navigate("/terms");
                      }}
                      className="hover:text-foreground transition-colors"
                      data-testid="link-footer-terms"
                    >
                      Terms of Service
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
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
            <p>&copy; {new Date().getFullYear()} ScholarName. All rights reserved.</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs">
              <button
                onClick={() => {
                  handleNavClick();
                  navigate("/privacy");
                }}
                className="hover:text-foreground"
              >
                Privacy
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  handleNavClick();
                  navigate("/terms");
                }}
                className="hover:text-foreground"
              >
                Terms
              </button>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
